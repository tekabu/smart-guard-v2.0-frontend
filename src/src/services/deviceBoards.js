import api from './api';

const deviceBoardsService = {
  /**
   * Get all device boards
   */
  async getAll() {
    const response = await api.get('/api/device-boards');
    return response.data;
  },

  /**
   * Get device boards with filters
   */
  async getFiltered(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.device_id) params.append('device_id', filters.device_id);
    if (filters.board_type) params.append('board_type', filters.board_type);
    if (filters.active !== undefined) params.append('active', filters.active);
    
    const response = await api.get(`/api/device-boards?${params.toString()}`);
    return response.data;
  },

  /**
   * Get device board by ID
   */
  async getById(id) {
    const response = await api.get(`/api/device-boards/${id}`);
    return response.data;
  },

  /**
   * Create new device board
   */
  async create(boardData) {
    const response = await api.post('/api/device-boards', boardData);
    return response.data;
  },

  /**
   * Update device board
   */
  async update(id, boardData) {
    const response = await api.put(`/api/device-boards/${id}`, boardData);
    return response.data;
  },

  /**
   * Delete device board
   */
  async delete(id) {
    await api.delete(`/api/device-boards/${id}`);
  },
};

export default deviceBoardsService;