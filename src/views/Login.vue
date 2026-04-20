<template>
  <div class="login-screen">
    <div class="login-container">
      <div class="logo-container">
        <img
          src="../assets/CompanyLogo4.png"
          alt="SpeedUp Logo"
          class="logo-image"
        />
      </div>

      <div class="form-section">
        <h2 class="login-title">Đăng nhập</h2>

        <form @submit.prevent="handleLogin">
          <div class="input-wrapper">
            <User class="input-icon" />
            <input
              type="text"
              class="input-field"
              v-model="username"
              required
              placeholder="Tài khoản"
              autocomplete="username"
            />
          </div>

          <div class="input-wrapper">
            <Lock class="input-icon" />
            <input
              :type="showPassword ? 'text' : 'password'"
              class="input-field"
              v-model="password"
              required
              placeholder="Mật khẩu"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="eye-btn"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <Eye v-if="showPassword" class="eye-icon" />
              <EyeOff v-else class="eye-icon" />
            </button>
          </div>

          <button
            type="submit"
            class="login-btn gradient-bg"
            :disabled="isLoading"
          >
            <Loader2 v-if="isLoading" class="spinner" />
            <span v-else>ĐĂNG NHẬP</span>
          </button>
        </form>
      </div>

      <div class="footer-logos-container">
        <img
          src="../assets/CompanyLogo2.png"
          alt="Partner 1"
          class="footer-image"
        />

        <div class="footer-divider"></div>

        <img
          src="../assets/CompanyLogo3.png"
          alt="Partner 2"
          class="footer-image"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-vue-next';
import { useToast } from '../composables/useToast';

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const username = ref('');
const password = ref('');
const isLoading = ref(false);
const showPassword = ref(false);

const handleLogin = async () => {
  if (!username.value || !password.value) {
    toast.error('Vui lòng nhập đủ tài khoản/mật khẩu!');
    return;
  }

  isLoading.value = true;
  try {
    await authStore.login(username.value, password.value);
    toast.success('Đăng nhập thành công!');
    router.push('/');
  } catch (error) {
    toast.error(error.response?.data?.detail || 'Sai tài khoản hoặc mật khẩu!');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style src="../styles/LoginStyle.css" scoped></style>
