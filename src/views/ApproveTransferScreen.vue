<template>
  <DefaultLayout>
    <div class="transaction-wrapper">
      <div class="page-header mb-4">
        <button class="btn-back" @click="$router.push('/')">
          <ArrowLeft class="icon-sm" /> Về Bảng Điều Khiển
        </button>
        <div class="modal-header w-100">
          <div class="d-flex align-items-center">
            <div class="header-icon-box bg-warning-light mr-3">
              <ClipboardCheck class="icon-md text-warning" />
            </div>
            <div>
              <h2 class="m-0" style="color: #0f172a; font-weight: 700">
                Duyệt Phiếu Luân Chuyển
              </h2>
              <p class="text-muted m-0 mt-1">
                Quản lý và xét duyệt các lô hàng đang di chuyển đến kho của bạn.
              </p>
            </div>
          </div>
          <button
            @click="fetchPendingRequests"
            class="btn btn-primary shadow-sm"
            style="
              display: flex;
              gap: 8px;
              align-items: center;
              font-weight: 600;
            "
          >
            <RefreshCcw class="icon-sm" :class="{ spin: isLoading }" /> Làm Mới
          </button>
        </div>
      </div>

      <div
        class="card p-0 shadow-sm"
        style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden"
      >
        <div v-if="isLoading" class="text-center p-5 text-muted">
          <RefreshCcw
            class="icon-md spin mb-3 text-primary"
            style="width: 40px; height: 40px"
          />
          <h5 style="font-weight: 600">Đang đồng bộ dữ liệu...</h5>
        </div>

        <div v-else-if="pendingRequests.length === 0" class="text-center p-5">
          <div
            style="
              background: #ecfdf5;
              width: 80px;
              height: 80px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
            "
          >
            <CheckCircle style="width: 40px; height: 40px; color: #10b981" />
          </div>
          <h4 style="text-align: center; color: #0f172a; font-weight: 700">
            Không có phiếu chờ duyệt!
          </h4>
          <p style="text-align: center" class="text-muted">
            Hiện tại không có chuyến hàng nào đang hướng về kho của bạn.
          </p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover table-modern m-0">
            <thead
              style="
                background-color: #f8fafc;
                border-bottom: 2px solid #e2e8f0;
              "
            >
              <tr>
                <th width="120">Mã Bảng Kê</th>
                <th width="150" class="text-center">Trạng Thái</th>
                <th width="220">Lộ Trình Luân Chuyển</th>
                <th>Thông Tin Vận Chuyển</th>
                <th>Người Lập</th>
                <th width="130">Ngày Lập</th>
                <th width="120" class="text-center">Số Lượng</th>
                <th width="160" class="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="req in pendingRequests" :key="req.id">
                <td>
                  <span
                    class="fw-bold"
                    style="color: #0284c7; font-size: 0.95rem"
                    >{{ req.ma_bill }}</span
                  >
                </td>

                <td class="text-center">
                  <span
                    v-if="req.trang_thai === 'PENDING_SOURCE'"
                    class="badge"
                    style="
                      background: #fef3c7;
                      color: #d97706;
                      border: 1px solid #fde68a;
                    "
                  >
                    Chờ Duyệt Xuất
                  </span>
                  <span
                    v-else-if="req.trang_thai === 'PENDING_DESTINATION'"
                    class="badge"
                    style="
                      background: #e0f2fe;
                      color: #0284c7;
                      border: 1px solid #bae6fd;
                    "
                  >
                    Chờ Duyệt Nhận
                  </span>
                </td>

                <td>
                  <div class="route-container">
                    <span class="route-badge out">{{ req.kho_xuat }}</span>
                    <ArrowRight class="icon-xs text-muted mx-2" />
                    <span class="route-badge in">{{ req.kho_nhan }}</span>
                  </div>
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    <div>
                      <div
                        style="
                          font-size: 0.9rem;
                          font-weight: 600;
                          color: #1e293b;
                        "
                      >
                        {{ req.tai_xe || 'N/A' }}
                      </div>
                      <div
                        class="text-muted"
                        style="font-size: 0.8rem; font-weight: 500"
                      >
                        Biển số: {{ req.bien_so_xe || 'N/A' }}
                      </div>
                    </div>
                  </div>
                </td>
                <td style="color: #475569; font-weight: 500">
                  {{ req.nv_nhap_lieu }}
                </td>
                <td style="color: #475569; font-size: 0.9rem">
                  {{ formatDate(req.ngay_tao) }}
                </td>
                <td class="text-center">
                  <span
                    class="badge"
                    style="
                      background: #f1f5f9;
                      color: #475569;
                      font-size: 0.85rem;
                      padding: 6px 12px;
                    "
                  >
                    {{ req.so_mon_hang }} món
                  </span>
                </td>
                <td class="text-center">
                  <button
                    v-if="req.trang_thai === 'PENDING_SOURCE'"
                    @click="openApproveModal(req)"
                    class="btn btn-sm px-3 shadow-sm"
                    style="
                      font-weight: 600;
                      border-radius: 6px;
                      background-color: #f59e0b;
                      color: white;
                      border: none;
                    "
                  >
                    Duyệt Xuất Hàng <ArrowRight class="icon-xs ml-1" />
                  </button>
                  <button
                    v-else
                    @click="openApproveModal(req)"
                    class="btn btn-primary btn-sm px-3 shadow-sm"
                    style="font-weight: 600; border-radius: 6px"
                  >
                    Kiểm Tra & Nhận <Check class="icon-xs ml-1" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="showModal"
        class="modal-overlay"
        @click.self="showModal = false"
      >
        <div
          class="modal-content shadow-lg"
          style="
            max-width: 1000px;
            width: 95%;
            border-radius: 16px;
            overflow: hidden;
          "
        >
          <div class="modal-header">
            <h3
              class="m-0"
              style="font-size: 1.25rem; font-weight: 700; color: #0f172a"
            >
              {{
                selectedRequest?.trang_thai === 'PENDING_SOURCE'
                  ? 'Xét Duyệt Xuất Kho:'
                  : 'Xác Nhận Nhập Kho:'
              }}
              <span
                :class="
                  selectedRequest?.trang_thai === 'PENDING_SOURCE'
                    ? 'text-warning'
                    : 'text-primary'
                "
              >
                {{ selectedRequest?.ma_bill }}
              </span>
            </h3>
            <button class="btn-close-custom" @click="showModal = false">
              <X class="icon-sm" />
            </button>
          </div>

          <div
            class="modal-body p-4"
            style="
              max-height: 70vh;
              overflow-y: auto;
              background-color: #f8fafc;
            "
          >
            <div class="summary-card mb-4 bg-white shadow-sm border-0">
              <div class="summary-item">
                <div class="summary-label">
                  <MapPin class="icon-xs" /> Nơi Phát Hành
                </div>
                <div class="summary-value text-danger">
                  {{ selectedRequest?.kho_xuat }}
                </div>
              </div>
              <div class="summary-divider">
                <ArrowRight class="icon-sm text-muted" />
              </div>
              <div class="summary-item">
                <div class="summary-label">
                  <MapPin class="icon-xs" /> Đích Đến
                </div>
                <div class="summary-value text-success">
                  {{ selectedRequest?.kho_nhan }}
                </div>
              </div>
              <div
                class="summary-divider"
                style="width: 1px; height: 40px; background: #e2e8f0"
              ></div>
              <div class="summary-item">
                <div class="summary-label">
                  <Truck class="icon-xs" /> Vận Chuyển
                </div>
                <div
                  class="summary-value"
                  style="color: #334155; font-size: 0.9rem"
                >
                  {{ selectedRequest?.tai_xe }} <br />
                  <span class="text-muted">{{
                    selectedRequest?.bien_so_xe
                  }}</span>
                </div>
              </div>
            </div>

            <div
              class="items-list-container bg-white p-3 rounded-3 shadow-sm mb-4"
            >
              <div
                class="table-responsive custom-scrollbar"
                style="border: 1px solid #e2e8f0; border-radius: 8px"
              >
                <table class="table data-grid-table m-0">
                  <thead>
                    <tr>
                      <th width="50" class="text-center">#</th>
                      <th width="90" class="text-center">Loại</th>
                      <th width="30%">Tên Sản Phẩm</th>
                      <th width="20%">Mã Máy</th>
                      <th width="20%">Mã Sản Phẩm</th>
                      <th width="20%">Số Serial</th>
                      <th width="20%">Mã Bill</th>
                      <th width="100" class="text-center">Số Lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, idx) in selectedRequest?.items"
                      :key="item.id"
                      class="grid-row"
                    >
                      <td class="text-center text-muted fw-bold align-middle">
                        {{ idx + 1 }}
                      </td>

                      <td class="text-center align-middle">
                        <div
                          class="status-pill"
                          :class="
                            item.loai_khach === 'VIP'
                              ? 'pill-vip'
                              : 'pill-thuong'
                          "
                        >
                          {{ item.loai_khach }}
                        </div>
                      </td>

                      <td class="align-middle">
                        <div class="product-name" :title="item.ten_san_pham">
                          {{ item.ten_san_pham }}
                        </div>
                        <div v-if="item.ghi_chu" class="product-note mt-1">
                          {{ item.ghi_chu }}
                        </div>
                      </td>

                      <td class="align-middle">
                        <div class="code-block" v-if="item.ma_may">
                          <span v-if="item.ma_may" class="d-block mb-1">
                            <span class="code-val text-dark">{{
                              item.ma_may
                            }}</span>
                          </span>
                        </div>
                        <span
                          v-else
                          class="text-muted fst-italic"
                          style="font-size: 0.8rem"
                          >---</span
                        >
                      </td>

                      <td class="align-middle">
                        <div class="code-block" v-if="item.ma_sp_hoac_id">
                          <span v-if="item.ma_sp_hoac_id" class="d-block">
                            <span class="code-val text-muted">{{
                              item.ma_sp_hoac_id
                            }}</span>
                          </span>
                        </div>
                        <span
                          v-else
                          class="text-muted fst-italic"
                          style="font-size: 0.8rem"
                          >---</span
                        >
                      </td>

                      <td class="align-middle">
                        <div v-if="item.serial" class="serial-box">
                          {{ item.serial }}
                        </div>
                        <span
                          v-else
                          class="text-muted fst-italic"
                          style="font-size: 0.8rem"
                          >---</span
                        >
                      </td>
                      <td class="align-middle">
                        <div v-if="item.ma_bill_item" class="serial-box">
                          {{ item.ma_bill_item }}
                        </div>
                        <span
                          v-else
                          class="text-muted fst-italic"
                          style="font-size: 0.8rem"
                          >---</span
                        >
                      </td>

                      <td class="text-center align-middle">
                        <div class="qty-highlight">{{ item.so_luong }}</div>
                        <div
                          v-if="item.so_kien"
                          class="text-muted"
                          style="font-size: 0.75rem"
                        >
                          ({{ item.so_kien }} kiện)
                        </div>
                      </td>
                    </tr>

                    <tr
                      v-if="
                        !selectedRequest?.items ||
                        selectedRequest?.items.length === 0
                      "
                    >
                      <td colspan="6" class="text-center text-muted p-4">
                        <Package class="mb-2" style="opacity: 0.5" />
                        <div>Không có dữ liệu hàng hóa.</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div
              class="form-group m-0 p-3 bg-white shadow-sm"
              style="border-radius: 10px; border: 1px solid #e2e8f0"
            >
              <label
                style="
                  font-weight: 700;
                  color: #334155;
                  margin-bottom: 8px;
                  margin-top: 8px;
                  display: block;
                "
              >
                Ghi chú
                <span
                  v-if="isRejectingMode"
                  class="text-danger ml-1"
                  style="font-style: italic"
                  >* (Bắt buộc nhập lý do từ chối)</span
                >
              </label>
              <textarea
                v-model="approveNote"
                rows="3"
                class="form-control custom-textarea"
                :placeholder="
                  isRejectingMode
                    ? 'Ví dụ: Hàng thiếu 1 kiện, Serial không khớp với phiếu...'
                    : 'Ghi chú xác nhận tình trạng hàng hóa (Không bắt buộc)...'
                "
                :class="{ 'is-invalid-note': isRejectingMode }"
              ></textarea>
            </div>
          </div>

          <div
            class="modal-actions"
            style="
              padding: 20px 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #ffffff;
              border-top: 1px solid #e2e8f0;
            "
          >
            <button
              @click="showModal = false"
              class="btn btn-light shadow-sm"
              style="font-weight: 600; padding: 10px 20px"
            >
              Hủy Bỏ
            </button>
            <div style="display: flex; gap: 12px">
              <button
                @click="handleReject"
                class="btn action-btn-danger"
                :class="{ 'pulse-red': isRejectingMode }"
                :disabled="isProcessing"
              >
                <X class="icon-sm mr-2" v-if="!isProcessing" />
                {{
                  isProcessing && isRejectingMode
                    ? 'Đang xử lý...'
                    : isRejectingMode
                    ? 'Xác Nhận Trả Về'
                    : 'Từ Chối Nhận'
                }}
              </button>

              <button
                v-if="!isRejectingMode"
                @click="submitAction('APPROVE')"
                class="btn action-btn-success"
                :disabled="isProcessing"
              >
                <CheckCircle class="icon-sm mr-2" v-if="!isProcessing" />
                {{
                  isProcessing
                    ? 'Đang cập nhật kho...'
                    : selectedRequest?.trang_thai === 'PENDING_SOURCE'
                    ? 'Chấp Nhận & Xuất Đi'
                    : 'Khớp Hàng & Nhập Kho'
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '../composables/useToast';
import { inventoryService } from '../services/inventory';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import {
  ClipboardCheck,
  RefreshCcw,
  CheckCircle,
  Check,
  X,
  Package,
  ArrowRight,
  Truck,
  MapPin,
  ArrowLeft,
} from 'lucide-vue-next';

const toast = useToast();
const pendingRequests = ref([]);
const isLoading = ref(false);
const isRejectingMode = ref(false);
const isProcessing = ref(false);
const showModal = ref(false);
const selectedRequest = ref(null);
const approveNote = ref('');

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${d.getFullYear()} ${d
    .getHours()
    .toString()
    .padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const fetchPendingRequests = async () => {
  isLoading.value = true;
  try {
    const res = await inventoryService.getPendingNoiBo();
    pendingRequests.value = res.data.data;
    // console.log('Danh sách chờ duyệt:', pendingRequests.value);
  } catch (error) {
    toast.error('Lỗi khi lấy danh sách chờ duyệt!');
  } finally {
    isLoading.value = false;
  }
};

const openApproveModal = (req) => {
  selectedRequest.value = req;
  approveNote.value = '';
  isRejectingMode.value = false;
  showModal.value = true;
};

const handleReject = () => {
  if (!isRejectingMode.value) {
    isRejectingMode.value = true;
    toast.info('Vui lòng nhập lý do từ chối vào ô Ghi chú.');
  } else {
    if (!approveNote.value.trim()) {
      toast.error('Lỗi: Bạn phải nhập lý do để báo về cho Kho Xuất!');
      return;
    }
    submitAction('REJECT');
  }
};

const submitAction = async (actionType) => {
  if (!selectedRequest.value) return;
  isProcessing.value = true;
  try {
    await inventoryService.actionNoiBo(selectedRequest.value.id, {
      action_type: actionType,
      ghi_chu_duyet: approveNote.value,
    });
    if (actionType === 'APPROVE')
      toast.success(`Đã CHẤP NHẬN phiếu ${selectedRequest.value.ma_bill}!`);
    else toast.info(`Đã TỪ CHỐI phiếu ${selectedRequest.value.ma_bill}.`);

    showModal.value = false;
    await fetchPendingRequests();
  } catch (error) {
    // console.error(error);
    toast.info(error.response?.data?.detail || 'Lỗi hệ thống khi xử lý phiếu!');
  } finally {
    isProcessing.value = false;
    isRejectingMode.value = false;
  }
};

onMounted(() => {
  fetchPendingRequests();
});
</script>

<style scoped>
/* =========================================================
   UI TỔNG QUAN - CHUYÊN NGHIỆP, CAO CẤP
========================================================= */
.transaction-wrapper {
  max-width: 1280px;
  margin: 0 auto;
}

.header-icon-box {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}
.bg-warning-light {
  background: linear-gradient(135deg, #fffbeb, #fde68a);
  box-shadow: 0 4px 10px rgba(253, 230, 138, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.align-middle {
  text-align: center;
}

/* Bảng Main Danh Sách */
.table-modern {
  width: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  background: white;
}
.table-modern th {
  background-color: #f8fafc;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  padding: 16px 20px;
  border-bottom: 2px solid var(--border-color);
}
.table-modern td {
  padding: 18px 20px;
  vertical-align: middle;
  border-bottom: 1px solid #f1f5f9;
  transition: background var(--transition-fast);
}
.table-modern tr:hover td {
  background: #f8fafc;
}

.route-container {
  display: flex;
  align-items: center;
}
.route-badge {
  font-weight: 700;
  font-size: 0.85rem;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  box-shadow: var(--shadow-sm);
}
.route-badge.out {
  background: linear-gradient(135deg, #fff1f2, #ffe4e6);
  color: #e11d48;
  border-color: #fecdd3;
}
.route-badge.in {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  color: #059669;
  border-color: #a7f3d0;
}

/* =========================================================
   MODAL CHI TIẾT ĐÃ ĐƯỢC THIẾT KẾ LẠI CAO CẤP
========================================================= */
.btn-close-custom {
  background: transparent;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-normal);
}
.btn-close-custom:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  transform: rotate(90deg);
}

/* Tóm tắt Info */
.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  border-radius: var(--radius-lg);
  background: #ffffff;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}
.summary-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.summary-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 700;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.summary-value {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-main);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
}

/* =========================================================
   BẢNG DATA GRID (BẢNG KÊ HÀNG HÓA MỚI)
========================================================= */
.data-grid-table {
  width: 100%;
}
.data-grid-table th {
  background-color: #f1f5f9;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 14px 12px;
  border-bottom: 2px solid var(--border-color);
}

.data-grid-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: var(--text-main);
}

.grid-row:hover td {
  background-color: #f8fafc;
}

/* Các định dạng thành phần trong bảng */
.status-pill {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}
.pill-vip {
  background: linear-gradient(135deg, #fdf2f8, #fce7f3);
  color: #db2777;
  border: 1px solid #fbcfe8;
}
.pill-thuong {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.product-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.product-note {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 4px;
}

.code-block {
  font-size: 0.9rem;
}
.code-label {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.85rem;
}
.code-val {
  font-weight: 700;
  color: var(--text-main);
}

.serial-box {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 700;
  font-size: 0.95rem;
  color: #0369a1;
  background-color: #f0f9ff;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border: 1px dashed #bae6fd;
  display: inline-block;
  word-break: break-all;
}

.qty-highlight {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--success);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
}

/* =========================================================
   GHI CHÚ & BUTTONS
========================================================= */
.custom-textarea {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  transition: all var(--transition-fast);
  color: var(--text-main);
  background: #fafafa;
  font-family: inherit;
  font-size: 0.95rem;
}
.custom-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(15, 61, 38, 0.15);
  background: #ffffff;
  outline: none;
}
.is-invalid-note {
  border-color: var(--danger) !important;
  background-color: #fef2f2;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15) !important;
}

.action-btn-danger {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  font-weight: 700;
  padding: 12px 28px;
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
  font-size: 1rem;
}
.action-btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(239, 68, 68, 0.3);
}

.action-btn-success {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, var(--success), #059669);
  color: white;
  border: none;
  font-weight: 700;
  padding: 12px 28px;
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
  font-size: 1rem;
}
.action-btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(16, 185, 129, 0.3);
}

.pulse-red {
  animation: pulse-red-anim 2s infinite;
}
@keyframes pulse-red-anim {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

/* Thanh cuộn cho bảng chi tiết */
.custom-scrollbar::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  margin-bottom: 12px;
}
.btn-back:hover {
  background: #ffffff;
  color: var(--primary);
  border-color: #cbd5e1;
  box-shadow: var(--shadow-sm);
  transform: translateX(-2px);
}
</style>
