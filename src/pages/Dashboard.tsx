import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Problem, UserBadge, Badge } from '../lib/supabase';
import { Trophy, Target, Award, TrendingUp, Code, BookOpen, MessageSquare } from 'lucide-react';

export default function Dashboard() {
  const { profile, refreshProfile } = useAuth();
  const [stats, setStats] = useState({
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    recentSubmissions: 0,
  });
  const [recentProblems, setRecentProblems] = useState<Problem[]>([]);
  const [userBadges, setUserBadges] = useState<(UserBadge & { badges: Badge })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;

    try {
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*, problems(difficulty)')
        .eq('user_id', profile.id)
        .eq('status', 'correct');

      const uniqueProblems = new Set(submissions?.map(s => s.problem_id) || []);
      const totalSolved = uniqueProblems.size;

      const easySolved = submissions?.filter(s =>
        s.problems && 'difficulty' in s.problems && s.problems.difficulty === 'easy'
      ).length || 0;

      const mediumSolved = submissions?.filter(s =>
        s.problems && 'difficulty' in s.problems && s.problems.difficulty === 'medium'
      ).length || 0;

      const hardSolved = submissions?.filter(s =>
        s.problems && 'difficulty' in s.problems && s.problems.difficulty === 'hard'
      ).length || 0;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentSubmissions = submissions?.filter(s =>
        new Date(s.submitted_at) > oneWeekAgo
      ).length || 0;

      setStats({
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        recentSubmissions,
      });

      const { data: problems } = await supabase
        .from('problems')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      setRecentProblems(problems || []);

      const { data: badges } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', profile.id)
        .order('earned_at', { ascending: false })
        .limit(3);

      setUserBadges(badges || []);

      await refreshProfile();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const difficultyColor = {
    easy: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    hard: 'text-red-600 bg-red-100',
  };

  const typeIcon = {
    coding: <Code className="w-4 h-4" />,
    mcq: <BookOpen className="w-4 h-4" />,
    interview: <MessageSquare className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.full_name}!</h1>
          <p className="text-gray-600 mt-1">Continue your learning journey</p>
        </div>
        <div className="flex items-center gap-4 bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-3 rounded-xl">
          <Trophy className="w-6 h-6" />
          <div>
            <div className="text-sm opacity-90">Level {profile?.level}</div>
            <div className="text-xl font-bold">{profile?.total_points} pts</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Problems Solved</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSolved}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.recentSubmissions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{profile?.total_points}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Badges Earned</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{userBadges.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Problems</h2>
          <div className="space-y-3">
            {recentProblems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No problems available yet</p>
            ) : (
              recentProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {typeIcon[problem.type]}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{problem.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${difficultyColor[problem.difficulty]}`}>
                          {problem.difficulty}
                        </span>
                        <span className="text-xs text-gray-500">{problem.points_reward} pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Badges</h2>
          <div className="space-y-3">
            {userBadges.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No badges yet. Keep solving!</p>
            ) : (
              userBadges.map((ub) => (
                <div
                  key={ub.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200"
                >
                  <div className="text-3xl">{ub.badges.icon}</div>
                  <div>
                    <h3 className="font-medium text-gray-900">{ub.badges.name}</h3>
                    <p className="text-xs text-gray-600">{ub.badges.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-2">Progress by Difficulty</h2>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-sm opacity-90">Easy</p>
            <p className="text-2xl font-bold">{stats.easySolved}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Medium</p>
            <p className="text-2xl font-bold">{stats.mediumSolved}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Hard</p>
            <p className="text-2xl font-bold">{stats.hardSolved}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
