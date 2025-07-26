import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { User, AuthResponse, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setExpiresAt] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [tokenCheckInterval, setTokenCheckInterval] = useState<NodeJS.Timeout | null>(null);

  const startTokenMonitoring = useCallback(() => {
    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval);
    }
    
    const interval = setInterval(async () => {
      if (token && isActive) {
        try {
          const response = await axios.get(`${API_BASE_URL}/check-token`);
          
          if (response.data.success && response.data.data.refreshed) {
            // Token was refreshed
            const { token: newToken, expires_at } = response.data.data;
            setToken(newToken);
            setExpiresAt(expires_at);
            
            localStorage.setItem('sql-playground-token', newToken);
            localStorage.setItem('sql-playground-expires-at', expires_at);
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            
            console.log('Token auto-refreshed due to upcoming expiration');
          } else if (response.data.success) {
            // Token is still valid
            setExpiresAt(response.data.data.expires_at);
            localStorage.setItem('sql-playground-expires-at', response.data.data.expires_at);
          }
        } catch (error: any) {
          if (error.response?.status === 401) {
            // Token expired, logout user
            console.log('Token expired, logging out user');
            // We need to define logout function before this
          }
        }
      }
    }, 10 * 60 * 1000); // Check every 10 minutes
    
    setTokenCheckInterval(interval);
  }, [tokenCheckInterval, token, isActive, setExpiresAt]);

  useEffect(() => {
    const storedToken = localStorage.getItem('sql-playground-token');
    const storedUser = localStorage.getItem('sql-playground-user');
    const storedExpiresAt = localStorage.getItem('sql-playground-expires-at');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setExpiresAt(storedExpiresAt);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      
      // Start token monitoring
      startTokenMonitoring();
    }
    
    setLoading(false);
  }, [startTokenMonitoring]);

  // Activity tracking
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      setIsActive(true);
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, []);

  // Reset activity after 5 minutes of inactivity
  useEffect(() => {
    if (isActive) {
      const timeout = setTimeout(() => {
        setIsActive(false);
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearTimeout(timeout);
    }
  }, [isActive]);

  const stopTokenMonitoring = () => {
    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval);
      setTokenCheckInterval(null);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/login`, {
        email,
        password,
      });

      if (response.data.success) {
        const { user, token, expires_at } = response.data.data;
        
        setUser(user);
        setToken(token);
        setExpiresAt(expires_at);
        
        localStorage.setItem('sql-playground-token', token);
        localStorage.setItem('sql-playground-user', JSON.stringify(user));
        localStorage.setItem('sql-playground-expires-at', expires_at);
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Record daily activity on login
        try {
          await axios.post(`${API_BASE_URL}/activity/record`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (error) {
          console.log('Failed to record activity on login:', error);
        }
        
        // Start token monitoring
        startTokenMonitoring();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, passwordConfirmation: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/register`, {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      if (response.data.success) {
        const { user, token, expires_at } = response.data.data;
        
        setUser(user);
        setToken(token);
        setExpiresAt(expires_at);
        
        localStorage.setItem('sql-playground-token', token);
        localStorage.setItem('sql-playground-user', JSON.stringify(user));
        localStorage.setItem('sql-playground-expires-at', expires_at);
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Start token monitoring
        startTokenMonitoring();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await axios.post(`${API_BASE_URL}/logout`);
      }
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      // Stop token monitoring
      stopTokenMonitoring();
      
      setUser(null);
      setToken(null);
      setExpiresAt(null);
      localStorage.removeItem('sql-playground-token');
      localStorage.removeItem('sql-playground-user');
      localStorage.removeItem('sql-playground-expires-at');
      localStorage.removeItem('sql-playground-progress');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};