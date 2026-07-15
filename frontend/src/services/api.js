import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'https://company-management-system-nocn.vercel.app/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for getting/setting HTTP-only cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach access token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle automatic token refreshing on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401, is a token expired error, and we haven't retried yet
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Request a new access token using the HTTP-only refresh token cookie
        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data;
        
        // Save new access token
        localStorage.setItem('token', accessToken);

        // Update authorization header for the retried request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed. Logging out...', refreshError);
        
        // Clear local storage and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Dispatch custom event to let AuthContext know
        window.dispatchEvent(new Event('auth-session-expired'));
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { API_URL };
export default api;
