<script setup>
import { reactive, computed, onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { getErrorMessage, showErrorToast, showSuccessToast } from "@/utils/errorHandler";
import { getSortedFilterOptions } from "@/utils/naturalSort";

import {
  Dataset,
  DatasetItem,
  DatasetInfo,
  DatasetPager,
  DatasetSearch,
  DatasetShow,
} from "vue-dataset";

import DeviceFormModal from "./DeviceFormModal.vue";
import devicesService from "@/services/devices";

// Devices data from API
const devices = ref([]);
const isLoading = ref(true);
const error = ref(null);
const pageSize = ref("10");

// Helper variables
const cols = reactive([
  {
    name: "Device ID",
    field: "device_id",
    sort: "",
  },
  {
    name: "Open Duration",
    field: "door_open_duration_seconds",
    sort: "",
  },
  {
    name: "Last Accessed",
    field: "last_accessed_at",
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
  // Fetch devices on component mount
  applyFilters();

  // Remove "entries" text and resize select from DatasetShow component
  // Use multiple attempts to ensure it works even after slow page loads
  const hideEntriesText = () => {
    const formInlineElements = document.querySelectorAll('.form-inline');
    formInlineElements.forEach(element => {
      const labels = element.querySelectorAll('label');
      labels.forEach((label, index) => {
        if (label.textContent.includes('entries')) {
          label.style.display = 'none';
        }
        // Also hide the last label if it's not the first one
        if (index > 0 && index === labels.length - 1) {
          label.style.display = 'none';
        }
      });

      // Make select smaller
      const selectElement = element.querySelector('select');
      if (selectElement) {
        selectElement.style.width = '60px';
        selectElement.style.minWidth = '60px';
        selectElement.style.maxWidth = '60px';
      }
    });
  };

  // Try multiple times with different delays to ensure it works
  setTimeout(hideEntriesText, 100);
  setTimeout(hideEntriesText, 300);
  setTimeout(hideEntriesText, 500);
});

// Fetch devices from API
const fetchDevices = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await devicesService.getAll();
    devices.value = response.data;
  } catch (err) {
    console.error('Error fetching devices:', err);
    error.value = 'Failed to load devices. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Apply filters
const applyFilters = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await devicesService.getAll();
    devices.value = response.data;
  } catch (err) {
    console.error('Error applying filters:', err);
    error.value = getErrorMessage(err);
  } finally {
    isLoading.value = false;
  }
};

// Reset filters
const resetFilters = () => {
  applyFilters();
};

// Modal state
const showFormModal = ref(false);
const showDeleteModal = ref(false);
const selectedDevice = ref(null);
const deviceToDelete = ref(null);
const isEditMode = ref(false);

// Edit device
function editDevice(device) {
  selectedDevice.value = { ...device };
  isEditMode.value = true;
  showFormModal.value = true;
}

// Add new device
function addDevice() {
  selectedDevice.value = null;
  isEditMode.value = false;
  showFormModal.value = true;
}

// Save device (for both create and update)
async function saveDevice(deviceData) {
  try {
    if (isEditMode.value) {
      // Update existing device
      const response = await devicesService.update(deviceData.id, deviceData);
      
      // Update device in local list
      const index = devices.value.findIndex((d) => d.id === deviceData.id);
      if (index !== -1) {
        devices.value[index] = response.data;
      }
      
      showSuccessToast('Device updated successfully');
    } else {
      // Create new device
      const response = await devicesService.create(deviceData);
      
      // Add new device to local list
      devices.value.unshift(response.data);
      
      showSuccessToast('Device created successfully');
    }
    
    // Close modal only on successful API request
    showFormModal.value = false;
  } catch (err) {
    console.error('Error saving device:', err);
    showErrorToast(err);
    // Don't close modal on error - let user fix the issue
  }
}

// Show delete confirmation
function confirmDelete(device) {
  deviceToDelete.value = device;
  showDeleteModal.value = true;
}

// Delete device
async function deleteDevice() {
  try {
    const deviceName = deviceToDelete.value.name || deviceToDelete.value.device_id;
    await devicesService.delete(deviceToDelete.value.id);
    
    // Remove device from local list
    const index = devices.value.findIndex((d) => d.id === deviceToDelete.value.id);
    if (index !== -1) {
      devices.value.splice(index, 1);
    }
    
    showDeleteModal.value = false;
    deviceToDelete.value = null;
    showSuccessToast('Device deleted successfully');
  } catch (err) {
    console.error('Error deleting device:', err);
    showErrorToast(err);
  }
}

// Cancel delete
function cancelDelete() {
  showDeleteModal.value = false;
  deviceToDelete.value = null;
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}
</script>

<template>
  <!-- Hero -->
  <BasePageHeading title="Devices" subtitle="Manage door lock devices and hardware.">
    <template #extra>
      <button 
        class="btn btn-primary" 
        @click="addDevice"
      >
        <i class="fa fa-plus me-1"></i> Add New
      </button>
    </template>
  </BasePageHeading>
  <!-- END Hero -->

  <!-- Page Content -->
  <div class="content">

    <BaseBlock title="Device List" content-full>
      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading devices...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <!-- Data table -->
      <template v-else>
        <Dataset
          v-slot="{ ds }"
          :ds-data="devices"
          :ds-sortby="sortBy"
          :ds-search-in="['device_id', 'door_open_duration_seconds']"
          :ds-page-size="Number(pageSize)"
        >
          <div class="row" :data-page-count="ds.dsPagecount">
            <div class="col-md-6 py-2">
              <DatasetShow
                v-model="pageSize"
                ds-show-label="Show"
                style="display: flex; align-items: center; gap: 0.5rem; max-width: 200px;"
              />
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
                        <td>{{ row.device_id }}</td>
                        <td>{{ row.door_open_duration_seconds }}s</td>
                        <td>{{ formatDate(row.last_accessed_at) }}</td>
                        <td>{{ formatDate(row.updated_at) }}</td>
                        <td class="text-center">
                          <div class="btn-group">
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="editDevice(row)"
                              title="Edit Device"
                            >
                              <i class="fa fa-fw fa-pencil-alt"></i>
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="confirmDelete(row)"
                              title="Delete Device"
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

  <!-- Device Form Modal -->
  <DeviceFormModal
    :device="selectedDevice"
    :show="showFormModal"
    @update:show="showFormModal = $event"
    @save="saveDevice"
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
          <p v-if="deviceToDelete">
            Are you sure you want to delete device
            <strong>{{ deviceToDelete.device_id }}</strong>?
          </p>
          <p class="text-muted mb-0">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="cancelDelete"
          >
            Cancel
          </button>
          <button type="button" class="btn btn-danger" @click="deleteDevice">
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

/* Hide the "entries" text from DatasetShow */
.form-inline label:nth-child(3) {
  display: none;
}

/* Alternative approach - hide all labels after the select */
.form-inline select + label {
  display: none;
}

/* More aggressive approach - hide labels containing "entries" */
.form-inline label:contains("entries") {
  display: none;
}

/* Hide any label that comes after the select in form-inline */
.form-inline label:not(:first-child) {
  display: none;
}

/* Make the select smaller in DatasetShow - more specific selectors */
.form-inline select.form-control {
  width: 60px !important;
  min-width: 60px !important;
  max-width: 60px !important;
}

.form-inline .form-control.mr-1 {
  width: 60px !important;
  min-width: 60px !important;
  max-width: 60px !important;
}

.form-inline .form-control.ml-1 {
  width: 60px !important;
  min-width: 60px !important;
  max-width: 60px !important;
}

/* Additional selectors for DatasetShow component */
.form-inline .form-select {
  width: 60px !important;
  min-width: 60px !important;
  max-width: 60px !important;
}

.form-inline label:last-of-type {
  display: none;
}
</style>