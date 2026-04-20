import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { requiresAuth: true }
    },

    {
        path: '/inventory/transaction',
        name: 'InventoryTransaction',
        component: () => import('../views/InventoryTransaction.vue'),
        meta: {
            requiresAuth: true,
            requiresAnyPermission: [
                'FUNC_VIP_NHAP_MOI',
                'FUNC_VIP_XUAT_MOI',
                'FUNC_VIP_NHAP_CU',
                'FUNC_VIP_XUAT_CU',
                'FUNC_THUONG_NHAP',
                'FUNC_THUONG_XUAT',
                'FUNC_LE_NHAP',
                'FUNC_LE_XUAT'
            ]
        }
    },

    {
        path: '/inventory/history',
        name: 'InventoryHistory',
        component: () => import('../views/InventoryHistory.vue'),
        meta: {
            requiresAuth: true,
            requiresAnyPermission: [
                'FUNC_VIP_NHAP_MOI',
                'FUNC_VIP_XUAT_MOI',
                'FUNC_VIP_NHAP_CU',
                'FUNC_VIP_XUAT_CU',
                'FUNC_THUONG_NHAP',
                'FUNC_THUONG_XUAT',
                'FUNC_LE_NHAP',
                'FUNC_LE_XUAT'
            ]
        }
    },

    {
        path: '/inventory/dashboard',
        name: 'InventoryDashboard',
        component: () => import('../views/InventoryDashboard.vue'),
        meta: {
            requiresAuth: true,
            requiresAnyPermission: [
                'FUNC_ADMIN_ALL',
                'FUNC_THUONG_NHAP', 'FUNC_THUONG_XUAT',
                'FUNC_LE_NHAP', 'FUNC_LE_XUAT'
            ]
        }
    },

    {
        path: '/inventory/approve-transfer',
        name: 'ApproveTransfer',
        component: () => import('../views/ApproveTransferScreen.vue'),
        meta: {
            requiresAuth: true,
            requiresAnyPermission: [
                'FUNC_ADMIN_ALL',
                'FUNC_CUSTOMER_MGR',
                'FUNC_TRUONG_KHO'
            ]
        }
    },

    {
        path: '/inventory/update-info',
        name: 'InventoryUpdateInfo',
        component: () => import('../views/InventoryUpdateInfo.vue'),
        meta: {
            requiresAuth: true,
            requiresAnyPermission: ['FUNC_VIP_NHAP_MOI', 'FUNC_VIP_NHAP_CU', 'FUNC_THUONG_NHAP', 'FUNC_ADMIN_ALL', 'FUNC_CUSTOMER_MGR', 'FUNC_TRUONG_KHO']
        }
    },

    {
        path: '/admin/roles',
        name: 'RoleManagement',
        component: () => import('../views/AdminRoles.vue'),
        meta: { requiresAuth: true, requiresPermission: 'FUNC_ADMIN_ALL' }
    },
    {
        path: '/admin/users',
        name: 'UserManagement',
        component: () => import('../views/AdminUsers.vue'),
        meta: { requiresAuth: true, requiresPermission: 'FUNC_ADMIN_ALL' }
    },
    {
        path: '/admin/permissions',
        name: 'PermissionManagement',
        component: () => import('../views/AdminPermissions.vue'),
        meta: { requiresAuth: true, requiresPermission: 'FUNC_ADMIN_ALL' }
    },
    {
        path: '/admin/customers',
        name: 'CustomerManagement',
        component: () => import('../views/CustomerManagement.vue'),
        meta: {
            requiresAuth: true,
            requiresAnyPermission: ['FUNC_ADMIN_ALL', 'FUNC_CUSTOMER_MGR']
        }
    },
    {
        path: '/admin/cars',
        name: 'VehicleManagement',
        component: () => import('../views/VehicleManagement.vue'),
        meta: {
            requiresAuth: true,
            requiresAnyPermission: ['FUNC_ADMIN_ALL', 'FUNC_CUSTOMER_MGR']
        }
    },
    {
        path: '/admin/locations',
        name: 'ViTriKhoManagement',
        component: () => import('../views/ViTriKhoManagement.vue'),
        meta: {
            requiresAuth: true,
            requiresAnyPermission: ['FUNC_ADMIN_ALL', 'FUNC_CUSTOMER_MGR']
        }
    },
    {
        path: '/admin/products',
        name: 'ProductManagement',
        component: () => import('../views/ProductManagement.vue'),
        meta: {
            requiresAuth: true,
            requiresAnyPermission: ['FUNC_ADMIN_ALL', 'FUNC_CUSTOMER_MGR']
        }
    },
    {
        path: '/admin/shipping-partners',
        name: 'ShippingPartnerManagement',
        component: () => import('../views/ShippingPartnerManagement.vue'),
        meta: {
            requiresAuth: true,
            requiresAnyPermission: ['FUNC_ADMIN_ALL', 'FUNC_CUSTOMER_MGR']
        }
    },

    {
        path: '/403',
        name: 'Forbidden',
        component: () => import('../views/Forbidden.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        redirect: '/'
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated;

    if (to.meta.requiresAuth && !isAuthenticated) {
        return next('/login');
    }

    if (to.path === '/login' && isAuthenticated) {
        return next('/');
    }

    if (isAuthenticated && !authStore.user) {
        try {
            await authStore.fetchMyProfile();
        } catch (error) {
            authStore.logout();
            return next('/login');
        }
    }

    if (to.meta.requiresPermission) {
        if (!authStore.hasPermission(to.meta.requiresPermission)) {
            console.warn(`Chặn truy cập! Thiếu quyền: ${to.meta.requiresPermission}`);
            return next('/403');
        }
    }

    if (to.meta.requiresAnyPermission) {
        const hasAccess = to.meta.requiresAnyPermission.some(permission =>
            authStore.hasPermission(permission)
        );

        if (!hasAccess) {
            console.warn(`Chặn truy cập! Cần ít nhất 1 trong các quyền: ${to.meta.requiresAnyPermission.join(', ')}`);
            return next('/403');
        }
    }

    next();
});

export default router;