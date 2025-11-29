import api from './api';

const studentsService = {
  /**
   * Get all students
   */
  async getAll() {
    const response = await api.get('/api/users?role=STUDENT');
    return response.data;
  },

  /**
   * Get student by ID
   */
  async getById(id) {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  /**
   * Create new student
   */
  async create(studentData) {
    const data = {
      ...studentData,
      role: 'STUDENT'
    };
    const response = await api.post('/api/users', data);
    return response.data;
  },

  /**
   * Update student
   */
  async update(id, studentData) {
    const data = {
      ...studentData,
      role: 'STUDENT'
    };
    const response = await api.put(`/api/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete student
   */
  async delete(id) {
    await api.delete(`/api/users/${id}`);
  },
};

export default studentsService;