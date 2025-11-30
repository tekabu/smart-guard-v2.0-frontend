<script setup>
import { reactive, computed, onMounted, ref } from "vue";
import Swal from "sweetalert2";

import {
  Dataset,
  DatasetItem,
  DatasetInfo,
  DatasetPager,
  DatasetSearch,
  DatasetShow,
} from "vue-dataset";

import FacultyFormModal from "./FacultyFormModal.vue";
import facultyService from "@/services/faculty";

// Faculty data from API
const faculty = ref([]);
const isLoading = ref(true);
const error = ref(null);
const pageSize = ref(10);

// Filter state
const activeFilter = ref(null);
const departmentFilter = ref(null);

// Dynamic filter options
const availableDepartments = ref([]);

// Helper variables
const cols = reactive([
  {
    name: "Faculty ID",
    field: "faculty_id",
    sort: "",
  },
  {
    name: "Name",
    field: "name",
    sort: "",
  },
  {
    name: "Email",
    field: "email",
    sort: "",
  },
  {
    name: "Department",
    field: "department",
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

// Reset filters
const resetFilters = () => {
  activeFilter.value = null;
  departmentFilter.value = null;
  applyFilters();
};

// Apply a few Bootstrap 5 optimizations
onMounted(() => {
  // Fetch faculty on component mount
  applyFilters();
});

// Apply filters
const applyFilters = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await facultyService.getAll();
    let filteredData = response.data;
    
    // Extract unique departments from API data
    const allDepartments = [...new Set(response.data
      .map(member => member.department)
      .filter(dept => dept))];
    
    availableDepartments.value = allDepartments.sort();
    
    // Apply active filter
    if (activeFilter.value !== null) {
      filteredData = filteredData.filter(member => member.active === activeFilter.value);
    }
    
    // Apply department filter
    if (departmentFilter.value) {
      filteredData = filteredData.filter(member => member.department === departmentFilter.value);
    }
    
    faculty.value = filteredData;
  } catch (err) {
    console.error('Error applying filters:', err);
    error.value = 'Failed to apply filters. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Modal state
const showFormModal = ref(false);
const showDeleteModal = ref(false);
const selectedFaculty = ref(null);
const facultyToDelete = ref(null);
const isEditMode = ref(false);

// Edit faculty member
function editFacultyMember(facultyMember) {
  selectedFaculty.value = { ...facultyMember };
  isEditMode.value = true;
  showFormModal.value = true;
}

// Add new faculty member
function addFacultyMember() {
  selectedFaculty.value = null;
  isEditMode.value = false;
  showFormModal.value = true;
}

// Save faculty member (for both create and update)
async function saveFacultyMember(facultyData) {
  try {
    if (isEditMode.value) {
      // Update existing faculty
      const response = await facultyService.update(facultyData.id, facultyData);
      
      // Update faculty in local list
      const index = faculty.value.findIndex((f) => f.id === facultyData.id);
      if (index !== -1) {
        faculty.value[index] = response.data;
      }
      
      // Show success message
      await new Promise(resolve => setTimeout(resolve, 100));
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Faculty member updated successfully',
        showConfirmButton: false,
        timer: 3000
      });
    } else {
      // Create new faculty
      const response = await facultyService.create(facultyData);
      
      // Add new faculty to local list
      faculty.value.unshift(response.data);
      
      // Show success message
      await new Promise(resolve => setTimeout(resolve, 100));
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Faculty member created successfully',
        showConfirmButton: false,
        timer: 3000
      });
    }
    
    showFormModal.value = false;
  } catch (err) {
    console.error('Error saving faculty member:', err);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Failed to save faculty member',
      showConfirmButton: false,
      timer: 3000
    });
  }
}

// Show delete confirmation
function confirmDelete(facultyMember) {
  facultyToDelete.value = facultyMember;
  showDeleteModal.value = true;
}

// Delete faculty member
async function deleteFacultyMember() {
  try {
    const facultyName = facultyToDelete.value.name;
    await facultyService.delete(facultyToDelete.value.id);
    
    // Remove faculty member from local list
    const index = faculty.value.findIndex((f) => f.id === facultyToDelete.value.id);
    if (index !== -1) {
      faculty.value.splice(index, 1);
    }
    
    showDeleteModal.value = false;
    facultyToDelete.value = null;
    
    // Show success message
    await new Promise(resolve => setTimeout(resolve, 100));
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Faculty member deleted successfully',
      showConfirmButton: false,
      timer: 3000
    });
  } catch (err) {
    console.error('Error deleting faculty member:', err);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Failed to delete faculty member',
      showConfirmButton: false,
      timer: 3000
    });
  }
}

// Cancel delete
function cancelDelete() {
  showDeleteModal.value = false;
  facultyToDelete.value = null;
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}
</script>

<template>
  <!-- Hero -->
  <BasePageHeading title="Faculty" subtitle="Manage faculty members and their information.">
    <template #extra>
      <button 
        class="btn btn-primary" 
        @click="addFacultyMember"
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
          <label class="form-label">Status</label>
          <select class="form-select" v-model="activeFilter" @change="applyFilters">
            <option :value="null">All Status</option>
            <option :value="true">Active</option>
            <option :value="false">Inactive</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Department</label>
          <select class="form-select" v-model="departmentFilter" @change="applyFilters">
            <option :value="null">All Departments</option>
            <option
              v-for="department in availableDepartments"
              :key="department"
              :value="department"
            >
              {{ department }}
            </option>
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

    <BaseBlock title="Faculty List" content-full>
      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading faculty...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <!-- Data table -->
      <template v-else>
        <Dataset
          v-slot="{ ds }"
          :ds-data="faculty"
          :ds-sortby="sortBy"
          :ds-search-in="['name', 'email', 'faculty_id', 'department', 'active']"
          :ds-page-size="pageSize"
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
                        <td>{{ row.faculty_id || '-' }}</td>
                        <td style="min-width: 150px">{{ row.name }}</td>
                        <td>{{ row.email }}</td>
                        <td>{{ row.department || '-' }}</td>
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
                              @click="editFacultyMember(row)"
                              title="Edit Faculty"
                            >
                              <i class="fa fa-fw fa-pencil-alt"></i>
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="confirmDelete(row)"
                              title="Delete Faculty"
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

  <!-- Faculty Form Modal -->
  <FacultyFormModal
    :faculty="selectedFaculty"
    :show="showFormModal"
    @update:show="showFormModal = $event"
    @save="saveFacultyMember"
  />

  <!-- Delete Confirmation Modal -->
  <div
    class="modal"
    :class="{ show: showDeleteModal, 'd-block': showDeleteModal }"
    tabindex="-1"
    role="dialog"
    @click.self="cancelDelete"
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
          <p v-if="facultyToDelete">
            Are you sure you want to delete faculty member
            <strong>{{ facultyToDelete.name }}</strong>?
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
          <button type="button" class="btn btn-danger" @click="deleteFacultyMember">
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