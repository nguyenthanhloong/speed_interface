import apiClient from '../utils/axios';

const API_SHIPPERS = '/api/shippers';

export const shipperService = {
    getShippers: () =>
        apiClient.get(`${API_SHIPPERS}`),
};