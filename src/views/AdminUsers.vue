<template>
  <AdminLayout>
    <div class="page-header">
      <div class="title-group">
        <Users class="title-icon" />
        <h2>Quản lý Người Dùng</h2>
      </div>

      <div class="header-actions">
        <div class="search-box">
          <Search class="icon-sm search-icon" />
          <input
            type="text"
            :value="searchQuery"
            @input="handleSearchInput"
            placeholder="Tìm tài khoản, họ tên..."
            class="search-input"
          />
        </div>

        <button @click="openUserModal()" class="btn btn-primary">
          <Plus class="icon-sm" /> Thêm Người Dùng
        </button>
      </div>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th width="80">ID</th>
              <th>Tài khoản</th>
              <th>Họ & Tên</th>
              <th>Kho Làm Việc</th>
              <th>Biển Số Xe</th>
              <th>Vai trò (Roles)</th>
              <th class="text-center" width="150">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>#{{ user.id }}</td>
              <td>
                <strong class="text-primary">{{ user.username }}</strong>
              </td>
              <td>{{ user.full_name }}</td>

              <td>
                <span v-if="user.ma_kho_spl">
                  {{ user.ma_kho_spl }}
                </span>
                <span v-else class="text-muted" style="font-size: 13px">~</span>
              </td>

              <td>
                <div v-if="user.bien_so_xe">
                  {{ user.bien_so_xe }}
                </div>
                <span v-else class="text-muted" style="font-size: 13px">~</span>
              </td>

              <td>
                <div class="badges-wrapper">
                  <span
                    v-for="role in user.roles"
                    :key="role.id"
                    class="badge role-badge"
                  >
                    {{ role.name }}
                  </span>
                  <span v-if="!user.roles.length" class="text-muted">
                    Chưa phân quyền
                  </span>
                </div>
              </td>
              <td class="text-center actions-cell">
                <button
                  @click="openUserModal(user)"
                  class="btn btn-sm btn-secondary btn-icon-only"
                  title="Sửa thông tin"
                >
                  <Edit class="icon-sm" />
                </button>

                <button
                  @click="openRoleModal(user)"
                  class="btn btn-sm btn-save btn-icon-only"
                  title="Gán Vai trò"
                >
                  <Shield class="icon-sm" />
                </button>
              </td>
            </tr>

            <tr v-if="users.length === 0">
              <td colspan="7" class="text-center text-muted empty-row">
                {{
                  searchQuery
                    ? `Không tìm thấy người dùng nào khớp với "${searchQuery}"`
                    : 'Chưa có dữ liệu người dùng.'
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination-container" v-if="totalUsers > 0">
        <div class="pagination-info">
          Hiển thị {{ (currentPage - 1) * limit + 1 }} đến
          {{ Math.min(currentPage * limit, totalUsers) }} trong tổng số
          <strong>{{ totalUsers }}</strong> người dùng
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

    <div v-if="showRoleModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content modal-lg">
        <div class="modal-header">
          <h3>
            Gán Vai trò cho:
            <span class="text-primary">{{ selectedUser?.username }}</span>
          </h3>
          <button @click="closeModal" class="btn-close">
            <X class="icon-sm" />
          </button>
        </div>
        <div class="roles-grid scrollable-grid">
          <label
            v-for="role in allRoles"
            :key="role.id"
            class="checkbox-label"
            :class="{ 'is-checked': checkedRoleIds.includes(role.id) }"
          >
            <input type="checkbox" :value="role.id" v-model="checkedRoleIds" />
            <div class="role-info">
              <span class="role-name">{{ role.name }}</span>
              <span class="role-code">{{ role.code }}</span>
            </div>
          </label>
        </div>
        <div class="modal-actions">
          <button @click="closeModal" class="btn btn-secondary">Hủy bỏ</button>
          <button
            @click="confirmSaveRoles"
            :disabled="isSaving"
            class="btn btn-save"
          >
            <Save class="icon-sm" v-if="!isSaving" />
            {{ isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showUserModal"
      class="modal-overlay"
      @click.self="showUserModal = false"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEditUser ? 'Sửa thông tin User' : 'Tạo User Mới' }}</h3>
          <button @click="showUserModal = false" class="btn-close">
            <X class="icon-sm" />
          </button>
        </div>

        <form @submit.prevent="confirmSaveUser">
          <div class="scrollable-form"></div>
          <div class="form-group">
            <label
              >Tên đăng nhập (Username)
              <span class="text-danger" v-if="!isEditUser">*</span></label
            >
            <input
              type="text"
              v-model="userForm.username"
              :disabled="isEditUser"
              required
              placeholder="Nhập tên tài khoản"
            />
          </div>
          <div class="form-group">
            <label>Họ và Tên <span class="text-danger">*</span></label>
            <input
              type="text"
              v-model="userForm.full_name"
              required
              placeholder="VD: Nguyễn Văn A..."
            />
          </div>
          <div class="form-group">
            <label>
              Mật khẩu {{ isEditUser ? '(Bỏ trống nếu không đổi)' : '*' }}
            </label>

            <div
              class="password-input-wrapper"
              style="position: relative; display: flex; align-items: center"
            >
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="userForm.password"
                :required="!isEditUser"
                placeholder="Nhập mật khẩu..."
                style="width: 100%; padding-right: 40px"
              />

              <button
                type="button"
                @click="showPassword = !showPassword"
                title="Ẩn/Hiện mật khẩu"
                style="
                  position: absolute;
                  right: 10px;
                  background: none;
                  border: none;
                  cursor: pointer;
                  color: #64748b;
                  padding: 0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                <Eye v-if="!showPassword" style="width: 20px; height: 20px" />
                <EyeOff v-else style="width: 20px; height: 20px" />
              </button>
            </div>
          </div>

          <div class="form-group mt-3">
            <label>Kho làm việc (Chi nhánh)</label>
            <select
              required
              v-model="userForm.ma_kho_spl"
              class="form-control"
              style="
                width: 100%;
                padding: 8px;
                border-radius: 4px;
                border: 1px solid #ccc;
              "
            >
              <option value="">-- Vị trí --</option>
              <option
                v-for="loc in locations"
                :key="loc.ma_kho"
                :value="loc.ma_kho"
              >
                {{ loc.ten_kho }} ({{ loc.ma_kho }})
              </option>
            </select>
          </div>

          <div
            class="form-group mt-3"
            style="
              background: #e8f5e9;
              padding: 12px;
              border-radius: 6px;
              border: 1px solid #c8e6c9;
            "
          >
            <label
              style="
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                margin: 0;
                color: #2e7d32;
                font-weight: 600;
              "
            >
              <input
                type="checkbox"
                v-model="userForm.is_shipper"
                style="width: 18px; height: 18px"
              />
              Tài khoản này là Nhân viên Giao hàng (Shipper)
            </label>
          </div>

          <template v-if="userForm.is_shipper">
            <div class="form-group mt-3 vehicle-dropdown-container">
              <label>
                Biển Số Xe
                <span class="text-muted"
                  >(Có thể để trống nếu chưa gán xe)</span
                >
              </label>

              <div class="search-box" style="width: 100%">
                <Truck class="icon-sm search-icon" style="color: #10b981" />
                <input
                  type="text"
                  :value="userForm.bien_so_xe"
                  @focus="
                    showVehicleDropdown = true;
                    loadVehicles('');
                  "
                  @blur="closeVehicleDropdown"
                  @input="handleVehicleSearch"
                  placeholder="Gõ để tìm biển số xe trống..."
                  class="form-control search-input"
                  style="width: 100%; padding-left: 35px"
                  autocomplete="off"
                />
              </div>

              <ul v-if="showVehicleDropdown" class="vehicle-dropdown-list">
                <li
                  @mousedown.prevent="selectVehicle(null)"
                  class="vehicle-dropdown-item vehicle-dropdown-remove"
                >
                  <X class="icon-sm" style="margin-right: 6px" />
                  Gỡ bỏ xe khỏi nhân viên này
                </li>

                <li
                  v-for="xe in filteredVehicles"
                  :key="xe.bien_so_xe"
                  @mousedown.prevent="selectVehicle(xe)"
                  class="vehicle-dropdown-item"
                >
                  <span class="vehicle-plate-text">{{ xe.bien_so_xe }}</span>

                  <span
                    :class="[
                      'vehicle-status-badge',
                      xe.trang_thai === 'AVAILABLE'
                        ? 'status-available'
                        : 'status-busy',
                    ]"
                  >
                    {{
                      xe.trang_thai === 'AVAILABLE' ? 'Sẵn sàng' : 'Đang bận'
                    }}
                  </span>
                </li>

                <li
                  v-if="filteredVehicles.length === 0"
                  class="vehicle-dropdown-empty"
                >
                  Không tìm thấy xe nào phù hợp.
                </li>
              </ul>
            </div>
          </template>

          <div class="modal-actions mt-4">
            <button
              type="button"
              @click="showUserModal = false"
              class="btn btn-secondary"
            >
              Hủy
            </button>
            <button type="submit" class="btn btn-save" :disabled="isSavingUser">
              <Save class="icon-sm" v-if="!isSavingUser" />
              {{ isSavingUser ? 'Đang lưu...' : 'Lưu lại' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <ConfirmModal
      :isOpen="showConfirm"
      :title="confirmTitle"
      :message="confirmMessage"
      @confirm="handleConfirm"
      @cancel="showConfirm = false"
    />
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { adminService } from '../services/admin';
import { viTriKhoService } from '../services/vi_tri_kho';
import AdminLayout from '../layouts/AdminLayout.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import { useToast } from '../composables/useToast';
import { vehicleService } from '../services/vehicle';
import {
  Users,
  Plus,
  Shield,
  Edit,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Truck,
  Search,
  Eye,
  EyeOff,
} from 'lucide-vue-next';

const toast = useToast();
const searchQuery = ref('');
let searchTimeout = null;

const showVehicleDropdown = ref(false);
const vehicles = ref([]);
const filteredVehicles = ref([]);
let vehicleTimeout = null;

const originalBienSoXe = ref('');

const showConfirm = ref(false);
const confirmTitle = ref('');
const confirmMessage = ref('');
const confirmActionType = ref('');

const showPassword = ref(false);

const showUserModal = ref(false);
const isEditUser = ref(false);
const isSavingUser = ref(false);
const editUserId = ref(null);

const userForm = ref({
  username: '',
  full_name: '',
  password: '',
  ma_kho_spl: '',
  is_shipper: false,
  bien_so_xe: '',
});

const users = ref([]);
const allRoles = ref([]);
const locations = ref([]);
const totalUsers = ref(0);

const currentPage = ref(1);
const limit = ref(5);

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

const handleSearchInput = (event) => {
  searchQuery.value = event.target.value;

  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchData();
  }, 400);
};

const loadVehicles = async (searchStr = '') => {
  try {
    const res = await vehicleService.getVehicles(searchStr, 'AVAILABLE');
    vehicles.value = res.data;
    filteredVehicles.value = res.data;
  } catch (error) {
    console.error('Lỗi tải danh sách xe:', error);
  }
};

const handleVehicleSearch = (event) => {
  const val = event.target.value;
  userForm.value.bien_so_xe = val;
  showVehicleDropdown.value = true;

  clearTimeout(vehicleTimeout);
  vehicleTimeout = setTimeout(() => {
    loadVehicles(val);
  }, 300);
};

const selectVehicle = (xe) => {
  if (xe === null) {
    userForm.value.bien_so_xe = '';
  } else {
    userForm.value.bien_so_xe = xe.bien_so_xe;
  }
  showVehicleDropdown.value = false;
};

const closeVehicleDropdown = () => {
  setTimeout(() => {
    showVehicleDropdown.value = false;

    if (userForm.value.bien_so_xe && userForm.value.bien_so_xe.trim() !== '') {
      if (
        isEditUser.value &&
        userForm.value.bien_so_xe === originalBienSoXe.value
      ) {
        return;
      }

      const isValid = filteredVehicles.value.some(
        (v) => v.bien_so_xe === userForm.value.bien_so_xe
      );

      if (!isValid) {
        toast.error(
          'Xe này không hợp lệ, không tồn tại hoặc ĐANG BỊ TÀI XẾ KHÁC SỬ DỤNG!'
        );
        userForm.value.bien_so_xe = originalBienSoXe.value;
      }
    }
  }, 200);
};

const totalPages = computed(() => {
  return Math.ceil(totalUsers.value / limit.value);
});

const loadLocations = async () => {
  try {
    const res = await viTriKhoService.getViTriKho();
    locations.value = res.data?.data || res.data || [];
  } catch (error) {
    console.error('Lỗi tải danh sách vị trí kho:', error);
  }
};

const openUserModal = (user = null) => {
  if (user) {
    isEditUser.value = true;
    editUserId.value = user.id;
    originalBienSoXe.value = user.bien_so_xe || '';
    const isShipperBool =
      user.is_shipper === true ||
      user.is_shipper === 1 ||
      user.is_shipper === '1';
    userForm.value = {
      username: user.username,
      full_name: user.full_name,
      password: '',
      ma_kho_spl: user.ma_kho_spl || '',
      is_shipper: isShipperBool,
      bien_so_xe: user.bien_so_xe || '',
    };
  } else {
    isEditUser.value = false;
    editUserId.value = null;
    userForm.value = {
      username: '',
      full_name: '',
      password: '',
      ma_kho_spl: '',
      is_shipper: false,
      bien_so_xe: '',
    };
  }
  showUserModal.value = true;
};

const confirmSaveUser = () => {
  confirmTitle.value = isEditUser.value
    ? 'Xác nhận Cập nhật'
    : 'Xác nhận Tạo mới';
  confirmMessage.value = isEditUser.value
    ? 'Bạn có chắc chắn muốn thay đổi thông tin của Người dùng này?'
    : 'Bạn có chắc chắn muốn tạo Người dùng mới này vào hệ thống?';
  confirmActionType.value = 'user';
  showConfirm.value = true;
};

const executeSaveUser = async () => {
  showConfirm.value = false;
  isSavingUser.value = true;
  try {
    const payload = {
      full_name: userForm.value.full_name,
      ma_kho_spl: userForm.value.ma_kho_spl || null,
      is_shipper: userForm.value.is_shipper,
    };

    if (userForm.value.is_shipper) {
      payload.bien_so_xe =
        userForm.value.bien_so_xe && userForm.value.bien_so_xe.trim() !== ''
          ? userForm.value.bien_so_xe.trim()
          : null;
    } else {
      payload.bien_so_xe = null;
    }

    if (userForm.value.password) payload.password = userForm.value.password;

    if (isEditUser.value) {
      await adminService.updateUser(editUserId.value, payload);
      toast.success('Cập nhật thông tin Người dùng thành công!');
    } else {
      payload.username = userForm.value.username;
      await adminService.createUser(payload);
      toast.success('Tạo Người dùng mới thành công!');
    }

    await fetchData();
    showUserModal.value = false;
  } catch (error) {
    toast.error(error.response?.data?.detail || 'Lỗi hệ thống!');
  } finally {
    isSavingUser.value = false;
  }
};

const showRoleModal = ref(false);
const selectedUser = ref(null);
const checkedRoleIds = ref([]);
const isSaving = ref(false);

const fetchData = async () => {
  try {
    const skip = (currentPage.value - 1) * limit.value;

    const [usersRes, rolesRes] = await Promise.all([
      adminService.getUsers(skip, limit.value, searchQuery.value),
      adminService.getRoles(),
    ]);

    users.value = usersRes.data.data || usersRes.data;
    totalUsers.value = usersRes.data.total || usersRes.data.length;
    allRoles.value = rolesRes.data.filter(
      (role) => role.code !== 'ROLE_SUPER_ADMIN'
    );
  } catch (error) {
    toast.error('Không thể tải dữ liệu từ máy chủ.');
  }
};

const changePage = (pageNumber) => {
  if (pageNumber >= 1 && pageNumber <= totalPages.value) {
    currentPage.value = pageNumber;
    fetchData();
  }
};

onMounted(() => {
  fetchData();
  loadLocations();
});

const openRoleModal = (user) => {
  selectedUser.value = user;
  checkedRoleIds.value = user.roles.map((r) => r.id);
  showRoleModal.value = true;
};

const closeModal = () => {
  showRoleModal.value = false;
  selectedUser.value = null;
  checkedRoleIds.value = [];
};

const confirmSaveRoles = () => {
  confirmTitle.value = 'Xác nhận Cấp quyền';
  confirmMessage.value =
    'Bạn có chắc chắn muốn thay đổi Vai trò của người dùng này?';
  confirmActionType.value = 'roles';
  showConfirm.value = true;
};

const executeSaveUserRoles = async () => {
  if (!selectedUser.value) return;
  showConfirm.value = false;
  isSaving.value = true;

  try {
    await adminService.syncUserRoles(
      selectedUser.value.id,
      checkedRoleIds.value
    );
    const updatedRoles = allRoles.value.filter((r) =>
      checkedRoleIds.value.includes(r.id)
    );
    selectedUser.value.roles = updatedRoles;
    toast.success('Cập nhật Vai trò thành công!');
    closeModal();
  } catch (error) {
    toast.error(error.response?.data?.detail || 'Lỗi khi lưu vai trò!');
  } finally {
    isSaving.value = false;
  }
};

const handleConfirm = () => {
  if (confirmActionType.value === 'user') executeSaveUser();
  else if (confirmActionType.value === 'roles') executeSaveUserRoles();
};
</script>

<style src="../styles/AdminUsersStyle.css" scoped></style>
