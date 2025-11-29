import api from './api';

const subjectsService = {
  /**
   * Get all subjects
   */
  async getAll() {
    const response = await api.get('/api/subjects');
    return response.data;
  },

  /**
   * Get subject by ID
   */
  async getById(id) {
    const response = await api.get(`/api/subjects/${id}`);
    return response.data;
  },

  /**
   * Create new subject
   */
  async create(subjectData) {
    const response = await api.post('/api/subjects', subjectData);
    return response.data;
  },

  /**
   * Update subject
   */
  async update(id, subjectData) {
    const response = await api.put(`/api/subjects/${id}`, subjectData);
    return response.data;
  },

  /**
   * Delete subject
   */
  async delete(id) {
    await api.delete(`/api/subjects/${id}`);
  },
};

export default subjectsService;