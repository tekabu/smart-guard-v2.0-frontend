import api from './api';

const scheduleAttendanceService = {
  // Get overview of schedule attendance with optional filters
  async getOverview(filters = {}) {
    const params = {};
    if (filters.section_id) params.section_id = filters.section_id;
    if (filters.subject_id) params.subject_id = filters.subject_id;
    if (filters.faculty_id) params.faculty_id = filters.faculty_id;
    if (filters.date_in) params.date_in = filters.date_in;

    const response = await api.get('/api/schedule-attendance/overview', { params });
    return response.data;
  }
};

export default scheduleAttendanceService;
