# Gamified Learning Engagement Platform

## Overview
ThinkPlus is a full-stack gamified learning platform where students practice coding problems, quizzes, and interview questions while earning points, badges, and competing on leaderboards.

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + REST APIs + Authentication)
- **Authentication**: JWT-based (via Supabase Auth)

## Core Features Implemented

### 1. User Authentication
- Student registration with username and full name
- Login with email and password
- JWT token-based authentication
- Profile creation on signup

### 2. Student Dashboard
- Welcome screen with user stats
- Total points and current level display
- Problems solved counter
- Weekly activity tracker
- Recent problems list
- Badge showcase
- Difficulty breakdown (Easy/Medium/Hard)

### 3. Practice Module
- Browse all available problems
- Filter by type (Coding, MCQ, Interview)
- Filter by difficulty (Easy, Medium, Hard)
- Search problems by title or description
- Solve problems in modal interface
- Immediate feedback on submissions
- Points awarded for correct answers
- Track solved vs unsolved problems

### 4. Gamification System
- Points system (awarded on problem completion)
- 11 achievement badges:
  - First Steps (1 problem)
  - Getting Started (5 problems)
  - Problem Solver (10 problems)
  - Dedicated Learner (25 problems)
  - Master Coder (50 problems)
  - Point Collector (100 points)
  - Rising Star (250 points)
  - Point Master (500 points)
  - Level Up (Level 3)
  - Advanced (Level 5)
  - Expert (Level 10)
- Level progression (1 level per 100 points)
- Automatic badge awarding
- Leaderboard rankings

### 5. Leaderboard
- Global ranking of all students
- Rank based on total points
- Display top 50 students
- Shows total points and problems solved
- Highlights current user position
- Visual rank indicators for top 3

### 6. Profile & Progress Analytics
- User profile overview
- Total points and level display
- Problem type breakdown (Coding, MCQ, Interview)
- Difficulty breakdown with progress bars
- Weekly activity chart (last 7 days)
- Badge collection display
- Recent submission history

## Database Schema

### Tables
1. **profiles** - User profiles with points and levels
2. **problems** - Coding problems, MCQs, and interview questions
3. **submissions** - User solutions and attempts
4. **badges** - Available achievement badges
5. **user_badges** - Badges earned by users
6. **leaderboard_cache** - Cached leaderboard rankings

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only modify their own data
- Public read access for problems and leaderboard
- Authenticated access required for submissions

### Database Functions
- `update_user_points()` - Auto-updates points and level on submission
- `refresh_leaderboard()` - Updates leaderboard rankings
- `check_and_award_badges()` - Awards badges based on achievements

## Sample Data Included
- 12 practice problems (Coding, MCQ, Interview)
- Difficulty levels: Easy, Medium, Hard
- 11 achievement badges
- Tags for problem categorization

## Pages
1. **Auth** (`/`) - Login and registration
2. **Dashboard** - Overview of progress and recent activity
3. **Practice** - Browse and solve problems
4. **Leaderboard** - Global student rankings
5. **Profile** - User analytics and progress tracking

## Key Features
- Responsive design for mobile and desktop
- Real-time point updates
- Automatic badge awarding
- Leaderboard ranking system
- Progress tracking and analytics
- Clean, modern UI with Tailwind CSS
- Type-safe with TypeScript
- Secure authentication with JWT

## Getting Started
1. Register a new account
2. Browse problems in the Practice section
3. Solve problems to earn points and badges
4. Track your progress on the Profile page
5. Compete with others on the Leaderboard

## Database Connection
The application uses Supabase with PostgreSQL. All database credentials are configured in the `.env` file.
