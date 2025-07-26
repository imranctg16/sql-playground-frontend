import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

export const setupAxiosInterceptors = () => {
  // Request interceptor to add token to headers
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('sql-playground-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle token expiration
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue the request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('sql-playground-token');
          
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await axios.post(`${API_BASE_URL}/refresh`, {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`
            }
          });

          const { token: newToken, expires_at } = response.data.data;
          
          // Update stored token
          localStorage.setItem('sql-playground-token', newToken);
          localStorage.setItem('sql-playground-expires-at', expires_at);
          
          // Update axios default headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          // Process queued requests
          processQueue(null, newToken);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
          
        } catch (refreshError) {
          // Refresh failed, logout user
          processQueue(refreshError, null);
          
          // Clear all stored data
          localStorage.removeItem('sql-playground-token');
          localStorage.removeItem('sql-playground-user');
          localStorage.removeItem('sql-playground-expires-at');
          localStorage.removeItem('sql-playground-progress');
          
          // Redirect to login
          window.location.href = '/login';
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

export const clearAxiosInterceptors = () => {
  axios.interceptors.request.clear();
  axios.interceptors.response.clear();
};