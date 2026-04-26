<template>
  <DefaultLayout>
    <div class="dashboard-wrapper">
      <button class="btn-back" @click="$router.push('/')">
        <ArrowLeft class="icon-sm" /> Về Bảng Điều Khiển
      </button>
      <div class="page-header">
        <div class="title-group">
          <h2>Bảng Thống Kê Tồn Kho</h2>
        </div>
        <p class="text-muted">
          Theo dõi số lượng hàng hóa hiện đang lưu trữ tại kho theo thời gian
          thực.
        </p>
      </div>

      <div v-if="canSwitchMode" class="admin-view-selector mb-4">
        <span class="label">Báo cáo của:</span>
        <button
          v-if="hasVipAccess"
          :class="['btn-tab', { active: currentMode === 'VIP' }]"
          @click="currentMode = 'VIP'"
        >
          Khách VIP
        </button>
        <button
          v-if="hasRegularAccess"
          :class="['btn-tab', { active: currentMode === 'THUONG' }]"
          @click="currentMode = 'THUONG'"
        >
          Khách Thường
        </button>
      </div>

      <div
        v-if="!hasVipAccess && !hasRegularAccess && !hasRetailAccess"
        class="empty-state text-center card p-5"
      >
        <ShieldAlert
          class="empty-icon mb-3"
          style="width: 48px; height: 48px; color: #f59e0b"
        />
        <h3>Bạn không có quyền truy cập Báo cáo Tồn Kho</h3>
        <p class="text-muted">
          Vui lòng liên hệ Quản trị viên để được cấp quyền hoặc quay lại trang
          chủ.
        </p>
        <button class="btn btn-primary mt-3" @click="$router.push('/')">
          Về Trang Chủ
        </button>
      </div>

      <template v-else>
        <div v-if="currentMode === 'VIP'" class="summary-grid mb-4">
          <div class="summary-card">
            <div class="card-icon bg-green"><Box class="icon-md" /></div>
            <div class="card-info">
              <p class="card-label">Tồn Kho (HÀNG MỚI)</p>
              <h3 class="card-value text-success">
                {{ totalStockNew.toLocaleString() }} <small>Máy</small>
              </h3>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon bg-orange"><RefreshCw class="icon-md" /></div>
            <div class="card-info">
              <p class="card-label">Tồn Kho (KHÁCH TRẢ)</p>
              <h3 class="card-value text-warning">
                {{ totalStockOld.toLocaleString() }} <small>Máy</small>
              </h3>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon bg-blue">
              <ArrowDownToLine class="icon-md" />
            </div>
            <div class="card-info">
              <p class="card-label">Lịch sử Tổng Nhập</p>
              <h3 class="card-value">{{ totalImport.toLocaleString() }}</h3>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon bg-purple">
              <ArrowUpFromLine class="icon-md" />
            </div>
            <div class="card-info">
              <p class="card-label">Lịch sử Tổng Xuất</p>
              <h3 class="card-value">{{ totalExport.toLocaleString() }}</h3>
            </div>
          </div>
        </div>

        <div v-else class="summary-grid mb-4">
          <div class="summary-card">
            <div class="card-icon bg-blue"><Box class="icon-md" /></div>
            <div class="card-info">
              <p class="card-label">Tổng Mã Hàng Đang Tồn</p>
              <h3 class="card-value">
                {{ inventoryData.length }} <small>Lô/SKU</small>
              </h3>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon bg-green">
              <ArrowDownToLine class="icon-md" />
            </div>
            <div class="card-info">
              <p class="card-label">Tổng Lượng Đã Nhập</p>
              <h3 class="card-value">{{ totalImport.toLocaleString() }}</h3>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon bg-orange">
              <ArrowUpFromLine class="icon-md" />
            </div>
            <div class="card-info">
              <p class="card-label">Tổng Lượng Đã Xuất</p>
              <h3 class="card-value">{{ totalExport.toLocaleString() }}</h3>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon bg-purple"><Layers class="icon-md" /></div>
            <div class="card-info">
              <p class="card-label">TỔNG TỒN HIỆN TẠI</p>
              <h3 class="card-value text-primary" style="margin-bottom: 0">
                {{ totalStock.toLocaleString() }}
              </h3>
            </div>
          </div>
        </div>

        <div
          class="card p-4 mb-4"
          v-if="currentMode === 'THUONG' || currentMode === 'VIP'"
        >
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="m-0" style="font-size: 1.1rem; color: #1e293b">
              Biểu đồ Lưu chuyển Hàng hóa ({{ currentMode }})
            </h3>
            <select
              v-model="chartTimeRange"
              class="form-select form-select-sm"
              style="
                width: auto;
                padding: 6px 12px;
                border-radius: 6px;
                border: 1px solid #cbd5e1;
              "
            >
              <option value="7_days">7 Ngày qua</option>
              <option value="30_days">30 Ngày qua</option>
            </select>
          </div>

          <div style="min-height: 350px">
            <VueApexCharts
              v-if="chartSeries.length > 0"
              type="bar"
              height="350"
              :options="chartOptions"
              :series="chartSeries"
            />
            <div v-else class="text-center text-muted p-5">
              Đang tải biểu đồ...
            </div>
          </div>
        </div>

        <div class="card p-0">
          <div class="history-toolbar">
            <h3 class="m-0" style="font-size: 1.1rem">
              Chi Tiết Từng Sản Phẩm
            </h3>
            <button class="btn btn-secondary btn-sm" @click="fetchData">
              <RefreshCw class="icon-sm" :class="{ spin: isLoading }" /> Cập
              nhật
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th
                    v-if="currentMode === 'THUONG' || currentMode === 'LE'"
                    width="80"
                  >
                    ID Nhóm
                  </th>
                  <th v-if="currentMode === 'VIP'">Mã Máy (Model)</th>
                  <th v-if="currentMode === 'THUONG' || currentMode === 'LE'">
                    Mã Sản Phẩm
                  </th>
                  <th>
                    {{
                      currentMode === 'VIP' ? 'Phân Loại Hàng' : 'Tên Sản Phẩm'
                    }}
                  </th>
                  <th class="text-right">Tổng Nhập</th>
                  <th class="text-right">Tổng Xuất</th>
                  <th class="text-right">Tồn Kho</th>
                  <th width="200">Mức Độ Tồn</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in inventoryData" :key="idx">
                  <td v-if="currentMode === 'THUONG' || currentMode === 'LE'">
                    #{{ item.id }}
                  </td>

                  <td v-if="currentMode === 'VIP'">
                    <strong>{{ item.ma_may }}</strong>
                  </td>

                  <td v-if="currentMode === 'THUONG' || currentMode === 'LE'">
                    <strong>{{ item.ma_san_pham || '---' }}</strong>
                  </td>

                  <td>
                    <span
                      v-if="currentMode === 'VIP'"
                      :class="{
                        'text-primary fw-bold': item.loai === 'MỚI',
                        'text-warning fw-bold': item.loai === 'CŨ',
                      }"
                    >
                      {{ item.ten_san_pham }}
                    </span>
                    <span v-else>{{ item.ten_san_pham }}</span>
                  </td>

                  <td class="text-right text-success">
                    <div style="font-weight: bold">
                      +{{ item.tong_nhap.toLocaleString() }}
                    </div>
                  </td>

                  <td class="text-right text-danger">
                    <div style="font-weight: bold">
                      -{{ item.tong_xuat.toLocaleString() }}
                    </div>
                  </td>

                  <td class="text-right">
                    <span
                      class="badge"
                      style="
                        font-size: 1rem;
                        padding: 6px 12px;
                        background: #0f3d26;
                        color: white;
                      "
                    >
                      {{ item.ton_kho.toLocaleString() }}
                    </span>
                  </td>
                  <td>
                    <div
                      class="stock-bar-container"
                      :title="`Còn lại ${Math.round(
                        (item.ton_kho / item.tong_nhap) * 100
                      )}%`"
                    >
                      <div
                        class="stock-bar-fill"
                        :style="{
                          width: `${(item.ton_kho / item.tong_nhap) * 100}%`,
                          backgroundColor:
                            currentMode === 'VIP' && item.loai === 'CŨ'
                              ? '#f59e0b'
                              : '#10b981',
                        }"
                      ></div>
                    </div>
                  </td>
                </tr>
                <tr v-if="inventoryData.length === 0 && !isLoading">
                  <td colspan="7" class="text-center p-5 text-muted">
                    Kho hiện tại đang trống. Không có sản phẩm nào tồn kho.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import { inventoryService } from '../services/inventory';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import VueApexCharts from 'vue3-apexcharts';
import {
  BarChart3,
  Box,
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
  RefreshCw,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-vue-next';

const authStore = useAuthStore();
const toast = useToast();

const currentMode = ref('');
const inventoryData = ref([]);
const isLoading = ref(false);

const chartTimeRange = ref('7_days');
const chartSeries = ref([]);
const chartOptions = ref({
  chart: { type: 'bar', height: 350, toolbar: { show: false } },
  colors: ['#10b981', '#ef4444'],
  plotOptions: {
    bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 },
  },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 2, colors: ['transparent'] },
  xaxis: { categories: [] },
  yaxis: { title: { text: 'Số lượng (Sản phẩm/Thiết bị)' } },
  fill: { opacity: 1 },
  tooltip: {
    y: {
      formatter: function (val) {
        return val + ' sản phẩm/thiết bị';
      },
    },
  },
});

// Quyền hạn
const isAdmin = computed(() => authStore.hasPermission('FUNC_ADMIN_ALL'));

const hasVipAccess = computed(
  () =>
    isAdmin.value ||
    authStore.hasPermission('FUNC_VIP_NHAP_MOI') ||
    authStore.hasPermission('FUNC_VIP_XUAT_MOI') ||
    authStore.hasPermission('FUNC_VIP_NHAP_CU') ||
    authStore.hasPermission('FUNC_VIP_XUAT_CU')
);

const hasRegularAccess = computed(
  () =>
    isAdmin.value ||
    authStore.hasPermission('FUNC_THUONG_NHAP') ||
    authStore.hasPermission('FUNC_THUONG_XUAT')
);

const canSwitchMode = computed(() => {
  const accessibleTabs = [hasVipAccess.value, hasRegularAccess.value].filter(
    Boolean
  );
  return accessibleTabs.length > 1;
});

// ==============================================================
// KHÔI PHỤC TÍNH TỔNG CHO KHO THƯỜNG / LẺ
// ==============================================================
const totalImport = computed(() =>
  inventoryData.value.reduce((sum, item) => sum + item.tong_nhap, 0)
);
const totalExport = computed(() =>
  inventoryData.value.reduce((sum, item) => sum + item.tong_xuat, 0)
);
const totalStock = computed(() =>
  inventoryData.value.reduce((sum, item) => sum + item.ton_kho, 0)
);

// XÓA BỎ computed totalKienStock

// ==============================================================
// TÁCH BÓC CHỈ SỐ KINH DOANH CHO VIP (HÀNG MỚI VÀ HÀNG CŨ)
// ==============================================================
const totalStockNew = computed(() =>
  inventoryData.value
    .filter((i) => i.loai === 'MỚI')
    .reduce((sum, i) => sum + i.ton_kho, 0)
);
const totalStockOld = computed(() =>
  inventoryData.value
    .filter((i) => i.loai === 'CŨ')
    .reduce((sum, i) => sum + i.ton_kho, 0)
);

// ==========================================
// 2. KHAI BÁO CÁC HÀM XỬ LÝ (FUNCTIONS)
// ==========================================
const fetchChartData = async () => {
  if (!currentMode.value) return;

  try {
    let response;
    if (currentMode.value === 'THUONG')
      response = await inventoryService.getChartDataRegular(
        chartTimeRange.value
      );
    else if (currentMode.value === 'VIP')
      response = await inventoryService.getChartDataVip(chartTimeRange.value);

    if (response) {
      const data = response.data;

      if (currentMode.value === 'VIP') {
        chartOptions.value = {
          ...chartOptions.value,
          xaxis: { categories: data.labels },
          colors: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
        };
        chartSeries.value = [
          { name: 'Nhập Mới', data: data.datasets.nhap_moi },
          { name: 'Nhập Cũ (Khách trả)', data: data.datasets.nhap_cu },
          { name: 'Xuất Mới (Giao Khách)', data: data.datasets.xuat_moi },
          { name: 'Xuất Cũ (Trả NCC)', data: data.datasets.xuat_cu },
        ];
      } else {
        chartOptions.value = {
          ...chartOptions.value,
          xaxis: { categories: data.labels },
          colors: ['#10b981', '#ef4444'],
        };
        chartSeries.value = [
          { name: 'Tổng Nhập', data: data.datasets.nhap },
          { name: 'Tổng Xuất', data: data.datasets.xuat },
        ];
      }
    }
  } catch (error) {
    // console.error('Lỗi khi tải biểu đồ:', error);
    toast.error('Không thể tải dữ liệu biểu đồ từ máy chủ!');
  }
};

const fetchData = async () => {
  if (!currentMode.value) return;
  isLoading.value = true;
  inventoryData.value = [];

  try {
    let response;
    if (currentMode.value === 'THUONG')
      response = await inventoryService.getInventoryRegular();
    else if (currentMode.value === 'VIP')
      response = await inventoryService.getInventoryVip();

    if (response) inventoryData.value = response.data.data;
  } catch (error) {
    // console.error('Lỗi tải tồn kho:', error);
    toast.error('Không thể tải dữ liệu tồn kho!');
  } finally {
    isLoading.value = false;
  }
};

// ==========================================
// 3. THEO DÕI VÀ VÒNG ĐỜI (WATCHERS & LIFECYCLE)
// ==========================================
watch(chartTimeRange, () => {
  fetchChartData();
});

watch(currentMode, () => {
  fetchData();
  fetchChartData();
});

onMounted(() => {
  if (hasVipAccess.value) currentMode.value = 'VIP';
  else if (hasRegularAccess.value) currentMode.value = 'THUONG';

  if (currentMode.value) {
    fetchData();
    fetchChartData();
  }
});
</script>

<style src="../styles/InventoryDashboardStyle.css" scoped></style>
