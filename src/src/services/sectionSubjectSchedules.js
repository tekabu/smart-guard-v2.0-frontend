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

    if (filters.section_id) params.append('section_id', filters.section_id);
    if (filters.subject_id) params.append('subject_id', filters.subject_id);
    if (filters.day_of_week) params.append('day_of_week', filters.day_of_week);
    if (filters.room_id) params.append('room_id', filters.room_id);

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
