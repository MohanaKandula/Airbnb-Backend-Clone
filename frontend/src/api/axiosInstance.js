import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for automatic cookie transmission (refresh tokens)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to check if a JWT is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp } = JSON.parse(jsonPayload);
    if (!exp) return false;
    // Add a 5 second buffer for network latency
    return Date.now() >= (exp * 1000 - 5000);
  } catch (error) {
    return true; // Treat invalid format as expired
  }
};

let refreshTokenPromise = null;

// Request interceptor: Attach JWT access token, refreshing it first if expired
axiosInstance.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem('accessToken');

    if (token && isTokenExpired(token)) {
      if (!refreshTokenPromise) {
        refreshTokenPromise = (async () => {
          try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
              withCredentials: true
            });
            const newAccessToken = response.data.accessToken || response.data.data?.accessToken;
            if (newAccessToken) {
              localStorage.setItem('accessToken', newAccessToken);
              axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
              return newAccessToken;
            }
            throw new Error('No access token returned in refresh response');
          } catch (err) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.dispatchEvent(new Event('auth-logout'));
            return null;
          } finally {
            refreshTokenPromise = null;
          }
        })();
      }

      const refreshedToken = await refreshTokenPromise;
      token = refreshedToken;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle expired tokens and automatic refresh (as fallback)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 (Unauthorized) and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if the error is from the refresh token request itself
      if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        return Promise.reject(error);
      }

      // If there is no token in localStorage, we are already logged out; reject immediately
      const hasToken = !!localStorage.getItem('accessToken');
      if (!hasToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            }
            return Promise.reject(error);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh token endpoint
        // Because withCredentials is true, cookies (refresh_token) are automatically sent
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true
        });

        const newAccessToken = response.data.accessToken || response.data.data?.accessToken;
        
        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          processQueue(null, newAccessToken);
          isRefreshing = false;
          
          return axiosInstance(originalRequest);
        } else {
          throw new Error('No access token returned in refresh response');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Clear local storage and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        
        // Trigger a custom event to notify Context to logout the user in real-time
        window.dispatchEvent(new Event('auth-logout'));
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
