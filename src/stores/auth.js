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
      user.value = null;
      isAuthenticated.value = false;

      // Clear any stored data
      localStorage.removeItem('user');

      return { success: true };
    } catch (err) {
      error.value = err.response?.data?.message || 'Logout failed';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch authenticated user
   */
  async function fetchUser() {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.getUser();
      user.value = response.data;
      isAuthenticated.value = true;

      // Optionally store in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(response.data));

      return { success: true, user: response.data };
    } catch (err) {
      user.value = null;
      isAuthenticated.value = false;
      error.value = err.response?.data?.message || 'Failed to fetch user';

      // Clear localStorage if user fetch fails
      localStorage.removeItem('user');

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
        user.value = JSON.parse(storedUser);
        isAuthenticated.value = true;
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    // Then verify with server
    await fetchUser();
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
    fetchUser,
    register,
    checkAuth,
    clearError,
  };
});
