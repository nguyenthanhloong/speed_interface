<template>
  <div class="forbidden-container">
    <div class="forbidden-box">
      <div class="icon-wrapper bg-rose-light">
        <ShieldAlert class="forbidden-icon text-rose" />
      </div>

      <h1 class="error-code">403</h1>
      <h2 class="error-title">Truy Cập Bị Từ Chối</h2>
      <p class="error-message">
        Rất tiếc, tài khoản của bạn không có đủ quyền hạn để xem trang này.
        <br />
        Nếu bạn cho rằng đây là sự nhầm lẫn, vui lòng liên hệ quản trị viên.
      </p>

      <div class="action-buttons">
        <button @click="$router.back()" class="btn btn-outline">
          <ArrowLeft class="icon-sm" /> Quay Lại
        </button>
        <button @click="$router.push('/')" class="btn btn-primary">
          <Home class="icon-sm" /> Về Trang Chủ
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ShieldAlert, Home, ArrowLeft } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style src="../styles/ForbiddenStyle.css" scoped></style>
