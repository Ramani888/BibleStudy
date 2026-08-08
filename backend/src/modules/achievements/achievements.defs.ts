// Achievement definitions live in code (not the DB). Each references a `metric`
// (computed from existing data in the service) and a `threshold`. Unlocking one
// grants `reward` credits. Add/tweak freely — only unlocks are persisted, so
// changing defs never corrupts data.

export type AchievementMetric =
  | 'cards_created'
  | 'sets_created'
  | 'quizzes_taken'
  | 'perfect_quiz'
  | 'quiz_modes'
  | 'streak'
  | 'friends'
  | 'groups_joined'
  | 'ai_questions'
  | 'plans_completed';

export type AchievementCategory = 'study' | 'quiz' | 'streak' | 'social' | 'ai';

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;               // name the frontend maps to an icon
  category: AchievementCategory;
  metric: AchievementMetric;
  threshold: number;
  reward: number;             // credits granted on unlock
}

const REWARD = 5; // locked decision C-2: +5 credits per unlock

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Study ──
  { key: 'first_card',   title: 'First Card',    description: 'Create your first flashcard.',        icon: 'card',    category: 'study', metric: 'cards_created', threshold: 1,   reward: REWARD },
  { key: 'cards_10',     title: 'Getting Started', description: 'Create 10 flashcards.',             icon: 'card',    category: 'study', metric: 'cards_created', threshold: 10,  reward: REWARD },
  { key: 'cards_50',     title: 'Card Collector', description: 'Create 50 flashcards.',              icon: 'cards',   category: 'study', metric: 'cards_created', threshold: 50,  reward: REWARD },
  { key: 'first_set',    title: 'First Set',     description: 'Create your first study set.',         icon: 'folder',  category: 'study', metric: 'sets_created',  threshold: 1,   reward: REWARD },
  { key: 'sets_5',       title: 'Organized',     description: 'Create 5 study sets.',                 icon: 'folder',  category: 'study', metric: 'sets_created',  threshold: 5,   reward: REWARD },
  { key: 'first_plan',   title: 'Plan Finisher', description: 'Complete a study plan.',               icon: 'book',    category: 'study', metric: 'plans_completed', threshold: 1, reward: REWARD },

  // ── Quiz ──
  { key: 'first_quiz',   title: 'First Quiz',    description: 'Complete your first quiz.',            icon: 'quiz',    category: 'quiz',  metric: 'quizzes_taken', threshold: 1,  reward: REWARD },
  { key: 'quiz_10',      title: 'Quiz Regular',  description: 'Complete 10 quizzes.',                 icon: 'quiz',    category: 'quiz',  metric: 'quizzes_taken', threshold: 10, reward: REWARD },
  { key: 'perfect_quiz', title: 'Perfect Score', description: 'Score 100% on a quiz.',                icon: 'star',    category: 'quiz',  metric: 'perfect_quiz',  threshold: 1,  reward: REWARD },
  { key: 'quiz_explorer',title: 'Quiz Explorer', description: 'Try 4 different quiz modes.',           icon: 'compass', category: 'quiz',  metric: 'quiz_modes',    threshold: 4,  reward: REWARD },

  // ── Streak ──
  { key: 'streak_3',     title: '3-Day Streak',   description: 'Study 3 days in a row.',              icon: 'flame',   category: 'streak', metric: 'streak', threshold: 3,   reward: REWARD },
  { key: 'streak_7',     title: '7-Day Streak',   description: 'Study 7 days in a row.',              icon: 'flame',   category: 'streak', metric: 'streak', threshold: 7,   reward: REWARD },
  { key: 'streak_30',    title: '30-Day Streak',  description: 'Study 30 days in a row.',             icon: 'flame',   category: 'streak', metric: 'streak', threshold: 30,  reward: REWARD },
  { key: 'streak_100',   title: '100-Day Streak', description: 'Study 100 days in a row.',            icon: 'flame',   category: 'streak', metric: 'streak', threshold: 100, reward: REWARD },

  // ── Social ──
  { key: 'first_friend', title: 'First Friend',  description: 'Add your first friend.',               icon: 'users',   category: 'social', metric: 'friends',       threshold: 1, reward: REWARD },
  { key: 'joined_group', title: 'Joined a Group', description: 'Join your first group.',              icon: 'group',   category: 'social', metric: 'groups_joined', threshold: 1, reward: REWARD },

  // ── AI ──
  { key: 'first_ai',     title: 'Curious Mind',  description: 'Ask the AI assistant a question.',     icon: 'sparkles',category: 'ai',    metric: 'ai_questions',  threshold: 1,  reward: REWARD },
  { key: 'ai_50',        title: 'Deep Student',  description: 'Ask the AI 50 questions.',             icon: 'sparkles',category: 'ai',    metric: 'ai_questions',  threshold: 50, reward: REWARD },
];
