<script setup>
import { reactive, computed, onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { getErrorMessage, showErrorToast, showSuccessToast } from "@/utils/errorHandler";
import { getSortedFilterOptions, naturalCompare } from "@/utils/naturalSort";

// Set default properties for SweetAlert2
const toast = Swal.mixin({
  buttonsStyling: false,
  target: "#page-container",
  customClass: {
    confirmButton: "btn btn-success m-1",
    cancelButton: "btn btn-danger m-1",
  },
});

import {
  Dataset,
  DatasetItem,
  DatasetInfo,
  DatasetPager,
  DatasetSearch,
  DatasetShow,
} from "vue-dataset";

import StudentFormModal from "./StudentFormModal.vue";
import RfidCardsModal from "./RfidCardsModal.vue";
import FingerprintsModal from "./FingerprintsModal.vue";
import studentsService from "@/services/students";

// Students data from API
const students = ref([]);
const isLoading = ref(true);
const error = ref(null);
const pageSize = ref("10");

// Filter state
const courseFilter = ref("All");

// Dynamic filter options
const availableCourses = ref([]);

// Computed filter options with natural sorting
const courseOptions = computed(() => {
  if (!availableCourses.value || !availableCourses.value.length) return ['All'];
  return getSortedFilterOptions(availableCourses.value);
});

// Helper variables
const cols = reactive([
  {
    name: "ID",
    field: "student_id",
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
    name: "Course",
    field: "course",
    sort: "",
  },
  {
    name: "Year",
    field: "year_level",
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
  courseFilter.value = "All";
  applyFilters();
};

// Apply a few Bootstrap 5 optimizations
onMounted(() => {
  // Fetch students on component mount
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

// Apply filters
const applyFilters = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    const response = await studentsService.getAll();
    let filteredData = response.data;

    // Extract unique courses from API data
    const allCourses = [...new Set(response.data
      .map(student => student.course)
      .filter(course => course))];

    // Sort courses naturally
    availableCourses.value = getSortedFilterOptions(allCourses).filter(course => course !== 'All');

    // Apply course filter
    if (courseFilter.value !== "All") {
      filteredData = filteredData.filter(student => student.course === courseFilter.value);
    }

    students.value = filteredData;
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
const selectedStudent = ref(null);
const studentToDelete = ref(null);
const isEditMode = ref(false);

// RFID and Fingerprint modal state
const showRfidModal = ref(false);
const showFingerprintModal = ref(false);
const selectedStudentForBiometric = ref(null);

// Edit student
function editStudent(student) {
  selectedStudent.value = { ...student };
  isEditMode.value = true;
  showFormModal.value = true;
}

// Add new student
function addStudent() {
  selectedStudent.value = null;
  isEditMode.value = false;
  showFormModal.value = true;
}

// Save student (for both create and update)
async function saveStudent(studentData) {
  try {
    if (isEditMode.value) {
      // Update existing student
      const response = await studentsService.update(studentData.id, studentData);
      
      // Update student in local list
      const index = students.value.findIndex((s) => s.id === studentData.id);
      if (index !== -1) {
        students.value[index] = response.data;
      }
      
      // Close modal only on successful API request
      showFormModal.value = false;
      
      // Show success message
      showSuccessToast('Student updated successfully');
    } else {
      // Create new student
      const response = await studentsService.create(studentData);
      
      // Add new student to local list
      students.value.unshift(response.data);
      
      // Close modal only on successful API request
      showFormModal.value = false;
      
      // Show success message
      showSuccessToast('Student created successfully');
    }
  } catch (err) {
    console.error('Error saving student:', err);
    showErrorToast(err);
    // Don't close modal on error - let user fix the issue
  }
}

// Show delete confirmation
function confirmDelete(student) {
  studentToDelete.value = student;
  showDeleteModal.value = true;
}

// Delete student
async function deleteStudent() {
  try {
    const studentName = studentToDelete.value.name;
    await studentsService.delete(studentToDelete.value.id);
    
    // Remove student from local list
    const index = students.value.findIndex((s) => s.id === studentToDelete.value.id);
    if (index !== -1) {
      students.value.splice(index, 1);
    }
    
    // Close modal and clear state
    showDeleteModal.value = false;
    studentToDelete.value = null;
    
    // Show success message
    showSuccessToast('Student deleted successfully');
  } catch (err) {
    console.error('Error deleting student:', err);
    showErrorToast(err);
  }
}

// Cancel delete
function cancelDelete() {
  showDeleteModal.value = false;
  studentToDelete.value = null;
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}

// Open RFID modal
function openRfidModal(student) {
  selectedStudentForBiometric.value = student;
  showRfidModal.value = true;
}

// Open Fingerprint modal
function openFingerprintModal(student) {
  selectedStudentForBiometric.value = student;
  showFingerprintModal.value = true;
}
</script>

<template>
  <!-- Hero -->
  <BasePageHeading title="Students" subtitle="Manage student records and information.">
    <template #extra>
      <button 
        class="btn btn-primary" 
        @click="addStudent"
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
        <div class="col-md-6">
          <label class="form-label">Course</label>
          <select class="form-select" v-model="courseFilter" @change="applyFilters">
            <option
              v-for="course in courseOptions"
              :key="course"
              :value="course"
            >
              {{ course === 'All' ? 'All Courses' : course }}
            </option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label">&nbsp;</label>
          <button class="btn btn-secondary w-100" @click="resetFilters">
            <i class="fa fa-undo me-1"></i> Reset
          </button>
        </div>
      </div>
    </BaseBlock>

    <BaseBlock title="Student List" content-full>
      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading students...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <!-- Data table -->
      <template v-else>
        <Dataset
          v-slot="{ ds }"
          :ds-data="students"
          :ds-sortby="sortBy"
          :ds-search-in="['name', 'email', 'student_id', 'course']"
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
                        <td>{{ row.student_id || '-' }}</td>
                        <td style="min-width: 150px">{{ row.name }}</td>
                        <td>{{ row.email }}</td>
                        <td>{{ row.course || '-' }}</td>
                        <td>{{ row.year_level || '-' }}</td>
                        <td>{{ formatDate(row.updated_at) }}</td>
                        <td class="text-center">
                          <div class="btn-group">
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="openFingerprintModal(row)"
                              title="Manage Fingerprints"
                            >
                              <i class="fa fa-fw fa-fingerprint"></i>
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="editStudent(row)"
                              title="Edit Student"
                            >
                              <i class="fa fa-fw fa-pencil-alt"></i>
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="confirmDelete(row)"
                              title="Delete Student"
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

  <!-- Student Form Modal -->
  <StudentFormModal
    :student="selectedStudent"
    :show="showFormModal"
    @update:show="showFormModal = $event"
    @save="saveStudent"
  />

  <!-- RFID Cards Modal -->
  <RfidCardsModal
    :student="selectedStudentForBiometric"
    :show="showRfidModal"
    @update:show="showRfidModal = $event"
  />

  <!-- Fingerprints Modal -->
  <FingerprintsModal
    :student="selectedStudentForBiometric"
    :show="showFingerprintModal"
    @update:show="showFingerprintModal = $event"
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
          <p v-if="studentToDelete">
            Are you sure you want to delete student
            <strong>{{ studentToDelete.name }}</strong>?
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
          <button type="button" class="btn btn-danger" @click="deleteStudent">
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
</style>