import api from './api';

const sectionSubjectStudentsService = {
  /**
   * Get all section subject students
   */
  async getAll() {
    const response = await api.get('/api/section-subject-students');
    return response.data;
  },

  /**
   * Get section subject students with filters
   */
  async getFiltered(filters = {}) {
    const params = new URLSearchParams();

    if (filters.section) params.append('section', filters.section);
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.faculty) params.append('faculty', filters.faculty);

    const response = await api.get(`/api/section-subject-students?${params.toString()}`);
    return response.data;
  },

  /**
   * Get section subject student by ID
   */
  async getById(id) {
    const response = await api.get(`/api/section-subject-students/${id}`);
    return response.data;
  },

  /**
   * Create new section subject student
   */
  async create(sectionSubjectStudentData) {
    const response = await api.post('/api/section-subject-students', sectionSubjectStudentData);
    return response.data;
  },

  /**
   * Update section subject student
   */
  async update(id, sectionSubjectStudentData) {
    const response = await api.put(`/api/section-subject-students/${id}`, sectionSubjectStudentData);
    return response.data;
  },

  /**
   * Delete section subject student
   */
  async delete(id) {
    await api.delete(`/api/section-subject-students/${id}`);
  },
};

export default sectionSubjectStudentsService;
