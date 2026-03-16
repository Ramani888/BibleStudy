import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AskQuestionDtoType } from './ai.dto';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT =
  'You are a helpful Bible study assistant. Answer questions about the Bible, Christian theology, and faith. Be accurate, respectful, and cite Bible verses when relevant.';

const HARDCODED_VERSE = {
  reference: 'John 3:16',
  text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
  book: 'John',
  chapter: 3,
  verse: 16,
};

export async function askQuestion(userId: string, dto: AskQuestionDtoType) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.creditBalance < 1) {
    throw new Error('Insufficient credits. Please earn more credits to use AI chat.');
  }

  // Call Anthropic API
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: dto.question }],
  });

  const answer =
    response.content[0].type === 'text' ? response.content[0].text : 'Unable to generate response';

  // Deduct credit and save chat in a transaction
  const [, , aiChat] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { decrement: 1 } },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        type: 'USAGE',
        amount: -1,
        description: 'AI chat question',
      },
    }),
    prisma.aIChat.create({
      data: {
        userId,
        question: dto.question,
        answer,
        creditsUsed: 1,
      },
    }),
  ]);

  return {
    id: aiChat.id,
    question: dto.question,
    answer,
    creditsUsed: 1,
    createdAt: aiChat.createdAt,
  };
}

export async function getChatHistory(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [chats, total] = await Promise.all([
    prisma.aIChat.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.aIChat.count({ where: { userId } }),
  ]);

  return {
    chats,
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
    const response = await fetch('https://bible-api.com/data/web/random');
    if (!response.ok) {
      throw new Error('API request failed');
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
