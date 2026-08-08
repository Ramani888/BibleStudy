export type AchievementCategory = 'study' | 'quiz' | 'streak' | 'social' | 'ai';

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  reward: number;
  threshold: number;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}
