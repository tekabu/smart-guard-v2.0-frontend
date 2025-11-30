import api from './api';

const sectionSubjectsService = {
  /**
   * Get all section subjects
   */
  async getAll() {
    const response = await api.get('/api/section-subjects');
    return response.data;
  },

  /**
   * Get section subject options for dropdown
   */
  async getOptions() {
    const response = await api.get('/api/section-subjects/options');
    return response.data;
  },

  /**
   * Get section subject by ID
   */
  async getById(id) {
    const response = await api.get(`/api/section-subjects/${id}`);
    return response.data;
  },

  /**
   * Create new section subject
   */
  async create(sectionSubjectData) {
    const response = await api.post('/api/section-subjects', sectionSubjectData);
    return response.data;
  },

  /**
   * Update section subject
   */
  async update(id, sectionSubjectData) {
    const response = await api.put(`/api/section-subjects/${id}`, sectionSubjectData);
    return response.data;
  },

  /**
   * Delete section subject
   */
  async delete(id) {
    await api.delete(`/api/section-subjects/${id}`);
  },
};

export default sectionSubjectsService;
