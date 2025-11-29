import api from './api';

const authService = {
  /**
   * Get CSRF cookie from Laravel (required before login/register)
   */
  async getCsrfCookie() {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8021';
    return await api.get(`${baseURL}/sanctum/csrf-cookie`);
  },

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    // First, get CSRF cookie
    await this.getCsrfCookie();

    // Then attempt login
    return await api.post('/api/login', credentials);
  },

  /**
   * Logout user
   */
  async logout() {
    return await api.post('/api/logout');
  },

  /**
   * Get authenticated user
   */
  async getUser() {
    return await api.get('/api/user');
  },

  /**
   * Register new user
   * @param {Object} userData - { name, email, password, password_confirmation }
   */
  async register(userData) {
    await this.getCsrfCookie();
    return await api.post('/api/register', userData);
  },

  /**
   * Send password reset link
   * @param {Object} data - { email }
   */
  async forgotPassword(data) {
    await this.getCsrfCookie();
    return await api.post('/api/forgot-password', data);
  },

  /**
   * Reset password
   * @param {Object} data - { token, email, password, password_confirmation }
   */
  async resetPassword(data) {
    await this.getCsrfCookie();
    return await api.post('/api/reset-password', data);
  },
};

export default authService;
