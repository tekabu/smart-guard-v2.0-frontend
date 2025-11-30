import api from './api';

const sectionsService = {
  /**
   * Get all sections
   */
  async getAll() {
    const response = await api.get('/api/sections');
    return response.data;
  },

  /**
   * Get section by ID
   */
  async getById(id) {
    const response = await api.get(`/api/sections/${id}`);
    return response.data;
  },

  /**
   * Create new section
   */
  async create(sectionData) {
    const response = await api.post('/api/sections', sectionData);
    return response.data;
  },

  /**
   * Update section
   */
  async update(id, sectionData) {
    const response = await api.put(`/api/sections/${id}`, sectionData);
    return response.data;
  },

  /**
   * Delete section
   */
  async delete(id) {
    await api.delete(`/api/sections/${id}`);
  },
};

export default sectionsService;
