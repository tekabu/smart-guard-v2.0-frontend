<script setup>
import { reactive, computed, onMounted, ref } from "vue";
import { showErrorToast, showSuccessToast } from "@/utils/errorHandler";
import { naturalCompare } from "@/utils/naturalSort";

import {
  Dataset,
  DatasetItem,
  DatasetInfo,
  DatasetPager,
  DatasetSearch,
  DatasetShow,
} from "vue-dataset";

import SectionFormModal from "./SectionFormModal.vue";
import sectionsService from "@/services/sections";

// Sections data from API
const sections = ref([]);
const isLoading = ref(true);
const error = ref(null);
const pageSize = ref("10");

// Helper variables
const cols = reactive([
  {
    name: "Section",
    field: "section",
    sort: "",
  },
  {
    name: "Created At",
    field: "created_at",
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

    const response = await sectionsService.getAll();
    // Sort sections naturally
    sections.value = response.data.sort((a, b) => naturalCompare(a.section, b.section));
  } catch (err) {
    console.error('Error fetching sections:', err);
    error.value = 'Failed to load sections. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Modal state
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedSection = ref(null);
const sectionToDelete = ref(null);
const isEditMode = ref(false);

// Edit section
function editSection(section) {
  selectedSection.value = { ...section };
  isEditMode.value = true;
  showEditModal.value = true;
}

// Add new section
function addSection() {
  selectedSection.value = null;
  isEditMode.value = false;
  showEditModal.value = true;
}

// Save section (for both create and update)
async function saveSection(sectionData) {
  try {
    if (isEditMode.value) {
      // Update existing section
      const response = await sectionsService.update(sectionData.id, sectionData);

      // Update section in local list
      const index = sections.value.findIndex((s) => s.id === sectionData.id);
      if (index !== -1) {
        sections.value[index] = response.data;
      }

      // Show success message
      showSuccessToast('Section updated successfully');
    } else {
      // Create new section
      const response = await sectionsService.create(sectionData);

      // Add new section to local list
      sections.value.unshift(response.data);

      // Show success message
      showSuccessToast('Section created successfully');
    }

    // Close modal only on successful API request
    showEditModal.value = false;
  } catch (err) {
    console.error('Error saving section:', err);
    showErrorToast(err);
    // Don't close modal on error - let user fix the issue
  }
}

// Show delete confirmation
function confirmDelete(section) {
  sectionToDelete.value = section;
  showDeleteModal.value = true;
}

// Delete section
async function deleteSection() {
  try {
    await sectionsService.delete(sectionToDelete.value.id);

    // Remove section from local list
    const index = sections.value.findIndex((s) => s.id === sectionToDelete.value.id);
    if (index !== -1) {
      sections.value.splice(index, 1);
    }

    showDeleteModal.value = false;
    sectionToDelete.value = null;

    showSuccessToast('Section deleted successfully');
  } catch (err) {
    console.error('Error deleting section:', err);
    showErrorToast(err);
  }
}

// Cancel delete
function cancelDelete() {
  showDeleteModal.value = false;
  sectionToDelete.value = null;
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}
</script>

<template>
  <!-- Hero -->
  <BasePageHeading title="Sections" subtitle="Manage class sections.">
    <template #extra>
      <button
        class="btn btn-primary"
        @click="addSection"
      >
        <i class="fa fa-plus me-1"></i> Add New
      </button>
    </template>
  </BasePageHeading>
  <!-- END Hero -->

  <!-- Page Content -->
  <div class="content">
    <BaseBlock title="Sections List" content-full>
      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading sections...</p>
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
          :ds-data="sections"
          :ds-sortby="sortBy"
          :ds-search-in="['section']"
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
                        <td>{{ row.section }}</td>
                        <td>{{ formatDate(row.created_at) }}</td>
                        <td>{{ formatDate(row.updated_at) }}</td>
                        <td class="text-center">
                          <div class="btn-group">
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="editSection(row)"
                              title="Edit Section"
                            >
                              <i class="fa fa-fw fa-pencil-alt"></i>
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="confirmDelete(row)"
                              title="Delete Section"
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

  <!-- Section Form Modal -->
  <SectionFormModal
    :section="selectedSection"
    :show="showEditModal"
    @update:show="showEditModal = $event"
    @save="saveSection"
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
          <p v-if="sectionToDelete">
            Are you sure you want to delete this section?
          </p>
          <p class="text-muted mb-0">
            Section: <strong>{{ sectionToDelete?.section }}</strong>
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
          <button type="button" class="btn btn-danger" @click="deleteSection">
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
