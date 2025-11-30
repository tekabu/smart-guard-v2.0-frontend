import api from './api';

const userFingerprintsService = {
  /**
   * Get all user fingerprints
   */
  async getAll() {
    const response = await api.get('/api/user-fingerprints');
    return response.data;
  },

  /**
   * Get fingerprints by user ID
   */
  async getByUserId(userId) {
    const response = await api.get(`/api/user-fingerprints?user_id=${userId}`);
    return response.data;
  },

  /**
   * Get fingerprint by ID
   */
  async getById(id) {
    const response = await api.get(`/api/user-fingerprints/${id}`);
    return response.data;
  },

  /**
   * Register fingerprint for user
   */
  async create(fingerprintData) {
    const response = await api.post('/api/user-fingerprints', fingerprintData);
    return response.data;
  },

  /**
   * Update fingerprint
   */
  async update(id, fingerprintData) {
    const response = await api.put(`/api/user-fingerprints/${id}`, fingerprintData);
    return response.data;
  },

  /**
   * Delete fingerprint
   */
  async delete(id) {
    await api.delete(`/api/user-fingerprints/${id}`);
  },
};

export default userFingerprintsService;