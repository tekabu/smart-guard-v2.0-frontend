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

import SectionSubjectFormModal from "./SectionSubjectFormModal.vue";
import sectionSubjectsService from "@/services/sectionSubjects";
import sectionsService from "@/services/sections";
import subjectsService from "@/services/subjects";
import usersService from "@/services/users";

// Section subjects data from API
const sectionSubjects = ref([]);
const isLoading = ref(true);
const error = ref(null);
const pageSize = ref(10);

// Available options for dropdowns (for modals)
const availableSections = ref([]);
const availableSubjects = ref([]);
const availableFaculty = ref([]);

// Computed filter options with natural sorting from table data
const sectionOptions = computed(() => {
  if (!sectionSubjects.value || !sectionSubjects.value.length) return ['All'];
  const sections = [...new Set(sectionSubjects.value
    .map(ss => ss.section?.section)
    .filter(s => s))];
  return getSortedFilterOptions(sections);
});
const subjectOptions = computed(() => {
  if (!sectionSubjects.value || !sectionSubjects.value.length) return ['All'];
  const subjects = [...new Set(sectionSubjects.value
    .map(ss => ss.subject?.subject)
    .filter(s => s))];
  return getSortedFilterOptions(subjects);
});

// Filters
const filters = ref({
  section: "All",
  subject: "All"
});

// Helper variables
const cols = reactive([
  {
    name: "Section",
    field: "section.section",
    sort: "",
  },
  {
    name: "Subject",
    field: "subject.subject",
    sort: "",
  },
  {
    name: "Faculty",
    field: "faculty.name",
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

    // Fetch section subjects, sections, subjects, and faculty in parallel
    const [sectionSubjectsRes, sectionsRes, subjectsRes, facultyRes] = await Promise.all([
      sectionSubjectsService.getAll(),
      sectionsService.getAll(),
      subjectsService.getAll(),
      usersService.getByRole('FACULTY')
    ]);

    sectionSubjects.value = sectionSubjectsRes.data;

    // Sort sections naturally
    availableSections.value = sectionsRes.data.sort((a, b) => naturalCompare(a.section, b.section));

    // Sort subjects naturally
    availableSubjects.value = subjectsRes.data.sort((a, b) => naturalCompare(a.subject, b.subject));

    // Sort faculty naturally by name
    availableFaculty.value = facultyRes.data.sort((a, b) => naturalCompare(a.name, b.name));
  } catch (err) {
    console.error('Error fetching section subjects:', err);
    error.value = 'Failed to load section subjects. Please try again.';
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
    if (filters.value.section !== "All") filterData.section = filters.value.section;
    if (filters.value.subject !== "All") filterData.subject = filters.value.subject;

    if (Object.keys(filterData).length > 0) {
      const response = await sectionSubjectsService.getFiltered(filterData);
      sectionSubjects.value = response.data;
    } else {
      const response = await sectionSubjectsService.getAll();
      sectionSubjects.value = response.data;
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
    section: "All",
    subject: "All"
  };
  fetchAllData();
};

// Modal state
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedSectionSubject = ref(null);
const sectionSubjectToDelete = ref(null);
const isEditMode = ref(false);

// Edit section subject
function editSectionSubject(sectionSubject) {
  selectedSectionSubject.value = { ...sectionSubject };
  isEditMode.value = true;
  showEditModal.value = true;
}

// Add new section subject
function addSectionSubject() {
  selectedSectionSubject.value = null;
  isEditMode.value = false;
  showEditModal.value = true;
}

// Save section subject (for both create and update)
async function saveSectionSubject(sectionSubjectData) {
  try {
    if (isEditMode.value) {
      // Update existing section subject
      const response = await sectionSubjectsService.update(sectionSubjectData.id, sectionSubjectData);

      // Update section subject in local list
      const index = sectionSubjects.value.findIndex((ss) => ss.id === sectionSubjectData.id);
      if (index !== -1) {
        sectionSubjects.value[index] = response.data;
      }

      // Show success message
      showSuccessToast('Section subject updated successfully');
    } else {
      // Create new section subject
      const response = await sectionSubjectsService.create(sectionSubjectData);

      // Add new section subject to local list
      sectionSubjects.value.unshift(response.data);

      // Show success message
      showSuccessToast('Section subject created successfully');
    }

    // Close modal only on successful API request
    showEditModal.value = false;
  } catch (err) {
    console.error('Error saving section subject:', err);
    showErrorToast(err);
    // Don't close modal on error - let user fix the issue
  }
}

// Show delete confirmation
function confirmDelete(sectionSubject) {
  sectionSubjectToDelete.value = sectionSubject;
  showDeleteModal.value = true;
}

// Delete section subject
async function deleteSectionSubject() {
  try {
    await sectionSubjectsService.delete(sectionSubjectToDelete.value.id);

    // Remove section subject from local list
    const index = sectionSubjects.value.findIndex((ss) => ss.id === sectionSubjectToDelete.value.id);
    if (index !== -1) {
      sectionSubjects.value.splice(index, 1);
    }

    showDeleteModal.value = false;
    sectionSubjectToDelete.value = null;

    showSuccessToast('Section subject deleted successfully');
  } catch (err) {
    console.error('Error deleting section subject:', err);
    showErrorToast(err);
  }
}

// Cancel delete
function cancelDelete() {
  showDeleteModal.value = false;
  sectionSubjectToDelete.value = null;
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}
</script>

<template>
  <!-- Hero -->
  <BasePageHeading title="Section Subjects" subtitle="Manage section-subject assignments with faculty.">
    <template #extra>
      <button
        class="btn btn-primary"
        @click="addSectionSubject"
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
        <div class="col-md-4">
          <label class="form-label">Section</label>
          <select class="form-select" v-model="filters.section" @change="applyFilters">
            <option
              v-for="section in sectionOptions"
              :key="section"
              :value="section"
            >
              {{ section === 'All' ? 'All Sections' : section }}
            </option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Subject</label>
          <select class="form-select" v-model="filters.subject" @change="applyFilters">
            <option
              v-for="subject in subjectOptions"
              :key="subject"
              :value="subject"
            >
              {{ subject === 'All' ? 'All Subjects' : subject }}
            </option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">&nbsp;</label>
          <button class="btn btn-secondary w-100" @click="resetFilters">
            <i class="fa fa-undo me-1"></i> Reset
          </button>
        </div>
      </div>
    </BaseBlock>

    <BaseBlock title="Section Subjects List" content-full>
      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading section subjects...</p>
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
          :ds-data="sectionSubjects"
          :ds-sortby="sortBy"
          :ds-search-in="['section.section', 'subject.subject', 'faculty.name']"
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
                        <td>{{ row.section?.section || '-' }}</td>
                        <td>{{ row.subject?.subject || '-' }}</td>
                        <td>
                          <div>{{ row.faculty?.name || '-' }}</div>
                          <small class="text-muted">{{ row.faculty?.faculty_id || '' }}</small>
                        </td>
                        <td>{{ formatDate(row.updated_at) }}</td>
                        <td class="text-center">
                          <div class="btn-group">
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="editSectionSubject(row)"
                              title="Edit Section Subject"
                            >
                              <i class="fa fa-fw fa-pencil-alt"></i>
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="confirmDelete(row)"
                              title="Delete Section Subject"
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

  <!-- Section Subject Form Modal -->
  <SectionSubjectFormModal
    :sectionSubject="selectedSectionSubject"
    :show="showEditModal"
    :sections="availableSections"
    :subjects="availableSubjects"
    :faculty="availableFaculty"
    @update:show="showEditModal = $event"
    @save="saveSectionSubject"
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
          <p v-if="sectionSubjectToDelete">
            Are you sure you want to delete this section subject?
          </p>
          <p class="text-muted mb-0">
            Section: <strong>{{ sectionSubjectToDelete?.section?.section }}</strong><br>
            Subject: <strong>{{ sectionSubjectToDelete?.subject?.subject }}</strong><br>
            Faculty: <strong>{{ sectionSubjectToDelete?.faculty?.name }}</strong>
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
          <button type="button" class="btn btn-danger" @click="deleteSectionSubject">
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
