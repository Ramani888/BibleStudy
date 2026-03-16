import { prisma } from '../../config/db';

export async function getBalance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return { balance: user.creditBalance };
}

export async function getTransactions(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.creditTransaction.count({ where: { userId } }),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function claimDailyLogin(userId: string) {
  // Check if user already claimed today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const rewardToday = await prisma.creditTransaction.findFirst({
    where: {
      userId,
      type: 'REWARD',
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  if (rewardToday) {
    throw new Error('Daily login reward already claimed today');
  }

  const [updatedUser, transaction] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: 1 } },
      select: { creditBalance: true },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        type: 'REWARD',
        amount: 1,
        description: 'Daily login reward',
      },
    }),
  ]);

  return {
    balance: updatedUser.creditBalance,
    transaction,
    message: 'Daily login reward claimed! +1 credit',
  };
}
