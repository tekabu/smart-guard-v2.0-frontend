import api from './api';

const schedulesService = {
  /**
   * Get all schedules
   */
  async getAll() {
    const response = await api.get('/api/schedules');
    return response.data;
  },

  /**
   * Get schedules by faculty ID
   */
  async getByFacultyId(facultyId) {
    const response = await api.get(`/api/schedules?user_id=${facultyId}`);
    return response.data;
  },

  /**
   * Get schedules by room ID
   */
  async getByRoomId(roomId) {
    const response = await api.get(`/api/schedules?room_id=${roomId}`);
    return response.data;
  },

  /**
   * Get schedules by day of week
   */
  async getByDay(dayOfWeek) {
    const response = await api.get(`/api/schedules?day_of_week=${dayOfWeek}`);
    return response.data;
  },

  /**
   * Get schedule by ID
   */
  async getById(id) {
    const response = await api.get(`/api/schedules/${id}`);
    return response.data;
  },

  /**
   * Create new schedule
   */
  async create(scheduleData) {
    const response = await api.post('/api/schedules', scheduleData);
    return response.data;
  },

  /**
   * Update schedule
   */
  async update(id, scheduleData) {
    const response = await api.put(`/api/schedules/${id}`, scheduleData);
    return response.data;
  },

  /**
   * Delete schedule
   */
  async delete(id) {
    await api.delete(`/api/schedules/${id}`);
  },
};

export default schedulesService;