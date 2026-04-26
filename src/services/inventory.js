import apiClient from '../utils/axios';

export const inventoryService = {
    importNewVip: (payload) =>
        apiClient.post('/api/warehouse/vip/import-new', payload),

    exportNewVip: (payload) =>
        apiClient.post('/api/warehouse/vip/export-new', payload),

    importOldVip: (payload) =>
        apiClient.post('/api/warehouse/vip/import-old', payload),

    exportOldVip: (payload) =>
        apiClient.post('/api/warehouse/vip/export-old', payload),

    getVipAvailableExportNew: (maKhoSpl = '') => apiClient.get(`/api/warehouse/vip/available-export-new?ma_kho_spl=${maKhoSpl}`),
    // getVipAvailableImportOld: () => apiClient.get(`/api/warehouse/vip/available-import-old`),
    getVipAvailableExportOld: (maKhoSpl = '') => apiClient.get(`/api/warehouse/vip/available-export-old?ma_kho_spl=${maKhoSpl}`),

    importRegular: (payload) =>
        apiClient.post('/api/warehouse/thuong/import', payload),

    exportRegular: (payload) =>
        apiClient.post('/api/warehouse/thuong/export', payload),

    getHistoryVipImportNew: (skip = 0, limit = 50, sDate = '', eDate = '') => apiClient.get(`/api/warehouse/vip/import-new?skip=${skip}&limit=${limit}&start_date=${sDate}&end_date=${eDate}`),
    getHistoryVipExportNew: (skip = 0, limit = 50, sDate = '', eDate = '') => apiClient.get(`/api/warehouse/vip/export-new?skip=${skip}&limit=${limit}&start_date=${sDate}&end_date=${eDate}`),
    getHistoryVipImportOld: (skip = 0, limit = 50, sDate = '', eDate = '') => apiClient.get(`/api/warehouse/vip/import-old?skip=${skip}&limit=${limit}&start_date=${sDate}&end_date=${eDate}`),
    getHistoryVipExportOld: (skip = 0, limit = 50, sDate = '', eDate = '') => apiClient.get(`/api/warehouse/vip/export-old?skip=${skip}&limit=${limit}&start_date=${sDate}&end_date=${eDate}`),

    getHistoryRegularImport: (skip = 0, limit = 50, sDate = '', eDate = '') => apiClient.get(`/api/warehouse/thuong/import?skip=${skip}&limit=${limit}&start_date=${sDate}&end_date=${eDate}`),
    getHistoryRegularExport: (skip = 0, limit = 50, sDate = '', eDate = '') => apiClient.get(`/api/warehouse/thuong/export?skip=${skip}&limit=${limit}&start_date=${sDate}&end_date=${eDate}`),

    getInventoryVip: () => apiClient.get('/api/warehouse/vip/ton-kho'),

    getInventoryRegular: () => apiClient.get('/api/warehouse/thuong/ton-kho'),

    exportExcelVipOld: (maBill, maKho, item_id) => apiClient.get(`/api/warehouse/vip/export-old/excel/${maBill}?ma_kho_spl=${maKho}&item_id=${item_id}`, { responseType: 'blob' }),
    exportExcelVipNew: (maBill, maKho, item_id) => apiClient.get(`/api/warehouse/vip/export-new/excel/${maBill}?ma_kho_spl=${maKho}&item_id=${item_id}`, { responseType: 'blob' }),

    exportExcelRegular: (ma_bill, ma_kho_spl) => apiClient.get(`/api/warehouse/thuong/export/excel/${ma_bill}?ma_kho_spl=${ma_kho_spl}`, { responseType: 'blob' }),

    getChartDataRegular: (timeRange = '7_days') => apiClient.get(`/api/warehouse/thuong/chart?time_range=${timeRange}`),

    getChartDataVip: (timeRange = '7_days') => apiClient.get(`/api/warehouse/vip/chart?time_range=${timeRange}`),

    getRegularAvailableExport: (customerId, maKho) => apiClient.get(`/api/warehouse/thuong/available?customer_id=${customerId}&ma_kho_spl=${maKho || ''}`),

    updateHistoryRecord: (payload) => apiClient.put('/api/warehouse/update-history', payload),

    bulkImportNewVip: (payload) => apiClient.post('/api/warehouse/vip/import-new/bulk', payload),
    bulkImportOldVip: (payload) => apiClient.post('/api/warehouse/vip/import-old/bulk', payload),
    bulkImportRegular: (payload) => apiClient.post('/api/warehouse/thuong/import/bulk', payload),

    exportNoiBo: (payload) => apiClient.post('/api/warehouse/noi-bo/export', payload),

    getHistoryNoiBoExport: (skip = 0, limit = 50, sDate = '', eDate = '') =>
        apiClient.get(`/api/warehouse/noi-bo/export?skip=${skip}&limit=${limit}&start_date=${sDate}&end_date=${eDate}`),

    exportExcelNoiBo: (ma_bill) => apiClient.get(`/api/warehouse/noi-bo/export/excel/${ma_bill}`, { responseType: 'blob' }),

    actionNoiBo: (id, payload) => apiClient.post(`/api/warehouse/noi-bo/${id}/action`, payload),

    getPendingNoiBo: () => apiClient.get('/api/warehouse/noi-bo/pending'),

    getUnreadNotifications: () => apiClient.get('/api/notifications/unread', { hideLoading: true }),

    markNotificationRead: (id) => apiClient.put(`/api/notifications/${id}/read`, { hideLoading: true }),

    downloadFileToFix: (actionType) => apiClient.get(`/api/warehouse/export-for-standardize?loai_phieu=${actionType}`, { responseType: 'blob' }),

    importStandardizedExcel: (formData) =>
        apiClient.post('/api/warehouse/import-standardized', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    exportAllWarehouseHistory: () => apiClient.get('/api/warehouse/export-all-history', {
        responseType: 'blob'
    }),
};