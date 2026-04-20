import { defineStore } from 'pinia';
import apiClient from '../utils/axios';
import { useToast } from '../composables/useToast';
import router from '../router';

let logoutTimer = null;

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('access_token') || null,
        user: null,
        roles: [],
        permissions: [],
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,

        hasPermission: (state) => (permissionCode) => {
            if (state.permissions.includes('FUNC_ADMIN_ALL')) return true;
            return state.permissions.includes(permissionCode);
        }
    },

    actions: {
        setupAutoLogout() {
            if (logoutTimer) {
                clearTimeout(logoutTimer);
                logoutTimer = null;
            }

            if (!this.token) return;

            // 2. Giải mã token lấy hạn sử dụng
            const decodedToken = parseJwt(this.token);
            if (!decodedToken || !decodedToken.exp) return;

            const expirationTimeMs = decodedToken.exp * 1000;
            const currentTimeMs = Date.now();
            const timeUntilExpiry = expirationTimeMs - currentTimeMs;

            if (timeUntilExpiry <= 0) {
                this.logout(true);
            } else {
                console.log(`⏰ Đã cài đặt tự động đăng xuất sau ${Math.round(timeUntilExpiry / 1000 / 60)} phút nữa.`);

                logoutTimer = setTimeout(() => {
                    const toast = useToast();
                    toast.info("Phiên đăng nhập đã tự động kết thúc. Vui lòng đăng nhập lại!");
                    this.logout(true); // Truyền true để báo đây là do máy tự auto-logout
                }, timeUntilExpiry);
            }
        },

        // 1. HÀM ĐĂNG NHẬP
        async login(username, password) {
            try {
                const params = new URLSearchParams();
                params.append('grant_type', 'password');
                params.append('username', username);
                params.append('password', password);

                const response = await apiClient.post('/api/auth/login', params, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                this.token = response.data.access_token;
                localStorage.setItem('access_token', this.token);

                this.setupAutoLogout();

                await this.fetchMyProfile();
                return true;
            } catch (error) {
                console.error("Lỗi đăng nhập:", error);
                throw error;
            }
        },

        async fetchMyProfile() {
            if (!this.token) return;
            try {
                this.setupAutoLogout();

                const response = await apiClient.get('/api/users/me');
                this.user = {
                    id: response.data.id,
                    username: response.data.username,
                    full_name: response.data.full_name,
                    bien_so_xe: response.data.bien_so_xe,
                    ma_kho_spl: response.data.ma_kho_spl,
                    is_shipper: response.data.is_shipper
                };

                this.roles = response.data.roles;

                const perms = [];
                response.data.roles.forEach(role => {
                    role.permissions.forEach(p => {
                        if (!perms.includes(p.code)) perms.push(p.code);
                    });
                });
                this.permissions = perms;

            } catch (error) {
                console.error("Lỗi lấy thông tin cá nhân:", error);
                this.logout(true);
            }
        },

        logout(isAutoLogout = false) {
            if (logoutTimer) {
                clearTimeout(logoutTimer);
                logoutTimer = null;
            }

            this.token = null;
            this.user = null;
            this.roles = [];
            this.permissions = [];
            localStorage.removeItem('access_token');

            if (router.currentRoute.value.path !== '/login') {
                router.push('/login');
            }

            if (!isAutoLogout) {
                const toast = useToast();
                toast.success("Đã đăng xuất thành công!");
            }
        }
    }
});