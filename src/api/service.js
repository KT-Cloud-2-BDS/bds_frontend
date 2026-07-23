import api from './apiClient.js';

// 1. 로그인 API
export const loginApi = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
};

// 3. 내 주문 목록 조회 API
export const getMyOrdersApi = async () => {
    const response = await api.get('/api/orders');
    return response.data;
};