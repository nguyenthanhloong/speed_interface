import apiClient from '../utils/axios';

const API_USER_PROFILE = '/api/users/me';

export const userServiceProfile = {
    getUserProfile: () =>
        apiClient.get(`${API_USER_PROFILE}`),
};