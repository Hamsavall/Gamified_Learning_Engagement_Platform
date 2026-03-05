import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, UserBadge, Badge, Submission, Problem } from '../lib/supabase';
import { Trophy, Target, Award, Calendar, Code, BookOpen, MessageSquare } from 'lucide-react';

export default function Profile() {
  const { profile } = useAuth();
  const [userBadges, setUserBadges] = useState<(UserBadge & { badges: Badge })[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<(Submission & { problems: Problem })[]>([]);
  const [stats, setStats] = useState({
    totalSolved: 0,
    codingSolved: 0,
    mcqSolved: 0,
    interviewSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    weeklyActivity: [] as { date: string; count: number }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, [profile]);

  const fetchProfileData = async () => {
    if (!profile) return;

    try {
      const { data: badges } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', profile.id)
        .order('earned_at', { ascending: false });

      setUserBadges(badges || []);

      const { data: submissions } = await supabase
        .from('submissions')
        .select('*, problems(*)')
        .eq('user_id', profile.id)
        .order('submitted_at', { ascending: false })
        .limit(10);

      setRecentSubmissions(submissions || []);

      const { data: allSubmissions } = await supabase
        .from('submissions')
        .select('*, problems(*)')
        .eq('user_id', profile.id)
        .eq('status', 'correct');

      const uniqueProblems = new Set(allSubmissions?.map(s => s.problem_id) || []);
      const totalSolved = uniqueProblems.size;

      const uniqueSolvedSubmissions = allSubmissions?.filter((s, i, arr) =>
        arr.findIndex(t => t.problem_id === s.problem_id) === i
      );

      const codingSolved = uniqueSolvedSubmissions?.filter(s => s.problems?.type === 'coding').length || 0;
      const mcqSolved = uniqueSolvedSubmissions?.filter(s => s.problems?.type === 'mcq').length || 0;
      const interviewSolved = uniqueSolvedSubmissions?.filter(s => s.problems?.type === 'interview').length || 0;

      const easySolved = uniqueSolvedSubmissions?.filter(s => s.problems?.difficulty === 'easy').length || 0;
      const mediumSolved = uniqueSolvedSubmissions?.filter(s => s.problems?.difficulty === 'medium').length || 0;
      const hardSolved = uniqueSolvedSubmissions?.filter(s => s.problems?.difficulty === 'hard').length || 0;

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const weeklyActivity = last7Days.map(date => {
        const count = allSubmissions?.filter(s =>
          s.submitted_at.startsWith(date)
        ).length || 0;
        return { date, count };
      });

      setStats({
        totalSolved,
        codingSolved,
        mcqSolved,
        interviewSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        weeklyActivity,
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
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

  const maxActivity = Math.max(...stats.weeklyActivity.map(d => d.count), 1);

  const typeIcon = {
    coding: <Code className="w-4 h-4" />,
    mcq: <BookOpen className="w-4 h-4" />,
    interview: <MessageSquare className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-xl p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-4xl font-bold">
            {profile?.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{profile?.full_name}</h1>
            <p className="text-blue-100 mt-1">@{profile?.username}</p>
            <div className="flex items-center gap-6 mt-4">
              <div>
                <div className="text-2xl font-bold">Level {profile?.level}</div>
                <div className="text-sm text-blue-100">Current Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{profile?.total_points}</div>
                <div className="text-sm text-blue-100">Total Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalSolved}</div>
                <div className="text-sm text-blue-100">Problems Solved</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Problem Types
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <Code className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700">Coding</span>
              </div>
              <span className="font-bold text-gray-900">{stats.codingSolved}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">MCQ</span>
              </div>
              <span className="font-bold text-gray-900">{stats.mcqSolved}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="text-gray-700">Interview</span>
              </div>
              <span className="font-bold text-gray-900">{stats.interviewSolved}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600" />
            Difficulty Breakdown
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Easy</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${stats.totalSolved ? (stats.easySolved / stats.totalSolved) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-bold text-gray-900 w-8">{stats.easySolved}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Medium</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500"
                    style={{ width: `${stats.totalSolved ? (stats.mediumSolved / stats.totalSolved) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-bold text-gray-900 w-8">{stats.mediumSolved}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Hard</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${stats.totalSolved ? (stats.hardSolved / stats.totalSolved) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-bold text-gray-900 w-8">{stats.hardSolved}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          Weekly Activity
        </h2>
        <div className="flex items-end gap-2 h-32">
          {stats.weeklyActivity.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${(day.count / maxActivity) * 100}%`, minHeight: day.count > 0 ? '8px' : '2px' }}
              />
              <div className="text-xs text-gray-600">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-blue-600" />
          Badges ({userBadges.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {userBadges.length === 0 ? (
            <p className="col-span-full text-gray-500 text-center py-8">No badges earned yet. Keep solving problems!</p>
          ) : (
            userBadges.map((ub) => (
              <div
                key={ub.id}
                className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 text-center"
              >
                <div className="text-4xl mb-2">{ub.badges.icon}</div>
                <h3 className="font-semibold text-gray-900 text-sm">{ub.badges.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{ub.badges.description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentSubmissions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No submissions yet. Start solving problems!</p>
          ) : (
            recentSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    {typeIcon[submission.problems.type]}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{submission.problems.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm px-3 py-1 rounded font-medium ${
                      submission.status === 'correct'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {submission.status}
                  </span>
                  <span className="text-sm text-gray-600">+{submission.points_earned} pts</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
