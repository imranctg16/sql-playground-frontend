import { useState, useEffect, useCallback } from 'react';

interface ActivityState {
  isActive: boolean;
  isInTask: boolean;
  taskType: string | null;
  lastActivity: Date | null;
}

export const useActivityTracker = () => {
  const [activity, setActivity] = useState<ActivityState>({
    isActive: true,
    isInTask: false,
    taskType: null,
    lastActivity: new Date(),
  });

  const activityEvents = [
    'mousedown', 'mousemove', 'keypress', 'keydown', 'scroll', 
    'touchstart', 'click', 'focus', 'blur'
  ];

  const handleActivity = useCallback(() => {
    setActivity(prev => ({
      ...prev,
      isActive: true,
      lastActivity: new Date(),
    }));
  }, []);

  const setTaskState = useCallback((isInTask: boolean, taskType?: string) => {
    setActivity(prev => ({
      ...prev,
      isInTask,
      taskType: taskType || null,
    }));
  }, []);

  const getInactivityDuration = useCallback(() => {
    if (!activity.lastActivity) return 0;
    return Date.now() - activity.lastActivity.getTime();
  }, [activity.lastActivity]);

  const shouldPreventExpiration = useCallback(() => {
    const inactivityDuration = getInactivityDuration();
    const fiveMinutes = 5 * 60 * 1000;
    
    // Prevent expiration if:
    // 1. User is currently in a task
    // 2. User has been active within the last 5 minutes
    return activity.isInTask || inactivityDuration < fiveMinutes;
  }, [activity.isInTask, getInactivityDuration]);

  useEffect(() => {
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [handleActivity]);

  // Reset activity state after 10 minutes of inactivity
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      const inactivityDuration = getInactivityDuration();
      const tenMinutes = 10 * 60 * 1000;

      if (inactivityDuration > tenMinutes) {
        setActivity(prev => ({
          ...prev,
          isActive: false,
        }));
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(checkInactivity);
  }, [getInactivityDuration]);

  return {
    ...activity,
    setTaskState,
    shouldPreventExpiration,
    getInactivityDuration,
  };
};