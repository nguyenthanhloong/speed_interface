import apiClient from '../utils/axios';

export const productService = {
    getProducts: (skip = 0, limit = 100, search = '') => {
        let url = `/api/products?skip=${skip}&limit=${limit}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        return apiClient.get(url);
    },

    createProduct: (payload) =>
        apiClient.post('/api/products', payload),

    bulkCreateProducts: (payloads) =>
        apiClient.post('/api/products/bulk', payloads),

    updateProduct: (id, payload) =>
        apiClient.put(`/api/products/${id}`, payload),

    deleteProduct: (id) =>
        apiClient.delete(`/api/products/${id}`),
};