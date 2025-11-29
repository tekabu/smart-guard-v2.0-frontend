import api from './api';

const facultyService = {
  /**
   * Get all faculty
   */
  async getAll() {
    const response = await api.get('/api/users?role=FACULTY');
    return response.data;
  },

  /**
   * Get faculty by ID
   */
  async getById(id) {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  /**
   * Create new faculty
   */
  async create(facultyData) {
    const data = {
      ...facultyData,
      role: 'FACULTY'
    };
    const response = await api.post('/api/users', data);
    return response.data;
  },

  /**
   * Update faculty
   */
  async update(id, facultyData) {
    const data = {
      ...facultyData,
      role: 'FACULTY'
    };
    const response = await api.put(`/api/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete faculty
   */
  async delete(id) {
    await api.delete(`/api/users/${id}`);
  },
};

export default facultyService;