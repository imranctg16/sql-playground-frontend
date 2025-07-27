import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import AuthPage from './components/AuthPage.tsx';
import QuestionList from './components/QuestionList.tsx';
import QuestionDetail from './components/QuestionDetail.tsx';
import QueryEditor from './components/QueryEditor.tsx';
import SchemaViewer from './components/SchemaViewer.tsx';
import StreakDisplay from './components/StreakDisplay.tsx';
import CelebrationEffect from './components/CelebrationEffect.tsx';
import { Question, QueryResult, TableSchema } from './types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  is_active_today: boolean;
}

const MainWorkingApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'questions' | 'schema' | 'progress' | 'help'>('questions');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [helpExpanded, setHelpExpanded] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState<{[key: string]: number}>({});
  const [isOffline, setIsOffline] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [filters, setFilters] = useState({
    difficulty: 'all' as 'all' | 'easy' | 'medium' | 'hard',
    category: 'all' as string,
    status: 'all' as 'all' | 'completed' | 'incomplete'
  });
  const [userProgress, setUserProgress] = useState({
    totalScore: 0,
    questionsCompleted: 0,
    completedQuestions: [] as number[]
  });
  const [streakData, setStreakData] = useState<StreakData>({
    current_streak: 0,
    longest_streak: 0,
    last_activity_date: null,
    is_active_today: false
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const applyFilters = useCallback(() => {
    let filtered = [...questions];

    // Filter by difficulty
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === filters.difficulty);
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(q => q.category === filters.category);
    }

    // Filter by completion status
    if (filters.status !== 'all') {
      if (filters.status === 'completed') {
        filtered = filtered.filter(q => q.completed === true);
      } else if (filters.status === 'incomplete') {
        filtered = filtered.filter(q => q.completed !== true);
      }
    }

    setFilteredQuestions(filtered);
  }, [questions, filters]);

  const loadUserProgress = useCallback(async (skipRetry = false) => {
    if (!user || (retryAttempts['progress'] >= 3 && !skipRetry)) {
      return;
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/user-progress`);
      if (response.data.success) {
        const dbProgress = response.data.data;
        setUserProgress({
          totalScore: dbProgress.total_points || 0,
          questionsCompleted: dbProgress.total_completed || 0,
          completedQuestions: dbProgress.progress.map((p: any) => p.question_id) || []
        });
        setRetryAttempts(prev => ({...prev, progress: 0}));
        setApiError(null);
      }
    } catch (error) {
      console.error('Failed to load user progress:', error);
      if (!skipRetry) {
        setRetryAttempts(prev => ({...prev, progress: (prev.progress || 0) + 1}));
        if ((retryAttempts['progress'] || 0) >= 3) {
          setIsOffline(true);
          setApiError('Unable to connect to server. Working in offline mode.');
        }
      }
    }
  }, [user, retryAttempts]);

  useEffect(() => {
    const initializeApp = async () => {
      if (user && !isOffline) {
        setIsInitialLoading(true);
        try {
          await Promise.all([
            fetchQuestions(),
            fetchSchema(),
            loadUserProgress(),
            fetchStreak()
          ]);
        } finally {
          setIsInitialLoading(false);
        }
      } else {
        setIsInitialLoading(false);
      }
    };
    
    initializeApp();
  }, [user, loadUserProgress, isOffline]);

  useEffect(() => {
    applyFilters();
  }, [questions, filters, applyFilters]);

  const getUniqueCategories = () => {
    return Array.from(new Set(questions.map(q => q.category))).sort();
  };

  const fetchSchema = async (skipRetry = false) => {
    if (retryAttempts['schema'] >= 3 && !skipRetry) {
      return;
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/schema`);
      setSchema(response.data.data);
      setRetryAttempts(prev => ({...prev, schema: 0}));
      setApiError(null);
    } catch (error) {
      console.error('Failed to fetch schema:', error);
      if (!skipRetry) {
        setRetryAttempts(prev => ({...prev, schema: (prev.schema || 0) + 1}));
        if ((retryAttempts['schema'] || 0) >= 3) {
          setIsOffline(true);
          setApiError('Unable to connect to server. Working in offline mode.');
        }
      }
    }
  };

  const fetchQuestions = async (skipRetry = false) => {
    if (retryAttempts['questions'] >= 3 && !skipRetry) {
      return;
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/questions`);
      setQuestions(response.data.data);
      setRetryAttempts(prev => ({...prev, questions: 0}));
      setApiError(null);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      if (!skipRetry) {
        setRetryAttempts(prev => ({...prev, questions: (prev.questions || 0) + 1}));
        if ((retryAttempts['questions'] || 0) >= 3) {
          setIsOffline(true);
          setApiError('Unable to connect to server. Working in offline mode.');
        }
      }
    }
  };

  const fetchStreak = async (skipRetry = false) => {
    if (retryAttempts['streak'] >= 3 && !skipRetry) {
      return;
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/streak`);
      setStreakData(response.data.data);
      setRetryAttempts(prev => ({...prev, streak: 0}));
      setApiError(null);
    } catch (error) {
      console.error('Failed to fetch streak data:', error);
      if (!skipRetry) {
        setRetryAttempts(prev => ({...prev, streak: (prev.streak || 0) + 1}));
        if ((retryAttempts['streak'] || 0) >= 3) {
          setIsOffline(true);
          setApiError('Unable to connect to server. Working in offline mode.');
        }
      }
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
    
    try {
      const response = await axios.post(`${API_BASE_URL}/evaluate`, {
        question_id: selectedQuestion.id,
        user_sql: query,
        query_type: queryType
      });

      const result = response.data.data;
      setQueryResult(result);
      setShowResultModal(true);

      // Update progress and streak for any query
      if (!isOffline) {
        await fetchStreak(); // Always update streak after any query
        
        if (result.is_correct && result.is_new_completion) {
          await loadUserProgress();
          await fetchQuestions();
        }
      }
      
      if (result.is_correct && result.is_new_completion) {
        // Trigger celebration effect for successful queries
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      } else if (result.is_correct) {
        // Show celebration even for already completed questions
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
    } catch (error: any) {
      console.error('Query execution error:', error);
      
      let errorMessage = 'An error occurred';
      if (error.response?.data) {
        // Try to extract detailed error information
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setQueryResult({
        is_correct: false,
        expected_result: [],
        user_result: [],
        points_earned: 0,
        message: errorMessage,
        error_details: error.response?.data?.error_details
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryConnection = async () => {
    setIsOffline(false);
    setApiError(null);
    setRetryAttempts({});
    
    // Retry all failed operations
    if (user) {
      await Promise.all([
        fetchQuestions(true),
        fetchSchema(true), 
        loadUserProgress(true),
        fetchStreak(true)
      ]);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleSectionClick = (section: 'questions' | 'schema' | 'progress' | 'help') => {
    console.log('Section clicked:', section);
    setActiveSection(section);
  };

  const handleResetProgress = async () => {
    setIsResetting(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/progress/reset`);
      
      if (response.data.success) {
        // Clear localStorage progress
        if (user) {
          localStorage.removeItem(`sql-playground-progress-${user.id}`);
        }
        
        // Reset all state
        setUserProgress({
          totalScore: 0,
          questionsCompleted: 0,
          completedQuestions: []
        });
        
        setStreakData({
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null,
          is_active_today: false
        });
        
        // Refresh questions to remove completion status
        if (!isOffline) {
          await fetchQuestions();
          await fetchStreak();
        }
        
        setShowResetConfirmation(false);
        alert('Progress reset successfully!');
      }
    } catch (error: any) {
      console.error('Reset progress error:', error);
      alert('Failed to reset progress. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const renderTable = (data: any[], title: string) => {
    if (!data || data.length === 0) {
      return (
        <div className="p-4 text-gray-500 text-center">
          No data to display
        </div>
      );
    }

    const columns = Object.keys(data[0]);

    return (
      <div>
        <h4 className="font-medium text-gray-800 mb-2">{title}</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column}
                      className="px-4 py-2 border-b text-sm text-gray-900"
                    >
                      {String(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Login screen
  if (!user) {
    return <AuthPage />;
  }

  // Loading screen
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading SQL Playground</h2>
          <p className="text-gray-600">Connecting to server and loading questions...</p>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating Orbs */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float-slow"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-r from-indigo-200 to-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-float-slower"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-pulse-slow"></div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-32 left-40 w-8 h-8 border-2 border-blue-300 opacity-30 animate-spin-slow transform rotate-45"></div>
        <div className="absolute bottom-40 right-32 w-6 h-6 bg-purple-300 opacity-20 animate-bounce-slow" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
        <div className="absolute top-60 right-60 w-10 h-10 border-2 border-indigo-300 rounded-full opacity-25 animate-pulse-slow"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.5) 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Top Navigation */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-xl fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-white hover:text-blue-200 transition-all duration-300 hover:scale-110 p-2 rounded-lg hover:bg-white/10"
            >
              <svg className="w-6 h-6 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 animate-pulse-slow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  SQL Playground
                </h1>
                <p className="text-blue-100 text-sm animate-pulse">Learn SQL • Build Queries • Master Database Skills</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Streak Display - Prominent */}
            <div className="flex items-center space-x-2">
              <StreakDisplay streakData={streakData} variant="compact" />
            </div>
            
            {/* Stats Display */}
            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300">
              <div className="text-center group">
                <div className="text-xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110">
                  {userProgress.totalScore}
                </div>
                <div className="text-xs text-blue-100">Points</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center group">
                <div className="text-xl font-bold bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110">
                  {userProgress.questionsCompleted}
                </div>
                <div className="text-xs text-blue-100">Solved</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center group">
                <div className="text-xl font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110">
                  {questions.length}
                </div>
                <div className="text-xs text-blue-100">Total</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium">Welcome, {user.name}!</div>
                <div className="text-xs text-blue-200">{user.email}</div>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {apiError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 fixed top-[6rem] left-0 right-0 z-40 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{apiError}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRetryConnection}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Retry Connection
              </button>
              <button
                onClick={() => setApiError(null)}
                className="text-red-700 hover:text-red-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } fixed left-0 ${apiError ? 'top-[10rem]' : 'top-[6rem]'} ${apiError ? 'h-[calc(100vh-10rem)]' : 'h-[calc(100vh-6rem)]'} z-40 shadow-sm`}>
        
        <nav className="p-4 space-y-1">
          {[
            { 
              id: 'questions', 
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ), 
              label: 'Questions', 
              badge: questions.length 
            },
            { 
              id: 'schema', 
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              ), 
              label: 'Database Schema', 
              badge: null 
            },
            { 
              id: 'progress', 
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ), 
              label: 'Progress', 
              badge: userProgress.questionsCompleted 
            },
            { 
              id: 'help', 
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              ), 
              label: 'Help & Guide', 
              badge: null 
            }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionClick(item.id as any)}
              className={`w-full flex items-center transition-all duration-200 rounded-lg ${
                sidebarCollapsed 
                  ? 'justify-center px-2 py-3' 
                  : 'px-4 py-3 space-x-3'
              } ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500 font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <div className={`flex-shrink-0 ${sidebarCollapsed ? '' : 'flex items-center justify-center'}`}>
                {item.icon}
              </div>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                  {item.badge !== null && (
                    <span className={`text-xs rounded-full px-2.5 py-1 min-w-[24px] text-center font-medium ${
                      activeSection === item.id 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} ${apiError ? 'pt-[10rem]' : 'pt-[6rem]'} relative min-h-screen`}>
        <div className="p-6 relative z-0 pb-20">
          {activeSection === 'questions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Questions List */}
              <div className="lg:col-span-1 space-y-4">
                {/* Filters */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 hover:bg-white/90">
                  <div className="flex items-center space-x-2 mb-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-800">Filter Questions</h3>
                  </div>
                  <div className="space-y-3">
                    {/* Difficulty Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Difficulty</label>
                      <div className="relative">
                        <select
                          value={filters.difficulty}
                          onChange={(e) => setFilters(prev => ({...prev, difficulty: e.target.value as any}))}
                          className="w-full text-sm bg-gray-50 border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:bg-white focus:border-blue-400 focus:outline-none transition-all appearance-none cursor-pointer hover:bg-white hover:border-gray-300"
                        >
                          <option value="all">All Difficulties</option>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Category</label>
                      <div className="relative">
                        <select
                          value={filters.category}
                          onChange={(e) => setFilters(prev => ({...prev, category: e.target.value}))}
                          className="w-full text-sm bg-gray-50 border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:bg-white focus:border-blue-400 focus:outline-none transition-all appearance-none cursor-pointer hover:bg-white hover:border-gray-300"
                        >
                          <option value="all">All Categories</option>
                          {getUniqueCategories().map(category => (
                            <option key={category} value={category}>{category.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
                      <div className="relative">
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters(prev => ({...prev, status: e.target.value as any}))}
                          className="w-full text-sm bg-gray-50 border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:bg-white focus:border-blue-400 focus:outline-none transition-all appearance-none cursor-pointer hover:bg-white hover:border-gray-300"
                        >
                          <option value="all">All Questions</option>
                          <option value="completed">Completed</option>
                          <option value="incomplete">Not Completed</option>
                        </select>
                        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {questions.length === 0 && isOffline ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                    <div className="text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.75 0-5.254.926-7.292 2.5" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Questions Unavailable</h3>
                      <p className="text-sm text-gray-500 mb-4">Unable to load questions while offline.</p>
                      <button
                        onClick={handleRetryConnection}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : (
                  <QuestionList
                    questions={filteredQuestions}
                    selectedQuestion={selectedQuestion}
                    onQuestionSelect={handleQuestionSelect}
                  />
                )}
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2">
                {selectedQuestion ? (
                  <div className="space-y-4">
                    <QuestionDetail 
                      question={selectedQuestion} 
                      onHintUsed={() => {}}
                      hintsUsed={0}
                      renderMode="header"
                    />
                    <QueryEditor
                      onQuerySubmit={handleQuerySubmit}
                      loading={loading}
                      result={queryResult}
                    />
                    <QuestionDetail 
                      question={selectedQuestion} 
                      onHintUsed={() => {}}
                      hintsUsed={0}
                      renderMode="sections"
                    />
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 p-6 text-white relative overflow-hidden">
                      {/* Animated background elements */}
                      <div className="absolute inset-0">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse-slow"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                              </svg>
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                                Welcome to SQL Playground
                              </h2>
                              <p className="text-blue-100 text-sm">Your journey to SQL mastery starts here</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setHelpExpanded(!helpExpanded)}
                            className="text-white hover:text-blue-100 transition-all duration-300 hover:scale-110 p-2 rounded-lg hover:bg-white/10"
                          >
                            <svg 
                              className={`w-5 h-5 transition-transform ${helpExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 border-b">
                      <p className="text-gray-600 text-sm">
                        Select a question from the sidebar to start practicing your SQL skills.
                      </p>
                    </div>
                    
                    {helpExpanded && (
                      <div className="p-6 space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h3 className="font-medium text-blue-800 mb-2">Database Schema</h3>
                          <p className="text-sm text-blue-600">
                            This playground uses an e-commerce database with categories, products, orders, and order items.
                            Click on "Database Schema" to explore the table structure.
                          </p>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h3 className="font-medium text-green-800 mb-2">Getting Started</h3>
                          <p className="text-sm text-green-600">
                            Use the filter panel above to find questions by difficulty, category, or completion status.
                            Each question shows points earned and completion status.
                          </p>
                        </div>
                        
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h3 className="font-medium text-purple-800 mb-2">Progress Tracking</h3>
                          <p className="text-sm text-purple-600">
                            Your progress is automatically saved. Completed questions are marked with green checkmarks 
                            and your total score is displayed in the top menu.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeSection === 'schema' && (
            schema ? (
              <SchemaViewer schema={schema} />
            ) : isOffline ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Schema Unavailable</h3>
                  <p className="text-sm text-gray-500 mb-4">Unable to load database schema while offline.</p>
                  <button
                    onClick={handleRetryConnection}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center text-gray-500">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm">Loading schema...</p>
                </div>
              </div>
            )
          )}
          
          {activeSection === 'progress' && (
            <div className="space-y-6">
              {/* Detailed Streak Display */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <StreakDisplay streakData={streakData} variant="detailed" />
                </div>
                
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Progress</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              
              {/* Reset Progress Section */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-red-600 mb-4">Reset Progress</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will permanently delete all your progress including streak data, completed questions, and points earned.
                </p>
                <button
                  onClick={() => setShowResetConfirmation(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Reset All Progress
                </button>
              </div>
            </div>
          )}
          
          {/* Reset Confirmation Modal */}
          {showResetConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h2 className="text-xl font-bold text-red-600 mb-4">Confirm Reset</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to reset all your progress? This action cannot be undone and will remove:
              </p>
              <ul className="list-disc pl-6 mb-6 text-sm text-gray-600">
                <li>All completed questions</li>
                <li>Total points earned</li>
                <li>Daily streak data</li>
                <li>Activity calendar</li>
              </ul>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowResetConfirmation(false)}
                  disabled={isResetting}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetProgress}
                  disabled={isResetting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isResetting ? 'Resetting...' : 'Reset Progress'}
                </button>
              </div>
            </div>
          </div>
        )}
          
          {activeSection === 'help' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">Help & Guide</h2>
                  <button
                    onClick={() => setHelpExpanded(!helpExpanded)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg 
                      className={`w-5 h-5 transition-transform ${helpExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {helpExpanded && (
                <div className="p-6 space-y-6">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-blue-800">Getting Started</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Choose a question from the Questions section and write your SQL query. Use the filters to find questions by difficulty, category, or completion status.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-green-800">Database Schema</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Explore the database structure in the Schema section to understand table relationships and available columns.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-purple-800">Question Filters</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Use the filter panel to narrow down questions by difficulty (Easy/Medium/Hard), category, or completion status.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-semibold text-orange-800">Progress Tracking</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Your progress is automatically saved. Check the Progress section to see detailed statistics and completed questions.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="font-semibold text-red-800">Query Tips</h3>
                    <div className="text-gray-600 text-sm mt-1">
                      <p className="mb-2">Follow these best practices:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Always use proper column names as shown in the schema</li>
                        <li>Pay attention to the expected output format</li>
                        <li>Use appropriate JOIN types for table relationships</li>
                        <li>Test your queries step by step for complex problems</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Modal */}
      {showResultModal && queryResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Query Results</h3>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div
                className={`p-4 rounded-lg mb-4 ${
                  queryResult.is_correct
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-lg ${
                      queryResult.is_correct ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {queryResult.is_correct ? '✅' : '❌'}
                  </span>
                  <span
                    className={`font-medium ${
                      queryResult.is_correct ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {queryResult.is_correct ? 'Correct!' : 'Incorrect'}
                  </span>
                  {queryResult.is_correct && (
                    <span className="text-green-600 font-medium">
                      +{queryResult.points_earned} points
                    </span>
                  )}
                </div>
                <div className={`text-sm ${queryResult.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                  <p className="mb-2">{queryResult.message}</p>
                  
                  {/* Show detailed error information for SQL syntax errors */}
                  {!queryResult.is_correct && queryResult.error_details && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md border">
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h4 className="font-medium text-red-800">Error Details:</h4>
                      </div>
                      {queryResult.error_details.sql_error && (
                        <div className="mb-2">
                          <span className="font-medium text-gray-700">SQL Error: </span>
                          <code className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-mono">
                            {queryResult.error_details.sql_error}
                          </code>
                        </div>
                      )}
                      {queryResult.error_details.query && (
                        <div className="mb-2">
                          <span className="font-medium text-gray-700">Query Executed: </span>
                          <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono block mt-1">
                            {queryResult.error_details.query}
                          </code>
                        </div>
                      )}
                      <div className="text-xs text-gray-600 mt-2">
                        💡 <strong>Tip:</strong> Check your SQL syntax, table names, and column names. 
                        Make sure you're using proper JOIN syntax like "FROM table1 JOIN table2 ON condition".
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  {renderTable(queryResult.user_result, 'Your Result')}
                </div>
                <div>
                  {renderTable(queryResult.expected_result, 'Expected Result')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Celebration Effect */}
      <CelebrationEffect 
        isVisible={showCelebration} 
        onComplete={() => setShowCelebration(false)}
        intensity="high"
      />
    </div>
    </>
  );
};

const WorkingApp: React.FC = () => {
  return (
    <AuthProvider>
      <MainWorkingApp />
    </AuthProvider>
  );
};

export default WorkingApp;