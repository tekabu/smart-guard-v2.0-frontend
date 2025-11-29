import api from './api';

const devicesService = {
  /**
   * Get all devices
   */
  async getAll() {
    const response = await api.get('/api/devices');
    return response.data;
  },

  /**
   * Get device by ID
   */
  async getById(id) {
    const response = await api.get(`/api/devices/${id}`);
    return response.data;
  },

  /**
   * Create new device
   */
  async create(deviceData) {
    const response = await api.post('/api/devices', deviceData);
    return response.data;
  },

  /**
   * Update device
   */
  async update(id, deviceData) {
    const response = await api.put(`/api/devices/${id}`, deviceData);
    return response.data;
  },

  /**
   * Delete device
   */
  async delete(id) {
    await api.delete(`/api/devices/${id}`);
  },
};

export default devicesService;