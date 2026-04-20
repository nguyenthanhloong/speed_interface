import apiClient from '../utils/axios';

const API_VEHICLES = '/api/vehicles';
const API_FLEET = '/api/fleet';

export const vehicleService = {
    getVehicles: (search = '', status = '') => {
        return apiClient.get(API_VEHICLES, {
            params: { search, status }
        });
    },

    createVehicle: (payload) => {
        return apiClient.post(API_VEHICLES, payload);
    },

    updateVehicle: (bienSoXe, payload) => {
        return apiClient.put(`${API_VEHICLES}/${bienSoXe}`, payload);
    },

    assignVehicle: (bienSoXe, shipperUsername = null) => {
        return apiClient.post(`${API_FLEET}/assign`, {
            bien_so_xe: bienSoXe,
            username_tai_xe: shipperUsername
        });
    },
};