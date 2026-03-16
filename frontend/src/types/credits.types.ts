export type TransactionType = 'USAGE' | 'REWARD' | 'PURCHASE' | 'BONUS';

export interface CreditTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: string;
}

export interface CreditBalance {
  balance: number;
}
