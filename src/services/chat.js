import apiClient from '../utils/axios';

export const chatService = {
    getHistory: () => apiClient.get('/api/chat/history'),
};