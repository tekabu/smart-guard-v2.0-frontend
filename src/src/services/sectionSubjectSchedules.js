import api from './api';

const sectionSubjectSchedulesService = {
  /**
   * Get all section subject schedules
   */
  async getAll() {
    const response = await api.get('/api/section-subject-schedules');
    return response.data;
  },

  /**
   * Get section subject schedules with filters
   */
  async getFiltered(filters = {}) {
    const params = new URLSearchParams();

    if (filters.section) params.append('section', filters.section);
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.day_of_week) params.append('day_of_week', filters.day_of_week);
    if (filters.room) params.append('room', filters.room);

    const response = await api.get(`/api/section-subject-schedules?${params.toString()}`);
    return response.data;
  },

  /**
   * Get section subject schedule by ID
   */
  async getById(id) {
    const response = await api.get(`/api/section-subject-schedules/${id}`);
    return response.data;
  },

  /**
   * Create new section subject schedule
   */
  async create(scheduleData) {
    const response = await api.post('/api/section-subject-schedules', scheduleData);
    return response.data;
  },

  /**
   * Update section subject schedule
   */
  async update(id, scheduleData) {
    const response = await api.put(`/api/section-subject-schedules/${id}`, scheduleData);
    return response.data;
  },

  /**
   * Delete section subject schedule
   */
  async delete(id) {
    await api.delete(`/api/section-subject-schedules/${id}`);
  },
};

export default sectionSubjectSchedulesService;
