<script setup>
import { reactive, computed, onMounted, ref } from "vue";

import {
  Dataset,
  DatasetItem,
  DatasetInfo,
  DatasetPager,
  DatasetSearch,
  DatasetShow,
} from "vue-dataset";

import EditFacultyModal from "./EditFacultyModal.vue";
import facultyService from "@/services/faculty";

// Faculty data from API
const faculty = ref([]);
const isLoading = ref(true);
const error = ref(null);

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
  // Fetch faculty on component mount
  fetchFaculty();
});

// Fetch faculty from API
const fetchFaculty = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await facultyService.getAll();
    faculty.value = response.data;
  } catch (err) {
    console.error('Error fetching faculty:', err);
    error.value = 'Failed to load faculty. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Modal state
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedFaculty = ref(null);
const facultyToDelete = ref(null);

// Edit faculty member
function editFacultyMember(facultyMember) {
  selectedFaculty.value = { ...facultyMember };
  showEditModal.value = true;
}

// Save faculty member
async function saveFacultyMember(updatedFaculty) {
  try {
    const response = await facultyService.update(updatedFaculty.id, updatedFaculty);
    
    // Update faculty member in local list
    const index = faculty.value.findIndex((f) => f.id === updatedFaculty.id);
    if (index !== -1) {
      faculty.value[index] = response.data;
    }
    
    showEditModal.value = false;
  } catch (err) {
    console.error('Error saving faculty member:', err);
    alert('Failed to save faculty member. Please try again.');
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
    await facultyService.delete(facultyToDelete.value.id);
    
    // Remove faculty member from local list
    const index = faculty.value.findIndex((f) => f.id === facultyToDelete.value.id);
    if (index !== -1) {
      faculty.value.splice(index, 1);
    }
    
    showDeleteModal.value = false;
    facultyToDelete.value = null;
  } catch (err) {
    console.error('Error deleting faculty member:', err);
    alert('Failed to delete faculty member. Please try again.');
  }
}

// Cancel delete
function cancelDelete() {
  showDeleteModal.value = false;
  facultyToDelete.value = null;
}
</script>

<template>
  <!-- Hero -->
  <BasePageHeading title="Faculty" subtitle="Manage faculty members and their information.">
  </BasePageHeading>
  <!-- END Hero -->

  <!-- Page Content -->
  <div class="content">
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
          :ds-search-in="['name', 'email', 'faculty_id', 'department']"
        >
          <div class="row" :data-page-count="ds.dsPagecount">
            <div class="col-md-6 py-2">
              <div class="d-flex align-items-center gap-2">
                <label class="form-label mb-0 fs-sm">Show</label>
                <select 
                  class="form-select form-select-sm" 
                  style="width: auto; min-width: 65px; max-width: 80px;"
                  @input="ds.setPageCount($event.target.value)"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <label class="form-label mb-0 fs-sm">entries</label>
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
                  <DatasetItem tag="tbody" class="fs-sm">
                    <template #default="{ row, rowIndex }">
                      <tr>
                        <td>{{ row.faculty_id || '-' }}</td>
                        <td style="min-width: 150px">{{ row.name }}</td>
                        <td>{{ row.email }}</td>
                        <td>{{ row.department || '-' }}</td>
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
            <DatasetInfo class="py-3 fs-sm" />
            <DatasetPager class="flex-wrap py-3 fs-sm" />
          </div>
        </Dataset>
      </template>
    </BaseBlock>
  </div>
  <!-- END Page Content -->

  <!-- Edit Faculty Modal -->
  <EditFacultyModal
    :faculty="selectedFaculty"
    :show="showEditModal"
    @update:show="showEditModal = $event"
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