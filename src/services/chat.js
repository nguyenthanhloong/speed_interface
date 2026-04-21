import apiClient from '../utils/axios';

export const chatService = {
    // Truyền cursor dưới dạng query params (ví dụ: ?cursor=85)
    getHistory: (cursor = null) => apiClient.get('/api/chat/history', { params: { cursor } }),

    deleteMessage: (messageId) => apiClient.delete(`/api/chat/${messageId}`),
};