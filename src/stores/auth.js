import { defineStore } from 'pinia';
import { ref } from 'vue';
import authService from '@/services/auth';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
  const isAuthenticated = ref(false);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Login user
   */
  async function login(credentials) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.login(credentials);

      // If login successful, get user data
      if (response.data) {
        await fetchUser();
        return { success: true };
      }
    } catch (err) {
      // Clear any existing auth state on login failure
      clearAuth();
      error.value = err.response?.data?.message || 'Login failed';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Logout user
   */
  async function logout() {
    loading.value = true;
    error.value = null;

    try {
      await authService.logout();
    } catch (err) {
      // Even if server logout fails, we should clear local auth
      console.warn('Server logout failed, but clearing local auth:', err);
    } finally {
      // Always clear local auth state
      clearAuth();
      loading.value = false;
      return { success: true };
    }
  }

  /**
   * Clear authentication state
   */
  function clearAuth() {
    user.value = null;
    isAuthenticated.value = false;
    error.value = null;
    
    // Clear any stored data
    localStorage.removeItem('user');
  }

  /**
   * Fetch authenticated user
   */
  async function fetchUser() {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.getUser();
      user.value = response.data.data; // Extract the actual user data from response.data.data
      isAuthenticated.value = true;

      // Store in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(response.data.data));

      return { success: true, user: response.data.data };
    } catch (err) {
      // Only clear user data if we get 401 or similar auth error
      if (err.response?.status === 401) {
        clearAuth();
      }
      error.value = err.response?.data?.message || 'Failed to fetch user';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Register new user
   */
  async function register(userData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.register(userData);

      // After registration, fetch user data
      if (response.data) {
        await fetchUser();
        return { success: true };
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Registration failed';
      return { success: false, error: error.value, errors: err.response?.data?.errors };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Check if user is authenticated (on app load)
   */
  async function checkAuth() {
    // Try to get user from localStorage first
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Handle both formats: direct user data or wrapped in data property
        user.value = parsedUser.data || parsedUser;
        isAuthenticated.value = true;
        
        // Verify with server, but handle errors gracefully
        try {
          await fetchUser();
        } catch (error) {
          // Server verification failed with 401, clear auth
          if (error.response?.status === 401) {
            console.warn('Session expired, clearing auth');
            clearAuth();
          } else {
            // Other error, keep localStorage user but log warning
            console.warn('Server verification failed, using stored user data');
          }
        }
      } catch (e) {
        console.warn('Invalid stored user data, clearing');
        clearAuth();
      }
    }
  }

  /**
   * Clear error
   */
  function clearError() {
    error.value = null;
  }

  return {
    // State
    user,
    isAuthenticated,
    loading,
    error,

    // Actions
    login,
    logout,
    clearAuth,
    fetchUser,
    register,
    checkAuth,
    clearError,
  };
});
