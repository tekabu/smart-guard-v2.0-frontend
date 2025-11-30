import api from './api';

const userRfidsService = {
  /**
   * Get all user RFIDs
   */
  async getAll() {
    const response = await api.get('/api/user-rfids');
    return response.data;
  },

  /**
   * Get RFIDs by user ID
   */
  async getByUserId(userId) {
    const response = await api.get(`/api/user-rfids?user_id=${userId}`);
    return response.data;
  },

  /**
   * Get RFID by ID
   */
  async getById(id) {
    const response = await api.get(`/api/user-rfids/${id}`);
    return response.data;
  },

  /**
   * Register RFID card for user
   */
  async create(rfidData) {
    const response = await api.post('/api/user-rfids', rfidData);
    return response.data;
  },

  /**
   * Update RFID
   */
  async update(id, rfidData) {
    const response = await api.put(`/api/user-rfids/${id}`, rfidData);
    return response.data;
  },

  /**
   * Delete RFID
   */
  async delete(id) {
    await api.delete(`/api/user-rfids/${id}`);
  },
};

export default userRfidsService;