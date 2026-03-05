import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, LeaderboardEntry, Profile } from '../lib/supabase';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

export default function Leaderboard() {
  const { profile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<(LeaderboardEntry & { profiles: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      await supabase.rpc('refresh_leaderboard');

      const { data } = await supabase
        .from('leaderboard_cache')
        .select('*, profiles(*)')
        .order('rank', { ascending: true })
        .limit(50);

      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-white border border-gray-200';
    }
  };

  const userRank = leaderboard.find(entry => entry.user_id === profile?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-600 mt-1">See how you rank among other students</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
          <TrendingUp className="w-5 h-5" />
          <span className="font-medium">Your Rank: #{userRank?.rank || 'N/A'}</span>
        </div>
      </div>

      {userRank && userRank.rank > 3 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {userRank.rank}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{userRank.profiles.full_name}</h3>
                <p className="text-sm text-gray-600">@{userRank.profiles.username}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{userRank.total_points}</div>
              <div className="text-sm text-gray-600">points</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 text-sm">
          <div className="col-span-1">Rank</div>
          <div className="col-span-5">Student</div>
          <div className="col-span-2 text-center">Level</div>
          <div className="col-span-2 text-center">Problems</div>
          <div className="col-span-2 text-right">Points</div>
        </div>

        <div className="divide-y divide-gray-100">
          {leaderboard.map((entry) => {
            const isCurrentUser = entry.user_id === profile?.id;
            return (
              <div
                key={entry.user_id}
                className={`grid grid-cols-12 gap-4 p-4 transition-colors ${
                  isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="col-span-1 flex items-center">
                  {entry.rank <= 3 ? (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRankColor(entry.rank)}`}>
                      {getRankIcon(entry.rank) || <span className="font-bold">{entry.rank}</span>}
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="font-semibold text-gray-600">{entry.rank}</span>
                    </div>
                  )}
                </div>

                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {entry.profiles.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{entry.profiles.full_name}</h3>
                    <p className="text-sm text-gray-600">@{entry.profiles.username}</p>
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-center">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Level {entry.profiles.level}
                  </span>
                </div>

                <div className="col-span-2 flex items-center justify-center">
                  <span className="text-gray-900 font-medium">{entry.problems_solved}</span>
                </div>

                <div className="col-span-2 flex items-center justify-end">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{entry.total_points}</div>
                    <div className="text-xs text-gray-600">points</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {leaderboard.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No entries on the leaderboard yet. Be the first!</p>
        </div>
      )}
    </div>
  );
}
