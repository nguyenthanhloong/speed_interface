<template>
  <div class="notification-wrapper" ref="notifRef">
    <div class="bell-icon-container" @click="toggleNotification">
      <Bell class="icon-sm bell-icon" />
      <span v-if="unreadCount > 0" class="badge-dot">
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </div>

    <div v-if="showNotifDropdown" class="notif-dropdown shadow">
      <div class="notif-header">
        <span>Thông báo của bạn</span>
        <button
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          class="btn-read-all"
        >
          Đọc tất cả
        </button>
      </div>

      <div
        v-if="notifications.length === 0"
        class="p-4 text-center text-muted"
        style="font-size: 0.85rem"
      >
        Không có thông báo mới.
      </div>

      <ul v-else class="notif-list">
        <li
          v-for="n in notifications"
          :key="n.id"
          class="notif-item"
          @click="markAsRead(n.id)"
        >
          <div
            class="notif-icon"
            :class="n.type === 'NOI_BO' ? 'bg-success' : 'bg-primary'"
          >
            <Package class="icon-xs text-white" />
          </div>
          <div class="notif-content">
            <strong>{{ n.title }}</strong>
            <p>{{ n.message }}</p>
            <span class="notif-time">{{ n.created_at }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onBeforeUnmount } from 'vue';
import { inventoryService } from '../services/inventory';
import { Bell, Package } from 'lucide-vue-next';

const notifications = ref([]);
const unreadCount = ref(0);
const showNotifDropdown = ref(false);
const notifRef = ref(null);
let pollingInterval = null;

const toggleNotification = () => {
  showNotifDropdown.value = !showNotifDropdown.value;
};

// Đóng dropdown khi click ra ngoài
const handleClickOutside = (event) => {
  if (notifRef.value && !notifRef.value.contains(event.target)) {
    showNotifDropdown.value = false;
  }
};

const fetchNotifications = async () => {
  try {
    const res = await inventoryService.getUnreadNotifications();
    notifications.value = res.data;
    unreadCount.value = notifications.value.length;
  } catch (error) {
    console.error('Lỗi tải thông báo', error);
  }
};

const markAsRead = async (id) => {
  try {
    await inventoryService.markNotificationRead(id);
    notifications.value = notifications.value.filter((n) => n.id !== id);
    unreadCount.value = notifications.value.length;
  } catch (error) {
    console.error(error);
  }
};

const markAllAsRead = async () => {
  // Tùy chọn: Bạn có thể viết thêm API markAllRead ở backend
  for (let n of notifications.value) {
    await markAsRead(n.id);
  }
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';

  // 1. Xử lý chuỗi: Nếu Backend gửi lên thiếu 'Z' (ký hiệu giờ UTC), ta chủ động thêm vào
  let safeDateStr = dateStr;
  if (!safeDateStr.includes('Z') && !safeDateStr.includes('+')) {
    safeDateStr += 'Z';
  }

  // 2. Ép hiển thị chuẩn theo múi giờ Việt Nam
  const d = new Date(safeDateStr);
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

onMounted(() => {
  fetchNotifications();
  // Gọi lại API mỗi 30 giây
  pollingInterval = setInterval(fetchNotifications, 30000);
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  clearInterval(pollingInterval);
});
</script>

<style scoped>
.notification-wrapper {
  position: relative;
  margin-right: 15px;
}
.bell-icon-container {
  position: relative;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bell-icon-container:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
.bell-icon {
  color: #475569;
}
/* Tuỳ chỉnh cho DefaultLayout có nền xanh */
:global(.top-navbar) .bell-icon {
  color: #ffffff;
}
:global(.top-navbar) .bell-icon-container:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.badge-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #ef4444;
  color: white;
  font-size: 0.65rem;
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 10px;
  line-height: 1;
}
.notif-dropdown {
  position: absolute;
  top: 45px;
  right: -10px;
  width: 320px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  z-index: 1050;
  max-height: 400px;
  overflow-y: auto;
}
.notif-header {
  padding: 12px 15px;
  font-weight: bold;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #0f172a;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.btn-read-all {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.8rem;
  cursor: pointer;
}
.btn-read-all:hover {
  text-decoration: underline;
}
.notif-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.notif-item {
  display: flex;
  gap: 12px;
  padding: 12px 15px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: 0.2s;
  color: #333;
}
.notif-item:hover {
  background: #f8fafc;
}
.notif-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.notif-content strong {
  display: block;
  font-size: 0.9rem;
  color: #0f172a;
}
.notif-content p {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.4;
}
.notif-time {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 4px;
  display: block;
}
</style>
