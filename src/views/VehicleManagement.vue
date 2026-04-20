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
          <Truck class="title-icon" />
          <h2>Quản lý Xe Chở Hàng</h2>
        </div>
        <div class="header-actions">
          <div class="search-box" style="margin-right: 15px">
            <Search class="icon-sm search-icon" />
            <input
              type="text"
              v-model="searchQuery"
              @input="handleSearch"
              placeholder="Tìm biển số xe..."
              class="search-input"
            />
          </div>
          <button @click="openModal()" class="btn btn-primary">
            <Plus class="icon-sm" /> Thêm Xe Mới
          </button>
        </div>
      </div>

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Biển Số Xe</th>
              <th>Trạng Thái</th>
              <th>Trọng Lượng (Kg)</th>
              <th>Mô Tả / Dòng Xe</th>
              <th class="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="xe in paginatedData" :key="xe.bien_so_xe">
              <td>
                <span
                  class="badge"
                  style="
                    font-size: 1.05rem;
                    letter-spacing: 1px;
                    background-color: #f1f5f9;
                    color: #0f172a;
                    border: 1px solid #cbd5e1;
                  "
                >
                  {{ xe.bien_so_xe }}
                </span>
              </td>
              <td>
                <span
                  v-if="xe.trang_thai === 'AVAILABLE'"
                  class="badge"
                  style="
                    background-color: #dcfce7;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                  "
                >
                  <CheckCircle
                    class="icon-xs"
                    style="margin-right: 4px; vertical-align: middle"
                  />
                  Sẵn Sàng
                </span>
                <span
                  v-else
                  class="badge"
                  style="
                    background-color: #fef3c7;
                    color: #b45309;
                    border: 1px solid #fde68a;
                  "
                >
                  <Clock
                    class="icon-xs"
                    style="margin-right: 4px; vertical-align: middle"
                  />
                  Đang Giao Hàng
                </span>
              </td>
              <td>
                <strong>{{ xe.trong_luong || '---' }}</strong>
              </td>
              <td>{{ xe.mo_ta || '---' }}</td>
              <td class="text-center">
                <button
                  @click="openModal(xe)"
                  class="btn btn-sm btn-secondary"
                  title="Sửa thông tin"
                >
                  <Edit class="icon-sm" /> Sửa
                </button>
              </td>
            </tr>
            <tr v-if="paginatedData.length === 0">
              <td
                colspan="5"
                class="text-center text-muted"
                style="padding: 2rem"
              >
                Chưa có dữ liệu xe vận chuyển.
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination-container" v-if="totalItems > 0">
          <div class="pagination-info">
            Hiển thị {{ (currentPage - 1) * limit + 1 }} đến
            {{ Math.min(currentPage * limit, totalItems) }} trong tổng số
            <strong>{{ totalItems }}</strong> xe
          </div>
          <div class="pagination-actions">
            <button
              class="btn-page"
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            >
              <ChevronLeft class="icon-sm" />
            </button>
            <button
              v-for="page in totalPages"
              :key="page"
              class="btn-page"
              :class="{ active: page === currentPage }"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
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
              {{ isEdit ? 'Sửa thông tin Xe' : 'Thêm Xe Mới' }}
            </h3>
            <button @click="closeModal" class="btn-close">
              <X class="icon-sm" />
            </button>
          </div>

          <form @submit.prevent="confirmSave">
            <div class="form-group">
              <label>
                Biển Số Xe (Khóa Chính)
                <span class="text-danger" v-if="!isEdit">*</span>
              </label>
              <input
                type="text"
                v-model="form.bien_so_xe"
                :disabled="isEdit"
                required
                placeholder="VD: 51H-12345"
                style="text-transform: uppercase"
              />
              <small v-if="isEdit" class="text-muted">
                Biển số xe là khóa chính, không thể thay đổi.
              </small>
            </div>

            <div class="form-group" v-if="isEdit">
              <label>Trạng Thái Hiện Tại</label>
              <select
                v-model="form.trang_thai"
                class="form-control"
                style="
                  width: 100%;
                  padding: 8px;
                  border-radius: 4px;
                  border: 1px solid #ccc;
                "
              >
                <option value="AVAILABLE">Sẵn Sàng (Ở tại kho)</option>
                <option value="IN_USE">Đang Giao Hàng</option>
              </select>
              <small
                class="text-warning"
                v-if="
                  form.trang_thai === 'AVAILABLE' && originalStatus === 'IN_USE'
                "
              >
                Cảnh báo: Bạn đang cưỡng chế thu hồi xe về trạng thái "Sẵn
                Sàng".
              </small>
            </div>

            <div class="form-group">
              <label>Trọng Lượng / Tải Trọng (Kg)</label>
              <input
                type="number"
                v-model="form.trong_luong"
                placeholder="VD: 1500"
                min="0"
                step="0.1"
              />
            </div>

            <div class="form-group">
              <label>Mô Tả / Dòng Xe</label>
              <textarea
                v-model="form.mo_ta"
                rows="2"
                placeholder="VD: Xe tải ISUZU 1.5 Tấn - Đời 2022"
              ></textarea>
            </div>

            <div class="modal-actions mt-4">
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
            ? 'Bạn có chắc chắn muốn cập nhật thông tin xe vận chuyển này?'
            : 'Thêm xe chở hàng mới vào hệ thống?'
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
import { vehicleService } from '../services/vehicle'; // Nhớ tạo file này như hướng dẫn trước
import AdminLayout from '../layouts/AdminLayout.vue';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import {
  Truck,
  Plus,
  Edit,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Search,
  CheckCircle,
  Clock,
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
const currentId = ref(null); // Sẽ lưu biển số xe lúc edit
const originalStatus = ref('');

const form = ref({
  bien_so_xe: '',
  trang_thai: 'AVAILABLE',
  trong_luong: null,
  mo_ta: '',
});

// PAGINATION
const currentPage = ref(1);
const limit = ref(8);
const totalItems = computed(() => dataList.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / limit.value));
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * limit.value;
  return dataList.value.slice(start, start + limit.value);
});

const changePage = (pageNumber) => {
  if (pageNumber >= 1 && pageNumber <= totalPages.value)
    currentPage.value = pageNumber;
};

const loadData = async () => {
  try {
    const res = await vehicleService.getVehicles(searchQuery.value);
    dataList.value = res.data;

    if (paginatedData.value.length === 0 && currentPage.value > 1) {
      currentPage.value = 1;
    }
  } catch (error) {
    toast.error('Lỗi khi tải dữ liệu xe vận chuyển!');
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
    currentId.value = item.bien_so_xe;
    originalStatus.value = item.trang_thai;
    form.value = {
      bien_so_xe: item.bien_so_xe,
      trang_thai: item.trang_thai,
      trong_luong: item.trong_luong || null,
      mo_ta: item.mo_ta || '',
    };
  } else {
    isEdit.value = false;
    currentId.value = null;
    originalStatus.value = '';
    form.value = {
      bien_so_xe: '',
      trang_thai: 'AVAILABLE',
      trong_luong: null,
      mo_ta: '',
    };
  }
  showModal.value = true;
};

const closeModal = () => (showModal.value = false);

const confirmSave = () => {
  if (!form.value.bien_so_xe || form.value.bien_so_xe.trim() === '') {
    toast.error('Vui lòng nhập biển số xe!');
    return;
  }
  showConfirm.value = true;
};

const executeSave = async () => {
  showConfirm.value = false;
  isSaving.value = true;
  try {
    const payload = {
      bien_so_xe: form.value.bien_so_xe.trim().toUpperCase(),
      trang_thai: form.value.trang_thai,
      trong_luong: form.value.trong_luong
        ? parseFloat(form.value.trong_luong)
        : null,
      mo_ta: form.value.mo_ta,
    };

    if (isEdit.value) {
      await vehicleService.updateVehicle(currentId.value, payload);
      toast.success('Cập nhật thông tin xe thành công!');
    } else {
      await vehicleService.createVehicle(payload);
      toast.success('Thêm xe chở hàng mới thành công!');
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
