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
          <Box class="title-icon" />
          <h2>Quản lý Danh mục Sản Phẩm</h2>
        </div>
        <p class="text-muted" style="margin-top: 5px">
          Quản lý danh sách các mã sản phẩm và mã máy trong hệ thống.
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
            placeholder="Tìm mã SP, mã máy hoặc tên..."
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
            multiple
            style="display: none"
          />

          <button
            @click="openModal()"
            class="btn btn-primary"
            style="display: flex; gap: 5px; align-items: center"
          >
            <Plus class="icon-sm" /> Thêm Sản Phẩm
          </button>
        </div>
      </div>

      <div class="card p-0">
        <table class="data-table">
          <thead>
            <tr>
              <th width="80" class="text-center">ID</th>
              <th width="180">Mã Sản Phẩm</th>
              <th width="180">Mã Máy (Model)</th>
              <th>Tên Sản Phẩm</th>
              <th width="150">Trọng lượng (kg)</th>
              <th width="120" class="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in dataList" :key="item.id">
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
                  {{ item.ma_san_pham }}
                </span>
              </td>
              <td>
                <strong>{{ item.ma_may || '---' }}</strong>
              </td>
              <td>
                <strong style="color: #0f3d26">{{ item.ten_san_pham }}</strong>
              </td>
              <td>{{ item.trong_luong ? item.trong_luong + ' kg' : '---' }}</td>
              <td class="text-center">
                <div style="display: flex; gap: 5px; justify-content: center">
                  <button
                    @click="openModal(item)"
                    class="btn btn-sm btn-secondary"
                    title="Sửa thông tin"
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
            <tr v-if="dataList.length === 0 && !isLoading">
              <td
                colspan="6"
                class="text-center text-muted"
                style="padding: 3rem"
              >
                <Box
                  class="mb-2"
                  style="width: 40px; height: 40px; opacity: 0.3"
                />
                <p>Không tìm thấy sản phẩm nào trong danh mục.</p>
              </td>
            </tr>
            <tr v-if="isLoading">
              <td
                colspan="6"
                class="text-center text-muted"
                style="padding: 2rem"
              >
                Đang tải dữ liệu...
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination-container" v-if="totalItems > 0">
          <div class="pagination-info">
            Hiển thị {{ (currentPage - 1) * limit + 1 }} đến
            {{ Math.min(currentPage * limit, totalItems) }} trong tổng số
            <strong>{{ totalItems }}</strong> sản phẩm
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
              {{ isEdit ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới' }}
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
                Mã Sản Phẩm <span class="text-danger">*</span>
              </label>
              <input
                type="text"
                v-model="form.ma_san_pham"
                required
                class="form-control"
                placeholder="VD: SP-001"
              />
            </div>

            <div class="form-group mb-3">
              <label
                style="font-weight: 600; display: block; margin-bottom: 5px"
              >
                Mã Máy (Model)
              </label>
              <input
                type="text"
                v-model="form.ma_may"
                class="form-control"
                placeholder="VD: LAPTOP-DELL-01"
              />
            </div>

            <div class="form-group mb-3">
              <label
                style="font-weight: 600; display: block; margin-bottom: 5px"
              >
                Tên Sản Phẩm <span class="text-danger">*</span>
              </label>
              <input
                type="text"
                v-model="form.ten_san_pham"
                required
                class="form-control"
                placeholder="Nhập tên sản phẩm..."
              />
            </div>

            <div class="form-group mb-3">
              <label
                style="font-weight: 600; display: block; margin-bottom: 5px"
                >Trọng lượng (kg)</label
              >
              <input
                type="number"
                step="0.01"
                min="0"
                v-model="form.trong_luong"
                class="form-control"
                placeholder="VD: 1.5"
              />
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
import { productService } from '../services/product';
import AdminLayout from '../layouts/AdminLayout.vue';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import { useToast } from '../composables/useToast';
import {
  Box,
  Plus,
  Save,
  Archive,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Search,
  Download,
  Edit,
  Trash2,
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

const currentPage = ref(1);
const limit = ref(10);
const totalItems = ref(0);
const totalPages = computed(() => Math.ceil(totalItems.value / limit.value));

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

const showModal = ref(false);
const isEdit = ref(false);
const isSaving = ref(false);
const currentId = ref(null);
const form = ref({
  ma_san_pham: '',
  ma_may: '',
  ten_san_pham: '',
  trong_luong: null,
});

const fileInputRef = ref(null);
const isUploadingExcel = ref(false);

const showConfirm = ref(false);
const confirmActionType = ref('');
const itemToDelete = ref(null);

const confirmTitle = computed(() => {
  if (confirmActionType.value === 'DELETE') return 'Xác nhận Xóa';
  return isEdit.value ? 'Xác nhận Cập nhật' : 'Xác nhận Thêm mới';
});

const confirmMessage = computed(() => {
  if (confirmActionType.value === 'DELETE') {
    return `Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm [${itemToDelete.value?.ma_san_pham}] không?`;
  }
  return isEdit.value
    ? 'Bạn có chắc chắn muốn cập nhật thông tin sản phẩm này?'
    : 'Thêm sản phẩm mới vào hệ thống?';
});

// ==========================================
// HÀM TẢI DỮ LIỆU
// ==========================================
const loadData = async () => {
  isLoading.value = true;
  try {
    const skip = (currentPage.value - 1) * limit.value;
    const res = await productService.getProducts(
      skip,
      limit.value,
      searchQuery.value
    );

    dataList.value = res.data.data;
    totalItems.value = res.data.total;
  } catch (error) {
    toast.error('Lỗi khi tải danh mục sản phẩm!');
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

const changePage = (pageNumber) => {
  if (pageNumber >= 1 && pageNumber <= totalPages.value) {
    currentPage.value = pageNumber;
    loadData();
  }
};

onMounted(loadData);

// ==========================================
// HÀM XỬ LÝ MODAL (THÊM / SỬA / XÓA)
// ==========================================
const openModal = (item = null) => {
  if (item) {
    isEdit.value = true;
    currentId.value = item.id;
    form.value = {
      ma_san_pham: item.ma_san_pham,
      ma_may: item.ma_may || '',
      ten_san_pham: item.ten_san_pham,
      trong_luong: item.trong_luong,
    };
  } else {
    isEdit.value = false;
    currentId.value = null;
    form.value = {
      ma_san_pham: '',
      ma_may: '',
      ten_san_pham: '',
      trong_luong: null,
    };
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
  if (confirmActionType.value === 'SAVE') {
    await executeSave();
  } else if (confirmActionType.value === 'DELETE') {
    await executeDelete();
  }
};

const executeSave = async () => {
  isSaving.value = true;
  try {
    if (isEdit.value) {
      await productService.updateProduct(currentId.value, form.value);
      toast.success('Cập nhật sản phẩm thành công!');
    } else {
      await productService.createProduct(form.value);
      toast.success('Thêm sản phẩm mới thành công!');
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

const executeDelete = async () => {
  if (!itemToDelete.value) return;
  try {
    await productService.deleteProduct(itemToDelete.value.id);
    toast.success('Đã xóa sản phẩm thành công!');
    if (dataList.value.length === 1 && currentPage.value > 1) {
      currentPage.value -= 1;
    }
    await loadData();
  } catch (error) {
    toast.error(error.response?.data?.detail || 'Lỗi khi xóa sản phẩm!');
  } finally {
    itemToDelete.value = null;
  }
};

const downloadTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['MÃ SP', 'MÃ MÁY', 'TÊN SẢN PHẨM', 'TRỌNG LƯỢNG'],
  ]);

  ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 35 }, { wch: 15 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BieuMau_SanPham');
  XLSX.writeFile(wb, 'Bieu_Mau_San_Pham.xlsx');
  toast.success('Đã tải biểu mẫu Excel thành công!');
};

const triggerFileUpload = () => {
  fileInputRef.value.click();
};

const handleExcelUpload = async (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  isUploadingExcel.value = true;
  let allPayloads = [];

  const processSingleFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (json.length === 0) {
            resolve([]);
            return;
          }

          const getVal = (row, keys) => {
            for (let key of keys) {
              if (row[key] !== undefined && row[key] !== '') return row[key];
            }
            return '';
          };

          const filePayload = json
            .map((row) => {
              const maSP = String(
                getVal(row, [
                  'MÃ SP',
                  'Mã SP',
                  'Mã Sản Phẩm',
                  'SKU',
                  'ma_san_pham',
                ])
              );
              const maMay = String(
                getVal(row, ['MÃ MÁY', 'Mã Máy', 'Mã máy', 'Model', 'ma_may'])
              );
              const tenSP = String(
                getVal(row, [
                  'TÊN SẢN PHẨM',
                  'Tên Sản Phẩm',
                  'Tên SP',
                  'ten_san_pham',
                ])
              );
              const trongLuong =
                parseFloat(
                  getVal(row, ['TRỌNG LƯỢNG', 'Trọng lượng', 'trong_luong'])
                ) || null;

              if (maSP || tenSP) {
                return {
                  ma_san_pham: maSP,
                  ma_may: maMay,
                  ten_san_pham: tenSP,
                  trong_luong: trongLuong,
                };
              }
              return null;
            })
            .filter((item) => item !== null);

          resolve(filePayload);
        } catch (error) {
          console.error(`Lỗi khi đọc file ${file.name}:`, error);
          resolve([]);
        }
      };

      reader.onerror = () => resolve([]);
      reader.readAsArrayBuffer(file);
    });
  };

  try {
    const filePromises = Array.from(files).map((file) =>
      processSingleFile(file)
    );
    const allResults = await Promise.all(filePromises);

    allPayloads = allResults.flat();

    if (allPayloads.length === 0) {
      toast.error(
        'Không tìm thấy dữ liệu hợp lệ (MÃ SP, TÊN SẢN PHẨM) trong các file!'
      );
      return;
    }

    const res = await productService.bulkCreateProducts(allPayloads);
    toast.success(
      res.data.message || `Đã Import thành công từ ${files.length} file!`
    );

    currentPage.value = 1;
    loadData();
  } catch (error) {
    console.error(error);
    toast.error(
      error.response?.data?.detail || 'Lỗi hệ thống khi tải file Excel!'
    );
  } finally {
    isUploadingExcel.value = false;
    event.target.value = '';
  }
};
</script>

<style src="../styles/ProductManagementStyle.css" scoped></style>
