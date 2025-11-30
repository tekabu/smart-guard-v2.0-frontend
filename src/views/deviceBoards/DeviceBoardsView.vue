<script setup>
import { reactive, computed, onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { getErrorMessage, showErrorToast, showSuccessToast } from "@/utils/errorHandler";

import {
  Dataset,
  DatasetItem,
  DatasetInfo,
  DatasetPager,
  DatasetSearch,
  DatasetShow,
} from "vue-dataset";

import DeviceBoardFormModal from "./DeviceBoardFormModal.vue";
import deviceBoardsService from "@/services/deviceBoards";
import devicesService from "@/services/devices";

// Device boards data from API
const deviceBoards = ref([]);
const isLoading = ref(true);
const error = ref(null);
const pageSize = ref(10);

// Available devices
const availableDevices = ref([]);

// Dynamic board types from API
const availableBoardTypes = ref([]);

// Filters
const filters = ref({
  device_id: null,
  board_type: null,
  active: null
});

// Helper variables
const cols = reactive([
  {
    name: "Device",
    field: "device.device_id",
    sort: "",
  },
  {
    name: "Board Type",
    field: "board_type",
    sort: "",
  },
  {
    name: "Status",
    field: "active",
    sort: "",
  },
  {
    name: "Last Updated",
    field: "updated_at",
    sort: "",
  },
]);

// Sort by functionality
const sortBy = computed(() => {
  return cols.reduce((acc, o) => {
    if (o.sort) {
      o.sort === "asc" ? acc.push(o.field) : acc.push("-" + o.field);
    }
    return acc;
  }, []);
});

// On sort th click
function onSort(event, i) {
  let toset;
  const sortEl = cols[i];

  if (!event.shiftKey) {
    cols.forEach((o) => {
      if (o.field !== sortEl.field) {
        o.sort = "";
      }
    });
  }

  if (!sortEl.sort) {
    toset = "asc";
  }

  if (sortEl.sort === "desc") {
    toset = event.shiftKey ? "" : "asc";
  }

  if (sortEl.sort === "asc") {
    toset = "desc";
  }

  sortEl.sort = toset;
}

// Apply a few Bootstrap 5 optimizations
onMounted(() => {
  // Fetch data on component mount
  fetchAllData();
});

// Fetch all required data
const fetchAllData = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    // Fetch device boards and devices in parallel
    const [boardsRes, devicesRes] = await Promise.all([
      deviceBoardsService.getAll(),
      devicesService.getAll()
    ]);
    
    deviceBoards.value = boardsRes.data;
    availableDevices.value = devicesRes.data.filter(device => device.active);
    
    // Extract unique board types from API data
    const allBoardTypes = [...new Set(boardsRes.data
      .map(board => board.board_type)
      .filter(type => type))];
    
    availableBoardTypes.value = allBoardTypes.sort();
  } catch (err) {
    console.error('Error fetching device boards:', err);
    error.value = 'Failed to load device boards. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Apply filters (now automatic on change)
const applyFilters = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const filterData = {};
    if (filters.value.device_id) filterData.device_id = filters.value.device_id;
    if (filters.value.board_type) filterData.board_type = filters.value.board_type;
    if (filters.value.active !== null) filterData.active = filters.value.active;
    
    const response = await deviceBoardsService.getFiltered(filterData);
    deviceBoards.value = response.data;
  } catch (err) {
    console.error('Error applying filters:', err);
    error.value = 'Failed to apply filters. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Reset filters
const resetFilters = () => {
  filters.value = {
    device_id: null,
    board_type: null,
    active: null
  };
  fetchAllData();
};

// Modal state
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedBoard = ref(null);
const boardToDelete = ref(null);
const isEditMode = ref(false);

// Edit device board
function editDeviceBoard(board) {
  selectedBoard.value = { ...board };
  isEditMode.value = true;
  showEditModal.value = true;
}

// Add new device board
function addDeviceBoard() {
  selectedBoard.value = null;
  isEditMode.value = false;
  showEditModal.value = true;
}

// Save device board (for both create and update)
async function saveDeviceBoard(boardData) {
  try {
    if (isEditMode.value) {
      // Update existing board
      const response = await deviceBoardsService.update(boardData.id, boardData);
      
      // Update board in local list
      const index = deviceBoards.value.findIndex((b) => b.id === boardData.id);
      if (index !== -1) {
        deviceBoards.value[index] = response.data;
      }
      
      // Show success message
      showSuccessToast('Device board updated successfully');
    } else {
      // Create new board
      const response = await deviceBoardsService.create(boardData);
      
      // Add new board to local list
      deviceBoards.value.unshift(response.data);
      
      // Show success message
      showSuccessToast('Device board created successfully');
    }
    
    // Close modal only on successful API request
    showEditModal.value = false;
  } catch (err) {
    console.error('Error saving device board:', err);
    showErrorToast(err);
    // Don't close modal on error - let user fix the issue
  }
}

// Show delete confirmation
function confirmDelete(board) {
  boardToDelete.value = board;
  showDeleteModal.value = true;
}

// Delete device board
async function deleteDeviceBoard() {
  try {
    await deviceBoardsService.delete(boardToDelete.value.id);
    
    // Remove device board from local list
    const index = deviceBoards.value.findIndex((b) => b.id === boardToDelete.value.id);
    if (index !== -1) {
      deviceBoards.value.splice(index, 1);
    }
    
    showDeleteModal.value = false;
    boardToDelete.value = null;
    
    showSuccessToast('Device board deleted successfully');
  } catch (err) {
    console.error('Error deleting device board:', err);
    showErrorToast(err);
  }
}

// Cancel delete
function cancelDelete() {
  showDeleteModal.value = false;
  boardToDelete.value = null;
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}
</script>

<template>
  <!-- Hero -->
  <BasePageHeading title="Device Boards" subtitle="Manage ESP32 boards and hardware components.">
    <template #extra>
      <button 
        class="btn btn-primary" 
        @click="addDeviceBoard"
      >
        <i class="fa fa-plus me-1"></i> Add New
      </button>
    </template>
  </BasePageHeading>
  <!-- END Hero -->

  <!-- Page Content -->
  <div class="content">
    <!-- Filters -->
    <BaseBlock title="Filters" content-full>
      <div class="row">
        <div class="col-md-3">
          <label class="form-label">Device</label>
          <select class="form-select" v-model="filters.device_id" @change="applyFilters">
            <option :value="null">All Devices</option>
            <option
              v-for="device in availableDevices"
              :key="device.id"
              :value="device.id"
            >
              {{ device.device_id }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Board Type</label>
          <select class="form-select" v-model="filters.board_type" @change="applyFilters">
            <option :value="null">All Types</option>
            <option
              v-for="type in availableBoardTypes"
              :key="type"
              :value="type"
            >
              {{ type }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Status</label>
          <select class="form-select" v-model="filters.active" @change="applyFilters">
            <option :value="null">All Status</option>
            <option :value="true">Active</option>
            <option :value="false">Inactive</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">&nbsp;</label>
          <button class="btn btn-secondary w-100" @click="resetFilters">
            <i class="fa fa-undo me-1"></i> Reset
          </button>
        </div>
      </div>
    </BaseBlock>

    <BaseBlock title="Device Boards List" content-full>
      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading device boards...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <!-- Data table -->
      <template v-else>
        <Dataset
          v-slot="{ ds }"
          :ds-page-size="pageSize"
:ds-data="deviceBoards"
          :ds-sortby="sortBy"
          :ds-search-in="['device.device_id', 'board_type', 'active']"
        >
          <div class="row" :data-page-count="ds.dsPagecount">
            <div class="col-md-6 py-2">
              <div class="d-flex align-items-center gap-2">
                <label class="form-label mb-0">Show</label>
                <select 
                  class="form-select" 
                  style="width: auto; min-width: 65px; max-width: 80px;"
                  v-model="pageSize"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <label class="form-label mb-0">entries</label>
              </div>
            </div>
            <div class="col-md-6 py-2">
              <DatasetSearch ds-search-placeholder="Search..." />
            </div>
          </div>
          <hr />
          <div class="row">
            <div class="col-md-12">
              <div class="table-responsive">
                <table class="table table-striped mb-0">
                  <thead>
                    <tr>
                      <th
                        v-for="(th, index) in cols"
                        :key="th.field"
                        :class="['sort', th.sort]"
                        @click="onSort($event, index)"
                      >
                        {{ th.name }} <i class="gg-select float-end"></i>
                      </th>
                      <th scope="col" class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <DatasetItem tag="tbody">
                    <template #default="{ row, rowIndex }">
                      <tr>
                        <td>{{ row.device?.device_id || '-' }}</td>
                        <td>
                          <span class="badge bg-info">{{ row.board_type }}</span>
                        </td>
                        <td>
                          <span :class="['badge', row.active ? 'bg-success' : 'bg-danger']">
                            {{ row.active ? 'Active' : 'Inactive' }}
                          </span>
                        </td>
                        <td>{{ formatDate(row.updated_at) }}</td>
                        <td class="text-center">
                          <div class="btn-group">
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="editDeviceBoard(row)"
                              title="Edit Device Board"
                            >
                              <i class="fa fa-fw fa-pencil-alt"></i>
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="confirmDelete(row)"
                              title="Delete Device Board"
                            >
                              <i class="fa fa-fw fa-times"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </DatasetItem>
                </table>
              </div>
            </div>
          </div>
          <div
            class="d-flex flex-md-row flex-column justify-content-between align-items-center"
          >
            <DatasetInfo class="py-3" />
            <DatasetPager class="flex-wrap py-3" />
          </div>
        </Dataset>
      </template>
    </BaseBlock>
  </div>
  <!-- END Page Content -->

  <!-- Device Board Form Modal -->
  <DeviceBoardFormModal
    :board="selectedBoard"
    :show="showEditModal"
    :devices="availableDevices"
    @update:show="showEditModal = $event"
    @save="saveDeviceBoard"
  />

  <!-- Delete Confirmation Modal -->
  <div
    class="modal"
    :class="{ show: showDeleteModal, 'd-block': showDeleteModal }"
    tabindex="-1"
    role="dialog"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm Delete</h5>
          <button
            type="button"
            class="btn-close"
            @click="cancelDelete"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <p v-if="boardToDelete">
            Are you sure you want to delete this device board?
          </p>
          <p class="text-muted mb-0">
            Device: {{ boardToDelete?.device?.device_id }}<br>
            Type: {{ boardToDelete?.board_type }}
          </p>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="cancelDelete"
          >
            Cancel
          </button>
          <button type="button" class="btn btn-danger" @click="deleteDeviceBoard">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="showDeleteModal"
    class="modal-backdrop fade"
    :class="{ show: showDeleteModal }"
  ></div>
</template>

<style lang="scss" scoped>
.gg-select {
  box-sizing: border-box;
  position: relative;
  display: block;
  transform: scale(1);
  width: 22px;
  height: 22px;
}
.gg-select::after,
.gg-select::before {
  content: "";
  display: block;
  box-sizing: border-box;
  position: absolute;
  width: 8px;
  height: 8px;
  left: 7px;
  transform: rotate(-45deg);
}
.gg-select::before {
  border-left: 2px solid;
  border-bottom: 2px solid;
  bottom: 4px;
  opacity: 0.3;
}
.gg-select::after {
  border-right: 2px solid;
  border-top: 2px solid;
  top: 4px;
  opacity: 0.3;
}
th.sort {
  cursor: pointer;
  user-select: none;
  &.asc {
    .gg-select::after {
      opacity: 1;
    }
  }
  &.desc {
    .gg-select::before {
      opacity: 1;
    }
  }
}

.modal.show {
  display: block;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1040;
  width: 100vw;
  height: 100vh;
  background-color: #000;
}

.modal-backdrop.show {
  opacity: 0.5;
}

.modal {
  z-index: 1050;
}
</style>