import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AskQuestionDtoType } from './ai.dto';
import { AppError, NotFoundError, PaymentRequiredError } from '../../utils/errors';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

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

  // Step 3: parse card Q/A pairs from each block
  const suggestedCards: { question: string; answer: string }[] = [];
  for (const part of parts.slice(1)) {
    const partLines = part.split('\n').map(l => l.trim()).filter(Boolean);
    const qLine = partLines.find(l => l.toUpperCase().startsWith('Q:'));
    const aLine = partLines.find(l => l.toUpperCase().startsWith('A:'));
    if (qLine && aLine) {
      suggestedCards.push({
        question: qLine.slice(2).trim(),
        answer: aLine.slice(2).trim(),
      });
    }
  }

  return {
    answer: answerText,
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

  const messages: Anthropic.MessageParam[] = [
    ...(dto.history ?? []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: dto.question },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3072,
    system: SYSTEM_PROMPT,
    messages,
  });

  const textBlock = response.content[0];
  if (!textBlock || textBlock.type !== 'text') {
    throw new AppError('AI returned an empty response. No credit was charged.', 502, 'AI_EMPTY_RESPONSE');
  }

  const { answer, followUps, suggestedCards } = parseAIResponse(textBlock.text);

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
      data: { creditBalance: { decrement: 1 } },
    }),
    prisma.creditTransaction.create({
      data: { userId, type: 'USAGE', amount: -1, description: 'AI chat question' },
    }),
    prisma.aIChat.create({
      data: {
        userId,
        sessionId: dto.sessionId ?? null,
        question: dto.question,
        answer,
        creditsUsed: 1,
      },
    }),
  ]);

  // Upsert session outside transaction (non-critical)
  if (sessionOp) {
    await sessionOp.catch(() => {});
  }

  return {
    id: aiChat.id,
    question: dto.question,
    answer,
    followUps,
    suggestedCards,
    creditsUsed: 1,
    createdAt: aiChat.createdAt,
  };
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
  const standaloneMsgMap = new Map((standaloneMessages as { id: string; sessionId: string | null; question: string; answer: string; creditsUsed: number; createdAt: Date }[]).map(m => [m.id, m]));

  const sessionMsgMap = new Map<string, { id: string; sessionId: string | null; question: string; answer: string; creditsUsed: number; createdAt: Date }[]>();
  for (const msg of (sessionMessages as { id: string; sessionId: string | null; question: string; answer: string; creditsUsed: number; createdAt: Date }[])) {
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
    messages: { id: string; sessionId: string | null; question: string; answer: string; creditsUsed: number; createdAt: Date }[];
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
        book_name?: string;
        chapter?: number;
        verse?: number;
        text?: string;
      };
    };

    if (data.random_verse) {
      const verse = data.random_verse;
      return {
        reference: `${verse.book_name} ${verse.chapter}:${verse.verse}`,
        text: verse.text?.trim() ?? '',
        book: verse.book_name ?? '',
        chapter: verse.chapter ?? 0,
        verse: verse.verse ?? 0,
      };
    }

    return HARDCODED_VERSE;
  } catch {
    return HARDCODED_VERSE;
  }
}
