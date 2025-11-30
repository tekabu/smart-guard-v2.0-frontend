import api from './api';

const roomsService = {
  /**
   * Get all rooms
   */
  async getAll() {
    const response = await api.get('/api/rooms');
    return response.data;
  },

  /**
   * Get room by ID
   */
  async getById(id) {
    const response = await api.get(`/api/rooms/${id}`);
    return response.data;
  },

  /**
   * Create new room
   */
  async create(roomData) {
    const response = await api.post('/api/rooms', roomData);
    return response.data;
  },

  /**
   * Update room
   */
  async update(id, roomData) {
    const response = await api.put(`/api/rooms/${id}`, roomData);
    return response.data;
  },

  /**
   * Delete room
   */
  async delete(id) {
    await api.delete(`/api/rooms/${id}`);
  },

  /**
   * Get room count
   */
  async getCount() {
    const response = await api.get('/api/rooms/count');
    return response.data.data.count;
  },
};

export default roomsService;