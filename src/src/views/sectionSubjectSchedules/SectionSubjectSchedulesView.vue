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

import SectionSubjectScheduleFormModal from "./SectionSubjectScheduleFormModal.vue";
import sectionSubjectSchedulesService from "@/services/sectionSubjectSchedules";
import sectionSubjectsService from "@/services/sectionSubjects";
import roomsService from "@/services/rooms";

// Schedules data from API
const schedules = ref([]);
const isLoading = ref(true);
const error = ref(null);
const pageSize = ref(10);

// Available options for dropdowns
const availableSectionSubjects = ref([]);
const availableRooms = ref([]);

// Helper variables
const cols = reactive([
  {
    name: "Section",
    field: "section_subject.section",
    sort: "",
  },
  {
    name: "Subject",
    field: "section_subject.subject",
    sort: "",
  },
  {
    name: "Day",
    field: "day_of_week",
    sort: "",
  },
  {
    name: "Room",
    field: "room.room",
    sort: "",
  },
  {
    name: "Start Time",
    field: "start_time",
    sort: "",
  },
  {
    name: "End Time",
    field: "end_time",
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

    // Fetch schedules, section subjects (options), and rooms in parallel
    const [schedulesRes, sectionSubjectsRes, roomsRes] = await Promise.all([
      sectionSubjectSchedulesService.getAll(),
      sectionSubjectsService.getOptions(),
      roomsService.getAll()
    ]);

    schedules.value = schedulesRes.data;

    // Sort section subjects by label
    availableSectionSubjects.value = sectionSubjectsRes.data.sort((a, b) => naturalCompare(a.label, b.label));

    // Sort rooms naturally by room name
    availableRooms.value = roomsRes.data.sort((a, b) => naturalCompare(a.room, b.room));
  } catch (err) {
    console.error('Error fetching schedules:', err);
    error.value = 'Failed to load schedules. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Modal state
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedSchedule = ref(null);
const scheduleToDelete = ref(null);
const isEditMode = ref(false);

// Edit schedule
function editSchedule(schedule) {
  selectedSchedule.value = { ...schedule };
  isEditMode.value = true;
  showEditModal.value = true;
}

// Add new schedule
function addSchedule() {
  selectedSchedule.value = null;
  isEditMode.value = false;
  showEditModal.value = true;
}

// Save schedule (for both create and update)
async function saveSchedule(scheduleData) {
  try {
    if (isEditMode.value) {
      // Update existing schedule
      const response = await sectionSubjectSchedulesService.update(scheduleData.id, scheduleData);

      // Update schedule in local list
      const index = schedules.value.findIndex((s) => s.id === scheduleData.id);
      if (index !== -1) {
        schedules.value[index] = response.data;
      }

      // Show success message
      showSuccessToast('Schedule updated successfully');
    } else {
      // Create new schedule
      const response = await sectionSubjectSchedulesService.create(scheduleData);

      // Add new schedule to local list
      schedules.value.unshift(response.data);

      // Show success message
      showSuccessToast('Schedule created successfully');
    }

    // Close modal only on successful API request
    showEditModal.value = false;
  } catch (err) {
    console.error('Error saving schedule:', err);
    showErrorToast(err);
    // Don't close modal on error - let user fix the issue
  }
}

// Show delete confirmation
function confirmDelete(schedule) {
  scheduleToDelete.value = schedule;
  showDeleteModal.value = true;
}

// Delete schedule
async function deleteSchedule() {
  try {
    await sectionSubjectSchedulesService.delete(scheduleToDelete.value.id);

    // Remove schedule from local list
    const index = schedules.value.findIndex((s) => s.id === scheduleToDelete.value.id);
    if (index !== -1) {
      schedules.value.splice(index, 1);
    }

    showDeleteModal.value = false;
    scheduleToDelete.value = null;

    showSuccessToast('Schedule deleted successfully');
  } catch (err) {
    console.error('Error deleting schedule:', err);
    showErrorToast(err);
  }
}

// Cancel delete
function cancelDelete() {
  showDeleteModal.value = false;
  scheduleToDelete.value = null;
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}

// Format time to 12-hour format
function formatTime(time24) {
  if (!time24) return '-';
  const [hours, minutes] = time24.split(":");
  let hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minutes} ${ampm}`;
}
</script>

<template>
  <!-- Hero -->
  <BasePageHeading title="Schedules" subtitle="Manage class schedules for section subjects.">
    <template #extra>
      <button
        class="btn btn-primary"
        @click="addSchedule"
      >
        <i class="fa fa-plus me-1"></i> Add New
      </button>
    </template>
  </BasePageHeading>
  <!-- END Hero -->

  <!-- Page Content -->
  <div class="content">
    <BaseBlock title="Schedules List" content-full>
      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading schedules...</p>
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
          :ds-data="schedules"
          :ds-sortby="sortBy"
          :ds-search-in="['section_subject.label', 'day_of_week', 'room.room']"
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
                        <td>{{ row.section_subject?.section?.section || '-'  }}</td>
                        <td>{{ row.section_subject?.subject?.subject || '-' }}</td>
                        <td>
                          <span class="badge bg-primary">{{ row.day_of_week }}</span>
                        </td>
                        <td>{{ row.room?.room_number || '-' }}</td>
                        <td>{{ formatTime(row.start_time) }}</td>
                        <td>{{ formatTime(row.end_time) }}</td>
                        <td>{{ formatDate(row.updated_at) }}</td>
                        <td class="text-center">
                          <div class="btn-group">
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="editSchedule(row)"
                              title="Edit Schedule"
                            >
                              <i class="fa fa-fw fa-pencil-alt"></i>
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-alt-secondary"
                              @click="confirmDelete(row)"
                              title="Delete Schedule"
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

  <!-- Schedule Form Modal -->
  <SectionSubjectScheduleFormModal
    :schedule="selectedSchedule"
    :show="showEditModal"
    :sectionSubjects="availableSectionSubjects"
    :rooms="availableRooms"
    @update:show="showEditModal = $event"
    @save="saveSchedule"
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
          <p v-if="scheduleToDelete">
            Are you sure you want to delete this schedule?
          </p>
          <p class="text-muted mb-0">
            Section Subject: <strong>{{ scheduleToDelete?.section_subject?.label }}</strong><br>
            Day: <strong>{{ scheduleToDelete?.day_of_week }}</strong><br>
            Room: <strong>{{ scheduleToDelete?.room?.room }}</strong><br>
            Time: <strong>{{ formatTime(scheduleToDelete?.start_time) }} - {{ formatTime(scheduleToDelete?.end_time) }}</strong>
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
          <button type="button" class="btn btn-danger" @click="deleteSchedule">
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
