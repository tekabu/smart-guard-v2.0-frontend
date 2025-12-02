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

    if (filters.section_id) params.append('section_id', filters.section_id);
    if (filters.subject_id) params.append('subject_id', filters.subject_id);
    if (filters.faculty_id) params.append('faculty_id', filters.faculty_id);

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
