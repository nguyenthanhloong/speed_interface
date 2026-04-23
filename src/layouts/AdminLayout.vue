<template>
  <div class="app-wrapper" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <router-link to="/">
          <img
            src="../assets/CompanyLogo4.png"
            alt="SpeedUp Logo"
            class="sidebar-logo"
            v-if="!isSidebarCollapsed"
          />
          <img
            src="../assets/CompanyLogo4.png"
            alt="SpeedUp Logo"
            class="sidebar-logo-collapsed"
            v-else
          />
          <!-- <Database class="brand-icon" v-else /> -->
        </router-link>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" title="Dashboard">
          <LayoutDashboard class="nav-icon" />
          <span v-if="!isSidebarCollapsed">Dashboard</span>
        </router-link>

        <div
          class="nav-group"
          v-permission="'FUNC_CUSTOMER_MGR'"
          v-if="!isSidebarCollapsed"
        >
          DANH MỤC CƠ SỞ
        </div>

        <router-link
          to="/admin/customers"
          class="nav-item"
          v-permission="'FUNC_CUSTOMER_MGR'"
          title="Khách Hàng"
        >
          <Users class="nav-icon" />
          <span v-if="!isSidebarCollapsed">Khách Hàng</span>
        </router-link>

        <router-link
          to="/admin/locations"
          class="nav-item"
          v-permission="'FUNC_CUSTOMER_MGR'"
          title="Vị Trí Kho"
        >
          <MapPin class="nav-icon" />
          <span v-if="!isSidebarCollapsed">Vị Trí Kho</span>
        </router-link>

        <div
          class="nav-group"
          v-permission="'FUNC_ADMIN_ALL'"
          v-if="!isSidebarCollapsed"
        >
          QUẢN TRỊ HỆ THỐNG
        </div>

        <router-link
          to="/admin/users"
          class="nav-item"
          v-permission="'FUNC_ADMIN_ALL'"
          title="Người Dùng"
        >
          <Users class="nav-icon" />
          <span v-if="!isSidebarCollapsed">Người Dùng</span>
        </router-link>

        <router-link
          to="/admin/roles"
          class="nav-item"
          v-permission="'FUNC_ADMIN_ALL'"
          title="Vai Trò (Roles)"
        >
          <ShieldCheck class="nav-icon" />
          <span v-if="!isSidebarCollapsed">Vai Trò (Roles)</span>
        </router-link>

        <router-link
          to="/admin/permissions"
          class="nav-item"
          v-permission="'FUNC_ADMIN_ALL'"
          title="Chức Năng (Perms)"
        >
          <Key class="nav-icon" />
          <span v-if="!isSidebarCollapsed">Chức Năng (Perms)</span>
        </router-link>
      </nav>
    </aside>

    <div class="main-content">
      <header class="topbar">
        <div class="topbar-left">
          <button class="btn-toggle-sidebar" @click="toggleSidebar">
            <Menu class="toggle-icon" />
          </button>

          <div class="breadcrumbs">
            <router-link to="/" class="breadcrumb-item">Trang chủ</router-link>
            <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
              <ChevronRight class="breadcrumb-separator" />
              <span
                class="breadcrumb-item"
                :class="{ active: index === breadcrumbs.length - 1 }"
                >{{ crumb.name }}</span
              >
            </template>
          </div>
        </div>

        <div class="topbar-right" v-if="authStore.user">
          <NotificationBell />
          <div class="user-profile-container" ref="dropdownRef">
            <div class="user-profile" @click="toggleDropdown">
              <div class="avatar"><User class="avatar-icon" /></div>
              <span class="user-name">{{ authStore.user.full_name }}</span>
              <ChevronDown
                class="dropdown-icon"
                :class="{ rotate: isDropdownOpen }"
              />
            </div>

            <transition name="dropdown-fade">
              <div class="dropdown-menu" v-if="isDropdownOpen">
                <div class="dropdown-header">
                  <span class="dropdown-name">{{
                    authStore.user.full_name
                  }}</span>
                </div>
                <div class="dropdown-divider"></div>
                <button
                  href="#"
                  class="dropdown-item"
                  @click.prevent="openProfileModal"
                >
                  <User class="dropdown-item-icon" /> Hồ sơ cá nhân
                </button>
                <!-- <a
                  href="#"
                  class="dropdown-item"
                  @click.prevent="toggleDarkMode"
                >
                  <Moon v-if="!isDarkMode" class="dropdown-item-icon" />
                  <Sun v-else class="dropdown-item-icon" />
                  {{ isDarkMode ? 'Giao diện: Sáng' : 'Giao diện: Tối' }}
                </a> -->
                <div class="dropdown-divider"></div>
                <button
                  class="dropdown-item text-danger"
                  @click="showLogoutConfirm = true"
                >
                  <LogOut class="dropdown-item-icon" /> Đăng xuất
                </button>
              </div>
            </transition>
          </div>
        </div>
      </header>

      <main class="page-content">
        <slot></slot>
      </main>
    </div>

    <ConfirmModal
      :isOpen="showLogoutConfirm"
      title="Xác nhận Đăng xuất"
      message="Bạn có chắc chắn muốn kết thúc phiên làm việc và đăng xuất khỏi hệ thống?"
      confirmButtonClass="btn-danger"
      @confirm="executeLogout"
      @cancel="showLogoutConfirm = false"
    />

    <UserProfileModal
      :isOpen="showProfileModal"
      :user="authStore.user"
      @close="showProfileModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';
import ConfirmModal from '../components/ConfirmModal.vue';
import NotificationBell from '../components/NotificationBell.vue';
import UserProfileModal from '../components/UserProfileModal.vue';

import {
  Database,
  LayoutDashboard,
  Users,
  ShieldCheck,
  Key,
  User,
  LogOut,
  MapPin, // ĐÃ IMPORT THÊM ICON MAPPIN
  Menu,
  ChevronRight,
  ChevronDown,
  Settings,
  Moon,
  Sun,
} from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

// Biến điều khiển ẩn/hiện popup
const showLogoutConfirm = ref(false);

// Dropdown state
const isDropdownOpen = ref(false);
const dropdownRef = ref(null);

const showProfileModal = ref(false);
const isDarkMode = ref(false);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const openProfileModal = () => {
  isDropdownOpen.value = false;
  showProfileModal.value = true;
};

const toggleDarkMode = () => {
  isDropdownOpen.value = false;
  isDarkMode.value = !isDarkMode.value;
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-theme');
  } else {
    document.documentElement.classList.remove('dark-theme');
  }
};

// Đóng dropdown khi click ra ngoài
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);

  // Khôi phục trạng thái dark mode nếu đã được bật
  if (document.documentElement.classList.contains('dark-theme')) {
    isDarkMode.value = true;
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// 1. Khởi tạo giá trị từ localStorage (nếu chưa có thì mặc định là false)
const isSidebarCollapsed = ref(
  localStorage.getItem('sidebarCollapsed') === 'true'
);

const toggleSidebar = () => {
  // 2. Đảo ngược trạng thái
  isSidebarCollapsed.value = !isSidebarCollapsed.value;

  // 3. Lưu lại trạng thái mới vào localStorage
  localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.value.toString());
};
// Breadcrumbs logic
const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(Boolean);
  const breadcrumbsList = [];
  let currentPath = '';

  const names = {
    admin: 'Quản trị',
    customers: 'Khách Hàng',
    locations: 'Vị Trí Kho',
    users: 'Người Dùng',
    roles: 'Vai Trò',
    permissions: 'Chức Năng',
  };

  paths.forEach((path) => {
    currentPath += '/' + path;
    breadcrumbsList.push({
      path: currentPath,
      name: names[path] || path,
    });
  });

  return breadcrumbsList;
});

// Hàm thực thi đăng xuất
const executeLogout = () => {
  showLogoutConfirm.value = false;
  isDropdownOpen.value = false;
  authStore.logout();
};
</script>

<style scoped>
.app-wrapper {
  display: flex;
  height: 100vh;
  background-color: var(--bg-app);
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background-color: #0f3d26;
  color: var(--text-inverse);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}
.sidebar-collapsed .sidebar {
  width: 80px;
}
.sidebar-collapsed .sidebar-brand {
  padding: 0;
  justify-content: center;
}
.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem 0;
}

.sidebar-logo {
  max-height: 65px;
  width: auto;
  object-fit: contain;
  margin-left: 40px;
}

.sidebar-logo-collapsed {
  max-height: 30px;
  width: auto;
  object-fit: contain;
}

.sidebar-brand {
  height: 70px;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  border-bottom: 1px solid #2e5c46;
}
.sidebar-brand h2 {
  margin: 0;
  color: #fff;
  font-size: 1.25rem;
  letter-spacing: 1px;
}
.brand-icon {
  width: 24px;
  height: 24px;
  color: #4caf50;
}

.sidebar-nav {
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.nav-group {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  margin: 1rem 0 0.5rem 0.5rem;
  font-weight: bold;
  letter-spacing: 0.5px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #e0e0e0;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 500;
}
.nav-item:hover {
  background-color: #1d3b2e;
  color: #fff;
}
.nav-item.router-link-active {
  background-color: #2e7d32;
  color: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.nav-icon {
  width: 18px;
  height: 18px;
  min-width: 18px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.topbar {
  height: 70px;
  background-color: var(--bg-card);
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  z-index: 13;
}

/* Update topbar styles */
.topbar-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.btn-toggle-sidebar {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}
.btn-toggle-sidebar:hover {
  background-color: var(--border-color);
}
.toggle-icon {
  width: 24px;
  height: 24px;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}
.breadcrumb-item {
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
  text-transform: capitalize;
  transition: color 0.2s;
}
.breadcrumb-item:hover {
  color: var(--text-main);
}
.breadcrumb-item.active {
  color: var(--text-main);
  font-weight: 600;
}
.breadcrumb-separator {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-profile-container {
  position: relative;
}
.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  transition: background-color 0.2s;
}
.user-profile:hover {
  background-color: var(--border-color);
}
.dropdown-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  transition: transform 0.2s;
}
.dropdown-icon.rotate {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 220px;
  background-color: var(--bg-card);
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  z-index: 50;
  padding: 0.5rem 0;
}
.dropdown-header {
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
}
.dropdown-name {
  font-weight: 600;
  color: var(--text-main);
}
.dropdown-divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 0.5rem 0;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  color: var(--text-main);
  text-decoration: none;
  font-size: 0.95rem;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
}
.dropdown-item:hover {
  background-color: var(--border-color);
}
.dropdown-item-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
}
.text-danger {
  color: #ef4444;
}
.text-danger .dropdown-item-icon {
  color: #ef4444;
}
.text-danger:hover {
  background-color: rgba(239, 68, 68, 0.05);
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.avatar {
  width: 36px;
  height: 36px;
  background-color: #e0e0e0;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #0f3d26;
}
.avatar-icon {
  width: 20px;
  height: 20px;
}
.user-name {
  font-weight: 600;
  color: var(--text-main);
}
.page-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* Thêm class nút màu đỏ cho ConfirmModal */
:deep(.btn-danger) {
  background-color: #ef4444 !important;
  color: white !important;
  border: none !important;
}
:deep(.btn-danger:hover) {
  background-color: #dc2626 !important;
}
</style>
