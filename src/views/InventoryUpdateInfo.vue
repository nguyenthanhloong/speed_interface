<template>
  <DefaultLayout>
    <div class="update-wrapper">
      <button class="btn-back" @click="$router.push('/')">
        <ArrowLeft class="icon-sm" /> Về Bảng Điều Khiển
      </button>
      <div class="page-header">
        <div>
          <div class="title-group d-flex align-items-center gap-2">
            <div class="header-icon-box bg-primary-light">
              <DatabaseZap class="icon-md text-primary" />
            </div>
            <div>
              <h2 class="m-0 text-dark fw-bold">Bổ Sung Thông Tin Giao Dịch</h2>
            </div>
          </div>
        </div>
      </div>

      <div class="control-panel card p-4 mb-4 shadow-sm border-0">
        <div class="row g-4 align-items-end">
          <div class="col-lg-7 border-end-lg pe-lg-4">
            <h6
              class="text-uppercase text-muted fw-bold mb-3"
              style="font-size: 0.8rem; letter-spacing: 0.5px"
            >
              Bộ Lọc Tìm Kiếm
            </h6>
            <div class="d-flex gap-3 flex-wrap flex-md-nowrap">
              <div class="form-group mb-0 flex-grow-1" style="max-width: 250px">
                <select
                  v-model="actionType"
                  class="form-control modern-select bg-light"
                >
                  <optgroup label="Khách VIP">
                    <option value="VIP_IMPORT_NEW">Nhập Hàng Mới (VIP)</option>
                    <option value="VIP_IMPORT_OLD">
                      Nhập Hàng Trả Lại (VIP)
                    </option>
                  </optgroup>
                  <optgroup label="Khách Thường">
                    <option value="THUONG_IMPORT">Nhập Kho (Thường)</option>
                  </optgroup>
                </select>
              </div>

              <div class="form-group mb-0 flex-grow-1 position-relative">
                <input
                  type="text"
                  v-model="searchQuery"
                  class="form-control search-input ps-4"
                  placeholder="Nhập ID, Mã Bill hoặc Mã Máy..."
                  @keyup.enter="fetchData"
                />
              </div>

              <button
                class="btn btn-primary px-4 fw-bold shadow-sm"
                @click="fetchData"
              >
                Tìm Kiếm
              </button>
            </div>
          </div>

          <div class="col-lg-5 ps-lg-4">
            <h6
              class="text-uppercase text-muted fw-bold mb-3"
              style="font-size: 0.8rem; letter-spacing: 0.5px"
            >
              Thao Tác Hàng Loạt
            </h6>
            <div
              style="
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                justify-content: flex-start;
              "
            >
              <button
                @click="downloadFileToFix"
                class="btn btn-excel-export shadow-sm flex-grow-1"
                :disabled="isDownloadingExcel"
              >
                <Download class="icon-sm mr-2" v-if="!isDownloadingExcel" />
                <RefreshCw class="icon-sm spin mr-2" v-else />
                {{
                  isDownloadingExcel ? 'Đang tạo file...' : '1. Xuất File Sửa'
                }}
              </button>

              <button
                @click="triggerUploadFixedFile"
                class="btn btn-excel-import shadow-sm flex-grow-1"
                :disabled="isUploadingExcel"
              >
                <Upload class="icon-sm mr-2" v-if="!isUploadingExcel" />
                <RefreshCw class="icon-sm spin mr-2" v-else />
                {{ isUploadingExcel ? 'Đang cập nhật...' : '2. Nhập Lại File' }}
              </button>
              <input
                type="file"
                ref="fixInputRef"
                @change="handleUploadFixedFile"
                hidden
                accept=".xlsx, .xls"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="card p-0 shadow-sm border-0 table-card">
        <div class="table-responsive">
          <table class="table data-table table-hover m-0">
            <thead class="bg-light text-muted">
              <tr>
                <th width="100" class="ps-4">ID</th>
                <th width="150">Ngày GD</th>
                <th width="30%">Mã Máy / Sản Phẩm</th>
                <th>Cảnh Báo Thiếu Dữ Liệu</th>
                <th width="120" class="text-center pe-4">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in tableData" :key="item.id" class="align-middle">
                <td class="ps-4">
                  <span class="text-dark fw-bold">#{{ item.id }}</span>
                </td>
                <td class="text-secondary" style="font-size: 0.9rem">
                  {{ formatDate(item.ngay) }}
                </td>
                <td>
                  <div class="fw-bold text-dark" style="font-size: 0.95rem">
                    {{ item.ma_may || item.ma_san_pham || 'N/A' }}
                  </div>
                  <div class="text-muted" style="font-size: 0.85rem">
                    {{ item.ten_san_pham }}
                  </div>
                </td>
                <td>
                  <div class="d-flex flex-wrap gap-2">
                    <span
                      v-if="
                        !item.serial_moi &&
                        !item.serial_cu &&
                        actionType.includes('VIP')
                      "
                      class="custom-badge badge-warning"
                    >
                      Thiếu Serial
                    </span>
                    <span
                      v-if="
                        !item.pxk_kho_tsb && actionType === 'VIP_IMPORT_NEW'
                      "
                      class="custom-badge badge-danger"
                    >
                      Thiếu PXK Kho
                    </span>
                    <span
                      v-if="!item.ma_bill && actionType === 'VIP_IMPORT_OLD'"
                      class="custom-badge badge-secondary"
                    >
                      Thiếu Mã Bill
                    </span>
                  </div>
                </td>
                <td class="text-center pe-4">
                  <button
                    @click="openEditModal(item)"
                    class="btn btn-action-edit"
                  >
                    Bổ sung
                  </button>
                </td>
              </tr>

              <tr v-if="isLoading">
                <td colspan="5" class="text-center p-5">
                  <RefreshCw class="icon-md spin text-primary mb-2" />
                  <p class="text-muted m-0">Đang tải dữ liệu...</p>
                </td>
              </tr>
              <tr v-else-if="tableData.length === 0">
                <td colspan="5" class="text-center p-5 text-muted">
                  <DatabaseZap
                    class="icon-lg mb-3 opacity-50"
                    style="width: 48px; height: 48px"
                  />
                  <h6 class="fw-bold">Không có dữ liệu</h6>
                  <p class="m-0" style="font-size: 0.9rem">
                    Hãy thay đổi bộ lọc tìm kiếm hoặc loại giao dịch.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="card p-0 shadow-sm border-0 table-card">
            <div class="table-responsive">
              <table class="table data-table table-hover m-0"></table>
            </div>

            <div
              class="d-flex justify-content-between align-items-center p-3 border-top"
              v-if="totalItems > 0"
            >
              <div class="pagination-container" v-if="totalItems > 0">
                <div class="pagination-info">
                  Hiển thị {{ (currentPage - 1) * limit + 1 }} đến
                  {{ Math.min(currentPage * limit, totalItems) }} trong tổng số
                  <strong>{{ totalItems }}</strong> giao dịch
                </div>
                <div class="pagination-actions">
                  <button
                    class="btn-page"
                    :disabled="currentPage === 1"
                    @click="changePage(currentPage - 1)"
                  >
                    Trước
                  </button>

                  <button
                    v-for="(item, index) in visiblePages"
                    :key="index"
                    class="btn-page"
                    :class="{
                      active: item === currentPage,
                      'btn-ellipsis': item === '...',
                    }"
                    :disabled="item === '...'"
                    @click="item !== '...' && changePage(item)"
                  >
                    {{ item }}
                  </button>

                  <button
                    class="btn-page"
                    :disabled="currentPage === totalPages"
                    @click="changePage(currentPage + 1)"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showEditModal"
      class="modal-overlay"
      @click.self="closeEditModal"
    >
      <div
        class="modal-content shadow-2xl border-0"
        style="max-width: 700px; border-radius: 16px; overflow: hidden"
      >
        <div class="modal-header">
          <h4 class="m-0 fw-bold" style="color: #0f172a; font-size: 1.25rem">
            Bổ Sung Thông Tin
            <span
              class="badge bg-primary text-white ms-2 px-2 py-1 rounded-pill"
              >#{{ editFormData.id }}</span
            >
          </h4>
          <button
            class="btn-close-modal d-flex align-items-center justify-content-center"
            @click="closeEditModal"
            style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: #e2e8f0;
            "
          >
            &times;
          </button>
        </div>

        <div class="modal-body p-4 bg-white">
          <div class="alert-modern" style="margin-bottom: 1.5rem">
            <div class="alert-icon">💡</div>
            <div class="alert-text">
              Chỉ có thể nhập vào các ô được đánh dấu
              <strong>Viền Xanh</strong>. Dữ liệu cũ đã được
              <strong>Khóa</strong> để bảo vệ tính toàn vẹn của hồ sơ kho.
            </div>
          </div>

          <form @submit.prevent="submitUpdate">
            <div class="row g-4">
              <template v-for="(value, key) in editableFields" :key="key">
                <div
                  v-if="!hiddenFields.includes(key)"
                  :class="key === 'ghi_chu' ? 'col-12' : 'col-md-6'"
                >
                  <label
                    class="form-label text-muted fw-bold d-flex justify-content-between mb-2"
                    style="
                      font-size: 0.8rem;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                    "
                  >
                    <span>{{ formatFieldName(key) }}</span>
                    <span
                      v-if="!isFieldLocked(key)"
                      class="text-primary"
                      style="font-size: 0.7rem; font-style: italic"
                      >*Cần bổ sung</span
                    >
                  </label>

                  <div class="position-relative field-wrapper">
                    <textarea
                      v-if="key === 'ghi_chu'"
                      v-model="editFormData[key]"
                      :disabled="isFieldLocked(key)"
                      class="form-control custom-input"
                      :class="
                        isFieldLocked(key) ? 'locked-field' : 'editable-field'
                      "
                      rows="2"
                      :placeholder="
                        !isFieldLocked(key) ? 'Nhập nội dung bổ sung...' : ''
                      "
                    ></textarea>

                    <input
                      v-else
                      type="text"
                      v-model="editFormData[key]"
                      :disabled="isFieldLocked(key)"
                      class="form-control"
                      :class="
                        isFieldLocked(key) ? 'locked-field' : 'editable-field'
                      "
                      :placeholder="
                        !isFieldLocked(key) ? 'Nhập thông tin...' : ''
                      "
                    />

                    <div class="field-icon-box" v-if="key !== 'ghi_chu'">
                      <Lock
                        v-if="isFieldLocked(key)"
                        class="icon-xs text-slate-400"
                      />
                      <Edit2 v-else class="icon-xs text-primary" />
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <button
              type="submit"
              style="margin-top: 1rem"
              class="btn btn-primary"
              :disabled="isUpdating"
            >
              <RefreshCw class="icon-sm spin mr-2" v-if="isUpdating" />
              {{ isUpdating ? 'Đang Lưu...' : 'Lưu Thay Đổi' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from '../composables/useToast';
import { inventoryService } from '../services/inventory';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import {
  RefreshCw,
  ArrowLeft,
  Download,
  Upload,
  DatabaseZap,
  Lock, // Bổ sung
  Edit2,
} from 'lucide-vue-next';

const toast = useToast();

const actionType = ref('VIP_IMPORT_NEW');
const searchQuery = ref('');
const tableData = ref([]);
const isLoading = ref(false);

const showEditModal = ref(false);
const originalDataItem = ref(null);
const editFormData = ref({});
const isUpdating = ref(false);

const isDownloadingExcel = ref(false);
const isUploadingExcel = ref(false);
const fixInputRef = ref(null);

const hiddenFields = [
  'id',
  'record_id',
  'ngay',
  'ngay_nhap_kho',
  'ngay_gd_only',
  'so_luong',
  'so_kien',
  'trong_luong',
  'kich_thuoc',
  'ma_kho_spl',
  'nv_nhap_lieu',
  'customer_id',
  'is_active',
  'ten_khach_hang',
  'ma_khach_hang',
];

// --- BIẾN PHÂN TRANG ---
const currentPage = ref(1);
const limit = ref(15); // Mỗi trang hiện 15 dòng cho vừa màn hình
const totalItems = ref(0);

const totalPages = computed(() => Math.ceil(totalItems.value / limit.value));

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 2;
  let pages = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (current > delta + 2) pages.push('...');

  const start = Math.max(2, current - delta);
  const end = Math.min(total - 1, current + delta);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - delta - 1) pages.push('...');
  pages.push(total);

  return pages;
});

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchData();
  }
};

const editableFields = computed(() => {
  if (!originalDataItem.value) return {};
  const fields = { ...originalDataItem.value };
  if (
    fields.serial_moi ||
    fields.serial_cu ||
    actionType.value.includes('VIP')
  ) {
    fields.serial = fields.serial_moi || fields.serial_cu || '';
  }
  return fields;
});

const formatFieldName = (key) => {
  const map = {
    ma_may: 'Mã Máy (Model)',
    ma_san_pham: 'Mã Sản Phẩm',
    serial: 'Số Serial',
    ma_bill: 'Mã Phiếu (Bill)',
    pxk_kho_tsb: 'Phiếu Xuất Kho TSB',
    pxk_vp_tsb: 'Phiếu Xuất VP TSB',
    ten_san_pham: 'Tên SP',
    ghi_chu: 'Ghi Chú',
  };
  return map[key] || key.replace(/_/g, ' ');
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const fetchData = async () => {
  isLoading.value = true;
  tableData.value = [];
  try {
    const skip = (currentPage.value - 1) * limit.value; // Tính vị trí bắt đầu
    let response = null;

    // Gọi API với skip và limit động
    if (actionType.value === 'VIP_IMPORT_NEW')
      response = await inventoryService.getHistoryVipImportNew(
        skip,
        limit.value
      );
    else if (actionType.value === 'VIP_IMPORT_OLD')
      response = await inventoryService.getHistoryVipImportOld(
        skip,
        limit.value
      );
    else if (actionType.value === 'THUONG_IMPORT')
      response = await inventoryService.getHistoryRegularImport(
        skip,
        limit.value
      );

    if (response && response.data) {
      let data = response.data.data;

      // Lọc local nếu có nhập text tìm kiếm
      if (searchQuery.value.trim() !== '') {
        const q = searchQuery.value.toLowerCase();
        data = data.filter(
          (item) =>
            String(item.id).includes(q) ||
            (item.ma_bill && item.ma_bill.toLowerCase().includes(q)) ||
            (item.ma_may && item.ma_may.toLowerCase().includes(q))
        );
      }

      tableData.value = data;
      // Cập nhật tổng số dòng từ Backend trả về (để vẽ số trang)
      totalItems.value = response.data.total || data.length;
    }
  } catch (error) {
    toast.error('Lỗi khi tải dữ liệu!');
  } finally {
    isLoading.value = false;
  }
};

const openEditModal = (item) => {
  originalDataItem.value = JSON.parse(JSON.stringify(item));
  const formData = JSON.parse(JSON.stringify(item));
  if (
    formData.serial_moi ||
    formData.serial_cu ||
    actionType.value.includes('VIP')
  ) {
    formData.serial = formData.serial_moi || formData.serial_cu || '';
  }
  editFormData.value = formData;
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  originalDataItem.value = null;
  editFormData.value = {};
};

const isFieldLocked = (key) => {
  if (!originalDataItem.value) return true;
  if (key === 'serial') {
    const val =
      originalDataItem.value.serial_moi || originalDataItem.value.serial_cu;
    return (
      val !== null &&
      val !== undefined &&
      String(val).trim() !== '' &&
      String(val).trim() !== 'N/A'
    );
  }
  const val = originalDataItem.value[key];
  return val !== null && val !== undefined && String(val).trim() !== '';
};

const downloadFileToFix = async () => {
  isDownloadingExcel.value = true;
  try {
    const response = await inventoryService.downloadFileToFix(actionType.value);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `can_chuan_hoa_${actionType.value}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã tải xuống file cần chuẩn hóa thành công!');
  } catch (e) {
    if (e.response && e.response.status === 404)
      toast.info('Không có dữ liệu nào bị thiếu thông tin cho loại phiếu này!');
    else toast.error('Lỗi khi xuất file Excel từ máy chủ!');
  } finally {
    isDownloadingExcel.value = false;
  }
};

const triggerUploadFixedFile = () => {
  if (fixInputRef.value) fixInputRef.value.click();
};

const handleUploadFixedFile = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  isUploadingExcel.value = true;
  try {
    const response = await inventoryService.importStandardizedExcel(formData);
    toast.success(response.data.message || 'Đã chuẩn hóa dữ liệu thành công!');
    await fetchData();
  } catch (error) {
    toast.error(error.response?.data?.detail || 'Lỗi khi cập nhật file Excel.');
  } finally {
    isUploadingExcel.value = false;
    if (event.target) event.target.value = '';
  }
};

const submitUpdate = async () => {
  isUpdating.value = true;
  const dataToUpdate = { ...editFormData.value };
  if (
    dataToUpdate.serial !== undefined &&
    String(dataToUpdate.serial).trim() !== ''
  ) {
    if (actionType.value === 'VIP_IMPORT_NEW')
      dataToUpdate.serial_moi = dataToUpdate.serial;
    else if (actionType.value === 'VIP_IMPORT_OLD')
      dataToUpdate.serial_cu = dataToUpdate.serial;
    delete dataToUpdate.serial;
  }

  let mode = '',
    actType = '';
  if (actionType.value === 'VIP_IMPORT_NEW') {
    mode = 'VIP';
    actType = 'IMPORT_NEW';
  } else if (actionType.value === 'VIP_IMPORT_OLD') {
    mode = 'VIP';
    actType = 'IMPORT_OLD';
  } else if (actionType.value === 'THUONG_IMPORT') {
    mode = 'THUONG';
    actType = 'IMPORT';
  }

  const payload = {
    id: editFormData.value.record_id || editFormData.value.id,
    mode: mode,
    action_type: actType,
    data_to_update: dataToUpdate,
  };

  try {
    await inventoryService.updateHistoryRecord(payload);
    toast.success('Đã điền bổ sung thông tin thành công!');
    closeEditModal();
    fetchData();
  } catch (error) {
    toast.error(error.response?.data?.detail || 'Lỗi khi cập nhật dữ liệu!');
  } finally {
    isUpdating.value = false;
  }
};

onMounted(() => {
  fetchData();
});
watch(actionType, () => {
  searchQuery.value = '';
  fetchData();
});
</script>

<style scoped>
.update-wrapper {
  padding: 1.5rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  margin-bottom: 8px;
}
.btn-back:hover {
  background: #f8fafc;
  color: #0f3d26;
  border-color: #cbd5e1;
}

.header-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bg-primary-light {
  background-color: #e0f2fe;
}
.text-primary {
  color: #0284c7 !important;
}

/* Control Panel */
.modern-select,
.search-input {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-weight: 500;
  color: #334155;
  transition: all 0.2s;
}
.modern-select:focus,
.search-input:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
  outline: none;
}

@media (min-width: 992px) {
  .border-end-lg {
    border-right: 1px solid #e2e8f0;
  }
}

/* Excel Buttons */
.btn-excel-export {
  background-color: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
  font-weight: 600;
}
.btn-excel-export:hover:not(:disabled) {
  background-color: #fef3c7;
  color: #92400e;
}

.btn-excel-import {
  background-color: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
  font-weight: 600;
}
.btn-excel-import:hover:not(:disabled) {
  background-color: #dcfce3;
  color: #166534;
}

/* Data Table */
.table-card {
  border-radius: 12px;
  overflow: hidden;
}
.data-table th {
  padding: 1rem;
  border-bottom: 2px solid #e2e8f0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

/* Badges */
.custom-badge {
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
}
.badge-warning {
  background-color: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}
.badge-danger {
  background-color: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}
.badge-secondary {
  background-color: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-action-edit {
  background-color: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  font-weight: 600;
  border-radius: 6px;
  padding: 0.4rem 1rem;
  transition: all 0.2s;
}
.btn-action-edit:hover {
  background-color: #dbeafe;
  color: #1e3a8a;
}

/* Modal */
.btn-close-modal {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s;
}
.btn-close-modal:hover {
  color: #0f172a;
}

.form-control {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  transition: all 0.2s;
  color: #1e293b;
}
.form-control:focus {
  border-color: #2e7d32;
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
}

.custom-input:focus:not(:disabled) {
  border-color: #0f3d26;
  box-shadow: 0 0 0 3px rgba(15, 61, 38, 0.1);
  outline: none;
}
.locked-field {
  background-color: #f8fafc;
  color: #64748b;
  cursor: not-allowed;
  border-color: #e2e8f0;
}

/* ===============================
   CSS CHO MODAL HIỆN ĐẠI
   =============================== */
.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.alert-modern {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #f0fdfa; /* Nền xanh dương rất nhạt */
  border-left: 4px solid #0284c7;
  padding: 12px 16px;
  border-radius: 8px;
}
.alert-icon {
  font-size: 1.25rem;
}
.alert-text {
  color: #0f172a;
  font-size: 0.9rem;
  line-height: 1.4;
}

.field-wrapper {
  position: relative;
}

.custom-input {
  border-radius: 8px;
  padding: 0.65rem 1rem;
  transition: all 0.25s ease;
  font-weight: 500;
  color: #1e293b;
  font-size: 0.95rem;
}

/* Kiểu dáng cho ô ĐÃ KHÓA (Có dữ liệu) */
.locked-field {
  background-color: #f8fafc;
  color: #64748b;
  cursor: not-allowed;
  border: 1px dashed #cbd5e1;
}

/* Kiểu dáng cho ô ĐƯỢC PHÉP SỬA (Đang trống) */
.editable-field {
  background-color: #ffffff;
  border: 1px solid #bae6fd; /* Viền xanh dương nhạt */
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.05); /* Tỏa sáng nhẹ */
}
.editable-field:focus:not(:disabled) {
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
  outline: none;
}

/* Icon bên trong Input */
.field-icon-box {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* Không cản trở việc click vào ô input */
}
.text-slate-400 {
  color: #94a3b8;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #0f3d26;
}
.title-icon {
  width: 28px;
  height: 28px;
  color: #2e7d32;
}
.title-group h2 {
  margin: 0;
  font-size: 1.5rem;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  background-color: #fafafa;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}
.pagination-info {
  font-size: 0.9rem;
  color: #64748b;
}
.pagination-info strong {
  color: #0f3d26;
}
.pagination-actions {
  display: flex;
  gap: 0.25rem;
}
.btn-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  background-color: #ffffff;
  color: #475569;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-page:hover:not(:disabled) {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
}
.btn-page.active {
  background-color: #2e7d32;
  color: #ffffff;
  border-color: #2e7d32;
}
.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f8fafc;
}
</style>
