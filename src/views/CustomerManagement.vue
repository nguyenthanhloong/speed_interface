<template>
  <component :is="currentLayout">
    <div class="dashboard-wrapper">
      <div class="mb-4">
        <button class="btn-back" @click="$router.push('/')">
          <ArrowLeft class="icon-sm" /> Về Bảng Điều Khiển
        </button>
      </div>

      <div class="page-header">
        <div class="title-group">
          <Users class="title-icon" />
          <h2>Quản lý Danh mục Khách Hàng</h2>
        </div>
        <div class="header-actions">
          <div class="search-box" style="margin-right: 15px">
            <Search class="icon-sm search-icon" />
            <input
              type="text"
              v-model="searchQuery"
              @input="handleSearch"
              placeholder="Tìm mã, tên khách hàng..."
              class="search-input"
            />
          </div>
          <button @click="openModal()" class="btn btn-primary">
            <Plus class="icon-sm" /> Thêm Khách Hàng
          </button>
        </div>
      </div>

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã KH</th>
              <th>Tên Khách Hàng</th>
              <th>Số Điện Thoại</th>
              <th>Địa Chỉ</th>
              <th class="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cus in dataList" :key="cus.id">
              <td>
                <span class="badge">{{ cus.ma_khach_hang }}</span>
              </td>
              <td>
                <strong>{{ cus.ten_khach_hang }}</strong>
              </td>
              <td>{{ cus.sdt || '---' }}</td>
              <td>{{ cus.dia_chi || '---' }}</td>
              <td class="text-center">
                <button
                  @click="openModal(cus)"
                  class="btn btn-sm btn-secondary"
                  title="Sửa thông tin"
                >
                  <Edit class="icon-sm" /> Sửa
                </button>
              </td>
            </tr>
            <tr v-if="dataList.length === 0">
              <td
                colspan="5"
                class="text-center text-muted"
                style="padding: 2rem"
              >
                Chưa có dữ liệu khách hàng.
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination-container" v-if="totalItems > 0">
          <div class="pagination-info">
            Hiển thị {{ (currentPage - 1) * limit + 1 }} đến
            {{ Math.min(currentPage * limit, totalItems) }} trong tổng số
            <strong>{{ totalItems }}</strong> khách hàng
          </div>
          <div class="pagination-actions">
            <button
              class="btn-page"
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            >
              <ChevronLeft class="icon-sm" />
            </button>

            <template v-for="(page, index) in displayedPages" :key="index">
              <span
                v-if="page === '...'"
                style="padding: 5px 10px; color: #64748b"
                >...</span
              >
              <button
                v-else
                class="btn-page"
                :class="{ active: page === currentPage }"
                @click="changePage(page)"
              >
                {{ page }}
              </button>
            </template>

            <button
              class="btn-page"
              :disabled="currentPage === totalPages"
              @click="changePage(currentPage + 1)"
            >
              <ChevronRight class="icon-sm" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>
              {{ isEdit ? 'Sửa thông tin Khách Hàng' : 'Thêm Khách Hàng mới' }}
            </h3>
            <button @click="closeModal" class="btn-close">
              <X class="icon-sm" />
            </button>
          </div>

          <form @submit.prevent="confirmSave">
            <div class="form-group">
              <label
                >Mã Khách Hàng
                <span class="text-danger" v-if="!isEdit">*</span></label
              >
              <input
                type="text"
                v-model="form.ma_khach_hang"
                :disabled="isEdit"
                required
                placeholder="VD: KH001, VIP_01"
              />
              <small v-if="isEdit" class="text-muted"
                >Mã khách hàng là cố định không thể thay đổi.</small
              >
            </div>
            <div class="form-group">
              <label
                >Tên Khách Hàng/Công Ty
                <span class="text-danger">*</span></label
              >
              <input
                type="text"
                v-model="form.ten_khach_hang"
                required
                placeholder="Nhập tên khách hàng"
              />
            </div>
            <div class="form-group">
              <label>Số Điện Thoại <span class="text-danger">*</span></label>
              <input
                type="text"
                v-model="form.sdt"
                placeholder="Nhập số điện thoại"
                required
                :class="{
                  'input-error': form.sdt && !phoneRegex.test(form.sdt),
                }"
              />
              <small
                v-if="form.sdt && !phoneRegex.test(form.sdt)"
                class="text-danger"
              >
                Số điện thoại không đúng định dạng Việt Nam (VD: 0912345678).
              </small>
            </div>
            <div class="form-group">
              <label>Địa Chỉ <span class="text-danger">*</span></label>
              <textarea
                v-model="form.dia_chi"
                rows="2"
                placeholder="Nhập địa chỉ nhận hàng/công ty"
                required
              ></textarea>
            </div>

            <div class="modal-actions">
              <button
                type="button"
                @click="closeModal"
                class="btn btn-secondary"
              >
                Hủy
              </button>
              <button type="submit" class="btn btn-save" :disabled="isSaving">
                <Save class="icon-sm" v-if="!isSaving" />
                {{ isSaving ? 'Đang lưu...' : 'Lưu lại' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        :isOpen="showConfirm"
        :title="isEdit ? 'Xác nhận Cập nhật' : 'Xác nhận Thêm mới'"
        :message="
          isEdit
            ? 'Bạn có chắc chắn muốn cập nhật thông tin khách hàng này?'
            : 'Thêm khách hàng mới vào hệ thống?'
        "
        @confirm="executeSave"
        @cancel="showConfirm = false"
      />
    </div>
  </component>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { customerService } from '../services/customer';
import AdminLayout from '../layouts/AdminLayout.vue';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import {
  Users,
  Plus,
  Edit,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Search,
} from 'lucide-vue-next';
import { useToast } from '../composables/useToast';

const authStore = useAuthStore();
const toast = useToast();

const currentLayout = computed(() =>
  authStore.hasPermission('FUNC_ADMIN_ALL') ? AdminLayout : DefaultLayout
);

const dataList = ref([]);
const searchQuery = ref('');
let searchTimeout = null;
const showModal = ref(false);
const showConfirm = ref(false);
const isEdit = ref(false);
const isSaving = ref(false);
const currentId = ref(null);

const phoneRegex = /^(03|05|07|08|09)\d{8}$/;

const isPhoneValid = computed(() => {
  if (!form.value.sdt) return false;
  return phoneRegex.test(form.value.sdt);
});

const form = ref({
  ma_khach_hang: '',
  ten_khach_hang: '',
  sdt: '',
  dia_chi: '',
});

// PAGINATION
const currentPage = ref(1);
const limit = ref(8);
const totalItems = ref(0);
const totalPages = computed(() => Math.ceil(totalItems.value / limit.value));

const changePage = (pageNumber) => {
  if (pageNumber >= 1 && pageNumber <= totalPages.value) {
    currentPage.value = pageNumber;
    loadData();
  }
};

const displayedPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  let pages = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(current - 1);
      pages.push(current);
      pages.push(current + 1);
      pages.push('...');
      pages.push(total);
    }
  }
  return pages;
});

const loadData = async () => {
  try {
    const skip = (currentPage.value - 1) * limit.value;

    const res = await customerService.getCustomers(
      skip,
      limit.value,
      searchQuery.value
    );

    dataList.value = res.data.data;
    totalItems.value = res.data.total;
  } catch (error) {
    toast.error('Lỗi khi tải dữ liệu khách hàng!');
  }
};

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadData();
  }, 500);
};

onMounted(loadData);

const openModal = (item = null) => {
  if (item) {
    isEdit.value = true;
    currentId.value = item.id;
    form.value = {
      ma_khach_hang: item.ma_khach_hang,
      ten_khach_hang: item.ten_khach_hang,
      sdt: item.sdt || '',
      dia_chi: item.dia_chi || '',
    };
  } else {
    isEdit.value = false;
    currentId.value = null;
    form.value = {
      ma_khach_hang: '',
      ten_khach_hang: '',
      sdt: '',
      dia_chi: '',
    };
  }
  showModal.value = true;
};

const closeModal = () => (showModal.value = false);
const confirmSave = () => {
  if (form.value.sdt && !phoneRegex.test(form.value.sdt)) {
    toast.error('Vui lòng nhập đúng định dạng số điện thoại!');
    return;
  }
  showConfirm.value = true;
};

const executeSave = async () => {
  showConfirm.value = false;
  isSaving.value = true;
  try {
    if (isEdit.value) {
      await customerService.updateCustomer(currentId.value, {
        ten_khach_hang: form.value.ten_khach_hang,
        sdt: form.value.sdt,
        dia_chi: form.value.dia_chi,
      });
      toast.success('Cập nhật khách hàng thành công!');
    } else {
      await customerService.createCustomer(form.value);
      toast.success('Thêm khách hàng mới thành công!');
      currentPage.value = 1;
    }
    await loadData();
    closeModal();
  } catch (error) {
    toast.error(error.response?.data?.detail || 'Lỗi khi lưu dữ liệu!');
  } finally {
    isSaving.value = false;
  }
};
</script>

<style src="../styles/CustomerManagementStyle.css" scoped></style>
