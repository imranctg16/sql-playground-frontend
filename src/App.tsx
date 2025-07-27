import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Question, QueryResult, TableSchema } from './types';
import QuestionList from './components/QuestionList.tsx';
import QuestionDetail from './components/QuestionDetail.tsx';
import QueryEditor from './components/QueryEditor.tsx';
import SchemaViewer from './components/SchemaViewer.tsx';
import AuthPage from './components/AuthPage.tsx';
import TokenExpirationWarning from './components/TokenExpirationWarning.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { useActivityTracker } from './hooks/useActivityTracker.ts';
import { setupAxiosInterceptors } from './utils/axiosInterceptors.ts';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

interface UserProgress {
  totalScore: number;
  questionsCompleted: number;
  hintsUsed: Record<number, number>;
  achievements: string[];
  completedQuestions: number[];
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  is_active_today: boolean;
}

const MainApp: React.FC = () => {
  const { user, logout } = useAuth();
  const activityTracker = useActivityTracker();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [solutionViewed, setSolutionViewed] = useState<{[questionId: number]: boolean}>({});
  const [activeSection, setActiveSection] = useState<'questions' | 'schema' | 'progress' | 'help'>('questions');
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [userProgress, setUserProgress] = useState<UserProgress>({
    totalScore: 0,
    questionsCompleted: 0,
    hintsUsed: {},
    achievements: [],
    completedQuestions: []
  });
  const [streakData, setStreakData] = useState<StreakData>({
    current_streak: 0,
    longest_streak: 0,
    last_activity_date: null,
    is_active_today: false
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchQuestions();
    fetchSchema();
    loadUserProgress();
    fetchStreak();
    
    // Setup axios interceptors for token refresh
    setupAxiosInterceptors();
  }, [difficulty, user]);

  const loadUserProgress = async () => {
    if (user) {
      try {
        // Load from database if authenticated
        const response = await axios.get(`${API_BASE_URL}/user-progress`);
        if (response.data.success) {
          const dbProgress = response.data.data;
          const newProgress = {
            ...userProgress,
            totalScore: dbProgress.total_points || 0,
            questionsCompleted: dbProgress.total_completed || 0,
            completedQuestions: dbProgress.progress.map((p: any) => p.question_id) || []
          };
          setUserProgress(newProgress);
        }
      } catch (error) {
        console.error('Failed to load user progress:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem(`sql-playground-progress-${user.id}`);
        if (saved) {
          setUserProgress(JSON.parse(saved));
        }
      }
    }
  };

  const saveUserProgress = (progress: UserProgress) => {
    if (user) {
      localStorage.setItem(`sql-playground-progress-${user.id}`, JSON.stringify(progress));
      setUserProgress(progress);
    }
  };

  const resetProgress = () => {
    const defaultProgress: UserProgress = {
      totalScore: 0,
      questionsCompleted: 0,
      hintsUsed: {},
      achievements: [],
      completedQuestions: []
    };
    saveUserProgress(defaultProgress);
  };

  const fetchQuestions = async () => {
    try {
      const url = difficulty === 'all' 
        ? `${API_BASE_URL}/questions`
        : `${API_BASE_URL}/questions/difficulty/${difficulty}`;
      
      const response = await axios.get(url);
      setQuestions(response.data.data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const fetchSchema = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/schema`);
      setSchema(response.data.data);
    } catch (error) {
      console.error('Failed to fetch schema:', error);
    }
  };

  const fetchStreak = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/streak`);
      setStreakData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch streak data:', error);
    }
  };

  const handleQuestionSelect = (question: Question) => {
    setSelectedQuestion(question);
    setQueryResult(null);
  };

  const handleQuerySubmit = async (query: string, queryType: 'sql' | 'laravel') => {
    if (!selectedQuestion) return;

    setLoading(true);
    setQueryResult(null);
    
    // Mark user as in task to prevent token expiration
    activityTracker.setTaskState(true, 'query_execution');
    
    try {
      const hintsUsed = userProgress.hintsUsed?.[selectedQuestion.id] || 0;
      const viewedSolution = solutionViewed[selectedQuestion.id] || false;
      
      const response = await axios.post(`${API_BASE_URL}/evaluate`, {
        question_id: selectedQuestion.id,
        user_sql: query,
        query_type: queryType,
        hints_used: hintsUsed,
        viewed_solution: viewedSolution
      });

      const result = response.data.data;
      setQueryResult(result);

      // Update progress if correct
      if (result.is_correct) {
        // Refresh progress from database
        await loadUserProgress();
        // Also refresh questions to update completion status
        await fetchQuestions();
        // Refresh streak data
        await fetchStreak();
      }
    } catch (error: any) {
      setQueryResult({
        is_correct: false,
        expected_result: [],
        user_result: [],
        points_earned: 0,
        message: error.response?.data?.message || 'An error occurred'
      });
    } finally {
      setLoading(false);
      // Mark user as no longer in task
      activityTracker.setTaskState(false);
    }
  };

  const handleHintUsed = (questionId: number, penalty: number) => {
    const newProgress = {
      ...userProgress,
      hintsUsed: {
        ...userProgress.hintsUsed,
        [questionId]: (userProgress.hintsUsed?.[questionId] || 0) + penalty
      }
    };
    saveUserProgress(newProgress);
  };

  const handleSolutionViewed = (questionId: number) => {
    setSolutionViewed(prev => ({
      ...prev,
      [questionId]: true
    }));
  };

  // Top Navigation Component
  const TopNavigation = () => (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg fixed top-0 left-0 right-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold">SQL Playground</h1>
            <p className="text-blue-100 text-sm">Learn SQL and Laravel Query Builder</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4 bg-white/10 rounded-lg px-4 py-2">
            <div className="text-center">
              <div className="text-lg font-bold">{userProgress.totalScore}</div>
              <div className="text-xs text-blue-200">Total Score</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{userProgress.questionsCompleted}</div>
              <div className="text-xs text-blue-200">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{questions.length}</div>
              <div className="text-xs text-blue-200">Total Questions</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium">Welcome, {user?.name}!</div>
              <div className="text-xs text-blue-200">{user?.email}</div>
            </div>
            
            <button
              onClick={resetProgress}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Reset Progress
            </button>
            
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  // Left Sidebar Component
  const LeftSidebar = () => (
    <div className={`bg-white shadow-lg transition-all duration-300 ${
      sidebarCollapsed ? 'w-16' : 'w-64'
    } fixed left-0 top-20 h-full z-20`}>
      <div className="p-4 border-b">
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {sidebarCollapsed ? (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Expand sidebar"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">SQL</span>
                </div>
                <span className="font-semibold text-gray-800">Navigation</span>
              </div>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Collapse sidebar"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {[
          { id: 'questions', icon: '❓', label: 'Questions', badge: questions.length },
          { id: 'schema', icon: '🗄️', label: 'Database Schema', badge: null },
          { id: 'progress', icon: '📊', label: 'Progress', badge: userProgress.questionsCompleted },
          { id: 'help', icon: '❓', label: 'Help & Guide', badge: null }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id as any)}
            className={`w-full flex items-center transition-colors rounded-lg ${
              sidebarCollapsed ? 'justify-center px-3 py-3' : 'space-x-3 px-3 py-2'
            } ${
              activeSection === item.id
                ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <span className="text-xl">{item.icon}</span>
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== null && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>
      
      {sidebarCollapsed && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Expand sidebar"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  // Progress Section Component
  const ProgressSection = () => {
    const [detailedProgress, setDetailedProgress] = useState<any>(null);
    
    React.useEffect(() => {
      const fetchDetailedProgress = async () => {
        if (user) {
          try {
            const response = await axios.get(`${API_BASE_URL}/user-progress`);
            if (response.data.success) {
              setDetailedProgress(response.data.data);
            }
          } catch (error) {
            console.error('Failed to fetch detailed progress:', error);
          }
        }
      };
      
      fetchDetailedProgress();
    }, [user]);
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Progress</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">{userProgress.totalScore}</div>
              <div className="text-sm text-blue-700">Total Score</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">{userProgress.questionsCompleted}</div>
              <div className="text-sm text-green-700">Questions Completed</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">
                {questions.length ? Math.round((userProgress.questionsCompleted / questions.length) * 100) : 0}%
              </div>
              <div className="text-sm text-purple-700">Completion Rate</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-orange-600">{streakData.current_streak}</div>
              <div className="text-sm text-orange-700">
                Current Streak {streakData.is_active_today ? '🔥' : ''}
              </div>
              <div className="text-xs text-orange-600 mt-1">
                Best: {streakData.longest_streak} days
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span>{userProgress.questionsCompleted}/{questions.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${questions.length ? (userProgress.questionsCompleted / questions.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Question Statistics by Difficulty</h3>
          <div className="space-y-4">
            {['easy', 'medium', 'hard'].map((level) => {
              const levelQuestions = questions.filter(q => q.difficulty === level);
              const completed = levelQuestions.filter(q => q.completed).length;
              const completionRate = levelQuestions.length ? (completed / levelQuestions.length) * 100 : 0;
              
              return (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`w-3 h-3 rounded-full ${
                        level === 'easy' ? 'bg-green-500' :
                        level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></span>
                      <span className="capitalize font-medium text-gray-700">{level}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {completed}/{levelQuestions.length} ({Math.round(completionRate)}%)
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        level === 'easy' ? 'bg-green-500' :
                        level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {detailedProgress && detailedProgress.progress && detailedProgress.progress.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Completions</h3>
            <div className="space-y-3">
              {detailedProgress.progress.slice(0, 5).map((completion: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-600 font-bold">✓</span>
                    <div>
                      <div className="font-medium text-gray-900">{completion.title}</div>
                      <div className="text-sm text-gray-600 capitalize">{completion.difficulty} • {completion.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-600">{completion.points_earned} pts</div>
                    <div className="text-xs text-gray-500">
                      {new Date(completion.completed_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Help Section Component
  const HelpSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">How to Use SQL Playground</h2>
        
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-blue-800">Getting Started</h3>
            <p className="text-gray-600 text-sm mt-1">
              Choose a question from the Questions section and write your SQL query in the editor.
              Click "Run Query" to test your solution.
            </p>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-green-800">Database Schema</h3>
            <p className="text-gray-600 text-sm mt-1">
              Explore the database structure in the Schema section. Click on tables to see their columns and relationships.
            </p>
          </div>
          
          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="font-semibold text-orange-800">Hints System</h3>
            <p className="text-gray-600 text-sm mt-1">
              Use hints if you're stuck, but remember that using hints will reduce your final score for that question.
            </p>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-purple-800">Scoring</h3>
            <p className="text-gray-600 text-sm mt-1">
              Each question has a base point value. Correct answers add to your total score, but hint usage reduces the points earned.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">SQL Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Basic Queries</h4>
            <code className="text-sm bg-gray-100 p-2 rounded block">
              SELECT * FROM table_name;
            </code>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Filtering</h4>
            <code className="text-sm bg-gray-100 p-2 rounded block">
              SELECT * FROM table WHERE condition;
            </code>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Joins</h4>
            <code className="text-sm bg-gray-100 p-2 rounded block">
              SELECT * FROM t1 JOIN t2 ON t1.id = t2.fk;
            </code>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Aggregation</h4>
            <code className="text-sm bg-gray-100 p-2 rounded block">
              SELECT COUNT(*) FROM table GROUP BY column;
            </code>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TokenExpirationWarning expiresAt={localStorage.getItem('sql-playground-expires-at')} />
      <TopNavigation />
      <LeftSidebar />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} pt-20`}>
        <div className="p-6">
          {activeSection === 'questions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Questions List */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Levels</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <QuestionList
                  questions={questions}
                  selectedQuestion={selectedQuestion}
                  onQuestionSelect={handleQuestionSelect}
                />
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2">
                {selectedQuestion ? (
                  <div className="space-y-6">
                    <QuestionDetail 
                      question={selectedQuestion} 
                      onHintUsed={() => handleHintUsed(selectedQuestion.id, selectedQuestion.hint_penalty || 2)}
                      hintsUsed={userProgress.hintsUsed?.[selectedQuestion.id] || 0}
                      onSolutionViewed={() => handleSolutionViewed(selectedQuestion.id)}
                    />
                    <QueryEditor
                      onQuerySubmit={handleQuerySubmit}
                      loading={loading}
                      result={queryResult}
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                      Welcome to SQL Playground
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Select a question from the sidebar to start practicing your SQL skills.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-800 mb-2">Database Schema</h3>
                      <p className="text-sm text-blue-600">
                        This playground uses an e-commerce database with categories, products, orders, and order items.
                        Click on "Database Schema" to explore the table structure.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeSection === 'schema' && (
            <div className="max-w-6xl mx-auto">
              <SchemaViewer schema={schema} />
            </div>
          )}
          
          {activeSection === 'progress' && <ProgressSection />}
          
          {activeSection === 'help' && <HelpSection />}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <MainApp />;
};

export default App;