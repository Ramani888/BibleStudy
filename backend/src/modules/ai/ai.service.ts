import Anthropic from '@anthropic-ai/sdk';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AskQuestionDtoType } from './ai.dto';
import { AppError, NotFoundError, PaymentRequiredError } from '../../utils/errors';
import { triggerAchievementCheck } from '../../utils/achievementCheck';
import { retrieveContext } from './embeddings.service';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 3072;

// Variable credit cost per AI action (Phase B + F). Media dominates: a PDF/image
// chat is charged the media rate even if it also returns cards (locked F decision #3).
const CREDIT_COST = { text: 1, cards: 2, image: 3, pdf: 5 } as const;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

// A media attachment for the latest user turn (Phase F). PDF now; image later.
// Files are public-read on S3, so Claude ingests them by URL (no base64).
type MediaBlock = Anthropic.DocumentBlockParam | Anthropic.ImageBlockParam;

// Provider seam: text chat routes to AI_PROVIDER (anthropic | openrouter).
// Media ALWAYS routes to Claude (vision/docs) regardless of AI_PROVIDER (Phase F).
// When media is present it is attached to the latest user turn as content blocks.
async function generateAnswer(system: string, messages: ChatMessage[], media?: MediaBlock[]): Promise<string> {
  const hasMedia = !!media && media.length > 0;

  if (env.AI_PROVIDER === 'openrouter' && !hasMedia) {
    if (!env.OPENROUTER_API_KEY) throw new AppError('OpenRouter not configured.', 500, 'AI_CONFIG_ERROR');
    if (!env.AI_MODEL) throw new AppError('AI_MODEL is required for OpenRouter.', 500, 'AI_CONFIG_ERROR');

    // Free models cold-start slowly and share a rate-limited pool — the first hit
    // often 429s or stalls, then succeeds. Retry transient failures (429 / 5xx)
    // with a short backoff so the flakiness self-heals before the user sees it.
    const MAX_ATTEMPTS = 3;
    let lastStatus = 0;
    let lastDetail = '';
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.AI_MODEL,
          max_tokens: MAX_TOKENS,
          messages: [{ role: 'system', content: system }, ...messages],
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        return data.choices?.[0]?.message?.content ?? '';
      }

      lastStatus = res.status;
      lastDetail = await res.text().catch(() => '');
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt === MAX_ATTEMPTS) break;
      await new Promise(r => setTimeout(r, 1000 * attempt)); // 1s, then 2s
    }

    throw new AppError(`AI provider error (${lastStatus}). No credit was charged. ${lastDetail.slice(0, 200)}`, 502, 'AI_PROVIDER_ERROR');
  }

  // Anthropic Claude (default provider, or forced by media).
  // env.AI_MODEL may hold an OpenRouter model id when provider=openrouter, so for the
  // media-forced path we pin CLAUDE_MODEL rather than trust AI_MODEL.
  const model = hasMedia ? CLAUDE_MODEL : (env.AI_MODEL || CLAUDE_MODEL);

  // Attach media to the latest user turn; earlier history stays plain text.
  const claudeMessages: Anthropic.MessageParam[] = hasMedia
    ? [
        ...messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: [...media!, { type: 'text', text: messages[messages.length - 1].content }] },
      ]
    : messages;

  let response: Anthropic.Message;
  try {
    response = await anthropic.messages.create({ model, max_tokens: MAX_TOKENS, system, messages: claudeMessages });
  } catch (e) {
    // Includes an unfunded/misconfigured Claude account — thrown BEFORE any credit charge.
    const status = (e as { status?: number }).status;
    throw new AppError(`AI provider error${status ? ` (${status})` : ''}. No credit was charged.`, 502, 'AI_PROVIDER_ERROR');
  }
  const textBlock = response.content[0];
  return textBlock && textBlock.type === 'text' ? textBlock.text : '';
}

const FOLLOWUP_DELIMITER = '|||';
const CARD_DELIMITER = '---CARD---';

const SYSTEM_PROMPT =
  `You are a helpful Bible study assistant. Answer questions about the Bible, Christian theology, and faith. Be accurate, respectful, and cite Bible verses when relevant.

If the user explicitly asks you to generate flashcards, study cards, or cards to memorize, include them after your main answer. Format each card as:
${CARD_DELIMITER}
Q: [question text]
A: [answer text]
Generate between 3 and 8 cards. Only include cards when the user explicitly asks.

After your main answer (and after any cards), provide exactly 3 follow-up questions the user might want to ask next. Each follow-up question must be on its own line, starting with "${FOLLOWUP_DELIMITER}". Do not number them. Example:
${FOLLOWUP_DELIMITER}What does this passage mean for daily life?
${FOLLOWUP_DELIMITER}Are there related verses elsewhere in the Bible?
${FOLLOWUP_DELIMITER}How do different denominations interpret this?`;

const HARDCODED_VERSE = {
  reference: 'John 3:16',
  text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
  book: 'John',
  chapter: 3,
  verse: 16,
};

function parseAIResponse(raw: string): {
  answer: string;
  followUps: string[];
  suggestedCards: { question: string; answer: string }[];
} {
  // Step 1: strip follow-up lines (start with '|||')
  const lines = raw.split('\n');
  const followUpLines: string[] = [];
  const bodyLines: string[] = [];
  for (const line of lines) {
    if (line.trimStart().startsWith(FOLLOWUP_DELIMITER)) {
      followUpLines.push(line.trimStart().slice(FOLLOWUP_DELIMITER.length).trim());
    } else {
      bodyLines.push(line);
    }
  }
  const body = bodyLines.join('\n');

  // Step 2: split on card delimiter — [0] is the main answer, [1..n] are card blocks
  const parts = body.split(CARD_DELIMITER);
  const answerText = parts[0].trim();

  // Step 3: parse card Q/A pairs from each block (A: captures all continuation lines)
  const suggestedCards: { question: string; answer: string }[] = [];
  for (const part of parts.slice(1)) {
    const partLines = part.split('\n').map(l => l.trim()).filter(Boolean);
    const qIdx = partLines.findIndex(l => l.toUpperCase().startsWith('Q:'));
    const aIdx = partLines.findIndex(l => l.toUpperCase().startsWith('A:'));
    if (qIdx === -1 || aIdx === -1) continue;
    const question = partLines[qIdx].slice(2).trim();
    const firstAnswerLine = partLines[aIdx].slice(2).trim();
    const continuation = partLines.slice(aIdx + 1).join(' ');
    const answer = continuation ? `${firstAnswerLine} ${continuation}` : firstAnswerLine;
    if (question && answer) {
      suggestedCards.push({ question, answer });
    }
  }

  // Some models emit cards with no intro text before the first ---CARD---,
  // leaving answerText empty. Fall back so the chat bubble is never blank.
  const answer = answerText || (suggestedCards.length > 0 ? 'Here are your flashcards:' : answerText);

  return {
    answer,
    followUps: followUpLines.filter(q => q.length > 0).slice(0, 3),
    suggestedCards: suggestedCards.slice(0, 10),
  };
}

export async function askQuestion(userId: string, dto: AskQuestionDtoType) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  });

  if (!user) throw new NotFoundError('User not found');
  if (user.creditBalance < 1) {
    throw new PaymentRequiredError('Insufficient credits. Please earn more credits to use AI chat.');
  }

  const messages: ChatMessage[] = [
    ...(dto.history ?? []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: dto.question },
  ];

  // Phase F: attach a PDF (F.1) or image (F.2) from the user's media library —
  // routes this turn to Claude. PDFs → document blocks, images → image blocks.
  let mediaBlocks: MediaBlock[] | undefined;
  let hasPdf = false;
  let hasImage = false;
  if (dto.mediaIds && dto.mediaIds.length > 0) {
    const files = await prisma.mediaFile.findMany({
      where: { id: { in: dto.mediaIds }, userId },
      select: { url: true, type: true },
    });
    if (files.length !== dto.mediaIds.length) throw new AppError('One or more files not found', 400, 'INVALID_MEDIA');
    mediaBlocks = files.map(f =>
      f.type === 'PDF'
        ? { type: 'document' as const, source: { type: 'url' as const, url: f.url } }
        : { type: 'image' as const, source: { type: 'url' as const, url: f.url } },
    );
    hasPdf = files.some(f => f.type === 'PDF');
    hasImage = files.some(f => f.type === 'IMAGE');
  }

  // G1: media routes to paid Claude, so require the FULL cost upfront (no floor) —
  // reject before the Claude call so we never make a paid request we can't charge for.
  const mediaCost = hasPdf ? CREDIT_COST.pdf : hasImage ? CREDIT_COST.image : 0;
  if (mediaCost > 0 && user.creditBalance < mediaCost) {
    throw new PaymentRequiredError(`This needs ${mediaCost} credits. Earn more or upgrade to keep using media in chat.`);
  }

  const userContext = await retrieveContext(userId, dto.question).catch(() => '');
  const system = userContext ? `${SYSTEM_PROMPT}\n\n${userContext}` : SYSTEM_PROMPT;

  const rawText = await generateAnswer(system, messages, mediaBlocks);
  if (!rawText) {
    throw new AppError('AI returned an empty response. No credit was charged.', 502, 'AI_EMPTY_RESPONSE');
  }

  const { answer, followUps, suggestedCards } = parseAIResponse(rawText);

  // Variable cost by what the AI did. Media dominates (Claude PDF/vision is the paid perk):
  // PDF > image > cards > text, even if a media chat also returned cards.
  // Charge is floored at the user's balance so it can't go negative — the AI already ran.
  const cost = hasPdf ? CREDIT_COST.pdf
    : hasImage ? CREDIT_COST.image
    : suggestedCards.length > 0 ? CREDIT_COST.cards
    : CREDIT_COST.text;
  const charge = Math.min(cost, user.creditBalance);
  const description = hasPdf ? 'AI PDF chat'
    : hasImage ? 'AI image chat'
    : suggestedCards.length > 0 ? 'AI flashcard generation'
    : 'AI chat question';

  // Upsert session record when sessionId is provided
  const sessionOp = dto.sessionId
    ? prisma.aIChatSession.upsert({
        where: { id: dto.sessionId },
        create: { id: dto.sessionId, userId, tags: [] },
        update: {},
      })
    : null;

  const [, , aiChat] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { decrement: charge } },
    }),
    prisma.creditTransaction.create({
      data: { userId, type: 'USAGE', amount: -charge, description },
    }),
    prisma.aIChat.create({
      data: {
        userId,
        sessionId: dto.sessionId ?? null,
        question: dto.question,
        answer,
        suggestedCards: suggestedCards as unknown as Prisma.InputJsonValue,
        followUps,
        creditsUsed: charge,
      },
    }),
  ]);

  // Upsert session outside transaction (non-critical)
  if (sessionOp) {
    await sessionOp.catch(() => {});
  }

  triggerAchievementCheck(userId); // AI question count

  return {
    id: aiChat.id,
    question: dto.question,
    answer,
    followUps,
    suggestedCards,
    creditsUsed: charge,
    createdAt: aiChat.createdAt,
  };
}

export async function markCardsSaved(userId: string, chatId: string) {
  const result = await prisma.aIChat.updateMany({
    where: { id: chatId, userId },
    data: { cardsSaved: true },
  });
  if (result.count === 0) throw new NotFoundError('Message not found');
}

export async function getChatHistory(userId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  // Phase 1: Fetch lightweight session-ordering data only (no message content).
  // Grouped sessions use prisma groupBy — one row per sessionId with the latest
  // createdAt. Standalone chats (no sessionId) each count as their own session.
  const [sessionGroups, standaloneSummaries] = await Promise.all([
    prisma.aIChat.groupBy({
      by: ['sessionId'],
      where: { userId, sessionId: { not: null } },
      _max: { createdAt: true },
    }),
    prisma.aIChat.findMany({
      where: { userId, sessionId: null },
      select: { id: true, createdAt: true },
    }),
  ]);

  // Build a unified, time-sorted list of "slots" (one slot = one history row)
  type Slot =
    | { kind: 'session'; sessionId: string; lastAt: Date }
    | { kind: 'standalone'; chatId: string; lastAt: Date };

  const allSlots: Slot[] = [
    ...sessionGroups.map(g => ({
      kind: 'session' as const,
      sessionId: g.sessionId!,
      lastAt: g._max.createdAt!,
    })),
    ...standaloneSummaries.map(c => ({
      kind: 'standalone' as const,
      chatId: c.id,
      lastAt: c.createdAt,
    })),
  ].sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());

  const total = allSlots.length;
  const pageSlots = allSlots.slice(skip, skip + limit);

  if (pageSlots.length === 0) {
    return { sessions: [], pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  // Phase 2: Fetch full message content only for this page's sessions.
  const sessionIds = pageSlots
    .filter((s): s is Extract<Slot, { kind: 'session' }> => s.kind === 'session')
    .map(s => s.sessionId);
  const chatIds = pageSlots
    .filter((s): s is Extract<Slot, { kind: 'standalone' }> => s.kind === 'standalone')
    .map(s => s.chatId);

  const msgSelect = {
    id: true,
    sessionId: true,
    question: true,
    answer: true,
    suggestedCards: true,
    followUps: true,
    cardsSaved: true,
    creditsUsed: true,
    createdAt: true,
  } as const;

  const [sessionMessages, standaloneMessages, sessionMeta] = await Promise.all([
    sessionIds.length > 0
      ? prisma.aIChat.findMany({
          where: { userId, sessionId: { in: sessionIds } },
          select: msgSelect,
          orderBy: { createdAt: 'asc' },
        })
      : [],
    chatIds.length > 0
      ? prisma.aIChat.findMany({
          where: { id: { in: chatIds } },
          select: msgSelect,
        })
      : [],
    sessionIds.length > 0
      ? prisma.aIChatSession.findMany({
          where: { userId, id: { in: sessionIds } },
          select: { id: true, title: true, tags: true },
        })
      : [],
  ]);

  // Build lookup maps
  const metaMap = new Map((sessionMeta as { id: string; title: string | null; tags: string[] }[]).map(s => [s.id, s]));
  const standaloneMsgMap = new Map((standaloneMessages as { id: string; sessionId: string | null; question: string; answer: string; suggestedCards: Prisma.JsonValue; followUps: string[]; cardsSaved: boolean; creditsUsed: number; createdAt: Date }[]).map(m => [m.id, m]));

  const sessionMsgMap = new Map<string, { id: string; sessionId: string | null; question: string; answer: string; suggestedCards: Prisma.JsonValue; followUps: string[]; cardsSaved: boolean; creditsUsed: number; createdAt: Date }[]>();
  for (const msg of (sessionMessages as { id: string; sessionId: string | null; question: string; answer: string; suggestedCards: Prisma.JsonValue; followUps: string[]; cardsSaved: boolean; creditsUsed: number; createdAt: Date }[])) {
    const key = msg.sessionId!;
    if (!sessionMsgMap.has(key)) sessionMsgMap.set(key, []);
    sessionMsgMap.get(key)!.push(msg);
  }

  type SessionRow = {
    sessionId: string | null;
    title: string;
    customTitle: string | null;
    tags: string[];
    messageCount: number;
    totalCreditsUsed: number;
    startedAt: Date;
    messages: { id: string; sessionId: string | null; question: string; answer: string; suggestedCards: Prisma.JsonValue; followUps: string[]; cardsSaved: boolean; creditsUsed: number; createdAt: Date }[];
  };

  // Assemble result in the same order as pageSlots
  const sessions: SessionRow[] = [];
  for (const slot of pageSlots) {
    if (slot.kind === 'session') {
      const messages = sessionMsgMap.get(slot.sessionId) ?? [];
      if (messages.length === 0) continue;
      const meta = metaMap.get(slot.sessionId);
      sessions.push({
        sessionId: slot.sessionId,
        title: messages[0].question,
        customTitle: meta?.title ?? null,
        tags: meta?.tags ?? [],
        messageCount: messages.length,
        totalCreditsUsed: messages.reduce((sum, m) => sum + m.creditsUsed, 0),
        startedAt: messages[0].createdAt,
        messages,
      });
    } else {
      const msg = standaloneMsgMap.get(slot.chatId);
      if (!msg) continue;
      sessions.push({
        sessionId: null,
        title: msg.question,
        customTitle: null,
        tags: [],
        messageCount: 1,
        totalCreditsUsed: msg.creditsUsed,
        startedAt: msg.createdAt,
        messages: [msg],
      });
    }
  }

  return {
    sessions,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

export async function deleteSession(userId: string, sessionId: string) {
  await Promise.all([
    prisma.aIChat.deleteMany({ where: { userId, sessionId } }),
    prisma.aIChatSession.deleteMany({ where: { id: sessionId, userId } }),
  ]);
}

export async function clearHistory(userId: string) {
  await Promise.all([
    prisma.aIChat.deleteMany({ where: { userId } }),
    prisma.aIChatSession.deleteMany({ where: { userId } }),
    prisma.bookmark.deleteMany({ where: { userId } }),
  ]);
}

export async function renameSession(userId: string, sessionId: string, title: string) {
  const session = await prisma.aIChatSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw new NotFoundError('Session not found');
  await prisma.aIChatSession.update({ where: { id: sessionId }, data: { title } });
}

export async function updateSessionTags(userId: string, sessionId: string, tags: string[]) {
  await prisma.aIChatSession.upsert({
    where: { id: sessionId },
    create: { id: sessionId, userId, tags },
    update: { tags },
  });
}

export async function addBookmark(userId: string, chatId: string) {
  const chat = await prisma.aIChat.findFirst({ where: { id: chatId, userId } });
  if (!chat) throw new NotFoundError('Message not found');
  await prisma.bookmark.upsert({
    where: { userId_chatId: { userId, chatId } },
    create: { userId, chatId },
    update: {},
  });
}

export async function removeBookmark(userId: string, chatId: string) {
  await prisma.bookmark.deleteMany({ where: { userId, chatId } });
}

export async function getBookmarks(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId },
      include: {
        chat: {
          select: {
            id: true,
            sessionId: true,
            question: true,
            answer: true,
            creditsUsed: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.bookmark.count({ where: { userId } }),
  ]);

  return {
    bookmarks: bookmarks.map(b => ({ ...b.chat, bookmarkedAt: b.createdAt })),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getDailyVerse() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://bible-api.com/data/web/random', {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) {
      throw new AppError('Bible API request failed', 502, 'EXTERNAL_API_ERROR');
    }

    const data = await response.json() as {
      random_verse?: {
        book?: string;
        chapter?: number;
        verse?: number;
        text?: string;
      };
    };

    if (data.random_verse) {
      const verse = data.random_verse;
      return {
        reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
        text: verse.text?.trim() ?? '',
        book: verse.book ?? '',
        chapter: verse.chapter ?? 0,
        verse: verse.verse ?? 0,
      };
    }

    return HARDCODED_VERSE;
  } catch {
    return HARDCODED_VERSE;
  }
}
