import React from 'react';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  is_active_today: boolean;
}

interface StreakDisplayProps {
  streakData: StreakData;
  variant?: 'compact' | 'detailed';
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({ streakData, variant = 'compact' }) => {
  const getStreakEmoji = (streak: number) => {
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '⚡';
    if (streak >= 1) return '✨';
    return '🎯';
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return 'from-orange-500 to-red-500';
    if (streak >= 3) return 'from-yellow-500 to-orange-500';
    if (streak >= 1) return 'from-blue-500 to-purple-500';
    return 'from-gray-400 to-gray-500';
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 7) return 'On fire!';
    if (streak >= 3) return 'Great momentum!';
    if (streak >= 1) return 'Keep it up!';
    return 'Start your streak!';
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-2">
        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r ${getStreakColor(streakData.current_streak)} text-white text-sm font-medium`}>
          <span className="text-lg">{getStreakEmoji(streakData.current_streak)}</span>
          <span>{streakData.current_streak} day streak</span>
          {streakData.is_active_today && <span className="animate-pulse">🔥</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-orange-500">
      <div className="text-center">
        <div className="text-6xl mb-2">{getStreakEmoji(streakData.current_streak)}</div>
        
        <div className="mb-4">
          <div className={`text-4xl font-bold bg-gradient-to-r ${getStreakColor(streakData.current_streak)} bg-clip-text text-transparent`}>
            {streakData.current_streak}
          </div>
          <div className="text-gray-600 text-sm font-medium">
            {streakData.current_streak === 1 ? 'Day Streak' : 'Days Streak'}
          </div>
        </div>

        <div className="text-lg font-semibold text-gray-800 mb-2">
          {getStreakMessage(streakData.current_streak)}
        </div>

        {streakData.is_active_today && (
          <div className="flex items-center justify-center space-x-2 text-green-600 text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Active today</span>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-600">
            <div>
              <div className="font-medium text-purple-600">{streakData.longest_streak}</div>
              <div>Best Streak</div>
            </div>
            <div>
              <div className="font-medium text-blue-600">
                {streakData.last_activity_date ? new Date(streakData.last_activity_date).toLocaleDateString() : 'Never'}
              </div>
              <div>Last Activity</div>
            </div>
          </div>
        </div>

        {streakData.current_streak === 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-blue-800 text-sm font-medium">💡 Start your streak!</div>
            <div className="text-blue-600 text-xs mt-1">
              Complete a question today to begin your learning streak
            </div>
          </div>
        )}

        {streakData.current_streak >= 3 && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg">
            <div className="text-orange-800 text-sm font-medium">🎉 Awesome streak!</div>
            <div className="text-orange-600 text-xs mt-1">
              You're building great learning habits
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakDisplay;