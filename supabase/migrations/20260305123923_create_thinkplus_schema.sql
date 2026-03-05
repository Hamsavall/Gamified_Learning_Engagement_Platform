/*
  # ThinkPlus - Gamified Learning Platform Schema

  ## Overview
  This migration creates the complete database schema for the ThinkPlus platform,
  a gamified learning engagement system for students.

  ## New Tables

  ### 1. profiles
  - `id` (uuid, FK to auth.users)
  - `username` (text, unique)
  - `full_name` (text)
  - `avatar_url` (text, optional)
  - `total_points` (integer, default 0)
  - `level` (integer, default 1)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. problems
  - `id` (uuid, primary key)
  - `title` (text)
  - `description` (text)
  - `difficulty` (text: easy/medium/hard)
  - `type` (text: coding/mcq/interview)
  - `points_reward` (integer)
  - `test_cases` (jsonb, for coding problems)
  - `options` (jsonb, for MCQ problems)
  - `correct_answer` (text, for MCQ)
  - `tags` (text array)
  - `created_at` (timestamptz)

  ### 3. submissions
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to profiles)
  - `problem_id` (uuid, FK to problems)
  - `status` (text: correct/incorrect/partial)
  - `code` (text, for coding submissions)
  - `answer` (text, for MCQ/interview)
  - `points_earned` (integer)
  - `submitted_at` (timestamptz)

  ### 4. badges
  - `id` (uuid, primary key)
  - `name` (text)
  - `description` (text)
  - `icon` (text)
  - `requirement_type` (text: problems_solved/streak/points)
  - `requirement_value` (integer)

  ### 5. user_badges
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to profiles)
  - `badge_id` (uuid, FK to badges)
  - `earned_at` (timestamptz)

  ### 6. leaderboard_cache
  - `user_id` (uuid, FK to profiles)
  - `rank` (integer)
  - `total_points` (integer)
  - `problems_solved` (integer)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can read their own data
  - Users can insert submissions
  - Public read access for problems and badges
  - Leaderboard is publicly readable
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  total_points integer DEFAULT 0,
  level integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create problems table
CREATE TABLE IF NOT EXISTS problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  type text NOT NULL CHECK (type IN ('coding', 'mcq', 'interview')),
  points_reward integer NOT NULL DEFAULT 10,
  test_cases jsonb,
  options jsonb,
  correct_answer text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('correct', 'incorrect', 'partial')),
  code text,
  answer text,
  points_earned integer DEFAULT 0,
  submitted_at timestamptz DEFAULT now()
);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement_type text NOT NULL CHECK (requirement_type IN ('problems_solved', 'streak', 'points', 'level')),
  requirement_value integer NOT NULL
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create leaderboard_cache table
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  total_points integer DEFAULT 0,
  problems_solved integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_cache(rank);
CREATE INDEX IF NOT EXISTS idx_problems_type ON problems(type);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Problems policies (public read)
CREATE POLICY "Anyone can view problems"
  ON problems FOR SELECT
  TO authenticated
  USING (true);

-- Submissions policies
CREATE POLICY "Users can view own submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Badges policies (public read)
CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

-- User badges policies
CREATE POLICY "Users can view all user badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own badges"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Leaderboard policies (public read)
CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard_cache FOR SELECT
  TO authenticated
  USING (true);

-- Function to update profile points and level
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    total_points = total_points + NEW.points_earned,
    level = FLOOR((total_points + NEW.points_earned) / 100) + 1,
    updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update points when submission is created
CREATE TRIGGER on_submission_created
  AFTER INSERT ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points();

-- Function to refresh leaderboard
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
  DELETE FROM leaderboard_cache;
  
  INSERT INTO leaderboard_cache (user_id, rank, total_points, problems_solved, updated_at)
  SELECT 
    p.id,
    ROW_NUMBER() OVER (ORDER BY p.total_points DESC, p.created_at ASC) as rank,
    p.total_points,
    COUNT(DISTINCT s.problem_id) as problems_solved,
    now()
  FROM profiles p
  LEFT JOIN submissions s ON s.user_id = p.id AND s.status = 'correct'
  GROUP BY p.id, p.total_points, p.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_problems_solved integer;
  v_total_points integer;
  v_level integer;
  v_badge record;
BEGIN
  SELECT 
    COUNT(DISTINCT problem_id) FILTER (WHERE status = 'correct'),
    total_points,
    level
  INTO v_problems_solved, v_total_points, v_level
  FROM profiles p
  LEFT JOIN submissions s ON s.user_id = p.id
  WHERE p.id = p_user_id
  GROUP BY p.id;

  FOR v_badge IN 
    SELECT * FROM badges 
    WHERE id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = p_user_id)
  LOOP
    IF (v_badge.requirement_type = 'problems_solved' AND v_problems_solved >= v_badge.requirement_value) OR
       (v_badge.requirement_type = 'points' AND v_total_points >= v_badge.requirement_value) OR
       (v_badge.requirement_type = 'level' AND v_level >= v_badge.requirement_value) THEN
      
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (p_user_id, v_badge.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;