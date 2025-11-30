import api from './api';

const schedulePeriodsService = {
  /**
   * Get all schedule periods
   */
  async getAll() {
    const response = await api.get('/api/schedule-periods');
    return response.data;
  },

  /**
   * Get periods by schedule ID
   */
  async getByScheduleId(scheduleId) {
    const response = await api.get('/api/schedule-periods', {
      params: {
        schedule_id: scheduleId
      }
    });
    return response.data;
  },

  /**
   * Get schedule period by ID
   */
  async getById(id) {
    const response = await api.get(`/api/schedule-periods/${id}`);
    return response.data;
  },

  /**
   * Create new schedule period
   */
  async create(periodData) {
    const response = await api.post('/api/schedule-periods', periodData);
    return response.data;
  },

  /**
   * Update schedule period
   */
  async update(id, periodData) {
    const response = await api.put(`/api/schedule-periods/${id}`, periodData);
    return response.data;
  },

  /**
   * Delete schedule period
   */
  async delete(id) {
    await api.delete(`/api/schedule-periods/${id}`);
  },
};

export default schedulePeriodsService;