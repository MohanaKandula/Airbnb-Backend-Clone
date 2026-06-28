import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '../api/axiosInstance';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');

      if (token) {
        try {
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
          // Fetch freshest profile to ensure state synchronization
          const response = await axiosInstance.get('/users/profile');
          const freshUser = response.data.data || response.data;
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch (err) {
          if (err.response?.status === 401) {
            console.log('Session expired or invalid token. User logged out.');
          } else {
            console.error('Failed to restore session:', err);
          }
          // If profile fetch fails, token might be invalid or expired
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen to Axios interceptor's logout event
    const handleForceLogout = () => {
      logout();
    };
    window.addEventListener('auth-logout', handleForceLogout);

    return () => {
      window.removeEventListener('auth-logout', handleForceLogout);
    };
  }, []);

  // Connect to real-time notification stream when user is logged in
  useEffect(() => {
    if (!user || !user.email) return;

    const sseUrl = `http://localhost:8080/api/v1/notifications/subscribe?email=${encodeURIComponent(user.email)}`;
    console.log(`Connecting to SSE notifications for: ${user.email} at ${sseUrl}`);

    let eventSource;
    try {
      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener('INIT', (event) => {
        console.log('SSE connection initialized:', event.data);
      });

      eventSource.addEventListener('NOTIFICATION', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE notification received:', data);

          // Deduplicate real-time SSE notifications with recently shown local toasts
          const isDuplicateOfLocalAction = (title, body) => {
            if (!window._recentToasts || window._recentToasts.length === 0) return false;

            const now = Date.now();
            const recent = window._recentToasts.filter(t => now - t.timestamp < 7000);
            
            const titleLower = (title || "").toLowerCase();
            const bodyLower = (body || "").toLowerCase();

            return recent.some(localToast => {
              if (localToast.type !== 'success' && localToast.type !== 'info') return false;

              const localText = localToast.text;

              // Check specific keyword mappings:
              // 1. Cancel booking
              if (titleLower.includes('cancel') && localText.includes('cancel')) {
                return true;
              }
              // 2. Reservation/Booking creation
              if ((titleLower.includes('reserved') || titleLower.includes('booking')) && 
                  (localText.includes('reservation') || localText.includes('booking') || localText.includes('checkout'))) {
                return true;
              }
              // 3. Payment confirmations
              if (titleLower.includes('payment') && 
                  (localText.includes('payment') || localText.includes('pay at property') || localText.includes('reservation placed'))) {
                return true;
              }
              // 4. Property submitted
              if (titleLower.includes('property submitted') && 
                  (localText.includes('property submitted') || localText.includes('hotel submitted') || localText.includes('successfully submitted'))) {
                return true;
              }
              // 5. Property approved
              if (titleLower.includes('property approved') && 
                  (localText.includes('approved successfully') || localText.includes('approve'))) {
                return true;
              }

              // 6. Generic overlap check (shares multiple significant words of length > 3)
              const localWords = localText.split(/\s+/).filter(w => w.length > 3);
              const matchCount = localWords.filter(w => titleLower.includes(w) || bodyLower.includes(w)).length;
              if (matchCount >= 2) {
                return true;
              }

              return false;
            });
          };

          if (isDuplicateOfLocalAction(data.title, data.body)) {
            console.log('Skipped duplicate SSE toast notification:', data.title);
            return;
          }

          toast.info(
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{data.title}</span>
              <span style={{ fontSize: '12px', opacity: 0.9 }}>{data.body}</span>
            </div>,
            {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              theme: "colored",
            }
          );
        } catch (err) {
          console.error('Error parsing SSE event data:', err);
        }
      });

      eventSource.onerror = (error) => {
        console.warn('SSE connection error, closing/reconnecting...', error);
      };
    } catch (e) {
      console.error('Failed to initialize SSE EventSource:', e);
    }

    return () => {
      if (eventSource) {
        console.log('Closing SSE connection for:', user.email);
        eventSource.close();
      }
    };
  }, [user]);


  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      // Support different shapes of backend responses: { accessToken, user } or { data: { accessToken, user } }
      const resData = response.data.data || response.data;
      const { accessToken, user: loggedUser } = resData;

      if (!accessToken) {
        throw new Error('Access token was not returned by the server');
      }

      localStorage.setItem('accessToken', accessToken);
      
      // Fetch full user profile or use returned user data
      let fullUser = loggedUser;
      if (!fullUser) {
        const profileRes = await axiosInstance.get('/users/profile');
        fullUser = profileRes.data.data || profileRes.data;
      }

      localStorage.setItem('user', JSON.stringify(fullUser));
      setUser(fullUser);
      setLoading(false);
      return fullUser;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const signup = async (signupData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/auth/signup', signupData);
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || err.message || 'Signup failed. Please try again.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axiosInstance.patch('/users/profile', profileData);
      const updatedUser = response.data.data || response.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update profile.';
      throw new Error(errMsg);
    }
  };

  const verifyHost = async () => {
    try {
      const response = await axiosInstance.patch('/users/verify-host');
      const updatedUser = response.data.data || response.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to verify host.';
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    updateProfile,
    verifyHost,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ROLE_HOTEL_MANAGER' || user?.roles?.includes('ROLE_HOTEL_MANAGER')
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
