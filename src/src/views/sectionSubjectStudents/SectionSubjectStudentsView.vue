<script setup>
import { reactive, computed, onMounted, ref } from "vue";
import { showErrorToast, showSuccessToast } from "@/utils/errorHandler";
import { naturalCompare, getSortedFilterOptions } from "@/utils/naturalSort";

import {
  Dataset,
  DatasetItem,
  DatasetInfo,
  DatasetPager,
  DatasetSearch,
  DatasetShow,
} from "vue-dataset";

import SectionSubjectStudentFormModal from "./SectionSubjectStudentFormModal.vue";
import BulkAddStudentsModal from "./BulkAddStudentsModal.vue";
import sectionSubjectStudentsService from "@/services/sectionSubjectStudents";
import sectionSubjectsService from "@/services/sectionSubjects";
import usersService from "@/services/users";

// Section subject students data from API
const sectionSubjectStudents = ref([]);
const isLoading = ref(true);
const error = ref(null);
const pageSize = ref("10");

// Available options for dropdowns
const availableSectionSubjects = ref([]);
const availableStudents = ref([]);

// Get unique sections from availableSectionSubjects
const uniqueSections = computed(() => {
  if (!availableSectionSubjects.value || !availableSectionSubjects.value.length) return [];
  const sectionsMap = new Map();
  availableSectionSubjects.value.forEach(ss => {
    if (ss.section?.id && !sectionsMap.has(ss.section.id)) {
      sectionsMap.set(ss.section.id, ss.section);
    }
  });
  return Array.from(sectionsMap.values()).sort((a, b) => naturalCompare(a.section, b.section));
});

// Get unique subjects from availableSectionSubjects
const uniqueSubjects = computed(() => {
  if (!availableSectionSubjects.value || !availableSectionSubjects.value.length) return [];
  const subjectsMap = new Map();
  availableSectionSubjects.value.forEach(ss => {
    if (ss.subject?.id && !subjectsMap.has(ss.subject.id)) {
      subjectsMap.set(ss.subject.id, ss.subject);
    }
  });
  return Array.from(subjectsMap.values()).sort((a, b) => naturalCompare(a.subject, b.subject));
});

// Get unique faculty from availableSectionSubjects
const uniqueFaculty = computed(() => {
  if (!availableSectionSubjects.value || !availableSectionSubjects.value.length) return [];
  const facultyMap = new Map();
  availableSectionSubjects.value.forEach(ss => {
    if (ss.faculty?.id && !facultyMap.has(ss.faculty.id)) {
      facultyMap.set(ss.faculty.id, ss.faculty);
    }
  });
  return Array.from(facultyMap.values()).sort((a, b) => naturalCompare(a.name, b.name));
});

// Filters
const filters = ref({
  section_id: "All",
  subject_id: "All",
  faculty_id: "All"
});

// Computed property to format section subjects for modal dropdown
const sectionSubjectsForModal = computed(() => {
  return availableSectionSubjects.value.map(ss => ({
    id: ss.id,
    label: `${ss.section?.section || ''} - ${ss.subject?.subject || ''} (${ss.faculty?.name || ''})`
  }));
});

// Helper variables
const cols = reactive([
  {
    name: "Section",
    field: "section_subject.section.section",
    sort: "",
  },
  {
    name: "Subject",
    field: "section_subject.subject.subject",
    sort: "",
  },
  {
    name: "Faculty",
    field: "section_subject.faculty.name",
    sort: "",
  },
  {
    name: "Student",
    field: "student.name",
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

// Fetch all required data
const fetchAllData = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    // Fetch section subject students, section subjects (full data for filters), and students in parallel
    const [sectionSubjectStudentsRes, sectionSubjectsRes, studentsRes] = await Promise.all([
      sectionSubjectStudentsService.getAll(),
      sectionSubjectsService.getAll(),
      usersService.getByRole('STUDENT')
    ]);

    sectionSubjectStudents.value = sectionSubjectStudentsRes.data;

    // Sort section subjects naturally
    availableSectionSubjects.value = sectionSubjectsRes.data.sort((a, b) => {
      const aLabel = `${a.section?.section || ''} - ${a.subject?.subject || ''}`;
      const bLabel = `${b.section?.section || ''} - ${b.subject?.subject || ''}`;
      return naturalCompare(aLabel, bLabel);
    });

    // Sort students naturally by name
    availableStudents.value = studentsRes.data.sort((a, b) => naturalCompare(a.name, b.name));
  } catch (err) {
    console.error('Error fetching section subject students:', err);
    error.value = 'Failed to load section subject students. Please try again.';
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
    if (filters.value.section_id !== "All") filterData.section_id = filters.value.section_id;
    if (filters.value.subject_id !== "All") filterData.subject_id = filters.value.subject_id;
    if (filters.value.faculty_id !== "All") filterData.faculty_id = filters.value.faculty_id;

    if (Object.keys(filterData).length > 0) {
      const response = await sectionSubjectStudentsService.getFiltered(filterData);
      sectionSubjectStudents.value = response.data;
    } else {
      const response = await sectionSubjectStudentsService.getAll();
      sectionSubjectStudents.value = response.data;
    }
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
    section_id: "All",
    subject_id: "All",
    faculty_id: "All"
  };
  fetchAllData();
};

// Modal state
const showEditModal = ref(false);
const showBulkAddModal = ref(false);
const showDeleteModal = ref(false);
const selectedSectionSubjectStudent = ref(null);
const sectionSubjectStudentToDelete = ref(null);
const isEditMode = ref(false);

// Edit section subject student
function editSectionSubjectStudent(sectionSubjectStudent) {
  selectedSectionSubjectStudent.value = { ...sectionSubjectStudent };
  isEditMode.value = true;
  showEditModal.value = true;
}

// Add new section subject student
function addSectionSubjectStudent() {
  selectedSectionSubjectStudent.value = null;
  isEditMode.value = false;
  showEditModal.value = true;
}

// Show bulk add modal
function showBulkAdd() {
  showBulkAddModal.value = true;
}

// Handle bulk add saved
async function handleBulkSaved() {
  // Refresh the list
  await fetchAllData();
}

// Save section subject student (for both create and update)
async function saveSectionSubjectStudent(sectionSubjectStudentData) {
  try {
    if (isEditMode.value) {
      // Update existing section subject student
      const response = await sectionSubjectStudentsService.update(sectionSubjectStudentData.id, sectionSubjectStudentData);

      // Update section subject student in local list
      const index = sectionSubjectStudents.value.findIndex((sss) => sss.id === sectionSubjectStudentData.id);
      if (index !== -1) {
        sectionSubjectStudents.value[index] = response.data;
      }

      // Show success message
      showSuccessToast('Student subject updated successfully');
    } else {
      // Create new section subject student
      const response = await sectionSubjectStudentsService.create(sectionSubjectStudentData);

      // Add new section subject student to local list
      sectionSubjectStudents.value.unshift(response.data);

      // Show success message
      showSuccessToast('Student subject created successfully');
    }

    // Close modal only on successful API request
    showEditModal.value = false;
  } catch (err) {
    console.error('Error saving section subject student:', err);
    showErrorToast(err);
    // Don't close modal on error - let user fix the issue
  }
}

// Show delete confirmation
function confirmDelete(sectionSubjectStudent) {
  sectionSubjectStudentToDelete.value = sectionSubjectStudent;
  showDeleteModal.value = true;
}

// Delete section subject student
async function deleteSectionSubjectStudent() {
  try {
    await sectionSubjectStudentsService.delete(sectionSubjectStudentToDelete.value.id);

    // Remove section subject student from local list
    const index = sectionSubjectStudents.value.findIndex((sss) => sss.id === sectionSubjectStudentToDelete.value.id);
    if (index !== -1) {
      sectionSubjectStudents.value.splice(index, 1);
    }

    showDeleteModal.value = false;
    sectionSubjectStudentToDelete.value = null;

    showSuccessToast('Student subject deleted successfully');
  } catch (err) {
    console.error('Error deleting student subject:', err);
    showErrorToast(err);
  }
}

// Cancel delete
function cancelDelete() {
  showDeleteModal.value = false;
  sectionSubjectStudentToDelete.value = null;
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}
</script>

<template>
  <!-- Hero -->
  <BasePageHeading title="Student Subject" subtitle="Manage student enrollments in section subjects.">
    <template #extra>
      <div class="btn-group">
        <button
          class="btn btn-primary"
          @click="addSectionSubjectStudent"
        >
          <i class="fa fa-plus me-1"></i> Add New
        </button>
        <button
          class="btn btn-primary"
          @click="showBulkAdd"
        >
          <i class="fa fa-users me-1"></i> Add Bulk
        </button>
      </div>
    </template>
  </BasePageHeading>
  <!-- END Hero -->

  <!-- Page Content -->
  <div class="content">
    <!-- Filters -->
    <BaseBlock title="Filters" content-full>
      <div class="row">
        <div class="col-md-3">
          <label class="form-label">Section</label>
          <select class="form-select" v-model="filters.section_id" @change="applyFilters">
            <option value="All">All Sections</option>
            <option
              v-for="section in uniqueSections"
              :key="section.id"
              :value="section.id"
            >
              {{ section.section }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Subject</label>
          <select class="form-select" v-model="filters.subject_id" @change="applyFilters">
            <option value="All">All Subjects</option>
            <option
              v-for="subject in uniqueSubjects"
              :key="subject.id"
              :value="subject.id"
            >
              {{ subject.subject }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Faculty</label>
          <select class="form-select" v-model="filters.faculty_id" @change="applyFilters">
            <option value="All">All Faculty</option>
            <option
              v-for="faculty in uniqueFaculty"
              :key="faculty.id"
              :value="faculty.id"
            >
              {{ faculty.name }}
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

    <BaseBlock title="Student Subjects List" content-full>
      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading student subjects...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <!-- Data table -->
      <template v-else>
        <Dataset
          v-slot="{ ds }"
          :ds-page-size="Number(pageSize)"
          :ds-data="sectionSubjectStudents"
          :ds-sortby="sortBy"
          :ds-search-in="['section_subject.section.section', 'section_subject.subject.subject', 'student.name', 'student.student_id']"
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
                        <td>{{ row.section_subject?.section?.section || '-' }}</td>
                        <td>{{ row.section_subject?.subject?.subject || '-' }}</td>
                        <td>
                          <div>{{ row.section_subject?.faculty?.name || '-' }}</div>
                          <small class="text-muted">{{ row.section_subject?.faculty?.faculty_id || '' }}</small>
                        </td>
                        <td>
                          <div>{{ row.student?.name || '-' }}</div>
                          <small class="text-muted">{{ row.student?.student_id || '' }}</small>
                        </td>
                        <td>{{ formatDate(row.updated_at) }}</td>
                        <td class="text-center">
                          <div class="btn-group">
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="editSectionSubjectStudent(row)"
                              title="Edit Student Subject"
                            >
                              <i class="fa fa-fw fa-pencil-alt"></i>
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="confirmDelete(row)"
                              title="Delete Student Subject"
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

  <!-- Section Subject Student Form Modal -->
  <SectionSubjectStudentFormModal
    :sectionSubjectStudent="selectedSectionSubjectStudent"
    :show="showEditModal"
    :sectionSubjects="sectionSubjectsForModal"
    :students="availableStudents"
    @update:show="showEditModal = $event"
    @save="saveSectionSubjectStudent"
  />

  <!-- Bulk Add Students Modal -->
  <BulkAddStudentsModal
    :show="showBulkAddModal"
    :sectionSubjects="sectionSubjectsForModal"
    :existingStudents="sectionSubjectStudents"
    @update:show="showBulkAddModal = $event"
    @saved="handleBulkSaved"
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
          <p v-if="sectionSubjectStudentToDelete">
            Are you sure you want to delete this student subject enrollment?
          </p>
          <p class="text-muted mb-0">
            Section: <strong>{{ sectionSubjectStudentToDelete?.section_subject?.section?.section }}</strong><br>
            Subject: <strong>{{ sectionSubjectStudentToDelete?.section_subject?.subject?.subject }}</strong><br>
            Student: <strong>{{ sectionSubjectStudentToDelete?.student?.name }} ({{ sectionSubjectStudentToDelete?.student?.student_id }})</strong>
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
          <button type="button" class="btn btn-danger" @click="deleteSectionSubjectStudent">
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

/* Hide "entries" text from DatasetShow */
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
