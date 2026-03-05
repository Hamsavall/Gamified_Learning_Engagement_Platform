import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  total_points: number;
  level: number;
  created_at: string;
  updated_at: string;
};

export type Problem = {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'coding' | 'mcq' | 'interview';
  points_reward: number;
  test_cases?: unknown;
  options?: string[];
  correct_answer?: string;
  tags: string[];
  created_at: string;
};

export type Submission = {
  id: string;
  user_id: string;
  problem_id: string;
  status: 'correct' | 'incorrect' | 'partial';
  code?: string;
  answer?: string;
  points_earned: number;
  submitted_at: string;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: 'problems_solved' | 'streak' | 'points' | 'level';
  requirement_value: number;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badges?: Badge;
};

export type LeaderboardEntry = {
  user_id: string;
  rank: number;
  total_points: number;
  problems_solved: number;
  updated_at: string;
  profiles?: Profile;
};
