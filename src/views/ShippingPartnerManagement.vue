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
          <h2>Quản lý Đối Tác Vận Chuyển</h2>
        </div>
        <p class="text-muted" style="margin-top: 5px">
          Danh sách các đơn vị vận chuyển và biểu giá.
        </p>
      </div>

      <div
        class="toolbar-actions"
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        "
      >
        <div class="search-box">
          <Search
            class="icon-sm search-icon"
            style="position: absolute; left: 10px; color: #94a3b8"
          />
          <input
            type="text"
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="Tìm mã, tên đối tác..."
            class="search-input form-control"
            style="padding-left: 35px; width: 300px"
          />
        </div>

        <div class="action-buttons" style="display: flex; gap: 10px">
          <button
            @click="downloadTemplate"
            class="btn btn-outline-primary"
            style="display: flex; gap: 5px; align-items: center"
          >
            <Download class="icon-sm" /> Tải Biểu Mẫu
          </button>

          <button
            @click="triggerFileUpload"
            class="btn btn-outline-success"
            style="display: flex; gap: 5px; align-items: center"
            :disabled="isUploadingExcel"
          >
            <Archive class="icon-sm" />
            {{ isUploadingExcel ? 'Đang Xử Lý...' : 'Nhập Excel' }}
          </button>
          <input
            type="file"
            ref="fileInputRef"
            @change="handleExcelUpload"
            accept=".xlsx, .xls"
            style="display: none"
          />

          <button
            @click="openModal()"
            class="btn btn-primary"
            style="display: flex; gap: 5px; align-items: center"
          >
            <Plus class="icon-sm" /> Thêm Đối Tác
          </button>
        </div>
      </div>

      <div class="card p-0">
        <table class="data-table">
          <thead>
            <tr>
              <th width="80" class="text-center">ID</th>
              <th width="150">Mã Đối Tác</th>
              <th>Tên Đơn Vị Vận Chuyển</th>
              <th width="180" class="text-right">Giá cước (VNĐ)</th>
              <th width="200">Ghi chú</th>
              <th width="120" class="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedData" :key="item.id">
              <td class="text-center text-muted">#{{ item.id }}</td>
              <td>
                <span
                  class="badge"
                  style="
                    background-color: #f1f5f9;
                    color: #334155;
                    font-family: monospace;
                    font-size: 14px;
                  "
                >
                  {{ item.ma_doi_tac }}
                </span>
              </td>
              <td>
                <strong style="color: #0f3d26">{{ item.ten_doi_tac }}</strong>
              </td>
              <td class="text-right" style="color: #ef4444; font-weight: 600">
                {{ item.gia.toLocaleString() }} ₫
              </td>
              <td>{{ item.ghi_chu || '---' }}</td>
              <td class="text-center">
                <div style="display: flex; gap: 5px; justify-content: center">
                  <button
                    @click="openModal(item)"
                    class="btn btn-sm btn-secondary"
                    title="Sửa"
                  >
                    <Edit class="icon-sm" />
                  </button>
                  <button
                    @click="promptDelete(item)"
                    class="btn btn-sm btn-danger"
                    style="
                      background-color: #fef2f2;
                      color: #ef4444;
                      border: 1px solid #fecaca;
                    "
                    title="Xóa"
                  >
                    <Trash2 class="icon-sm" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedData.length === 0 && !isLoading">
              <td
                colspan="6"
                class="text-center text-muted"
                style="padding: 3rem"
              >
                Không tìm thấy đơn vị vận chuyển nào.
              </td>
            </tr>
          </tbody>
        </table>
        <div class="pagination-container" v-if="totalItems > 0">
          <div class="pagination-info">
            Hiển thị {{ (currentPage - 1) * limit + 1 }} đến
            {{ Math.min(currentPage * limit, totalItems) }} trong tổng số
            <strong>{{ totalItems }}</strong> đối tác
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
        <div class="modal-content" style="max-width: 500px">
          <div class="modal-header">
            <h3 style="margin: 0; color: #0f3d26">
              {{ isEdit ? 'Sửa Đối Tác' : 'Thêm Đơn Vị Vận Chuyển' }}
            </h3>
            <button
              @click="closeModal"
              class="btn-close"
              style="
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
              "
            >
              &times;
            </button>
          </div>

          <form @submit.prevent="confirmSave" style="padding: 20px">
            <div class="form-group mb-3">
              <label
                style="font-weight: 600; display: block; margin-bottom: 5px"
              >
                Mã Đối Tác <span class="text-danger">*</span>
              </label>
              <input
                type="text"
                v-model="form.ma_doi_tac"
                required
                class="form-control"
                placeholder="VD: GHTK, VTP..."
              />
            </div>

            <div class="form-group mb-3">
              <label
                style="font-weight: 600; display: block; margin-bottom: 5px"
              >
                Tên Đơn Vị Vận Chuyển <span class="text-danger">*</span>
              </label>
              <input
                type="text"
                v-model="form.ten_doi_tac"
                required
                class="form-control"
                placeholder="VD: Giao Hàng Tiết Kiệm..."
              />
            </div>

            <div class="form-group mb-3">
              <label
                style="font-weight: 600; display: block; margin-bottom: 5px"
                >Giá cước cơ bản (VNĐ)</label
              >
              <input
                type="number"
                v-model="form.gia"
                min="0"
                step="any"
                class="form-control"
                placeholder="0.0"
              />
            </div>

            <div class="form-group mb-3">
              <label
                style="font-weight: 600; display: block; margin-bottom: 5px"
                >Ghi chú</label
              >
              <textarea
                v-model="form.ghi_chu"
                class="form-control"
                rows="2"
              ></textarea>
            </div>

            <div
              class="modal-actions mt-4"
              style="display: flex; justify-content: flex-end; gap: 10px"
            >
              <button
                type="button"
                @click="closeModal"
                class="btn btn-secondary"
              >
                Hủy
              </button>
              <button
                type="submit"
                class="btn btn-save"
                style="background-color: #0f3d26; color: white"
                :disabled="isSaving"
              >
                <Save class="icon-sm" v-if="!isSaving" />
                {{ isSaving ? 'Đang lưu...' : 'Lưu Dữ Liệu' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        :isOpen="showConfirm"
        :title="confirmTitle"
        :message="confirmMessage"
        @confirm="executeConfirmAction"
        @cancel="showConfirm = false"
      />
    </div>
  </component>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../stores/auth';
import { shippingPartnerService } from '../services/shippingPartner';
import AdminLayout from '../layouts/AdminLayout.vue';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import { useToast } from '../composables/useToast';
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Save,
  ArrowLeft,
  Search,
  Download,
  Archive,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next';

const authStore = useAuthStore();
const toast = useToast();

const currentLayout = computed(() =>
  authStore.hasPermission('FUNC_ADMIN_ALL') ? AdminLayout : DefaultLayout
);

const dataList = ref([]);
const isLoading = ref(false);
const searchQuery = ref('');
let searchTimeout = null;

const showModal = ref(false);
const isEdit = ref(false);
const isSaving = ref(false);
const currentId = ref(null);
const form = ref({ ma_doi_tac: '', ten_doi_tac: '', gia: 0, ghi_chu: '' });

const showConfirm = ref(false);
const confirmActionType = ref('');
const itemToDelete = ref(null);

const fileInputRef = ref(null);
const isUploadingExcel = ref(false);

const confirmTitle = computed(() =>
  confirmActionType.value === 'DELETE'
    ? 'Xác nhận Xóa'
    : isEdit.value
    ? 'Xác nhận Cập nhật'
    : 'Xác nhận Thêm mới'
);
const confirmMessage = computed(() => {
  if (confirmActionType.value === 'DELETE')
    return `Bạn có chắc chắn muốn xóa đối tác [${itemToDelete.value?.ma_doi_tac}] không?`;
  return isEdit.value
    ? 'Cập nhật thông tin đối tác này?'
    : 'Thêm đối tác mới vào hệ thống?';
});

const currentPage = ref(1);
const limit = ref(8);

const totalItems = computed(() => dataList.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / limit.value));

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * limit.value;
  return dataList.value.slice(start, start + limit.value);
});

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

const changePage = (pageNumber) => {
  if (pageNumber >= 1 && pageNumber <= totalPages.value) {
    currentPage.value = pageNumber;
  }
};

const loadData = async () => {
  isLoading.value = true;
  try {
    const res = await shippingPartnerService.getPartners(
      0,
      1000,
      searchQuery.value
    );
    dataList.value = res.data.data;
  } catch (error) {
    toast.error('Lỗi khi tải danh sách đối tác!');
  } finally {
    isLoading.value = false;
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
    form.value = { ...item };
  } else {
    isEdit.value = false;
    currentId.value = null;
    form.value = { ma_doi_tac: '', ten_doi_tac: '', gia: 0, ghi_chu: '' };
  }
  showModal.value = true;
};

const closeModal = () => (showModal.value = false);

const confirmSave = () => {
  confirmActionType.value = 'SAVE';
  showConfirm.value = true;
};
const promptDelete = (item) => {
  itemToDelete.value = item;
  confirmActionType.value = 'DELETE';
  showConfirm.value = true;
};

const executeConfirmAction = async () => {
  showConfirm.value = false;
  if (confirmActionType.value === 'SAVE') await executeSave();
  else if (confirmActionType.value === 'DELETE') await executeDelete();
};

const executeSave = async () => {
  isSaving.value = true;
  try {
    if (isEdit.value) {
      await shippingPartnerService.updatePartner(currentId.value, form.value);
      toast.success('Cập nhật thành công!');
    } else {
      await shippingPartnerService.createPartner(form.value);
      toast.success('Thêm đối tác thành công!');
    }
    await loadData();
    closeModal();
  } catch (error) {
    toast.error(error.response?.data?.detail || 'Lỗi khi lưu dữ liệu!');
  } finally {
    isSaving.value = false;
  }
};

const executeDelete = async () => {
  if (!itemToDelete.value) return;
  try {
    await shippingPartnerService.deletePartner(itemToDelete.value.id);
    toast.success('Đã xóa đối tác thành công!');
    await loadData();
  } catch (error) {
    toast.error('Lỗi khi xóa đối tác!');
  } finally {
    itemToDelete.value = null;
  }
};

// ==========================================
// HÀM XỬ LÝ EXCEL (TẢI BIỂU MẪU & IMPORT)
// ==========================================
const downloadTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['MÃ ĐỐI TÁC', 'TÊN ĐỐI TÁC', 'GIÁ CƯỚC', 'GHI CHÚ'],
  ]);

  ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 25 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DoiTacVanChuyen');
  XLSX.writeFile(wb, 'Bieu_Mau_Doi_Tac_Van_Chuyen.xlsx');
  toast.success('Đã tải biểu mẫu Excel thành công!');
};

const triggerFileUpload = () => {
  fileInputRef.value.click();
};

const handleExcelUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  isUploadingExcel.value = true;
  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (json.length === 0) {
        toast.error('File Excel trống hoặc không đúng định dạng!');
        return;
      }

      const getVal = (row, keys) => {
        for (let key of keys) {
          if (row[key] !== undefined && row[key] !== '') return row[key];
        }
        return '';
      };

      const payload = json
        .map((row) => {
          const ma = String(
            getVal(row, ['MÃ ĐỐI TÁC', 'Mã Đối Tác', 'ma_doi_tac'])
          );
          const ten = String(
            getVal(row, ['TÊN ĐỐI TÁC', 'Tên Đối Tác', 'Tên', 'ten_doi_tac'])
          );
          const gia =
            parseFloat(getVal(row, ['GIÁ CƯỚC', 'Giá Cước', 'Giá', 'gia'])) ||
            0;
          const ghiChu = String(getVal(row, ['GHI CHÚ', 'Ghi Chú', 'ghi_chu']));

          if (ma || ten) {
            return {
              ma_doi_tac: ma,
              ten_doi_tac: ten,
              gia: gia,
              ghi_chu: ghiChu,
            };
          }
          return null;
        })
        .filter((item) => item !== null);

      if (payload.length === 0) {
        toast.error(
          'Không tìm thấy cột MÃ ĐỐI TÁC hoặc TÊN ĐỐI TÁC trong file!'
        );
        return;
      }

      const res = await shippingPartnerService.bulkCreatePartners(payload);
      toast.success(res.data.message || `Đã Import hàng loạt thành công!`);

      loadData();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.detail || 'Lỗi hệ thống khi đọc/gửi file Excel!'
      );
    } finally {
      isUploadingExcel.value = false;
      event.target.value = '';
    }
  };
  reader.readAsArrayBuffer(file);
};
</script>

<style src="../styles/ShippingPartnerManagementStyle.css" scoped></style>
