<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content profile-modal">
        <button class="btn-close-floating" @click="$emit('close')">
          <X class="close-icon" />
        </button>

        <div class="modal-body" v-if="user">
          <div class="profile-header">
            <div class="avatar-large">
              <UserIcon class="avatar-icon-large" />
            </div>
            <div class="profile-name-role">
              <h4>{{ user.full_name }}</h4>
              <span class="role-badge">{{
                getRoleName(user.role) || 'Người dùng'
              }}</span>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">
                <ShieldCheck class="info-icon" /> Tài khoản
              </span>
              <span class="info-value">{{ user.username }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">
                <UserIcon class="info-icon" /> Họ và tên
              </span>
              <span class="info-value">{{ user.full_name }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">
                <Car class="info-icon" /> Biển số xe
              </span>
              <span class="info-value">{{
                user.bien_so_xe || 'Chưa cập nhật'
              }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">
                <MapPin class="info-icon" /> Mã kho
              </span>
              <span class="info-value">{{
                user.ma_kho_spl || 'Chưa cập nhật'
              }}</span>
            </div>

            <div class="info-item full-width">
              <span class="info-label">Loại tài khoản</span>
              <div class="info-value mt-1">
                <span class="status-badge" :class="{ active: isShipper }">
                  <Truck v-if="isShipper" class="badge-icon" />
                  <Briefcase v-else class="badge-icon" />
                  {{ isShipper ? 'Shipper' : 'Nhân viên' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="$emit('close')" class="btn btn-outline">Đóng</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import {
  X,
  User as UserIcon,
  Car,
  MapPin,
  ShieldCheck,
  Truck,
  Briefcase,
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean,
  user: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close']);

// Rút gọn logic kiểm tra Shipper
const isShipper = computed(() => {
  if (!props.user) return false;
  const status = props.user.is_shipper;
  return status === '1' || status === true || status === 1;
});

// Xử lý đóng modal bằng phím ESC
const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close');
  }
};

const getRoleName = (roleId) => {
  if (!roleId) return '';
  const roles = {
    ADMIN: 'Quản trị viên',
    MANAGER: 'Quản lý',
    USER: 'Nhân viên',
  };
  return roles[roleId.toUpperCase()] || roleId;
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
/* Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease, backdrop-filter 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}
.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    opacity 0.3s;
}
.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: translateY(20px) scale(0.95);
  opacity: 0;
}

/* Base Modal Layout */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(17, 24, 39, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9998;
  padding: 16px;
}

.profile-modal {
  background: var(--bg-card, #ffffff);
  width: 100%;
  max-width: 480px;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
}

/* Floating Close Button */
.btn-close-floating {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  color: var(--text-muted, #6b7280);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.btn-close-floating:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--text-main, #111827);
  transform: rotate(90deg);
}

.close-icon {
  width: 18px;
  height: 18px;
}

/* Modal Body & Profile Header */
.modal-body {
  padding: 40px 24px 24px 24px;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 32px;
}

.avatar-large {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  color: #0284c7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 14px 0 rgba(2, 132, 199, 0.2);
  border: 4px solid var(--bg-card, #ffffff);
}

.avatar-icon-large {
  width: 40px;
  height: 40px;
}

.profile-name-role h4 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main, #111827);
  letter-spacing: -0.025em;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background-color: var(--bg-app, #f3f4f6);
  color: var(--text-muted, #4b5563);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Grid Thông tin */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.full-width {
  grid-column: 1 / -1;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  transition: background-color 0.2s;
}

.info-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.info-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted, #6b7280);
  font-weight: 500;
}

.info-icon {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.info-value {
  font-size: 0.95rem;
  color: var(--text-main, #111827);
  font-weight: 600;
  word-break: break-word;
}

.mt-1 {
  margin-top: 4px;
}

/* Trạng thái */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge.active {
  background-color: #dcfce3;
  color: #166534;
}

.badge-icon {
  width: 16px;
  height: 16px;
}

/* Footer */
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color, #e5e7eb);
  background-color: rgba(0, 0, 0, 0.01);
  display: flex;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-outline {
  background: transparent;
  border-color: var(--border-color, #d1d5db);
  color: var(--text-main, #374151);
}

.btn-outline:hover {
  background: var(--bg-app, #f3f4f6);
  border-color: #9ca3af;
}

/* Responsive */
@media (max-width: 480px) {
  .info-grid {
    grid-template-columns: 1fr; /* Trở về 1 cột trên điện thoại */
  }
}
</style>
