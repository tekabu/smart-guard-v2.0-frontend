import api from './api';

const usersService = {
  /**
   * Get all users
   */
  async getAll() {
    const response = await api.get('/api/users');
    return response.data;
  },

  /**
   * Get users by role
   */
  async getByRole(role) {
    const response = await api.get(`/api/users?role=${role}`);
    return response.data;
  },

  /**
   * Get user by ID
   */
  async getById(id) {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  /**
   * Create new user
   */
  async create(userData) {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  /**
   * Update user
   */
  async update(id, userData) {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  },

  /**
   * Delete user
   */
  async delete(id) {
    await api.delete(`/api/users/${id}`);
  },

  /**
   * Get user count
   */
  async getCount() {
    const response = await api.get('/api/users/count');
    return response.data.data.count;
  },
};

export default usersService;