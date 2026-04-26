<template>
  <DefaultLayout>
    <div class="transaction-wrapper">
      <button class="btn-back" @click="$router.push('/')">
        <ArrowLeft class="icon-sm" /> Về Bảng Điều Khiển
      </button>
      <div class="page-header">
        <div
          class="title-group"
          style="
            display: flex;
            justify-content: space-between;
            width: 100%;
            align-items: center;
          "
        >
          <h2>Lập Phiếu Yêu Cầu Giao / Nhận Hàng</h2>

          <div
            v-if="
              [
                'VIP_IMPORT_NEW',
                'VIP_IMPORT_OLD',
                'THUONG_IMPORT',
                'LE_IMPORT',
              ].includes(currentAction)
            "
            style="display: flex; gap: 10px; align-items: center"
          >
            <button
              @click="downloadImportTemplate"
              class="btn btn-outline-primary"
              style="
                display: flex;
                gap: 5px;
                align-items: center;
                border: 1px solid #3b82f6;
                background: #eff6ff;
                color: #3b82f6;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
              "
            >
              <Download class="icon-sm" /> Tải File Mẫu
            </button>

            <button
              @click="triggerFileUpload"
              class="btn btn-outline-success"
              style="
                display: flex;
                gap: 5px;
                align-items: center;
                border: 1px solid #16a34a;
                background: #f0fdf4;
                color: #16a34a;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
              "
              :disabled="isSubmitting"
            >
              <Archive class="icon-sm" />
              {{ isSubmitting ? 'Đang Xử Lý...' : 'Nhập Excel Hàng Loạt' }}
            </button>
            <input
              type="file"
              ref="fileInputRef"
              @change="handleDirectExcelUpload"
              accept=".xlsx, .xls"
              multiple
              style="display: none"
            />
          </div>
        </div>

        <p class="text-muted">
          Hệ thống tự động hiển thị biểu mẫu phù hợp với đặc quyền tài khoản của
          bạn.
        </p>
      </div>

      <div v-if="showTabSelector" class="admin-view-selector mb-4">
        <span class="label">Chế độ hiển thị:</span>
        <button
          v-if="canViewVip"
          :class="['btn-tab', { active: customerMode === 'VIP' }]"
          @click="setCustomerMode('VIP')"
        >
          Khách VIP
        </button>
        <button
          v-if="canViewThuong"
          :class="['btn-tab', { active: customerMode === 'THUONG' }]"
          @click="setCustomerMode('THUONG')"
        >
          Khách Thường
        </button>
      </div>

      <div class="split-layout">
        <div class="left-panel">
          <h3 class="panel-title">Chọn Nghiệp Vụ</h3>
          <div class="action-list">
            <template v-for="action in availableActions" :key="action.id">
              <div
                class="action-card"
                :class="{ active: currentAction === action.id }"
                @click="currentAction = action.id"
              >
                <div class="icon-box"><component :is="action.icon" /></div>
                <div class="card-text">
                  <h4>{{ action.title }}</h4>
                  <p>{{ action.desc }}</p>
                </div>
              </div>
            </template>

            <div
              v-if="availableActions.length === 0"
              class="text-muted text-center p-4"
            >
              Bạn không có quyền thực hiện nghiệp vụ nào trong nhóm này.
            </div>
          </div>
        </div>

        <div class="right-panel card">
          <h3 class="panel-title text-primary">
            {{ currentActionObj?.title || 'Vui lòng chọn nghiệp vụ' }}
          </h3>
          <hr class="divider" />

          <form v-if="currentActionObj" @submit.prevent="handleSubmit">
            <div class="form-grid">
              <div
                class="form-group full-width"
                v-if="customerMode === 'THUONG'"
                style="position: relative"
              >
                <label>Khách Hàng <span class="text-danger">*</span></label>

                <input
                  type="text"
                  :value="searchCustomerQuery"
                  @input="handleCustomerInput"
                  @focus="showCustomerDropdown = true"
                  @blur="closeCustomerDropdown"
                  placeholder="Gõ mã hoặc tên khách hàng để tìm kiếm..."
                  autocomplete="off"
                  class="form-control"
                  style="font-weight: bold; border-color: #10b981"
                />

                <ul
                  v-if="showCustomerDropdown"
                  class="custom-dropdown-list shadow-sm"
                  style="max-height: 250px; overflow-y: auto"
                >
                  <li
                    v-for="c in filteredCustomers"
                    :key="c.id"
                    @mousedown.prevent="selectCustomer(c)"
                  >
                    <span class="fw-bold text-primary"
                      >[{{ c.ma_khach_hang }}]</span
                    >
                    - {{ c.ten_khach_hang }}
                  </li>
                  <li
                    v-if="filteredCustomers.length === 0"
                    class="text-muted p-2"
                    style="cursor: default; text-align: center"
                  >
                    Không tìm thấy khách hàng nào khớp với từ khóa
                  </li>
                </ul>
              </div>

              <div
                v-if="
                  (currentAction.includes('EXPORT') ||
                    currentAction.includes('NOIBO')) &&
                  (customerMode === 'VIP' ||
                    (customerMode === 'THUONG' && form.customer_id))
                "
                class="inventory-suggestion-panel full-width"
              >
                <div class="panel-header">
                  <div class="header-title">
                    <PackageSearch class="icon-sm text-primary" />
                    <span>Danh sách hàng hóa khả dụng</span>
                  </div>
                  <span class="badge-count" v-if="customerInventory.length > 0">
                    {{ filteredCustomerInventory.length }} kết quả
                  </span>
                </div>

                <div
                  class="search-box-wrapper"
                  v-if="customerInventory.length > 0"
                >
                  <input
                    type="text"
                    :value="searchInventoryQuery"
                    @input="searchInventoryQuery = $event.target.value"
                    class="search-input-modern"
                    placeholder="🔍 Nhập tên, mã SP hoặc Serial để tìm nhanh..."
                  />
                </div>

                <div v-if="isLoadingInventory" class="state-message loading">
                  <RefreshCcw class="icon-sm spin" /> Đang tải dữ liệu kho...
                </div>

                <div
                  v-else-if="customerInventory.length === 0"
                  class="state-message warning"
                >
                  <Info class="icon-sm" /> Hiện không có thiết bị/hàng hóa nào
                  trong kho thuộc quyền quản lý của bạn.
                </div>

                <div
                  v-else-if="filteredCustomerInventory.length === 0"
                  class="state-message error"
                >
                  <SearchX class="icon-sm" /> Không tìm thấy kết quả nào khớp
                  với từ khóa "<b>{{ searchInventoryQuery }}</b
                  >".
                </div>

                <div v-else class="inventory-list-modern">
                  <div
                    v-for="(item, idx) in filteredCustomerInventory"
                    :key="idx"
                    class="inventory-card"
                    @click="autoFillItem(item)"
                  >
                    <div class="card-main-info">
                      <h4 class="product-name">{{ item.ten_san_pham }}</h4>
                      <div class="tags-group">
                        <span class="tag tag-id">ID: {{ item.id }}</span>
                        <span
                          v-if="item.ma_san_pham && item.ma_san_pham !== 'N/A'"
                          class="tag tag-code"
                        >
                          Mã: {{ item.ma_san_pham }}
                        </span>
                        <span v-if="item.serial" class="tag tag-serial">
                          SN: {{ item.serial }}
                        </span>
                      </div>
                      <div
                        class="update-time"
                        style="display: flex; flex-direction: column; gap: 4px"
                      >
                        <span
                          >Cập nhật:
                          {{ formatDate(item.ngay_nhap_gan_nhat) }}</span
                        >
                        <span
                          >Người nhập:
                          <strong style="color: #0f3d26">{{
                            item.nv_nhap_lieu || 'N/A'
                          }}</strong></span
                        >
                      </div>
                    </div>

                    <div
                      class="card-side-info"
                      style="display: flex; flex-direction: column"
                    >
                      <div class="stock-info">
                        <span class="stock-label">Tồn kho</span>
                        <span class="stock-number">{{
                          item.ton_kho.toLocaleString()
                        }}</span>
                      </div>

                      <div class="location-info">
                        <MapPin class="icon-xs" /> Kho:
                        {{ item.ma_kho_spl || 'N/A' }}
                      </div>
                    </div>

                    <div class="card-action">
                      <button type="button" class="btn-select-item">
                        Chọn <ArrowRight class="icon-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-group" v-if="!currentAction.includes('NOIBO')">
                <label>Mã Lô / Thiết Bị (ID)</label>
                <input
                  v-if="
                    [
                      'VIP_IMPORT_NEW',
                      'VIP_IMPORT_OLD',
                      'THUONG_IMPORT',
                    ].includes(currentAction)
                  "
                  type="text"
                  value="Hệ thống tự động khởi tạo"
                  disabled
                  class="form-control text-muted"
                  style="
                    background-color: #f8f9fa;
                    cursor: not-allowed;
                    font-weight: bold;
                  "
                />
                <input
                  v-else
                  type="text"
                  v-model="form.id"
                  required
                  disabled
                  class="form-control text-primary"
                  placeholder="Tự động điền khi chọn hàng..."
                  style="
                    background-color: #f8f9fa;
                    cursor: not-allowed;
                    font-weight: bold;
                  "
                />
              </div>

              <div class="form-group">
                <label>
                  {{
                    currentAction.includes('NOIBO')
                      ? 'Kho Phát Hành (Xuất)'
                      : 'Vị Trí Kho (SPL)'
                  }}
                </label>
                <input
                  type="text"
                  v-model="form.ma_kho_spl"
                  disabled
                  class="form-control"
                  placeholder="Hệ thống tự động tải..."
                  style="
                    background-color: #f8f9fa;
                    cursor: not-allowed;
                    font-weight: bold;
                  "
                />
              </div>

              <div
                class="form-group"
                v-if="!isExportAction && !currentAction.includes('NOIBO')"
              >
                <label>Ngày Nhập</label>
                <input
                  type="text"
                  value="Hệ thống tự động khởi tạo"
                  disabled
                  class="form-control text-muted"
                  style="
                    background-color: #f8f9fa;
                    cursor: not-allowed;
                    font-weight: bold;
                  "
                />
              </div>

              <template
                v-if="isExportAction && !currentAction.includes('NOIBO')"
              >
                <div class="form-group">
                  <label>Ngày Nhập Kho</label>
                  <input
                    type="text"
                    v-model="form.ngay_nhap_kho_hien_thi"
                    disabled
                    class="form-control text-primary"
                    placeholder="Tự động điền khi chọn hàng..."
                    style="
                      background-color: #f8f9fa;
                      cursor: not-allowed;
                      font-weight: bold;
                    "
                  />
                </div>
                <div class="form-group">
                  <label>Ngày Xuất Kho</label>
                  <input
                    type="text"
                    value="Hệ thống tự động khởi tạo"
                    disabled
                    class="form-control text-muted"
                    style="
                      background-color: #f8f9fa;
                      cursor: not-allowed;
                      font-weight: bold;
                    "
                  />
                </div>
              </template>

              <div class="form-group">
                <label>Nhân viên thao tác</label>
                <input
                  type="text"
                  :value="authStore.user?.username || authStore.user?.full_name"
                  disabled
                  class="form-control"
                  style="
                    background-color: #f8f9fa;
                    cursor: not-allowed;
                    font-weight: bold;
                  "
                />
              </div>

              <div
                class="form-group"
                style="position: relative"
                v-if="
                  customerMode === 'VIP' && !currentAction.includes('NOIBO')
                "
              >
                <label>
                  Mã Sản Phẩm
                  <span
                    v-if="
                      ['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(
                        currentAction
                      )
                    "
                    class="text-danger"
                    >*</span
                  >
                </label>

                <input
                  type="text"
                  :value="form.ma_san_pham"
                  @focus="
                    currentAction === 'VIP_IMPORT_NEW'
                      ? (showProductDropdown = true)
                      : null
                  "
                  @blur="closeProductDropdown"
                  @input="
                    form.ma_san_pham = $event.target.value;
                    currentAction === 'VIP_IMPORT_NEW'
                      ? (showProductDropdown = true)
                      : null;
                  "
                  :placeholder="
                    currentAction === 'VIP_IMPORT_NEW'
                      ? 'Gõ tìm mã SP, Tên SP hoặc Mã Máy...'
                      : currentAction === 'VIP_IMPORT_OLD'
                      ? 'Tự động điền từ Mã Máy hoặc nhập tay...'
                      : 'Tự động điền khi chọn hàng...'
                  "
                  autocomplete="off"
                  class="form-control"
                  :disabled="isExportAction"
                  :style="
                    isExportAction
                      ? 'background-color: #f8f9fa; cursor: not-allowed; font-weight: bold;'
                      : 'font-weight: bold'
                  "
                />

                <ul
                  v-if="
                    showProductDropdown && currentAction === 'VIP_IMPORT_NEW'
                  "
                  class="custom-dropdown-list shadow-sm"
                >
                  <li
                    v-for="p in filteredCatalogProducts"
                    :key="p.id"
                    @mousedown.prevent="selectProduct(p)"
                  >
                    <span class="fw-bold" style="color: #0f3d26">{{
                      p.ma_san_pham
                    }}</span>
                    <span
                      class="text-muted"
                      style="font-size: 13px; margin-left: 8px"
                    >
                      - {{ p.ten_san_pham }} (Máy: {{ p.ma_may || 'N/A' }})
                    </span>
                  </li>
                  <li
                    v-if="filteredCatalogProducts.length === 0"
                    class="text-muted p-2"
                    style="text-align: center"
                  >
                    Không tìm thấy.
                  </li>
                </ul>
              </div>

              <div
                class="form-group"
                v-if="
                  customerMode === 'THUONG' && !currentAction.includes('NOIBO')
                "
              >
                <label>Mã Sản Phẩm</label>
                <input
                  type="text"
                  v-model="form.ma_san_pham"
                  placeholder="Không bắt buộc (Để trống nếu không có)"
                />
              </div>

              <div
                class="form-group"
                style="position: relative"
                v-if="
                  customerMode === 'VIP' && !currentAction.includes('NOIBO')
                "
              >
                <label>
                  Mã Máy (Model)
                  <span
                    v-if="
                      ['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(
                        currentAction
                      )
                    "
                    class="text-danger"
                    >*</span
                  >
                </label>

                <input
                  type="text"
                  :value="form.ma_may"
                  @focus="
                    currentAction === 'VIP_IMPORT_OLD'
                      ? (showProductDropdown = true)
                      : null
                  "
                  @blur="closeProductDropdown"
                  @input="
                    form.ma_may = $event.target.value;
                    currentAction === 'VIP_IMPORT_OLD'
                      ? (showProductDropdown = true)
                      : null;
                  "
                  :disabled="
                    !['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(
                      currentAction
                    )
                  "
                  :placeholder="
                    currentAction === 'VIP_IMPORT_OLD'
                      ? 'Gõ tìm Mã Máy...'
                      : ['VIP_IMPORT_NEW'].includes(currentAction)
                      ? 'Nhập mã máy hoặc điền tự động từ Mã SP'
                      : 'Tự động điền khi chọn hàng...'
                  "
                  :style="
                    !['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(
                      currentAction
                    )
                      ? 'background-color: #f8f9fa; cursor: not-allowed; font-weight: bold;'
                      : 'font-weight: bold;'
                  "
                />

                <ul
                  v-if="
                    showProductDropdown && currentAction === 'VIP_IMPORT_OLD'
                  "
                  class="custom-dropdown-list shadow-sm"
                >
                  <li
                    v-for="p in filteredCatalogProducts"
                    :key="p.id"
                    @mousedown.prevent="selectProduct(p)"
                  >
                    <span class="fw-bold" style="color: #0f3d26">{{
                      p.ma_may || 'Chưa có mã máy'
                    }}</span>
                    <span
                      class="text-muted"
                      style="font-size: 13px; margin-left: 8px"
                    >
                      - {{ p.ten_san_pham }} (Mã SP:
                      {{ p.ma_san_pham || 'N/A' }})
                    </span>
                  </li>
                  <li
                    v-if="filteredCatalogProducts.length === 0"
                    class="text-muted p-2"
                    style="text-align: center"
                  >
                    Không tìm thấy. Bạn có thể tự gõ tay Mã Máy.
                  </li>
                </ul>
              </div>

              <div
                class="form-group"
                v-if="
                  customerMode === 'VIP' && !currentAction.includes('NOIBO')
                "
              >
                <label>
                  Số Serial
                  <span
                    v-if="
                      currentAction === 'VIP_IMPORT_NEW' ||
                      currentAction === 'VIP_IMPORT_OLD'
                    "
                    class="text-danger"
                    >*</span
                  >
                </label>
                <input
                  type="text"
                  v-model="form.serial"
                  :disabled="
                    !['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(
                      currentAction
                    )
                  "
                  :placeholder="
                    ['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(currentAction)
                      ? 'Nhập mã Serial...'
                      : 'Tự động điền khi chọn hàng...'
                  "
                  :style="
                    !['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(
                      currentAction
                    )
                      ? 'background-color: #f8f9fa; cursor: not-allowed; font-weight: bold;'
                      : ''
                  "
                />
              </div>

              <template
                v-if="
                  currentAction === 'VIP_IMPORT_NEW' &&
                  !currentAction.includes('NOIBO')
                "
              >
                <div class="form-group">
                  <label>PXK Kho TSB</label>
                  <input
                    type="text"
                    v-model="form.pxk_kho_tsb"
                    placeholder="Phiếu xuất kho TSB..."
                  />
                </div>
                <div class="form-group">
                  <label>PXK VP TSB</label>
                  <input
                    type="text"
                    v-model="form.pxk_vp_tsb"
                    placeholder="Phiếu xuất VP TSB..."
                  />
                </div>
              </template>

              <div
                class="form-group"
                style="position: relative"
                v-if="
                  customerMode === 'THUONG' && !currentAction.includes('NOIBO')
                "
              >
                <label>Tên Sản Phẩm <span class="text-danger">*</span></label>
                <input
                  type="text"
                  :value="form.ten_san_pham"
                  @focus="showProductDropdown = true"
                  @blur="closeProductDropdown"
                  @input="
                    form.ten_san_pham = $event.target.value;
                    showProductDropdown = true;
                  "
                  :placeholder="
                    currentAction === 'THUONG_IMPORT' ||
                    currentAction === 'LE_IMPORT'
                      ? 'Gõ tìm Tên SP, Mã SP hoặc nhập tên mới...'
                      : 'Tự động điền khi chọn hàng...'
                  "
                  autocomplete="off"
                  class="form-control"
                  :disabled="isExportAction"
                  :style="
                    isExportAction
                      ? 'background-color: #f8f9fa; cursor: not-allowed; font-weight: bold;'
                      : 'font-weight: bold'
                  "
                />

                <ul
                  v-if="showProductDropdown && !isExportAction"
                  class="custom-dropdown-list shadow-sm"
                >
                  <li
                    v-for="p in filteredCatalogProducts"
                    :key="p.id"
                    @mousedown.prevent="selectProduct(p)"
                  >
                    <span class="fw-bold" style="color: #0f3d26">{{
                      p.ten_san_pham
                    }}</span>
                    <span
                      class="text-muted"
                      style="font-size: 13px; margin-left: 8px"
                    >
                      - Mã SP: {{ p.ma_san_pham || 'N/A' }}
                    </span>
                  </li>
                  <li
                    v-if="filteredCatalogProducts.length === 0"
                    class="text-muted p-2"
                    style="cursor: default; text-align: center"
                  >
                    Không tìm thấy sản phẩm. Bạn có thể nhập tên mới.
                  </li>
                </ul>
              </div>

              <div
                class="form-group full-width"
                v-if="
                  customerMode === 'THUONG' && !currentAction.includes('NOIBO')
                "
              >
                <div
                  style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                  "
                >
                  <div>
                    <label style="display: block; margin-bottom: 6px">
                      Số Lượng <span class="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      v-model="form.so_luong"
                      placeholder="Nhập tổng số lượng..."
                      class="form-control"
                      style="width: 100%"
                    />
                  </div>
                  <div>
                    <label style="display: block; margin-bottom: 6px">
                      Số Kiện <span class="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      v-model="form.so_kien"
                      placeholder="Nhập số kiện..."
                      class="form-control"
                      style="width: 100%"
                    />
                  </div>
                </div>
              </div>

              <template
                v-if="isExportAction || currentAction.includes('NOIBO')"
              >
                <div class="form-group" style="position: relative">
                  <label
                    >Tài Xế / Phụ Xe <span class="text-danger">*</span></label
                  >

                  <input
                    v-if="isCurrentUserShipper"
                    type="text"
                    :value="searchShipperQuery"
                    disabled
                    class="form-control"
                    style="
                      background-color: #f8f9fa;
                      cursor: not-allowed;
                      font-weight: bold;
                    "
                  />

                  <input
                    v-else
                    type="text"
                    :value="searchShipperQuery"
                    @input="handleShipperInput"
                    @focus="showShipperDropdown = true"
                    @blur="closeShipperDropdown"
                    placeholder="Gõ tên, tài khoản hoặc biển số xe..."
                    autocomplete="off"
                    style="font-weight: bold"
                  />

                  <ul
                    v-if="showShipperDropdown && !isCurrentUserShipper"
                    class="custom-dropdown-list shadow-sm"
                  >
                    <li
                      v-for="shipper in filteredShippers"
                      :key="shipper.id"
                      @mousedown.prevent="selectShipper(shipper)"
                    >
                      <span class="fw-bold">{{
                        shipper.full_name || shipper.username
                      }}</span>
                      <span
                        class="text-muted"
                        style="font-size: 12px; margin-left: 8px"
                      >
                        (Biển số xe: {{ shipper.bien_so_xe }})
                      </span>
                    </li>
                    <li
                      v-if="filteredShippers.length === 0"
                      class="text-muted p-2"
                      style="cursor: default; text-align: center"
                    >
                      Không tìm thấy tài xế
                    </li>
                  </ul>
                  <input type="hidden" v-model="form.nv_giao_hang" />
                </div>

                <div class="form-group" style="position: relative">
                  <label>Biển Số Xe <span class="text-danger">*</span></label>

                  <input
                    v-if="isLockedBienSoXe"
                    type="text"
                    v-model="form.bien_so_xe"
                    placeholder="Hệ thống tự điền khi chọn tài xế..."
                    required
                    disabled
                    style="
                      background-color: #f8f9fa;
                      cursor: not-allowed;
                      font-weight: bold;
                    "
                  />

                  <template v-else>
                    <input
                      type="text"
                      :value="searchVehicleQuery"
                      @input="handleVehicleInput"
                      @focus="showVehicleDropdown = true"
                      @blur="closeVehicleDropdown"
                      placeholder="Gõ tìm biển số xe trống..."
                      autocomplete="off"
                      class="form-control"
                      style="font-weight: bold; border-color: #f59e0b"
                      required
                    />

                    <ul
                      v-if="showVehicleDropdown"
                      class="custom-dropdown-list shadow-sm"
                      style="max-height: 200px; overflow-y: auto"
                    >
                      <li
                        v-for="xe in filteredVehicles"
                        :key="xe.bien_so_xe"
                        @mousedown.prevent="selectVehicle(xe)"
                      >
                        <span class="fw-bold text-success">{{
                          xe.bien_so_xe
                        }}</span>
                        <span
                          class="text-muted"
                          style="font-size: 12px; margin-left: 8px"
                        >
                          ({{ xe.mo_ta || 'Trống' }})
                        </span>
                      </li>
                      <li
                        v-if="filteredVehicles.length === 0"
                        class="text-muted p-2"
                        style="text-align: center"
                      >
                        Không tìm thấy xe
                      </li>
                    </ul>
                  </template>
                </div>
              </template>

              <div
                class="form-group"
                v-if="
                  customerMode === 'VIP' ||
                  currentAction === 'THUONG_IMPORT' ||
                  isExportAction ||
                  currentAction.includes('NOIBO')
                "
              >
                <label>
                  Mã Bảng Kê / Bill
                  <span
                    class="text-danger"
                    v-if="
                      !currentAction.includes('NOIBO') &&
                      (isExportAction || currentAction === 'VIP_IMPORT_OLD')
                    "
                    >*</span
                  >
                </label>

                <input
                  v-if="currentAction.includes('NOIBO')"
                  type="text"
                  value="Hệ thống tự động khởi tạo"
                  disabled
                  class="form-control text-muted"
                  style="
                    background-color: #f8f9fa;
                    cursor: not-allowed;
                    font-weight: bold;
                  "
                />

                <input
                  v-else
                  type="text"
                  v-model="form.ma_bill"
                  :required="isExportAction"
                  placeholder="VD: BILL-2026-001"
                  class="form-control"
                />
              </div>

              <template
                v-if="
                  currentAction === 'VIP_EXPORT_OLD' &&
                  !currentAction.includes('NOIBO')
                "
              >
                <div class="form-group">
                  <label>Kho Trả Hàng <span class="text-danger">*</span></label>
                  <select v-model="form.kho_tra_hang" required>
                    <option value="" disabled>Chọn kho nhận trả</option>
                    <option
                      v-for="loc in locations"
                      :key="loc.id"
                      :value="loc.ma_kho"
                    >
                      [{{ loc.ma_kho }}] - {{ loc.ten_kho }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Người Nhận <span class="text-danger">*</span></label>
                  <input
                    type="text"
                    v-model="form.nguoi_nhan"
                    required
                    placeholder="Tên người nhận..."
                  />
                </div>
              </template>

              <template v-if="currentAction.includes('NOIBO')">
                <div class="form-group">
                  <label
                    >Kho Nhận (Đích đến)
                    <span class="text-danger">*</span></label
                  >
                  <select v-model="form.kho_nhan" required class="form-control">
                    <option value="" disabled>-- Chọn kho nhận --</option>
                    <option
                      v-for="loc in locations"
                      :key="loc.id"
                      :value="loc.ma_kho"
                    >
                      [{{ loc.ma_kho }}] - {{ loc.ten_kho }}
                    </option>
                  </select>
                </div>

                <div class="form-group" style="position: relative">
                  <label>Đối tác vận chuyển </label>

                  <input
                    type="text"
                    :value="searchShippingPartnerQuery"
                    @input="handleShippingPartnerInput"
                    @focus="showShippingPartnerDropdown = true"
                    @blur="closeShippingPartnerDropdown"
                    placeholder="Tìm đối tác..."
                    autocomplete="off"
                    class="form-control"
                    style="font-weight: bold"
                  />

                  <ul
                    v-if="showShippingPartnerDropdown"
                    class="custom-dropdown-list shadow-sm"
                  >
                    <li
                      v-for="partner in filteredShippingPartners"
                      :key="partner.id"
                      @mousedown.prevent="selectShippingPartner(partner)"
                    >
                      <span class="fw-bold">{{ partner.ten_doi_tac }}</span>
                      <span
                        class="text-muted"
                        style="font-size: 12px; margin-left: 8px"
                      >
                        (Mã: {{ partner.ma_doi_tac }})
                      </span>
                    </li>
                    <li
                      v-if="filteredShippingPartners.length === 0"
                      class="text-muted p-2"
                      style="cursor: default; text-align: center"
                    >
                      Không tìm thấy đối tác
                    </li>
                  </ul>
                </div>

                <div
                  class="form-group full-width mt-3 p-4"
                  style="
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                  "
                >
                  <div
                    style="
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      margin-bottom: 20px;
                    "
                  >
                    <h4
                      style="
                        margin: 0;
                        color: #0f3d26;
                        font-size: 1.15rem;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                      "
                    >
                      <PackageSearch class="icon-sm" /> Giỏ Hàng Luân Chuyển ({{
                        form.noi_bo_items.filter((i) => i.id_ton_kho).length
                      }}
                      món)
                    </h4>
                    <span
                      class="text-muted"
                      style="font-size: 0.9rem; font-style: italic"
                      >*Click chọn tồn kho ở trên để thêm vào giỏ</span
                    >
                  </div>

                  <div style="display: flex; flex-direction: column; gap: 16px">
                    <div
                      v-if="
                        form.noi_bo_items.length === 0 ||
                        !form.noi_bo_items[0].id_ton_kho
                      "
                      class="text-center p-4 text-muted"
                      style="border: 2px dashed #cbd5e1; border-radius: 8px"
                    >
                      Giỏ hàng đang trống. Hãy chọn hàng hóa từ Danh sách Tồn
                      kho khả dụng phía trên!
                    </div>

                    <template v-else>
                      <div
                        v-for="(item, index) in form.noi_bo_items"
                        :key="index"
                        style="
                          background: white;
                          border: 1px solid #cbd5e1;
                          border-radius: 8px;
                          padding: 16px;
                          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                        "
                      >
                        <div
                          style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 12px;
                            border-bottom: 1px dashed #e2e8f0;
                            padding-bottom: 8px;
                          "
                        >
                          <span style="font-weight: bold; color: #475569">
                            #{{ index + 1 }} -
                            <span
                              :style="{
                                color:
                                  item.loai_khach === 'VIP'
                                    ? '#db2777'
                                    : '#059669',
                              }"
                              >[{{ item.loai_khach }}]</span
                            >
                          </span>
                          <button
                            type="button"
                            @click="removeNoiBoItem(index)"
                            style="
                              background: #fee2e2;
                              color: #ef4444;
                              border: none;
                              border-radius: 4px;
                              padding: 4px 10px;
                              font-weight: bold;
                              cursor: pointer;
                              transition: 0.2s;
                            "
                          >
                            Xóa Khỏi Giỏ
                          </button>
                        </div>

                        <div
                          :style="{
                            display: 'grid',
                            gridTemplateColumns:
                              item.loai_khach === 'VIP'
                                ? '2fr 1.5fr 1fr 1.5fr'
                                : '2fr 1fr',
                            gap: '16px',
                            marginBottom: '16px',
                          }"
                        >
                          <div>
                            <label
                              style="
                                font-size: 0.85rem;
                                font-weight: 600;
                                color: #334155;
                                margin-bottom: 6px;
                                display: block;
                              "
                              >Tên Sản Phẩm</label
                            >
                            <input
                              type="text"
                              :value="item.ten_san_pham"
                              disabled
                              class="form-control"
                              style="background: #f1f5f9; font-weight: bold"
                            />
                          </div>

                          <div v-if="item.loai_khach === 'VIP'">
                            <label
                              style="
                                font-size: 0.85rem;
                                font-weight: 600;
                                color: #334155;
                                margin-bottom: 6px;
                                display: block;
                              "
                              >Mã Máy (Model)</label
                            >
                            <input
                              type="text"
                              :value="item.ma_may"
                              disabled
                              class="form-control"
                              style="background: #f1f5f9"
                            />
                          </div>

                          <div>
                            <label
                              style="
                                font-size: 0.85rem;
                                font-weight: 600;
                                color: #334155;
                                margin-bottom: 6px;
                                display: block;
                              "
                              >Mã SP</label
                            >
                            <input
                              type="text"
                              :value="item.ma_sp_hoac_id"
                              disabled
                              class="form-control"
                              style="background: #f1f5f9"
                            />
                          </div>

                          <div v-if="item.loai_khach === 'VIP'">
                            <label
                              style="
                                font-size: 0.85rem;
                                font-weight: 600;
                                color: #334155;
                                margin-bottom: 6px;
                                display: block;
                              "
                              >Mã Serial</label
                            >
                            <input
                              type="text"
                              :value="item.serial"
                              disabled
                              class="form-control"
                              style="background: #f1f5f9"
                            />
                          </div>
                        </div>

                        <div
                          style="
                            display: grid;
                            grid-template-columns: 1fr 1fr 1.5fr 2fr; /* Chỉnh lại cho vừa khít 4 ô */
                            gap: 16px;
                          "
                        >
                          <div>
                            <label
                              style="
                                font-size: 0.85rem;
                                font-weight: 600;
                                color: #334155;
                                margin-bottom: 6px;
                                display: block;
                              "
                              >Số Lượng
                              <span class="text-danger">*</span></label
                            >
                            <input
                              type="number"
                              v-model="item.so_luong"
                              disabled
                              class="form-control"
                              style="background: #f1f5f9; font-weight: bold"
                            />
                          </div>
                          <div>
                            <label
                              style="
                                font-size: 0.85rem;
                                font-weight: 600;
                                color: #334155;
                                margin-bottom: 6px;
                                display: block;
                              "
                              >Số Kiện <span class="text-danger">*</span></label
                            >
                            <input
                              type="number"
                              v-model="item.so_kien"
                              min="1"
                              required
                              class="form-control"
                            />
                          </div>
                          <div>
                            <label
                              style="
                                font-size: 0.85rem;
                                font-weight: 600;
                                color: #334155;
                                margin-bottom: 6px;
                                display: block;
                              "
                              >Mã Bill <span class="text-danger">*</span></label
                            >
                            <input
                              type="text"
                              v-model="item.ma_bill"
                              class="form-control"
                              required
                            />
                          </div>

                          <div>
                            <label
                              style="
                                font-size: 0.85rem;
                                font-weight: 600;
                                color: #334155;
                                margin-bottom: 6px;
                                display: block;
                              "
                              >Ghi chú</label
                            >
                            <input
                              type="text"
                              v-model="item.ghi_chu"
                              placeholder="Ghi chú thêm..."
                              class="form-control"
                            />
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </template>
            </div>

            <div
              class="form-group full-width mt-3"
              v-if="!currentAction.includes('NOIBO')"
            >
              <div
                style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px"
              >
                <div>
                  <label>
                    Địa Chỉ Giao Hàng
                    <span v-if="isExportAction" class="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    v-model="form.dia_chi_giao_hang"
                    :required="isExportAction"
                    placeholder="Số nhà, tên đường, phường/xã..."
                    class="form-control"
                  />
                </div>
                <div>
                  <label>
                    Tỉnh / Thành Phố
                    <span v-if="isExportAction" class="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    v-model="form.tinh_thanh"
                    :required="isExportAction"
                    placeholder="VD: TP. Hồ Chí Minh, Hà Nội..."
                    class="form-control"
                  />
                </div>
              </div>
            </div>

            <div class="form-group full-width mt-3">
              <label v-if="!currentAction.includes('NOIBO')">Ghi Chú</label>
              <textarea
                v-if="!currentAction.includes('NOIBO')"
                v-model="form.ghi_chu"
                rows="2"
                placeholder="Ghi chú thêm nếu có..."
              ></textarea>
            </div>

            <div class="form-actions mt-4">
              <button
                type="button"
                class="btn btn-secondary"
                @click="resetForm(true)"
              >
                Làm Mới
              </button>
              <button
                type="submit"
                class="btn btn-save"
                :disabled="isSubmitting"
              >
                <Send class="icon-sm" v-if="!isSubmitting" />
                {{ isSubmitting ? 'Đang Xử Lý...' : 'Gửi Yêu Cầu' }}
              </button>
            </div>
          </form>

          <div v-else class="empty-state text-center p-5 text-muted">
            <MousePointerClick
              class="empty-icon mb-3"
              style="width: 48px; height: 48px; opacity: 0.5"
            />
            <p>Hãy chọn một nghiệp vụ ở cột bên trái để bắt đầu điền phiếu.</p>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import { inventoryService } from '../services/inventory';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import { customerService } from '../services/customer';
import { shipperService } from '../services/shipper';
import { userServiceProfile } from '../services/user';
import { viTriKhoService } from '../services/vi_tri_kho';
import { productService } from '../services/product';
import { shippingPartnerService } from '../services/shippingPartner';
import { vehicleService } from '../services/vehicle';
import {
  Archive,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCcw,
  SendToBack,
  Send,
  MousePointerClick,
  ArrowLeft,
  MapPin,
  PackageSearch,
  Download,
} from 'lucide-vue-next';

const authStore = useAuthStore();
const toast = useToast();

const isAdmin = computed(() => authStore.hasPermission('FUNC_ADMIN_ALL'));

const isCurrentUserShipper = computed(() => !!authStore.user?.is_shipper);

const selectedShipperObj = ref(null);
const searchVehicleQuery = ref('');
const showVehicleDropdown = ref(false);
const filteredVehicles = ref([]);
let vehicleTimeout = null;

const customerMode = ref('');
const currentAction = ref('');
const isSubmitting = ref(false);

const customers = ref([]);
const locations = ref([]);
const shippers = ref([]);
const userProfile = ref([]);
const catalogProducts = ref([]);
const customerInventory = ref([]);
const isLoadingInventory = ref(false);
const shippingPartners = ref([]);
const searchShippingPartnerQuery = ref('');
const showShippingPartnerDropdown = ref(false);
const activeNoiBoDropdown = ref(null);

const searchShipperQuery = ref('');
const showShipperDropdown = ref(false);
const searchInventoryQuery = ref('');

const fileInputRef = ref(null);

const searchCustomerQuery = ref('');
const showCustomerDropdown = ref(false);

const form = ref({
  id: '',
  customer_id: '',
  ma_kho_spl: '',
  ma_bill: '',
  ma_san_pham: '',
  ten_san_pham: '',
  ma_may: '',
  so_luong: null,
  so_kien: null,
  nv_giao_hang: '',
  bien_so_xe: '',
  kho_tra_hang: '',
  nguoi_nhan: '',
  ghi_chu: '',
  pxk_kho_tsb: '',
  pxk_vp_tsb: '',
  ngay_nhap_kho_hien_thi: '',
  kho_nhan: '',
  doi_tac_van_chuyen: '',
  dia_chi_giao_hang: '',
  tinh_thanh: '',
  noi_bo_items: [
    {
      ma_sp_hoac_id: '',
      ten_san_pham: '',
      ma_bill: '',
      ma_may: '',
      so_luong: 1,
      so_kien: 1,
      trong_luong: 0,
      kich_thuoc: '',
      tinh_thanh: '',
      dia_chi_giao_hang: '',
      ghi_chu: '',
    },
  ],
});

const filteredCustomers = computed(() => {
  const q = searchCustomerQuery.value.toLowerCase().trim();
  if (!q) return customers.value;

  return customers.value.filter((c) => {
    const ma = (c.ma_khach_hang || '').toLowerCase();
    const ten = (c.ten_khach_hang || '').toLowerCase();
    return ma.includes(q) || ten.includes(q);
  });
});

const loadCatalogProducts = async () => {
  try {
    const res = await productService.getProducts(0, 5000);
    catalogProducts.value = res.data.data;
  } catch (error) {
    // console.error('Lỗi tải danh mục sản phẩm:', error);
    toast.error('Không thể tải danh mục sản phẩm từ máy chủ.');
  }
};

const handleCustomerInput = (event) => {
  searchCustomerQuery.value = event.target.value;
  showCustomerDropdown.value = true;
  form.value.customer_id = '';
};

const isLockedBienSoXe = computed(() => {
  if (!selectedShipperObj.value) return true;
  return !!selectedShipperObj.value.bien_so_xe;
});

const handleVehicleInput = (e) => {
  searchVehicleQuery.value = e.target.value;
  form.value.bien_so_xe = '';
  showVehicleDropdown.value = true;

  clearTimeout(vehicleTimeout);
  vehicleTimeout = setTimeout(async () => {
    try {
      const res = await vehicleService.getVehicles(
        searchVehicleQuery.value,
        'AVAILABLE'
      );
      filteredVehicles.value = res.data;
    } catch (err) {
      // console.error(err);
      toast.error('Không thể tải danh sách xe từ máy chủ.');
    }
  }, 300);
};

const selectVehicle = (xe) => {
  form.value.bien_so_xe = xe.bien_so_xe;
  searchVehicleQuery.value = xe.bien_so_xe;
  showVehicleDropdown.value = false;
};

const closeVehicleDropdown = () => {
  setTimeout(() => {
    showVehicleDropdown.value = false;
  }, 200);
};

watch(showVehicleDropdown, async (val) => {
  if (val && !searchVehicleQuery.value) {
    try {
      const res = await vehicleService.getVehicles('', 'AVAILABLE');
      filteredVehicles.value = res.data;
    } catch (e) {}
  }
});

const selectCustomer = (customer) => {
  form.value.customer_id = customer.id;
  searchCustomerQuery.value = `[${customer.ma_khach_hang}] - ${customer.ten_khach_hang}`;
  showCustomerDropdown.value = false;
};

const showProductDropdown = ref(false);

const filteredCatalogProducts = computed(() => {
  let q = '';

  if (
    customerMode.value === 'VIP' &&
    currentAction.value === 'VIP_IMPORT_OLD'
  ) {
    q = (form.value.ma_may || '').toLowerCase().trim();
  } else if (customerMode.value === 'VIP') {
    q = (form.value.ma_san_pham || '').toLowerCase().trim();
  } else {
    q = (form.value.ten_san_pham || '').toLowerCase().trim();
  }

  if (!q) return catalogProducts.value.slice(0, 30);

  return catalogProducts.value
    .filter((p) => {
      const maSP = (p.ma_san_pham || '').toLowerCase();
      const tenSP = (p.ten_san_pham || '').toLowerCase();
      const maMay = (p.ma_may || '').toLowerCase();
      return maSP.includes(q) || tenSP.includes(q) || maMay.includes(q);
    })
    .slice(0, 30);
});

const selectProduct = (product) => {
  if (customerMode.value === 'VIP') {
    form.value.ma_san_pham = product.ma_san_pham || '';
    if (
      currentAction.value === 'VIP_IMPORT_NEW' ||
      currentAction.value === 'VIP_IMPORT_OLD'
    ) {
      form.value.ma_may = product.ma_may || '';
      toast.success(`Đã tự điền Mã Máy: ${product.ma_may}`);
    }
  } else {
    form.value.ten_san_pham = product.ten_san_pham || '';
    form.value.ma_san_pham = product.ma_san_pham || '';
    toast.success(`Đã tự điền Tên Sản Phẩm: ${product.ten_san_pham}`);
  }

  showProductDropdown.value = false;
};

const closeCustomerDropdown = () => {
  setTimeout(() => {
    showCustomerDropdown.value = false;
  }, 200);
};

const closeProductDropdown = () => {
  setTimeout(() => {
    showProductDropdown.value = false;
  }, 200);
};

const filteredNoiBoProducts = computed(() => {
  if (activeNoiBoDropdown.value === null) return [];

  const q = (
    form.value.noi_bo_items[activeNoiBoDropdown.value].ten_san_pham || ''
  )
    .toLowerCase()
    .trim();
  if (!q) return catalogProducts.value.slice(0, 30);

  return catalogProducts.value
    .filter((p) => {
      const maSP = (p.ma_san_pham || '').toLowerCase();
      const tenSP = (p.ten_san_pham || '').toLowerCase();
      const maMay = (p.ma_may || '').toLowerCase();
      return maSP.includes(q) || tenSP.includes(q) || maMay.includes(q);
    })
    .slice(0, 30);
});

const selectNoiBoProduct = (product, index) => {
  const item = form.value.noi_bo_items[index];
  item.ten_san_pham = product.ten_san_pham;
  item.ma_may = product.ma_may || '';
  item.ma_sp_hoac_id = product.ma_san_pham || '';
  item.trong_luong = product.trong_luong || 0;

  toast.success(`Đã tự điền mã: ${product.ma_san_pham}`);
  activeNoiBoDropdown.value = null;
};

const closeNoiBoDropdown = () => {
  setTimeout(() => {
    activeNoiBoDropdown.value = null;
  }, 200);
};

const filteredCustomerInventory = computed(() => {
  const q = searchInventoryQuery.value.toLowerCase().trim();
  if (!q) return customerInventory.value;

  return customerInventory.value.filter((item) => {
    const id = String(item.id || '').toLowerCase();
    const ten = String(item.ten_san_pham || '').toLowerCase();
    const ma_sp = String(item.ma_san_pham || '').toLowerCase();
    const serial = String(item.serial || '').toLowerCase();

    return id.includes(q) || ten.includes(q) || ma_sp.includes(q);
  });
});

const triggerFileUpload = () => {
  fileInputRef.value.click();
};

const downloadImportTemplate = () => {
  let ws_data = [];
  let filename = '';

  if (currentAction.value === 'VIP_IMPORT_NEW') {
    ws_data = [
      [
        'MÃ MÁY',
        'MÃ SP',
        'SỐ SERIAL',
        'MÃ BILL',
        'PXK Kho TSB',
        'PXK VP TSB',
        'Địa Chỉ',
        'Tỉnh Thành',
        'Ngày Nhập',
        'Ghi chú',
      ],
      [
        'TOSHIBA-7.5KG',
        'SP001',
        'SN123456789',
        'BILL-2026-001',
        'PXK-001',
        'VP-001',
        'Quận 1',
        'TP HCM',
        '01/04/2026',
        'Mẫu nhập VIP',
      ],
    ];
    filename = 'Bieu_Mau_Nhap_VIP.xlsx';
  } else if (currentAction.value === 'VIP_IMPORT_OLD') {
    ws_data = [
      [
        'MÃ MÁY',
        'MÃ SP',
        'SỐ SERIAL CŨ',
        'MÃ BILL',
        'Địa Chỉ',
        'Tỉnh Thành',
        'Ghi chú',
      ],
      [
        'TOSHIBA-7.5KG',
        'SP001',
        'SN-OLD-123',
        'BILL-TRA-001',
        'Quận 2',
        'TP HCM',
        'Khách trả hàng',
      ],
    ];
    filename = 'Bieu_Mau_Nhap_Cu_VIP.xlsx';
  } else if (currentAction.value === 'THUONG_IMPORT') {
    ws_data = [
      [
        'MÃ SP',
        'TÊN SẢN PHẨM',
        'MÃ BILL',
        'SỐ LƯỢNG',
        'SỐ KIỆN',
        'Địa Chỉ',
        'Tỉnh Thành',
        'Ngày Nhập',
        'Ghi chú',
      ],
      [
        'SP002',
        'Máy giặt Panasonic',
        'BILL-2026-001',
        10,
        2,
        'Quận 3',
        'TP HCM',
        '01/04/2026',
        `Ghi chú ${customerMode.value}`,
      ],
    ];
    filename = `Bieu_Mau_Nhap_${customerMode.value}.xlsx`;
  } else {
    return;
  }

  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  ws['!cols'] = Array(ws_data[0].length).fill({ wch: 18 });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BieuMauNhap');
  XLSX.writeFile(wb, filename);
  toast.success(`Đã tải ${filename} thành công!`);
};

const handleDirectExcelUpload = async (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  if (
    ['THUONG_IMPORT'].includes(currentAction.value) &&
    !form.value.customer_id
  ) {
    toast.error(
      'Lỗi: Vui lòng chọn Khách Hàng ở form bên dưới trước khi up file Excel!'
    );
    event.target.value = '';
    return;
  }

  isSubmitting.value = true;

  const processSingleFile = (file) => {
    return new Promise((resolve) => {
      const fileSignature = `${currentAction.value}_${file.name}_${file.size}_${file.lastModified}`;
      const importedFiles = JSON.parse(
        localStorage.getItem('imported_files_history') || '[]'
      );

      if (importedFiles.includes(fileSignature)) {
        toast.error(`File Excel "${file.name}" đã được tải lên trước đó!`);
        resolve([]);
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];

          const rawData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
          });

          let extractedKho = '';
          for (let i = 0; i < Math.min(10, rawData.length); i++) {
            for (let j = 0; j < rawData[i].length; j++) {
              const cellValue = String(rawData[i][j] || '').trim();
              if (cellValue.includes('Nơi phát hành:')) {
                extractedKho = cellValue.split('Nơi phát hành:')[1].trim();
                break;
              }
            }
            if (extractedKho) break;
          }

          let headerRowIndex = 0;
          for (let i = 0; i < Math.min(20, rawData.length); i++) {
            const rowString = rawData[i].join(' ').toUpperCase();
            if (
              rowString.includes('STT') ||
              rowString.includes('ID') ||
              rowString.includes('MÃ BILL') ||
              rowString.includes('SỐ SERIAL') ||
              rowString.includes('MÃ MÁY') ||
              rowString.includes('TÊN SẢN PHẨM')
            ) {
              headerRowIndex = i;
              break;
            }
          }

          let json = XLSX.utils.sheet_to_json(worksheet, {
            range: headerRowIndex,
            defval: '',
          });

          json = json.filter((row) => {
            const hasMaMay =
              String(row['MÃ MÁY'] || row['Mã Máy'] || '').trim() !== '';
            const hasMaSP =
              String(row['MÃ SP'] || row['Mã SP'] || '').trim() !== '';
            const hasTenSP =
              String(
                row['TÊN SẢN PHẨM'] || row['Tên Sản Phẩm'] || ''
              ).trim() !== '';
            const hasId = String(row['ID'] || '').trim() !== '';
            const hasStt = String(row['STT'] || '').trim() !== '';
            return hasMaMay || hasMaSP || hasTenSP || hasId || hasStt;
          });

          if (json.length === 0) {
            resolve([]);
            return;
          }

          const maKho =
            extractedKho ||
            form.value.ma_kho_spl ||
            currentUserKho.value ||
            'KHO_MAC_DINH';

          const getVal = (row, keys) => {
            for (let key of keys) {
              if (row[key] !== undefined && row[key] !== '') return row[key];
            }
            return '';
          };

          const formatExcelDate = (val) => {
            if (!val) return null;
            if (typeof val === 'number') {
              const date = new Date(Math.round((val - 25569) * 86400 * 1000));
              return date.toISOString().split('T')[0] + 'T00:00:00';
            }
            const strVal = String(val).trim();
            if (strVal.includes('/')) {
              const parts = strVal.split('/');
              if (parts.length >= 3) {
                const year = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
                return `${year}-${parts[1].padStart(
                  2,
                  '0'
                )}-${parts[0].padStart(2, '0')}T00:00:00`;
              }
            } else if (strVal.includes('-')) {
              return `${strVal}T00:00:00`;
            }
            return null;
          };

          let filePayload = [];

          if (currentAction.value === 'VIP_IMPORT_NEW') {
            filePayload = json.map((row) => ({
              ma_may: String(
                getVal(row, [
                  'MÃ MÁY',
                  'Mã Máy',
                  'Mã máy',
                  'Mã máy cũ',
                  'ma_may',
                ]) || ''
              ),
              ma_san_pham: String(
                getVal(row, ['MÃ SP', 'Mã SP', 'Mã Sản Phẩm', 'ma_san_pham']) ||
                  ''
              ),
              serial_moi: String(
                getVal(row, [
                  'SỐ SERIAL',
                  'Số Serial',
                  'Serial',
                  'SỐ SERIAL CŨ',
                  'SỐ SERIAL MỚI',
                  'serial_moi',
                ]) || ''
              ),
              ma_bill: String(
                getVal(row, ['MÃ BILL', 'Mã Bill', 'Bill', 'ma_bill']) ||
                  form.value.ma_bill ||
                  ''
              ),
              ghi_chu: String(
                getVal(row, ['Ghi chú', 'Ghi Chú', 'GHI CHÚ', 'ghi_chu']) || ''
              ),
              pxk_kho_tsb: String(
                getVal(row, ['PXK Kho TSB', 'PXK KHO TSB', 'pxk_kho_tsb']) || ''
              ),
              pxk_vp_tsb: String(
                getVal(row, ['PXK VP TSB', 'PXK VP TSB', 'pxk_vp_tsb']) || ''
              ),
              dia_chi_giao_hang: String(
                getVal(row, ['Địa Chỉ', 'Địa chỉ', 'ĐỊA CHỈ', 'dia_chi']) || ''
              ),
              tinh_thanh: String(
                getVal(row, [
                  'Tỉnh Thành',
                  'Tỉnh thành',
                  'TỈNH THÀNH',
                  'tinh_thanh',
                ]) || ''
              ),
              ngay: formatExcelDate(
                getVal(row, ['Ngày', 'Ngày Nhập', 'Ngày nhập kho'])
              ),
              ma_kho_spl: String(maKho),
            }));
          } else if (currentAction.value === 'VIP_IMPORT_OLD') {
            filePayload = json
              .map((row) => ({
                ma_may: String(
                  getVal(row, ['MÃ MÁY', 'Mã Máy', 'Mã máy']) || ''
                ),
                ma_san_pham: String(
                  getVal(row, [
                    'MÃ SP',
                    'Mã SP',
                    'Mã Sản Phẩm',
                    'ma_san_pham',
                  ]) || ''
                ),
                serial_cu: String(
                  getVal(row, [
                    'SỐ SERIAL CŨ',
                    'Số Serial Cũ',
                    'Serial Cũ',
                    'SỐ SERIAL',
                    'serial_cu',
                  ]) || ''
                ),
                ma_bill: String(
                  getVal(row, ['MÃ BILL', 'Mã Bill', 'Bill', 'ma_bill']) ||
                    form.value.ma_bill ||
                    ''
                ),
                ghi_chu: String(
                  getVal(row, ['Ghi chú', 'Ghi Chú', 'GHI CHÚ', 'ghi_chu']) ||
                    ''
                ),
                dia_chi_giao_hang: String(
                  getVal(row, ['Địa Chỉ', 'Địa chỉ', 'ĐỊA CHỈ', 'dia_chi']) ||
                    ''
                ),
                tinh_thanh: String(
                  getVal(row, [
                    'Tỉnh Thành',
                    'Tỉnh thành',
                    'TỈNH THÀNH',
                    'tinh_thanh',
                  ]) || ''
                ),
                ma_kho_spl: String(maKho),
              }))
              .filter((item) => item.ma_may !== '');
          } else if (currentAction.value === 'THUONG_IMPORT') {
            filePayload = json.map((row) => ({
              id: parseInt(row['ID']) || 0,
              customer_id: form.value.customer_id,
              ma_san_pham: String(
                getVal(row, ['MÃ SP', 'Mã SP', 'Mã Sản Phẩm', 'ma_san_pham']) ||
                  ''
              ),
              ten_san_pham: String(
                getVal(row, [
                  'TÊN SẢN PHẨM',
                  'Tên Sản Phẩm',
                  'Tên SP',
                  'ten_san_pham',
                ]) || ''
              ),
              ma_bill: String(
                getVal(row, ['MÃ BILL', 'Mã Bill', 'Bill', 'ma_bill']) ||
                  form.value.ma_bill ||
                  ''
              ),
              so_luong:
                parseInt(getVal(row, ['SỐ LƯỢNG', 'Số Lượng', 'so_luong'])) ||
                1,
              so_kien:
                parseInt(
                  getVal(row, ['SỐ KIỆN', 'Số Kiện', 'S.kiện', 'so_kien'])
                ) || 1,
              ghi_chu: String(
                getVal(row, ['Ghi chú', 'Ghi Chú', 'ghi_chu']) || ''
              ),
              dia_chi_giao_hang: String(
                getVal(row, ['Địa Chỉ', 'Địa chỉ', 'ĐỊA CHỈ', 'dia_chi']) || ''
              ),
              tinh_thanh: String(
                getVal(row, [
                  'Tỉnh Thành',
                  'Tỉnh thành',
                  'TỈNH THÀNH',
                  'tinh_thanh',
                ]) || ''
              ),
              ngay: formatExcelDate(
                getVal(row, ['Ngày', 'Ngày Nhập', 'Ngày nhập kho'])
              ),
              ma_kho_spl: String(maKho),
            }));
          }

          resolve(filePayload);
        } catch (err) {
          resolve([]);
        }
      };

      reader.readAsArrayBuffer(file);
    });
  };

  try {
    const filePromises = Array.from(files).map((file) =>
      processSingleFile(file)
    );
    const allResults = await Promise.all(filePromises);
    const combinedPayload = allResults.flat();

    if (combinedPayload.length === 0) {
      toast.error(
        'Không có dữ liệu hợp lệ nào được tìm thấy trong các file bạn tải lên!'
      );
      return;
    }

    if (currentAction.value === 'VIP_IMPORT_NEW') {
      await inventoryService.bulkImportNewVip(combinedPayload);
    } else if (currentAction.value === 'VIP_IMPORT_OLD') {
      await inventoryService.bulkImportOldVip(combinedPayload);
    } else if (currentAction.value === 'THUONG_IMPORT') {
      await inventoryService.bulkImportRegular(combinedPayload);
    }

    const historyFiles = JSON.parse(
      localStorage.getItem('imported_files_history') || '[]'
    );
    Array.from(files).forEach((file) => {
      const fileSig = `${currentAction.value}_${file.name}_${file.size}_${file.lastModified}`;
      if (!historyFiles.includes(fileSig)) historyFiles.push(fileSig);
    });
    if (historyFiles.length > 200)
      historyFiles.splice(0, historyFiles.length - 200);
    localStorage.setItem(
      'imported_files_history',
      JSON.stringify(historyFiles)
    );

    toast.success(
      `Đã Import thành công tổng cộng ${combinedPayload.length} dòng dữ liệu từ ${files.length} file Excel!`
    );

    if (typeof fetchCustomerInventory === 'function') {
      fetchCustomerInventory();
    }
  } catch (err) {
    // console.error(err);

    let errorMsg = 'Vui lòng kiểm tra lại file Excel.';
    if (err.response?.data?.detail) {
      const detail = err.response.data.detail;
      if (Array.isArray(detail)) {
        errorMsg = detail
          .slice(0, 3)
          .map((d) => `Cột [${d.loc.join(' > ')}] - ${d.msg}`)
          .join(' | ');
        if (detail.length > 3)
          errorMsg += ` (và ${detail.length - 3} lỗi khác...)`;
      } else {
        errorMsg = detail;
      }
    }
    toast.error('Lỗi hệ thống: ' + errorMsg);
  } finally {
    isSubmitting.value = false;
    event.target.value = '';
  }
};

const loadShippingPartners = async () => {
  try {
    const res = await shippingPartnerService.getPartners(0, 1000);
    shippingPartners.value = res.data.data;
  } catch (error) {
    // console.error('Lỗi lấy danh sách đối tác vận chuyển:', error);
    toast.error('Không thể tải danh sách đối tác vận chuyển từ máy chủ.');
  }
};

const filteredShippingPartners = computed(() => {
  const q = (searchShippingPartnerQuery.value || '').toLowerCase().trim();
  if (!q) return shippingPartners.value;

  return shippingPartners.value.filter((s) => {
    const ma = (s.ma_doi_tac || '').toLowerCase();
    const ten = (s.ten_doi_tac || '').toLowerCase();
    return ma.includes(q) || ten.includes(q);
  });
});

const handleShippingPartnerInput = (event) => {
  searchShippingPartnerQuery.value = event.target.value;
  form.value.doi_tac_van_chuyen = event.target.value;
  showShippingPartnerDropdown.value = true;
};

const selectShippingPartner = (partner) => {
  const tenDoiTac = partner.ten_doi_tac;
  form.value.doi_tac_van_chuyen = tenDoiTac;
  searchShippingPartnerQuery.value = tenDoiTac;
  showShippingPartnerDropdown.value = false;
};

const closeShippingPartnerDropdown = () => {
  setTimeout(() => {
    showShippingPartnerDropdown.value = false;
  }, 200);
};

const canViewVip = computed(
  () =>
    isAdmin.value ||
    ALL_ACTIONS.filter((a) => a.mode === 'VIP').some((a) =>
      authStore.hasPermission(a.perm)
    )
);
const canViewThuong = computed(
  () =>
    isAdmin.value ||
    ALL_ACTIONS.filter((a) => a.mode === 'THUONG').some((a) =>
      authStore.hasPermission(a.perm)
    )
);

const showTabSelector = computed(() => {
  const accessibleTabs = [canViewVip.value, canViewThuong.value].filter(
    Boolean
  );
  return accessibleTabs.length > 1;
});

const ALL_ACTIONS = [
  {
    id: 'VIP_IMPORT_NEW',
    mode: 'VIP',
    type: 'IMPORT',
    perm: 'FUNC_VIP_NHAP_MOI',
    title: 'Nhập Hàng Mới',
    desc: 'Nhập kho thiết bị mới',
    icon: ArrowDownToLine,
  },
  {
    id: 'VIP_EXPORT_NEW',
    mode: 'VIP',
    type: 'EXPORT',
    perm: 'FUNC_VIP_XUAT_MOI',
    title: 'Giao Hàng Mới',
    desc: 'Xuất hàng mới',
    icon: ArrowUpFromLine,
  },
  {
    id: 'VIP_IMPORT_OLD',
    mode: 'VIP',
    type: 'IMPORT',
    perm: 'FUNC_VIP_NHAP_CU',
    title: 'Nhập Hàng Cũ',
    desc: 'Nhập lại hàng cũ',
    icon: RefreshCcw,
  },
  {
    id: 'VIP_EXPORT_OLD',
    mode: 'VIP',
    type: 'EXPORT',
    perm: 'FUNC_VIP_XUAT_CU',
    title: 'Giao Hàng Cũ',
    desc: 'Xuất hàng cũ',
    icon: SendToBack,
  },
  {
    id: 'THUONG_IMPORT',
    mode: 'THUONG',
    type: 'IMPORT',
    perm: 'FUNC_THUONG_NHAP',
    title: 'Nhập Theo Sản Phẩm',
    desc: 'Gửi hàng thường',
    icon: ArrowDownToLine,
  },
  {
    id: 'THUONG_EXPORT',
    mode: 'THUONG',
    type: 'EXPORT',
    perm: 'FUNC_THUONG_XUAT',
    title: 'Giao Hàng Thường',
    desc: 'Xuất hàng thường',
    icon: ArrowUpFromLine,
  },
  {
    id: 'VIP_EXPORT_NOIBO',
    mode: 'VIP',
    type: 'EXPORT_NOIBO',
    perm: 'FUNC_VIP_XUAT_MOI',
    title: 'Xuất Nội Bộ',
    desc: 'Chuyển hàng nội bộ',
    icon: ArrowUpFromLine,
  },
  {
    id: 'THUONG_EXPORT_NOIBO',
    mode: 'THUONG',
    type: 'EXPORT_NOIBO',
    perm: 'FUNC_THUONG_XUAT',
    title: 'Xuất Nội Bộ',
    desc: 'Chuyển hàng nội bộ',
    icon: ArrowUpFromLine,
  },
];

const setCustomerMode = (mode) => {
  const oldAction = currentAction.value; // Lưu lại action hiện tại trước khi đổi tab
  customerMode.value = mode;

  // Tìm danh sách action cho mode mới
  const actionsForNewMode = ALL_ACTIONS.filter(
    (a) => a.mode === mode && (isAdmin.value || authStore.hasPermission(a.perm))
  );

  // LOGIC MỚI: Nếu đang làm Xuất Nội Bộ, cố gắng giữ nguyên nó ở Tab mới
  if (oldAction.includes('NOIBO')) {
    const matchingNoiBo = actionsForNewMode.find((a) => a.id.includes('NOIBO'));
    if (matchingNoiBo) {
      currentAction.value = matchingNoiBo.id; // Chuyển chéo từ VIP_NOIBO sang THUONG_NOIBO
      return;
    }
  }

  // Nếu không phải luồng Nội Bộ, hoặc tab mới không có quyền Nội Bộ, thì fallback về action đầu tiên
  if (actionsForNewMode.length > 0) {
    currentAction.value = actionsForNewMode[0].id;
  } else {
    currentAction.value = '';
  }
};

const currentUserKho = computed(() => {
  const kho = userProfile.value?.ma_kho_spl || authStore.user?.ma_kho_spl || '';
  return kho.trim();
});

const loadUserProfile = async () => {
  try {
    const res = await userServiceProfile.getUserProfile();
    userProfile.value = res.data;

    if (currentUserKho.value) {
      form.value.ma_kho_spl = currentUserKho.value;
    }
  } catch (error) {
    // console.error('Lỗi tải user profile:', error);
    toast.error('Không thể tải thông tin người dùng từ máy chủ.');
  }
};

const loadCustomers = async () => {
  try {
    const res = await customerService.getCustomers(0, 1000);
    customers.value = res.data.data;
    // console.log(res.data.data);
  } catch (error) {
    // console.error('Lỗi lấy danh sách KH:', error);
    toast.error('Không thể tải danh sách khách hàng từ máy chủ.');
  }
};

const loadShippers = async () => {
  try {
    const res = await shipperService.getShippers();
    shippers.value = res.data;
  } catch (error) {
    // console.error('Lỗi lấy danh sách Shippers:', error);
    toast.error('Không thể tải danh sách người giao hàng từ máy chủ.');
  }
};

const loadLocations = async () => {
  try {
    const res = await viTriKhoService.getViTriKho();
    locations.value = res.data;
  } catch (error) {
    // console.error('Lỗi lấy danh sách kho:', error);
    toast.error('Không thể tải danh sách kho từ máy chủ.');
  }
};

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

const initShipperData = () => {
  if (isCurrentUserShipper.value && authStore.user) {
    selectedShipperObj.value = authStore.user;
    form.value.nv_giao_hang = authStore.user.username;
    searchShipperQuery.value =
      authStore.user.full_name || authStore.user.username;
    form.value.bien_so_xe = authStore.user.bien_so_xe || '';
  }
};

watch(
  () => authStore.user,
  (newUser) => {
    if (newUser) initShipperData();
  },
  { immediate: true }
);

onMounted(() => {
  if (canViewVip.value) customerMode.value = 'VIP';
  else if (canViewThuong.value) customerMode.value = 'THUONG';

  initShipperData();

  loadCustomers();
  loadLocations();
  loadShippers();
  loadUserProfile();
  loadCatalogProducts();
  loadShippingPartners();
});

const availableActions = computed(() => {
  return ALL_ACTIONS.filter((action) => {
    if (action.mode !== customerMode.value) return false;
    return isAdmin.value || authStore.hasPermission(action.perm);
  });
});

const currentActionObj = computed(() =>
  ALL_ACTIONS.find((a) => a.id === currentAction.value)
);
const isExportAction = computed(
  () => currentActionObj.value?.type === 'EXPORT'
);

// CHỈ GIỮ LẠI HÀM NÀY:
const removeNoiBoItem = (index) => {
  if (form.value.noi_bo_items.length > 1)
    form.value.noi_bo_items.splice(index, 1);
};

const filteredShippers = computed(() => {
  const q = (searchShipperQuery.value || '').toLowerCase().trim();
  if (!q) return shippers.value;

  return shippers.value.filter((s) => {
    const name = (s.full_name || '').toLowerCase();
    const user = (s.username || '').toLowerCase();
    const plate = (s.bien_so_xe || '').toLowerCase();

    return name.includes(q) || user.includes(q) || plate.includes(q);
  });
});

const handleShipperInput = (event) => {
  searchShipperQuery.value = event.target.value;
  showShipperDropdown.value = true;

  form.value.bien_so_xe = '';
  form.value.nv_giao_hang = '';
  selectedShipperObj.value = null;
};

const selectShipper = (shipper) => {
  selectedShipperObj.value = shipper;
  form.value.nv_giao_hang = shipper.username;
  searchShipperQuery.value = shipper.full_name || shipper.username;

  if (shipper.bien_so_xe) {
    form.value.bien_so_xe = shipper.bien_so_xe;
    searchVehicleQuery.value = '';
  } else {
    form.value.bien_so_xe = '';
    searchVehicleQuery.value = '';
  }

  showShipperDropdown.value = false;
};

const closeShipperDropdown = () => {
  setTimeout(() => {
    showShipperDropdown.value = false;
    if (!form.value.nv_giao_hang) {
      searchShipperQuery.value = '';
    } else {
      searchShipperQuery.value =
        selectedShipperObj.value?.full_name ||
        selectedShipperObj.value?.username;
    }
  }, 200);
};

const fetchCustomerInventory = async () => {
  const newCustId = form.value.customer_id;
  const newAction = currentAction.value;
  const mode = customerMode.value;

  customerInventory.value = [];

  // 1. Chặn việc gọi API lấy tồn kho nếu đang ở luồng NHẬP HÀNG (IMPORT)
  if (!newAction || newAction.includes('IMPORT')) return;

  // 2. Chặn nếu là khách THƯỜNG / LẺ mà chưa chọn Tên Khách Hàng
  if ((mode === 'THUONG' || mode === 'LE') && !newCustId) return;

  isLoadingInventory.value = true;
  try {
    if (mode === 'VIP') {
      // ✅ FIX: NẾU LÀ NỘI BỘ -> GỌI CẢ HÀNG MỚI LẪN HÀNG CŨ VÀ GỘP LẠI
      if (newAction.includes('NOIBO')) {
        const [resNew, resOld] = await Promise.all([
          inventoryService.getVipAvailableExportNew(currentUserKho.value),
          inventoryService.getVipAvailableExportOld(currentUserKho.value),
        ]);

        const dataNew = resNew?.data?.data || [];
        const dataOld = resOld?.data?.data || [];

        // Đánh dấu để phân biệt
        dataNew.forEach((i) => (i.is_old = false));
        dataOld.forEach((i) => (i.is_old = true));

        customerInventory.value = [...dataNew, ...dataOld];
      } else if (newAction === 'VIP_EXPORT_NEW') {
        const res = await inventoryService.getVipAvailableExportNew(
          currentUserKho.value
        );
        if (res && res.data) {
          customerInventory.value = res.data.data;
        }
      }
      // 3. LUỒNG TRẢ NHÀ CUNG CẤP VIP (CŨ)
      else if (newAction === 'VIP_EXPORT_OLD') {
        const res = await inventoryService.getVipAvailableExportOld(
          currentUserKho.value
        );
        if (res && res.data) {
          customerInventory.value = res.data.data;
        }
      }
    } else if (mode === 'THUONG') {
      let res;
      // ✅ FIX: Gộp chung luồng Xuất Thường và Xuất Nội Bộ
      if (newAction === 'THUONG_EXPORT' || newAction.includes('NOIBO')) {
        res = await inventoryService.getRegularAvailableExport(
          newCustId,
          currentUserKho.value
        );
      }

      if (res && res.data) {
        customerInventory.value = res.data.data;
      }
    }
  } catch (error) {
    // console.error('Lỗi khi tải tồn kho:', error);
    toast.error('Không thể tải tồn kho từ máy chủ.');
  } finally {
    isLoadingInventory.value = false;
  }
};

watch([() => form.value.customer_id, currentAction], () => {
  searchInventoryQuery.value = '';
  fetchCustomerInventory();
});

const autoFillItem = (item) => {
  if (currentAction.value.includes('NOIBO')) {
    const isExist = form.value.noi_bo_items.some((i) => {
      if (customerMode.value === 'VIP') return i.id_ton_kho === item.id;
      return i.ten_san_pham === item.ten_san_pham;
    });

    // ================================================================
    // BƯỚC KIỂM TRA (VALIDATION): CHẶN HÀNG THIẾU DỮ LIỆU QUAN TRỌNG
    // ================================================================
    if (customerMode.value === 'VIP') {
      if (
        !item.ma_bill ||
        item.ma_bill === 'N/A' ||
        item.ma_bill.trim() === '' ||
        !item.tinh_thanh ||
        item.tinh_thanh.trim() === '' ||
        item.dia_chi_giao_hang.trim() === ''
      ) {
        toast.info(
          'Thông tin chưa đầy đủ! Vui lòng chuyển sang "Khai Thác Kho Hàng" để cập nhật trước giao hàng.'
        );
        return;
      }
      if (
        !item.ma_san_pham ||
        item.ma_san_pham === 'N/A' ||
        item.ma_san_pham.trim() === '' ||
        item.tinh_thanh.trim() === '' ||
        item.dia_chi_giao_hang.trim() === ''
      ) {
        toast.info(
          'Missing: Thông tin chưa đầy đủ! Vui lòng chuyển sang "Khai Thác Kho Hàng" để cập nhật trước giao hàng.'
        );
        return;
      }
    } else if (customerMode.value === 'THUONG') {
      if (
        !item.ma_san_pham ||
        item.ma_san_pham === 'N/A' ||
        item.ma_san_pham.trim() === '' ||
        !item.tinh_thanh ||
        item.tinh_thanh.trim() === '' ||
        !item.dia_chi_giao_hang ||
        item.dia_chi_giao_hang.trim() === '' ||
        !item.ma_bill ||
        item.ma_bill === 'N/A' ||
        item.ma_bill.trim() === ''
      ) {
        toast.info(
          'Missing: Thông tin chưa đầy đủ! Vui lòng chuyển sang "Khai Thác Kho Hàng" để cập nhật trước giao hàng.'
        );
        return;
      }
    }
    // ================================================================

    if (isExist) {
      toast.info('Sản phẩm này đã được bốc vào giỏ luân chuyển rồi!');
      return;
    }

    if (
      form.value.noi_bo_items.length === 1 &&
      !form.value.noi_bo_items[0].id_ton_kho
    ) {
      form.value.noi_bo_items = [];
    }

    // TẠO TÊN SẢN PHẨM RÕ RÀNG (CÓ TAG MỚI/CŨ CHO VIP)
    let displayName = item.ten_san_pham;
    if (customerMode.value === 'VIP') {
      displayName = 'Hàng Toshiba';
    }

    form.value.noi_bo_items.push({
      id_ton_kho: item.id,
      loai_khach: customerMode.value,
      customer_id: form.value.customer_id || null,
      ma_sp_hoac_id: item.ma_san_pham !== 'N/A' ? item.ma_san_pham : '',
      ten_san_pham: displayName,
      ma_may:
        customerMode.value === 'VIP'
          ? item.ten_san_pham.replace('Mã máy: ', '').trim()
          : '',
      serial: item.serial || '',

      so_luong: item.ton_kho,
      so_kien: item.so_kien || 1, // Để người dùng tự gõ lại nếu gom thùng
      ma_bill: item.ma_bill || '',

      ton_kho_hien_tai: item.ton_kho,
      trong_luong: 0,
      dai: '',
      rong: '',
      cao: '',
      kich_thuoc: '',
      tinh_thanh: item.tinh_thanh || '',
      dia_chi_giao_hang: item.dia_chi_giao_hang || '',
      ghi_chu: item.ghi_chu || '',
    });

    toast.success(`Đã bốc vào giỏ luân chuyển.`);
    return;
  }

  console.log(form.value);
  form.value.id = item.id;
  form.value.ma_kho_spl = item.ma_kho_spl || currentUserKho.value;
  form.value.ngay_nhap_kho_hien_thi = formatDate(item.ngay_nhap_gan_nhat);
  form.value.ghi_chu = item.ghi_chu || '';
  form.value.tinh_thanh = item.tinh_thanh || '';
  form.value.dia_chi_giao_hang = item.dia_chi_giao_hang || '';

  if (item.ma_bill) {
    form.value.ma_bill = item.ma_bill;
  }

  if (customerMode.value === 'VIP') {
    form.value.ma_may = item.ten_san_pham.replace('Mã máy: ', '').trim();
    form.value.ma_san_pham = item.ma_san_pham !== 'N/A' ? item.ma_san_pham : '';
    form.value.serial = item.serial;
    toast.success(`Đã chọn thiết bị: ${form.value.ma_may} (ID: ${item.id})`);
  } else {
    form.value.ten_san_pham = item.ten_san_pham;
    if (currentAction.value === 'THUONG_EXPORT') {
      form.value.ma_san_pham =
        item.ma_san_pham !== 'N/A' ? item.ma_san_pham : '';
      form.value.so_luong = null;
      form.value.so_kien = '';
    }
    toast.success(
      `Bạn đang chọn lô hàng "${item.ten_san_pham}". (Tồn kho: ${item.ton_kho})`
    );
  }
};

const resetForm = (isHardReset = false) => {
  const defaultShipperUsername = isCurrentUserShipper.value
    ? authStore.user?.username
    : '';
  const defaultShipperFullName = isCurrentUserShipper.value
    ? authStore.user?.full_name || authStore.user?.username
    : '';
  const defaultBienSoXe = isCurrentUserShipper.value
    ? authStore.user?.bien_so_xe
    : '';

  if (!isCurrentUserShipper.value) {
    selectedShipperObj.value = null;
  } else {
    selectedShipperObj.value = authStore.user;
  }

  if (isHardReset) {
    form.value = {
      id: '',
      ma_kho_spl: currentUserKho.value || '',
      ma_bill: '',
      ma_san_pham: '',
      ten_san_pham: '',
      ma_may: '',
      so_luong: null,
      kho_tra_hang: '',
      nguoi_nhan: '',
      ghi_chu: '',
      pxk_kho_tsb: '',
      pxk_vp_tsb: '',
      ngay_nhap_kho_hien_thi: '',
      kho_nhan: '',
      doi_tac_van_chuyen: '',
      dia_chi_giao_hang: '',
      tinh_thanh: '',
      noi_bo_items: [
        {
          id_ton_kho: null, // Bổ sung
          loai_khach: '', // Bổ sung
          customer_id: null, // Bổ sung
          ma_sp_hoac_id: '',
          ten_san_pham: '',
          ma_may: '',
          ma_bill: '',
          so_luong: 1,
          so_kien: 1,
          trong_luong: 0,
          kich_thuoc: '',
          ghi_chu: '',
        },
      ],
      nv_giao_hang: defaultShipperUsername,
      bien_so_xe: defaultBienSoXe,
    };
    searchShipperQuery.value = defaultShipperFullName;
    searchCustomerQuery.value = '';
    searchShippingPartnerQuery.value = '';
  } else {
    const currentData = { ...form.value };
    currentData.ghi_chu = '';
    currentData.so_luong = null;
    currentData.so_kien = isExportAction.value ? '' : 1;
    currentData.dia_chi_giao_hang = '';
    currentData.tinh_thanh = '';

    if (customerMode.value === 'THUONG' || customerMode.value === 'LE') {
      currentData.id = '';
      currentData.ma_san_pham = '';
      currentData.ten_san_pham = '';
      currentData.ngay_nhap_kho_hien_thi = '';
    } else if (customerMode.value === 'VIP') {
      currentData.id = '';
      currentData.ma_may = '';
      currentData.ma_san_pham = '';
      currentData.serial = '';
      currentData.ngay_nhap_kho_hien_thi = '';
    }

    currentData.ma_kho_spl = currentUserKho.value || currentData.ma_kho_spl;

    currentData.nv_giao_hang = defaultShipperUsername;
    currentData.bien_so_xe = defaultBienSoXe;
    searchShipperQuery.value = defaultShipperFullName;

    if (!currentData.noi_bo_items) {
      currentData.noi_bo_items = [
        {
          ma_sp_hoac_id: '',
          ten_san_pham: '',
          ma_may: '',
          so_luong: 1,
          so_kien: 1,
          trong_luong: 0,
          kich_thuoc: '',
          ghi_chu: '',
        },
      ];
    }
    form.value = currentData;
  }
};

watch(
  [currentAction, customerMode],
  ([newAction, newMode], [oldAction, oldMode]) => {
    // BẢO VỆ GIỎ HÀNG: Nếu đang ở luồng Nội Bộ và chỉ đổi qua lại giữa các Tab (VIP <-> THUONG)
    if (
      newAction &&
      oldAction &&
      newAction.includes('NOIBO') &&
      oldAction.includes('NOIBO')
    ) {
      // Chỉ xóa thanh tìm kiếm và tải lại danh sách tồn kho theo Tab mới
      searchInventoryQuery.value = '';
      fetchCustomerInventory();
      return; // THOÁT SỚM, TUYỆT ĐỐI KHÔNG GỌI resetForm()
    }

    // Các trường hợp chọn nghiệp vụ khác (Nhập, Xuất bình thường) thì xóa sạch form
    resetForm(true);
  }
);

const handleSubmit = async () => {
  const sanitizeText = (text) => {
    if (!text) return '';
    return String(text).trim().replace(/\s+/g, ' ');
  };

  // console.log(form.value.so_kien);

  form.value.ten_san_pham = sanitizeText(form.value.ten_san_pham);
  form.value.ma_san_pham = sanitizeText(form.value.ma_san_pham);
  form.value.ma_may = sanitizeText(form.value.ma_may);
  form.value.serial = sanitizeText(form.value.serial);
  form.value.ma_bill = sanitizeText(form.value.ma_bill);
  form.value.dia_chi_giao_hang = sanitizeText(form.value.dia_chi_giao_hang);
  form.value.tinh_thanh = sanitizeText(form.value.tinh_thanh);

  if (form.value.noi_bo_items && form.value.noi_bo_items.length > 0) {
    form.value.noi_bo_items.forEach((item) => {
      item.ten_san_pham = sanitizeText(item.ten_san_pham);
      item.ma_may = sanitizeText(item.ma_may);
      item.ma_sp_hoac_id = sanitizeText(item.ma_sp_hoac_id);
    });
  }

  if (currentAction.value.includes('NOIBO')) {
    if (!form.value.kho_nhan) {
      toast.error('Lỗi: Vui lòng chọn Kho Nhận (Đích đến)!');
      return;
    }
    // XÓA ĐOẠN CHECK `hasEmptyName` CŨ Ở ĐÂY ĐI VÌ BÂY GIỜ CHỈ CẦN CHECK ARRAY LENGTH
    if (
      form.value.noi_bo_items.length === 0 ||
      !form.value.noi_bo_items[0].id_ton_kho
    ) {
      toast.error('Lỗi: Không có hàng nào để luân chuyển!');
      return;
    }
  } else {
    if (
      customerMode.value === 'VIP' &&
      !['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(currentAction.value)
    ) {
      if (!form.value.id) {
        toast.error(
          'Lỗi: Bạn phải click chọn 1 thiết bị từ Danh sách có sẵn ở phía trên!'
        );
        return;
      }
    }

    if (
      (customerMode.value === 'THUONG' || customerMode.value === 'LE') &&
      !form.value.customer_id
    ) {
      toast.error('Lỗi: Vui lòng chọn Khách Hàng');
      return;
    }

    if (
      customerMode.value === 'VIP' &&
      !['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(currentAction.value)
    ) {
      if (!form.value.id) {
        toast.error(
          'Lỗi: Bạn phải click chọn 1 thiết bị từ Danh sách có sẵn ở phía trên!'
        );
        return;
      }
    }

    if (customerMode.value === 'VIP' && !form.value.ma_may) {
      toast.error('Lỗi: Mã Máy (Model) không được để trống!');
      return;
    }

    if (customerMode.value === 'VIP' && !form.value.serial) {
      toast.error('Lỗi: Mã Serial không được để trống!');
      return;
    }

    if (
      customerMode.value === 'VIP' &&
      !['VIP_IMPORT_NEW'].includes(currentAction.value) &&
      !form.value.ma_bill
    ) {
      toast.error('Lỗi: Mã Bill không được để trống!');
      return;
    }

    if (
      (customerMode.value === 'THUONG' || customerMode.value === 'LE') &&
      !form.value.ten_san_pham
    ) {
      toast.error('Lỗi: Tên Sản Phẩm không được để trống!');
      return;
    }

    if (
      (customerMode.value === 'THUONG' || customerMode.value === 'LE') &&
      !form.value.so_luong
    ) {
      toast.error('Lỗi: Số Lượng không được để trống!');
      return;
    }

    if (
      (customerMode.value === 'THUONG' || customerMode.value === 'LE') &&
      !form.value.so_kien
    ) {
      toast.error('Lỗi: Số Kiện không được để trống!');
      return;
    }

    if (
      ['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD', 'VIP_EXPORT_NEW'].includes(
        currentAction.value
      ) &&
      !form.value.ma_san_pham
    ) {
      toast.error('Lỗi: Mã Sản Phẩm không được để trống!');
      return;
    }
  }

  if (isExportAction.value || currentAction.value.includes('NOIBO')) {
    if (!form.value.nv_giao_hang) {
      toast.error('Lỗi: Bạn phải chọn Tài xế từ danh sách thả xuống!');
      return;
    }
    if (!form.value.bien_so_xe) {
      toast.error(
        'Lỗi: Bạn phải chọn một Biển Số Xe hợp lệ đang rảnh từ danh sách!'
      );
      return;
    }
  }

  if (
    !isLockedBienSoXe.value &&
    form.value.bien_so_xe &&
    selectedShipperObj.value
  ) {
    try {
      await vehicleService.assignVehicle(
        form.value.bien_so_xe,
        selectedShipperObj.value.username
      );

      if (isCurrentUserShipper.value) {
        authStore.user.bien_so_xe = form.value.bien_so_xe;
      }
    } catch (e) {
      toast.error(
        e.response?.data?.detail || 'Lỗi khi gán xe. Vui lòng chọn xe khác!'
      );
      return;
    }
  }

  isSubmitting.value = true;

  isSubmitting.value = true;
  let payload = {};
  const finalMaKhoSpl = form.value.ma_kho_spl || currentUserKho.value;

  try {
    if (currentAction.value === 'VIP_IMPORT_NEW') {
      payload = {
        ma_may: form.value.ma_may,
        ma_kho_spl: finalMaKhoSpl,
        ma_san_pham: form.value.ma_san_pham,
        ma_bill: form.value.ma_bill,
        ghi_chu: form.value.ghi_chu,
        pxk_kho_tsb: form.value.pxk_kho_tsb,
        pxk_vp_tsb: form.value.pxk_vp_tsb,
        dia_chi_giao_hang: form.value.dia_chi_giao_hang,
        tinh_thanh: form.value.tinh_thanh,
        username: form.username,
        serial_moi: form.value.serial,
      };
      await inventoryService.importNewVip(payload);
    } else if (currentAction.value === 'VIP_EXPORT_NEW') {
      payload = {
        id: form.value.id,
        ma_may: form.value.ma_may,
        ma_kho_spl: finalMaKhoSpl,
        nv_giao_hang: form.value.nv_giao_hang,
        bien_so_xe: form.value.bien_so_xe,
        ma_bill: form.value.ma_bill,
        ghi_chu: form.value.ghi_chu,
        serial_moi: form.value.serial,
        dia_chi_giao_hang: form.value.dia_chi_giao_hang,
        tinh_thanh: form.value.tinh_thanh,
      };
      await inventoryService.exportNewVip(payload);
    } else if (currentAction.value === 'VIP_IMPORT_OLD') {
      payload = {
        ma_may: form.value.ma_may,
        ma_san_pham: form.value.ma_san_pham || null,
        serial_cu: form.value.serial || null,
        ma_kho_spl: finalMaKhoSpl,
        ma_bill: form.value.ma_bill,
        ghi_chu: form.value.ghi_chu,
        dia_chi_giao_hang: form.value.dia_chi_giao_hang,
        tinh_thanh: form.value.tinh_thanh,
      };
      await inventoryService.importOldVip(payload);
    } else if (currentAction.value === 'VIP_EXPORT_OLD') {
      payload = {
        id: form.value.id,
        ma_may: form.value.ma_may,
        ma_san_pham: form.value.ma_san_pham || null,
        serial_cu: form.value.serial || null,
        ma_kho_spl: finalMaKhoSpl,
        ma_bill: form.value.ma_bill,
        nv_giao_hang: form.value.nv_giao_hang,
        bien_so_xe: form.value.bien_so_xe,
        kho_tra_hang: form.value.kho_tra_hang,
        nguoi_nhan: form.value.nguoi_nhan,
        ghi_chu: form.value.ghi_chu,
        dia_chi_giao_hang: form.value.dia_chi_giao_hang,
        tinh_thanh: form.value.tinh_thanh,
      };
      // console.log(payload);
      await inventoryService.exportOldVip(payload);
    } else if (currentAction.value === 'THUONG_IMPORT') {
      payload = {
        id: form.value.id || 0,
        customer_id: form.value.customer_id,
        ma_kho_spl: finalMaKhoSpl,
        ma_bill: form.value.ma_bill,
        ten_san_pham: form.value.ten_san_pham,
        ma_san_pham: form.value.ma_san_pham,
        so_luong: form.value.so_luong,
        so_kien: form.value.so_kien,
        ghi_chu: form.value.ghi_chu,
        dia_chi_giao_hang: form.value.dia_chi_giao_hang,
        tinh_thanh: form.value.tinh_thanh,
      };
      await inventoryService.importRegular(payload);
    } else if (currentAction.value === 'THUONG_EXPORT') {
      payload = {
        id: form.value.id || 0,
        customer_id: form.value.customer_id,
        ma_kho_spl: finalMaKhoSpl,
        ten_san_pham: form.value.ten_san_pham,
        ma_san_pham: form.value.ma_san_pham,
        so_luong: form.value.so_luong,
        nv_giao_hang: form.value.nv_giao_hang,
        bien_so_xe: form.value.bien_so_xe,
        ma_bill: form.value.ma_bill,
        ghi_chu: form.value.ghi_chu,
        so_kien: form.value.so_kien,
        dia_chi_giao_hang: form.value.dia_chi_giao_hang,
        tinh_thanh: form.value.tinh_thanh,
      };
      // console.log(payload);
      await inventoryService.exportRegular(payload);
    } else if (currentAction.value.includes('NOIBO')) {
      const itemsToSend = form.value.noi_bo_items.map((item) => {
        const parts = [item.dai, item.rong, item.cao].filter(
          (val) => val !== null && val !== ''
        );
        const kichThuocGop = parts.length > 0 ? parts.join(' x ') : '';

        return {
          ...item,
          kich_thuoc: kichThuocGop,
          ma_bill_item: item.ma_bill,
          tinh_thanh: item.tinh_thanh,
          dia_chi_giao_hang: item.dia_chi_giao_hang,
        };
      });

      const payload = {
        ma_bill: form.value.ma_bill,
        kho_xuat: currentUserKho.value,
        kho_nhan: form.value.kho_nhan,
        tai_xe: form.value.nv_giao_hang,
        bien_so_xe: form.value.bien_so_xe,
        doi_tac_van_chuyen: form.value.doi_tac_van_chuyen,
        ghi_chu: form.value.ghi_chu,
        items: itemsToSend,
      };
      // console.log('Payload luân chuyển nội bộ:', payload);
      await inventoryService.exportNoiBo(payload);
    }

    toast.success('Gửi phiếu yêu cầu thành công!');
    await fetchCustomerInventory();
  } catch (error) {
    toast.error(
      error.response?.data?.detail ||
        'Lỗi khi gửi yêu cầu. Vui lòng kiểm tra lại!'
    );
    await fetchCustomerInventory();
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style src="../styles/InventoryTransactionStyle.css" scoped></style>
