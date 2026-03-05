import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Problem } from '../lib/supabase';
import { Code, BookOpen, MessageSquare, Search, Filter } from 'lucide-react';
import ProblemModal from '../components/ProblemModal';

export default function Practice() {
  const { profile } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [solvedProblems, setSolvedProblems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProblems();
    fetchSolvedProblems();
  }, [profile]);

  useEffect(() => {
    filterProblems();
  }, [problems, searchQuery, typeFilter, difficultyFilter]);

  const fetchProblems = async () => {
    try {
      const { data } = await supabase
        .from('problems')
        .select('*')
        .order('created_at', { ascending: false });

      setProblems(data || []);
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSolvedProblems = async () => {
    if (!profile) return;

    try {
      const { data } = await supabase
        .from('submissions')
        .select('problem_id')
        .eq('user_id', profile.id)
        .eq('status', 'correct');

      const solved = new Set(data?.map(s => s.problem_id) || []);
      setSolvedProblems(solved);
    } catch (error) {
      console.error('Error fetching solved problems:', error);
    }
  };

  const filterProblems = () => {
    let filtered = [...problems];

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === typeFilter);
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(p => p.difficulty === difficultyFilter);
    }

    setFilteredProblems(filtered);
  };

  const difficultyColor = {
    easy: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    hard: 'text-red-600 bg-red-100',
  };

  const typeIcon = {
    coding: <Code className="w-5 h-5" />,
    mcq: <BookOpen className="w-5 h-5" />,
    interview: <MessageSquare className="w-5 h-5" />,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Practice Problems</h1>
        <p className="text-gray-600 mt-1">Sharpen your skills with coding challenges, quizzes, and interview questions</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Types</option>
                <option value="coding">Coding</option>
                <option value="mcq">MCQ</option>
                <option value="interview">Interview</option>
              </select>
            </div>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredProblems.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500">No problems found matching your criteria</p>
          </div>
        ) : (
          filteredProblems.map((problem) => {
            const isSolved = solvedProblems.has(problem.id);
            return (
              <div
                key={problem.id}
                onClick={() => setSelectedProblem(problem)}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {typeIcon[problem.type]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{problem.title}</h3>
                        {isSolved && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                            Solved
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">{problem.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${difficultyColor[problem.difficulty]}`}>
                          {problem.difficulty}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{problem.type}</span>
                        <span className="text-xs text-gray-500">{problem.points_reward} points</span>
                        {problem.tags.length > 0 && (
                          <div className="flex gap-1">
                            {problem.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedProblem && (
        <ProblemModal
          problem={selectedProblem}
          onClose={() => setSelectedProblem(null)}
          onSubmitSuccess={() => {
            fetchSolvedProblems();
            setSelectedProblem(null);
          }}
        />
      )}
    </div>
  );
}
