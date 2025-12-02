import api from './api';

const scheduleSessionsService = {
  // Get overview of schedule sessions with optional filters
  async getOverview(filters = {}) {
    const params = {};
    if (filters.section_id) params.section_id = filters.section_id;
    if (filters.subject_id) params.subject_id = filters.subject_id;
    if (filters.faculty_id) params.faculty_id = filters.faculty_id;
    if (filters.day_of_week) params.day_of_week = filters.day_of_week;
    if (filters.start_date) params.start_date = filters.start_date;

    const response = await api.get('/api/schedule-sessions/overview', { params });
    return response.data;
  },

  // Create a new schedule session
  async create(data) {
    const response = await api.post('/api/schedule-sessions/create?start=1', data);
    return response.data;
  },

  // Start a schedule session
  async start(scheduleSessionId) {
    const response = await api.post(`/api/schedule-sessions/${scheduleSessionId}/start`);
    return response.data;
  },

  // Close a schedule session
  async close(scheduleSessionId) {
    const response = await api.post(`/api/schedule-sessions/${scheduleSessionId}/close`);
    return response.data;
  }
};

export default scheduleSessionsService;
