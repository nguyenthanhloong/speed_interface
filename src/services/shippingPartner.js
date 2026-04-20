import apiClient from '../utils/axios';

export const shippingPartnerService = {
    getPartners: (skip = 0, limit = 100, search = '') => {
        let url = `/api/shipping-partners?skip=${skip}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return apiClient.get(url);
    },
    createPartner: (payload) => apiClient.post('/api/shipping-partners', payload),
    updatePartner: (id, payload) => apiClient.put(`/api/shipping-partners/${id}`, payload),
    deletePartner: (id) => apiClient.delete(`/api/shipping-partners/${id}`),
    bulkCreatePartners: (payloads) => apiClient.post('/api/shipping-partners/bulk', payloads),
};