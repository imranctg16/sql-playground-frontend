import React, { useState } from 'react';
import { Question, QuestionSolution } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

interface QuestionDetailProps {
  question: Question;
  onHintUsed?: () => void;
  hintsUsed?: number;
  renderMode?: 'header' | 'sections' | 'full';
}

const QuestionDetail: React.FC<QuestionDetailProps> = ({ question, onHintUsed, hintsUsed = 0, renderMode = 'full' }) => {
  const [showHint, setShowHint] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showHintSection, setShowHintSection] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showSolutionSection, setShowSolutionSection] = useState(false);
  const [solution, setSolution] = useState<QuestionSolution | null>(null);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'laravel'>('sql');
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleHintClick = () => {
    if (!showHint && onHintUsed) {
      onHintUsed();
    }
    setShowHint(true);
  };

  const fetchSolution = async () => {
    if (solution) {
      setShowSolution(true);
      return;
    }

    setSolutionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/questions/${question.id}/solution`);
      const data = await response.json();
      
      if (data.success) {
        setSolution(data.data);
        setShowSolution(true);
      } else {
        console.error('Failed to fetch solution:', data.message);
      }
    } catch (error) {
      console.error('Error fetching solution:', error);
    } finally {
      setSolutionLoading(false);
    }
  };

  const handleSolutionClick = () => {
    if (!showSolution) {
      fetchSolution();
    } else {
      setShowSolution(true);
    }
  };

  // Split into header and additional sections
  const renderHeader = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {question.title}
          </h1>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(
                question.difficulty
              )}`}
            >
              {question.difficulty}
            </span>
            <span className="text-sm text-gray-600">
              Category: {question.category}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {question.points} points
            </span>
          </div>
        </div>
      </div>

      <div className="prose max-w-none">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
        <p className="text-gray-700 leading-relaxed">
          {question.description}
        </p>
      </div>
    </div>
  );

  const renderAdditionalSections = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg border border-blue-200">
        <div className="p-4 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-blue-800">Instructions</h4>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-blue-600 hover:text-blue-800"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${showInstructions ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {showInstructions && (
          <div className="p-4">
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Write your SQL query in the editor below</li>
              <li>• You can also try the Laravel Query Builder equivalent</li>
              <li>• Click "Run Query" to test your solution</li>
              <li>• Your result will be compared with the expected output</li>
            </ul>
          </div>
        )}
      </div>

      {question.hint && (
        <div className="mt-6 bg-orange-50 rounded-lg border border-orange-200">
          <div className="p-4 border-b border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-orange-800">Need Help?</h4>
                {hintsUsed > 0 && (
                  <span className="text-sm text-orange-600">
                    Points deducted: {hintsUsed}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowHintSection(!showHintSection)}
                className="text-orange-600 hover:text-orange-800"
              >
                <svg 
                  className={`w-4 h-4 transition-transform ${showHintSection ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
          
          {showHintSection && (
            <div className="p-4">
              {!showHint ? (
                <div>
                  <p className="text-sm text-orange-700 mb-3">
                    💡 A hint is available for this question, but using it will deduct{' '}
                    <span className="font-semibold">{question.hint_penalty || 2} points</span> from your final score.
                  </p>
                  <button
                    onClick={handleHintClick}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Show Hint (-{question.hint_penalty || 2} points)
                  </button>
                </div>
              ) : (
                <div className="flex items-start space-x-2">
                  <span className="text-orange-500 text-lg">💡</span>
                  <div>
                    <p className="text-sm font-medium text-orange-800 mb-1">Hint:</p>
                    <p className="text-sm text-orange-700">{question.hint}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-purple-50 rounded-lg border border-purple-200">
        <div className="p-4 border-b border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-purple-800">Solution</h4>
              <span className="text-sm text-purple-600">
                (View without earning points)
              </span>
            </div>
            <button
              onClick={() => setShowSolutionSection(!showSolutionSection)}
              className="text-purple-600 hover:text-purple-800"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${showSolutionSection ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {showSolutionSection && (
          <div className="p-4">
            {!showSolution ? (
              <div>
                <p className="text-sm text-purple-700 mb-3">
                  🔍 View the solution for this question. Note that viewing the solution will not award any points, but it's great for learning!
                </p>
                <button
                  onClick={handleSolutionClick}
                  disabled={solutionLoading}
                  className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {solutionLoading ? 'Loading...' : 'View Solution'}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => setActiveTab('sql')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      activeTab === 'sql' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-purple-200 text-purple-700 hover:bg-purple-300'
                    }`}
                  >
                    SQL
                  </button>
                  <button
                    onClick={() => setActiveTab('laravel')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      activeTab === 'laravel' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-purple-200 text-purple-700 hover:bg-purple-300'
                    }`}
                  >
                    Laravel
                  </button>
                </div>
                
                <div className="bg-white rounded border border-purple-200 p-4">
                  <h5 className="font-medium text-purple-800 mb-2">
                    {activeTab === 'sql' ? 'SQL Solution:' : 'Laravel Query Builder Solution:'}
                  </h5>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    <code>
                      {activeTab === 'sql' ? solution?.sql_solution : solution?.laravel_solution}
                    </code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (renderMode === 'header') {
    return renderHeader();
  } else if (renderMode === 'sections') {
    return renderAdditionalSections();
  } else {
    // Full mode - original layout
    return (
      <div className="space-y-6">
        {renderHeader()}
        {renderAdditionalSections()}
      </div>
    );
  }
};

export default QuestionDetail;