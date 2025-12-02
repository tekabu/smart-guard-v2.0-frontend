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
  }
};

export default scheduleSessionsService;
