import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Problem } from '../lib/supabase';
import { X, Check, AlertCircle } from 'lucide-react';

type ProblemModalProps = {
  problem: Problem;
  onClose: () => void;
  onSubmitSuccess: () => void;
};

export default function ProblemModal({ problem, onClose, onSubmitSuccess }: ProblemModalProps) {
  const { profile, refreshProfile } = useAuth();
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ status: 'correct' | 'incorrect'; message: string } | null>(null);

  const handleSubmit = async () => {
    if (!profile) return;

    setSubmitting(true);
    setResult(null);

    try {
      let isCorrect = false;
      let userAnswer = '';

      if (problem.type === 'mcq') {
        userAnswer = selectedOption;
        isCorrect = selectedOption === problem.correct_answer;
      } else {
        userAnswer = answer;
        isCorrect = true;
      }

      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          user_id: profile.id,
          problem_id: problem.id,
          status: isCorrect ? 'correct' : 'incorrect',
          code: problem.type === 'coding' ? answer : null,
          answer: problem.type !== 'coding' ? userAnswer : null,
          points_earned: isCorrect ? problem.points_reward : 0,
        });

      if (submissionError) throw submissionError;

      await supabase.rpc('check_and_award_badges', { p_user_id: profile.id });

      await supabase.rpc('refresh_leaderboard');

      await refreshProfile();

      setResult({
        status: isCorrect ? 'correct' : 'incorrect',
        message: isCorrect
          ? `Correct! You earned ${problem.points_reward} points!`
          : 'Incorrect. Try again!',
      });

      if (isCorrect) {
        setTimeout(() => {
          onSubmitSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setResult({
        status: 'incorrect',
        message: 'An error occurred. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const difficultyColor = {
    easy: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    hard: 'text-red-600 bg-red-100',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{problem.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded font-medium ${difficultyColor[problem.difficulty]}`}>
                {problem.difficulty}
              </span>
              <span className="text-sm text-gray-600">{problem.points_reward} points</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{problem.description}</p>
          </div>

          {problem.type === 'mcq' && problem.options && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Select your answer:</h3>
              <div className="space-y-2">
                {(problem.options as string[]).map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedOption === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="option"
                      value={option}
                      checked={selectedOption === option}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {problem.type === 'coding' && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Write your code:</h3>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="// Write your solution here..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {problem.type === 'interview' && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Your answer:</h3>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {result && (
            <div
              className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
                result.status === 'correct'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {result.status === 'correct' ? (
                <Check className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="font-medium">{result.message}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting || (problem.type === 'mcq' && !selectedOption) || (problem.type !== 'mcq' && !answer)}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
