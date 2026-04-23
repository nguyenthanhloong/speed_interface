<template>
  <div class="default-wrapper">
    <header class="top-navbar">
      <div class="nav-brand">
        <router-link to="/">
          <img
            src="../assets/CompanyLogo4.png"
            alt="SpeedUp Logo"
            class="topbar-logo"
          />
        </router-link>
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
              <!-- <a href="#" class="dropdown-item" @click.prevent="toggleDarkMode">
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

    <main class="main-container">
      <slot></slot>
    </main>

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
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import {
  Package,
  User,
  LogOut,
  ChevronDown,
  Settings,
  Moon,
  Sun,
} from 'lucide-vue-next';
import ConfirmModal from '../components/ConfirmModal.vue'; // Đảm bảo đường dẫn này đúng
import NotificationBell from '../components/NotificationBell.vue';
import UserProfileModal from '../components/UserProfileModal.vue';

const authStore = useAuthStore();
const router = useRouter();

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

// Hàm thực thi đăng xuất khi người dùng bấm "Đồng ý"
const executeLogout = () => {
  showLogoutConfirm.value = false; // Đóng popup
  isDropdownOpen.value = false;
  authStore.logout(); // Gọi store để xóa token
  // router.push('/login');        // Nếu trong file authStore.js đã có lệnh push rồi thì có thể bỏ dòng này
};
</script>

<style scoped>
.default-wrapper {
  min-height: 100vh;
  background-color: var(--bg-app);
  display: flex;
  flex-direction: column;
}

.topbar-logo {
  max-height: 65px;
  width: auto;
  object-fit: contain;
}

.nav-brand {
  display: flex;
  align-items: center;
}

.top-navbar {
  height: 70px;
  background-color: #0f3d26;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.nav-brand h2 {
  margin: 0;
  font-size: 1.3rem;
  letter-spacing: 1px;
  color: white;
}
.brand-icon {
  width: 26px;
  height: 26px;
  color: #4caf50;
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
  background-color: rgba(255, 255, 255, 0.1);
}
.dropdown-icon {
  width: 18px;
  height: 18px;
  color: white;
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
  color: var(--text-main); /* Text color for dropdown items */
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
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.avatar-icon {
  width: 20px;
  height: 20px;
  color: white;
}
.user-name {
  font-weight: 600;
  color: white;
}

.main-container {
  flex: 1;
  padding: 2rem;
  max-width: 1300px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
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
