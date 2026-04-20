<template>
  <DefaultLayout>
    <div class="history-wrapper">
      <button class="btn-back" @click="$router.push('/')">
        <ArrowLeft class="icon-sm" /> Về Bảng Điều Khiển
      </button>
      <div class="page-header">
        <div class="title-group">
          <h2>Lịch Sử Giao Dịch</h2>
        </div>
        <p class="text-muted">
          Tra cứu lịch sử nhập, xuất và trả hàng chi tiết. Tích chọn nhiều ô
          vuông bên trái để
          <b>Tải Hàng Loạt File Excel</b>. Bấm nút <b>Sửa</b> để cập nhật các
          trường còn trống.
        </p>
      </div>

      <div v-if="showTabSelector" class="admin-view-selector mb-4">
        <span class="label">Góc nhìn:</span>
        <button
          v-if="canViewVip"
          :class="['btn-tab', { active: currentMode === 'VIP' }]"
          @click="currentMode = 'VIP'"
        >
          Khách VIP
        </button>
        <button
          v-if="canViewThuong"
          :class="['btn-tab', { active: currentMode === 'THUONG' }]"
          @click="currentMode = 'THUONG'"
        >
          Khách Thường
        </button>
        <button
          v-if="canViewNoiBo"
          :class="['btn-tab', { active: currentMode === 'NOIBO' }]"
          @click="currentMode = 'NOIBO'"
        >
          Nội Bộ
        </button>
      </div>

      <div class="card p-0">
        <div class="history-toolbar">
          <div class="action-filters">
            <template v-if="currentMode === 'VIP'">
              <button
                class="filter-btn"
                :class="{ active: actionType === 'IMPORT_NEW' }"
                @click="actionType = 'IMPORT_NEW'"
              >
                Nhập Hàng Mới
              </button>
              <button
                class="filter-btn"
                :class="{ active: actionType === 'EXPORT_NEW' }"
                @click="actionType = 'EXPORT_NEW'"
              >
                Xuất Giao Hàng
              </button>
              <button
                class="filter-btn"
                :class="{ active: actionType === 'IMPORT_OLD' }"
                @click="actionType = 'IMPORT_OLD'"
              >
                Khách Trả Cũ
              </button>
              <button
                class="filter-btn"
                :class="{ active: actionType === 'EXPORT_OLD' }"
                @click="actionType = 'EXPORT_OLD'"
              >
                Xuất Trả Cũ
              </button>
            </template>
            <template v-else-if="currentMode === 'NOIBO'">
              <button
                class="filter-btn"
                :class="{ active: actionType === 'EXPORT_NOIBO' }"
                @click="actionType = 'EXPORT_NOIBO'"
              >
                Lịch Sử Xuất Nội Bộ
              </button>
            </template>
            <template v-else>
              <button
                class="filter-btn"
                :class="{ active: actionType === 'IMPORT' }"
                @click="actionType = 'IMPORT'"
              >
                Lịch Sử Nhập Kho
              </button>
              <button
                class="filter-btn"
                :class="{ active: actionType === 'EXPORT' }"
                @click="actionType = 'EXPORT'"
              >
                Lịch Sử Xuất Kho
              </button>
            </template>
          </div>

          <div
            class="date-filters d-flex align-items-center gap-2"
            style="display: flex; gap: 10px; align-items: center"
          >
            <button
              v-if="
                isExportAction && selectedItems.length > 0 && canDownloadExcel
              "
              class="btn btn-sm action-btn"
              style="
                background-color: #22c55e;
                color: white;
                height: 32px;
                border: none;
                font-weight: bold;
                font-size: 0.9rem;
              "
              @click="downloadSelectedExcel"
              :disabled="isDownloadingMultiple"
            >
              <Download
                class="icon-sm"
                :class="{ spin: isDownloadingMultiple }"
              />
              {{
                isDownloadingMultiple
                  ? 'Đang Tải...'
                  : `Tải ${selectedItems.length} File Excel`
              }}
            </button>

            <div class="custom-date-picker">
              <input
                type="date"
                v-model="filterStartDate"
                class="modern-date-input"
                title="Từ ngày"
              />
            </div>

            <span class="text-muted" style="font-weight: 500; font-size: 0.9rem"
              >đến</span
            >

            <div class="custom-date-picker">
              <input
                type="date"
                v-model="filterEndDate"
                class="modern-date-input"
                title="Đến ngày"
              />
            </div>

            <button
              class="btn btn-primary btn-sm action-btn"
              style="
                background-color: #0f3d26;
                color: white;
                border: none;
                height: 32px;
              "
              @click="applyFilter"
            >
              Lọc
            </button>
            <button
              class="btn btn-secondary btn-sm action-btn"
              style="height: 32px"
              @click="clearFilter"
            >
              <RefreshCw class="icon-sm" :class="{ spin: isLoading }" />
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table
            class="data-table"
            style="
              white-space: nowrap;
              border-collapse: separate;
              border-spacing: 0;
            "
          >
            <thead>
              <tr>
                <th
                  v-for="col in allColumnsConfig"
                  :key="col.key"
                  :class="{
                    'sticky-left-col':
                      col.key === 'checkbox' ||
                      userPinnedColumns.includes(col.key),
                  }"
                  :style="[
                    { width: col.width + 'px', minWidth: col.width + 'px' },
                    getPinnedStyle(col.key, true),
                  ]"
                >
                  <div v-if="col.key === 'checkbox'" class="text-center w-100">
                    <span
                      style="
                        font-size: 0.85rem;
                        color: #ffffff;
                        font-weight: bold;
                      "
                      >Chọn</span
                    >
                  </div>
                  <div
                    v-else
                    class="d-flex align-items-center justify-content-between"
                  >
                    <span>{{ col.label }}</span>
                    <button
                      @click="togglePin(col.key)"
                      class="pin-btn"
                      title="Ghim cột này"
                    >
                      <Pin class="icon-xs" style="width: 14px; height: 14px" />
                    </button>
                  </div>
                </th>
                <th width="140" class="text-center sticky-right">Thao Tác</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in tableData"
                :key="item.id || item.record_id"
                :class="currentMode === 'NOIBO' ? item.groupBgClass : ''"
              >
                <template v-for="col in allColumnsConfig" :key="col.key">
                  <td
                    v-if="
                      currentMode !== 'NOIBO' ||
                      ![
                        'checkbox',
                        'ngay',
                        'ma_bill',
                        'trang_thai',
                        'kho_xuat',
                        'kho_nhan',
                        'nv_giao_hang',
                        'doi_tac_van_chuyen',
                        'nv_nhap_lieu',
                      ].includes(col.key) ||
                      item.isFirstOfGroup
                    "
                    :rowspan="
                      currentMode === 'NOIBO' &&
                      [
                        'checkbox',
                        'ngay',
                        'ma_bill',
                        'trang_thai',
                        'kho_xuat',
                        'kho_nhan',
                        'nv_giao_hang',
                        'doi_tac_van_chuyen',
                        'nv_nhap_lieu',
                      ].includes(col.key)
                        ? item.rowspan
                        : 1
                    "
                    :class="{
                      'sticky-left-col':
                        col.key === 'checkbox' ||
                        userPinnedColumns.includes(col.key),
                      'cell-border-bottom':
                        currentMode === 'NOIBO' &&
                        item.isFirstOfGroup &&
                        item.rowspan > 1 &&
                        ![
                          'checkbox',
                          'ngay',
                          'ma_bill',
                          'kho_xuat',
                          'kho_nhan',
                          'nv_giao_hang',
                          'doi_tac_van_chuyen',
                          'nv_nhap_lieu',
                        ].includes(col.key) == false,
                    }"
                    :style="getPinnedStyle(col.key, false)"
                  >
                    <template v-if="col.key === 'checkbox'">
                      <div class="text-center w-100">
                        <input
                          type="checkbox"
                          style="width: 16px; height: 16px; cursor: pointer"
                          :value="
                            currentMode === 'VIP'
                              ? item.id || item.record_id
                              : item.ma_bill
                          "
                          v-model="selectedItems"
                        />
                      </div>
                    </template>
                    <template v-else-if="col.key === 'trang_thai'">
                      <span
                        v-if="item.trang_thai === 'COMPLETED'"
                        class="badge"
                        style="background-color: #10b981; color: white"
                        >Hoàn tất</span
                      >
                      <span
                        v-else-if="item.trang_thai === 'REJECTED_SOURCE'"
                        class="badge"
                        style="background-color: #ef4444; color: white"
                        >Hủy (Kho Xuất)</span
                      >
                      <span
                        v-else
                        class="badge"
                        style="background-color: #f59e0b; color: white"
                        >Đang xử lý</span
                      >
                    </template>
                    <template v-else-if="col.key === 'ngay'">
                      <span class="date-badge">{{
                        formatDate(item.ngay)
                      }}</span>
                    </template>
                    <template v-else-if="col.key === 'ngay_nhap_kho'">
                      {{ formatDate(item.ngay_nhap_kho) || '-' }}
                    </template>
                    <template v-else-if="col.key === 'id'">
                      <strong>#{{ item.id }}</strong>
                    </template>
                    <template v-else-if="col.key === 'serial'">
                      <span class="text-primary font-weight-bold">{{
                        item.serial_moi || item.serial_cu || 'N/A'
                      }}</span>
                    </template>
                    <template
                      v-else-if="col.key === 'ma_may' || col.key === 'ma_bill'"
                    >
                      <strong>{{ item[col.key] || 'N/A' }}</strong>
                    </template>
                    <template v-else-if="col.key === 'so_luong'">
                      <span
                        class="badge qty-badge"
                        :class="isExportAction ? 'bg-danger' : 'bg-success'"
                      >
                        {{ isExportAction ? '-' : '+'
                        }}{{ currentMode === 'VIP' ? '1' : item.so_luong }}
                      </span>
                    </template>
                    <template v-else-if="col.key === 'so_kien'">
                      <span
                        class="badge"
                        style="
                          background-color: #3b82f6;
                          color: white;
                          padding: 4px 8px;
                          font-size: 0.85rem;
                        "
                      >
                        {{ item.so_kien || 0 }} Kiện
                      </span>
                    </template>
                    <template v-else-if="col.key === 'trong_luong'">
                      <strong>{{ item.trong_luong || '0' }}</strong> Kg
                    </template>
                    <template v-else-if="col.key === 'ma_kho_spl'">
                      <span class="badge">{{ item.ma_kho_spl || 'N/A' }}</span>
                    </template>
                    <template v-else-if="col.key === 'ghi_chu'">
                      <div
                        style="
                          min-width: 250px;
                          white-space: pre-wrap;
                          word-break: break-word;
                        "
                      >
                        {{ item.ghi_chu || '-' }}
                      </div>
                    </template>
                    <template v-else>
                      {{ item[col.key] || '-' }}
                    </template>
                  </td>
                </template>

                <td
                  v-if="currentMode !== 'NOIBO' || item.isFirstOfGroup"
                  :rowspan="currentMode === 'NOIBO' ? item.rowspan : 1"
                  class="text-center sticky-right"
                >
                  <div style="display: flex; gap: 5px; justify-content: center">
                    <button
                      v-if="!isExportAction"
                      @click="openEditModal(item)"
                      class="btn btn-sm action-btn"
                      style="color: #0284c7; border-color: #0284c7"
                      title="Cập nhật thông tin thiếu"
                    >
                      ✏️ Sửa
                    </button>

                    <button
                      v-if="
                        isExportAction &&
                        canDownloadExcel &&
                        (currentMode !== 'NOIBO' ||
                          (item.trang_thai !== 'PENDING_SOURCE' &&
                            item.trang_thai !== 'REJECTED_SOURCE'))
                      "
                      @click="
                        downloadExcel(
                          item.ma_bill,
                          item.ma_kho_spl || item.kho_xuat,
                          item.id || item.record_id
                        )
                      "
                      class="btn btn-sm btn-outline-success action-btn"
                      title="Tải Excel"
                    >
                      Tải File
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="tableData.length === 0 && !isLoading">
                <td
                  :colspan="allColumnsConfig.length + 1"
                  class="text-center text-muted empty-row"
                >
                  Không tìm thấy dữ liệu giao dịch nào.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

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

    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 style="margin: 0; color: #0f3d26; font-size: 1.2rem">
            Cập Nhật Thông Tin Phiếu Nhập
          </h3>
          <button class="close-btn" @click="closeEditModal">&times;</button>
        </div>

        <div class="modal-body">
          <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 15px">
            Hệ thống chỉ cho phép điền bổ sung vào các trường đang bị trống. Các
            trường đã có dữ liệu sẽ tự động bị khóa để đảm bảo an toàn nghiệp
            vụ.
          </p>

          <form @submit.prevent="submitUpdate">
            <div class="form-grid">
              <template v-for="col in allColumnsConfig" :key="col.key">
                <div
                  v-if="
                    ![
                      'checkbox',
                      'id',
                      'ngay',
                      'ngay_nhap_kho',
                      'so_luong',
                      'ma_kho_spl',
                      'nv_nhap_lieu',
                    ].includes(col.key)
                  "
                  class="form-group full-width"
                >
                  <label
                    style="
                      font-weight: bold;
                      font-size: 0.85rem;
                      color: #475569;
                    "
                    >{{ col.label }}</label
                  >

                  <textarea
                    v-if="col.key === 'ghi_chu'"
                    v-model="editFormData[col.key]"
                    :disabled="isFieldLocked(col.key)"
                    :class="{ 'locked-input': isFieldLocked(col.key) }"
                    class="form-control"
                    rows="2"
                  ></textarea>

                  <input
                    v-else
                    type="text"
                    v-model="editFormData[col.key]"
                    :disabled="isFieldLocked(col.key)"
                    :class="{ 'locked-input': isFieldLocked(col.key) }"
                    class="form-control"
                  />
                  <small
                    v-if="isFieldLocked(col.key)"
                    class="text-danger"
                    style="font-size: 0.75rem"
                    >🔒 Đã chốt dữ liệu, không thể sửa</small
                  >
                </div>
              </template>
            </div>

            <div
              class="modal-footer mt-4"
              style="display: flex; justify-content: flex-end; gap: 10px"
            >
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeEditModal"
              >
                Hủy
              </button>
              <button
                type="submit"
                class="btn btn-save"
                style="background-color: #0f3d26; color: white"
                :disabled="isUpdating"
              >
                {{ isUpdating ? 'Đang lưu...' : 'Lưu Thay Đổi' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import { inventoryService } from '../services/inventory';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import { History, RefreshCw, ArrowLeft, Pin, Download } from 'lucide-vue-next';

const authStore = useAuthStore();
const toast = useToast();
const isAdmin = computed(() => authStore.hasPermission('FUNC_ADMIN_ALL'));

const canDownloadExcel = computed(() => {
  if (isAdmin.value) return true;

  if (authStore.user?.is_shipper || authStore.user?.bien_so_xe) return false;

  return true;
});

const filterStartDate = ref('');
const filterEndDate = ref('');

const clearFilter = () => {
  filterStartDate.value = '';
  filterEndDate.value = '';
  currentPage.value = 1;
  fetchData();
};

const canViewVip = computed(
  () =>
    isAdmin.value ||
    authStore.hasPermission('FUNC_VIP_NHAP_MOI') ||
    authStore.hasPermission('FUNC_VIP_XUAT_MOI') ||
    authStore.hasPermission('FUNC_VIP_NHAP_CU') ||
    authStore.hasPermission('FUNC_VIP_XUAT_CU')
);
const canViewThuong = computed(
  () =>
    isAdmin.value ||
    authStore.hasPermission('FUNC_THUONG_NHAP') ||
    authStore.hasPermission('FUNC_THUONG_XUAT')
);

// THÊM QUYỀN NỘI BỘ
const canViewNoiBo = computed(() => {
  return (
    isAdmin.value ||
    authStore.hasPermission('FUNC_VIP_XUAT_MOI') ||
    authStore.hasPermission('FUNC_THUONG_XUAT')
  );
});

const showTabSelector = computed(
  () =>
    [canViewVip.value, canViewThuong.value, canViewNoiBo.value].filter(Boolean)
      .length > 1
);

const currentMode = ref('VIP');
const actionType = ref('IMPORT_NEW');
const tableData = ref([]);
const isLoading = ref(false);

const currentPage = ref(1);
const limit = ref(10);
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
const isExportAction = computed(() => actionType.value.includes('EXPORT'));

let currentRequestId = 0;

const selectedItems = ref([]);
const isDownloadingMultiple = ref(false);

watch(
  [currentMode, actionType, currentPage, filterStartDate, filterEndDate],
  () => {
    selectedItems.value = [];
  }
);

watch(currentMode, (newVal) => {
  if (newVal === 'VIP') actionType.value = 'IMPORT_NEW';
  else if (newVal === 'NOIBO') actionType.value = 'EXPORT_NOIBO';
  else actionType.value = 'IMPORT';
});

watch([currentMode, actionType], () => {
  currentPage.value = 1;
  fetchData();
});

const downloadSelectedExcel = async () => {
  if (selectedItems.value.length === 0) return;
  isDownloadingMultiple.value = true;
  const uniqueItems = [...new Set(selectedItems.value)];
  toast.info(`Bắt đầu tải ${uniqueItems.length} file. Vui lòng chờ...`);

  for (const uniqueValue of uniqueItems) {
    let item;
    // Tách riêng VIP (dùng ID). Còn lại (Nội Bộ, Thường, Lẻ) đều dùng ma_bill để tìm
    if (currentMode.value === 'VIP') {
      item = tableData.value.find(
        (i) => i.id === uniqueValue || i.record_id === uniqueValue
      );
    } else {
      item = tableData.value.find((i) => i.ma_bill === uniqueValue);
    }

    if (item) {
      await downloadExcel(
        item.ma_bill,
        item.ma_kho_spl || item.kho_xuat,
        item.id || item.record_id,
        false
      );
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  isDownloadingMultiple.value = false;
  toast.success(`Đã tải xong toàn bộ ${uniqueItems.length} file Excel!`);
  selectedItems.value = [];
};

const userPinnedColumns = ref([]);
const togglePin = (key) => {
  if (userPinnedColumns.value.includes(key))
    userPinnedColumns.value = userPinnedColumns.value.filter((k) => k !== key);
  else userPinnedColumns.value.push(key);
};

const allColumnsConfig = computed(() => {
  const cols = [];
  if (isExportAction.value && canDownloadExcel.value)
    cols.push({ key: 'checkbox', label: '', width: 50 });

  cols.push({ key: 'ngay', label: 'Ngày GD', width: 160 });
  cols.push({ key: 'id', label: 'ID / Mã Lô', width: 100 });

  if (currentMode.value === 'NOIBO') {
    cols.push({ key: 'ma_bill', label: 'Mã Phiếu', width: 150 });
    cols.push({ key: 'trang_thai', label: 'Trạng Thái', width: 160 });
    cols.push({ key: 'ten_san_pham', label: 'Tên Sản Phẩm', width: 220 });
    cols.push({ key: 'ma_san_pham', label: 'Mã Sản Phẩm', width: 120 });
    cols.push({ key: 'ma_may', label: 'Mã Máy', width: 120 });
    cols.push({ key: 'so_luong', label: 'SL', width: 80 });
    cols.push({ key: 'so_kien', label: 'Kiện', width: 80 });
    cols.push({ key: 'kho_xuat', label: 'Kho Phát Hành', width: 150 });
    cols.push({ key: 'kho_nhan', label: 'Kho Đích Nhận', width: 150 });
    cols.push({ key: 'nv_giao_hang', label: 'Tài Xế', width: 150 });
    cols.push({ key: 'doi_tac_van_chuyen', label: 'Đối Tác VC', width: 140 });
  } else {
    if (currentMode.value !== 'VIP') {
      cols.push({ key: 'ten_khach_hang', label: 'Tên Khách Hàng', width: 200 });
      cols.push({ key: 'ten_san_pham', label: 'Tên Sản Phẩm', width: 250 });
      cols.push({ key: 'ma_san_pham', label: 'Mã Sản Phẩm', width: 150 });
    }
    if (currentMode.value === 'VIP') {
      cols.push({ key: 'ma_may', label: 'Mã Máy (Model)', width: 160 });
      cols.push({ key: 'serial', label: 'Số Serial', width: 180 });
      if (
        actionType.value === 'IMPORT_NEW' ||
        actionType.value === 'EXPORT_NEW'
      )
        cols.push({ key: 'ma_san_pham', label: 'Mã Sản Phẩm', width: 150 });
      if (actionType.value === 'IMPORT_NEW') {
        cols.push({ key: 'pxk_kho_tsb', label: 'PXK Kho TSB', width: 140 });
        cols.push({ key: 'pxk_vp_tsb', label: 'PXK VP TSB', width: 140 });
      }
    }
    cols.push({ key: 'so_luong', label: 'Số Lượng', width: 120 });
    if (currentMode.value === 'THUONG' || currentMode.value === 'LE') {
      cols.push({ key: 'so_kien', label: 'Số Kiện', width: 100 });
    }
    cols.push({ key: 'ma_kho_spl', label: 'Mã Kho (SPL)', width: 130 });
    if (currentMode.value === 'VIP' || actionType.value.includes('EXPORT'))
      cols.push({ key: 'ma_bill', label: 'Mã Bill / Vận Đơn', width: 180 });
    if (isExportAction.value) {
      cols.push({ key: 'nv_giao_hang', label: 'NV Giao Hàng', width: 180 });
      cols.push({ key: 'bien_so_xe', label: 'Biển Số Xe', width: 140 });
    }
    if (actionType.value === 'EXPORT_OLD') {
      cols.push({ key: 'kho_tra_hang', label: 'Kho Trả Hàng', width: 180 });
      cols.push({ key: 'nguoi_nhan', label: 'Người Nhận', width: 180 });
    }
  }

  cols.push({ key: 'nv_nhap_lieu', label: 'NV Nhập Liệu', width: 160 });
  cols.push({ key: 'ghi_chu', label: 'Ghi Chú', width: 250 });

  if (isExportAction.value && currentMode.value !== 'NOIBO')
    cols.push({ key: 'ngay_nhap_kho', label: 'Ngày Nhập Kho', width: 180 });

  return cols;
});

const getPinnedStyle = (colKey) => {
  const isForcedPin = colKey === 'checkbox';
  if (!isForcedPin && !userPinnedColumns.value.includes(colKey)) return {};
  let leftOffset = 0;
  for (const col of allColumnsConfig.value) {
    if (col.key === colKey) break;
    if (col.key === 'checkbox' || userPinnedColumns.value.includes(col.key))
      leftOffset += col.width;
  }
  return { left: `${leftOffset}px` };
};

// ==============================================================
// LOGIC MODAL CẬP NHẬT THÔNG TIN CÒN THIẾU
// ==============================================================
const showEditModal = ref(false);
const originalDataItem = ref(null);
const editFormData = ref({});
const isUpdating = ref(false);

const openEditModal = (item) => {
  originalDataItem.value = JSON.parse(JSON.stringify(item));

  const formData = JSON.parse(JSON.stringify(item));

  if (formData.serial_moi || formData.serial_cu) {
    formData.serial = formData.serial_moi || formData.serial_cu;
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

const submitUpdate = async () => {
  isUpdating.value = true;

  const dataToUpdate = { ...editFormData.value };

  if (
    dataToUpdate.serial !== undefined &&
    String(dataToUpdate.serial).trim() !== ''
  ) {
    if (actionType.value === 'IMPORT_NEW') {
      dataToUpdate.serial_moi = dataToUpdate.serial;
    } else if (actionType.value === 'IMPORT_OLD') {
      dataToUpdate.serial_cu = dataToUpdate.serial;
    }
    delete dataToUpdate.serial;
  }

  const payload = {
    id: editFormData.value.record_id || editFormData.value.id,
    mode: currentMode.value,
    action_type: actionType.value,
    data_to_update: dataToUpdate,
  };

  try {
    await inventoryService.updateHistoryRecord(payload);
    toast.success('Đã điền bổ sung thông tin thành công!');
    closeEditModal();
    fetchData();
  } catch (error) {
    toast.error(
      error.response?.data?.detail || 'Lỗi khi cập nhật dữ liệu. Hãy thử lại!'
    );
  } finally {
    isUpdating.value = false;
  }
};

onMounted(() => {
  if (canViewVip.value) currentMode.value = 'VIP';
  else if (canViewThuong.value) currentMode.value = 'THUONG';
  else if (canViewNoiBo.value) currentMode.value = 'NOIBO';
  fetchData();
});

const applyFilter = () => {
  currentPage.value = 1;
  selectedItems.value = [];
  fetchData();
};

const fetchData = async () => {
  currentRequestId += 1;
  const myRequestId = currentRequestId;
  isLoading.value = true;
  tableData.value = [];

  const sDate = filterStartDate.value;
  const eDate = filterEndDate.value;
  const skip = (currentPage.value - 1) * limit.value;
  let response = null;

  try {
    if (currentMode.value === 'VIP') {
      if (actionType.value === 'IMPORT_NEW')
        response = await inventoryService.getHistoryVipImportNew(
          skip,
          limit.value,
          sDate,
          eDate
        );
      else if (actionType.value === 'EXPORT_NEW')
        response = await inventoryService.getHistoryVipExportNew(
          skip,
          limit.value,
          sDate,
          eDate
        );
      else if (actionType.value === 'IMPORT_OLD')
        response = await inventoryService.getHistoryVipImportOld(
          skip,
          limit.value,
          sDate,
          eDate
        );
      else if (actionType.value === 'EXPORT_OLD')
        response = await inventoryService.getHistoryVipExportOld(
          skip,
          limit.value,
          sDate,
          eDate
        );
    } else if (currentMode.value === 'THUONG') {
      if (actionType.value === 'IMPORT')
        response = await inventoryService.getHistoryRegularImport(
          skip,
          limit.value,
          sDate,
          eDate
        );
      else if (actionType.value === 'EXPORT')
        response = await inventoryService.getHistoryRegularExport(
          skip,
          limit.value,
          sDate,
          eDate
        );
    } else if (currentMode.value === 'NOIBO') {
      response = await inventoryService.getHistoryNoiBoExport(
        skip,
        limit.value,
        sDate,
        eDate
      );
      console.log(response);
    }

    if (myRequestId !== currentRequestId) return;

    if (response && response.data) {
      // 🚀 LOGIC ĐẶC BIỆT CHO LỊCH SỬ NỘI BỘ (LÀM PHẲNG DỮ LIỆU & TÍNH ROWSPAN)
      if (currentMode.value === 'NOIBO') {
        let flatData = [];
        let groupIndex = 0; // Dùng để xác định màu nền xen kẽ cho các nhóm

        response.data.data.forEach((bill) => {
          const itemsCount =
            bill.items && bill.items.length > 0 ? bill.items.length : 1;
          const bgClass =
            groupIndex % 2 === 0 ? 'bg-group-even' : 'bg-group-odd';

          if (bill.items && bill.items.length > 0) {
            bill.items.forEach((child, idx) => {
              flatData.push({
                ...bill,
                ...child,
                ngay: bill.ngay_xuat,
                record_id: bill.id,
                id: child.id,
                ma_san_pham: child.ma_sp_hoac_id,
                nv_giao_hang: bill.tai_xe,

                // --- THÊM LOGIC UI CHO GOM NHÓM ---
                rowspan: idx === 0 ? itemsCount : 0, // Chỉ dòng đầu tiên mới có rowspan
                isFirstOfGroup: idx === 0, // Đánh dấu dòng đầu tiên
                groupBgClass: bgClass, // Màu nền của nhóm
              });
            });
          } else {
            flatData.push({
              ...bill,
              ngay: bill.ngay_xuat,
              record_id: bill.id,
              rowspan: 1,
              isFirstOfGroup: true,
              groupBgClass: bgClass,
            });
          }
          groupIndex++; // Chuyển sang màu nhóm tiếp theo
        });
        tableData.value = flatData;
        totalItems.value = response.data.total;
      } else {
        // Logic bình thường cho VIP và THƯỜNG
        tableData.value = response.data.data;
        totalItems.value = response.data.total;
      }
    }
  } catch (error) {
    if (myRequestId === currentRequestId)
      toast.error('Không thể tải dữ liệu lịch sử. Vui lòng thử lại!');
  } finally {
    if (myRequestId === currentRequestId) isLoading.value = false;
  }
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchData();
  }
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
    second: '2-digit',
    hour12: false,
  }).format(date);
};

const downloadExcel = async (
  maBill,
  maKho,
  itemId,
  showSuccessToast = true
) => {
  try {
    let response;
    let fileName = '';

    if (currentMode.value === 'VIP') {
      if (actionType.value === 'EXPORT_OLD') {
        response = await inventoryService.exportExcelVipOld(
          maBill,
          maKho,
          itemId
        );
        fileName = `Phieu_Xuat_Tra_${maBill}_ID${itemId}.xlsx`;
      } else if (actionType.value === 'EXPORT_NEW') {
        response = await inventoryService.exportExcelVipNew(
          maBill,
          maKho,
          itemId
        );
        fileName = `Phieu_Xuat_Giao_Hang_${maBill}_ID${itemId}.xlsx`;
      }
    } else if (currentMode.value === 'THUONG') {
      response = await inventoryService.exportExcelRegular(maBill, maKho);
      fileName = `Phieu_Xuat_Kho_Thuong_${maBill}.xlsx`;
    } else if (currentMode.value === 'NOIBO') {
      response = await inventoryService.exportExcelNoiBo(maBill);
      fileName = `Phieu_Xuat_Noi_Bo_${maBill}.xlsx`;
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    if (showSuccessToast) toast.success('Đã xuất file Excel thành công!');
  } catch (error) {
    toast.error('Có lỗi xảy ra khi xuất file Excel! Hãy xem Console (F12).');
  }
};
</script>

<style src="../styles/InventoryHistoryStyle.css" scoped></style>
