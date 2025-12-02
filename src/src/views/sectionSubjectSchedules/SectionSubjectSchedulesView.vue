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

import SectionSubjectScheduleFormModal from "./SectionSubjectScheduleFormModal.vue";
import sectionSubjectSchedulesService from "@/services/sectionSubjectSchedules";
import sectionSubjectsService from "@/services/sectionSubjects";
import sectionsService from "@/services/sections";
import subjectsService from "@/services/subjects";
import roomsService from "@/services/rooms";
import scheduleSessionsService from "@/services/scheduleSessions";

// Schedules data from API
const schedules = ref([]);
const isLoading = ref(true);
const error = ref(null);
const pageSize = ref("10");

// Available options for dropdowns (for modals)
const availableSectionSubjects = ref([]);
const availableSections = ref([]);
const availableSubjects = ref([]);
const availableRooms = ref([]);

// Static days of the week
const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// Filters
const filters = ref({
  section_id: "All",
  subject_id: "All",
  day_of_week: "All",
  room_id: "All"
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
    field: "section_subject.section",
    sort: "",
  },
  {
    name: "Subject",
    field: "section_subject.subject",
    sort: "",
  },
  {
    name: "Faculty",
    field: "section_subject.faculty.name",
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

// Add searchable fields to data items for Dataset search
const schedulesWithSearchFields = computed(() => {
  return schedules.value.map(item => ({
    ...item,
    searchableSection: item.section_subject?.section?.section || '',
    searchableSubject: item.section_subject?.subject?.subject || '',
    searchableFaculty: item.section_subject?.faculty?.name || '',
    searchableRoom: item.room?.room_number || ''
  }));
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

    // Fetch schedules, section subjects, sections, subjects, and rooms in parallel
    const [schedulesRes, sectionSubjectsRes, sectionsRes, subjectsRes, roomsRes] = await Promise.all([
      sectionSubjectSchedulesService.getAll(),
      sectionSubjectsService.getAll(),
      sectionsService.getAll(),
      subjectsService.getAll(),
      roomsService.getAll()
    ]);

    schedules.value = schedulesRes.data;

    // Sort section subjects naturally
    availableSectionSubjects.value = sectionSubjectsRes.data.sort((a, b) => {
      const aLabel = `${a.section?.section || ''} - ${a.subject?.subject || ''}`;
      const bLabel = `${b.section?.section || ''} - ${b.subject?.subject || ''}`;
      return naturalCompare(aLabel, bLabel);
    });

    // Sort sections naturally
    availableSections.value = sectionsRes.data.sort((a, b) => naturalCompare(a.section, b.section));

    // Sort subjects naturally
    availableSubjects.value = subjectsRes.data.sort((a, b) => naturalCompare(a.subject, b.subject));

    // Sort rooms naturally by room number
    availableRooms.value = roomsRes.data.sort((a, b) => naturalCompare(a.room_number, b.room_number));
  } catch (err) {
    console.error('Error fetching schedules:', err);
    error.value = 'Failed to load schedules. Please try again.';
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
    if (filters.value.day_of_week !== "All") filterData.day_of_week = filters.value.day_of_week;
    if (filters.value.room_id !== "All") filterData.room_id = filters.value.room_id;

    if (Object.keys(filterData).length > 0) {
      const response = await sectionSubjectSchedulesService.getFiltered(filterData);
      schedules.value = response.data;
    } else {
      const response = await sectionSubjectSchedulesService.getAll();
      schedules.value = response.data;
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
    day_of_week: "All",
    room_id: "All"
  };
  fetchAllData();
};

// Modal state
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showStartSessionModal = ref(false);
const selectedSchedule = ref(null);
const scheduleToDelete = ref(null);
const scheduleToStartSession = ref(null);
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

// Show start session confirmation
function confirmStartSession(schedule) {
  scheduleToStartSession.value = schedule;
  showStartSessionModal.value = true;
}

// Start class session
async function startClassSession() {
  try {
    const response = await scheduleSessionsService.create({
      section_subject_schedule_id: scheduleToStartSession.value.id
    });

    showStartSessionModal.value = false;
    scheduleToStartSession.value = null;

    showSuccessToast('Class session started successfully');
  } catch (err) {
    console.error('Error starting class session:', err);
    showErrorToast(err);
  }
}

// Cancel start session
function cancelStartSession() {
  showStartSessionModal.value = false;
  scheduleToStartSession.value = null;
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
    <!-- Filters -->
    <BaseBlock title="Filters" content-full>
      <div class="row">
        <div class="col-md-3">
          <label class="form-label">Section</label>
          <select class="form-select" v-model="filters.section_id" @change="applyFilters">
            <option value="All">All Sections</option>
            <option
              v-for="section in availableSections"
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
              v-for="subject in availableSubjects"
              :key="subject.id"
              :value="subject.id"
            >
              {{ subject.subject }}
            </option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">Day</label>
          <select class="form-select" v-model="filters.day_of_week" @change="applyFilters">
            <option value="All">All Days</option>
            <option
              v-for="day in daysOfWeek"
              :key="day"
              :value="day"
            >
              {{ day }}
            </option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">Room</label>
          <select class="form-select" v-model="filters.room_id" @change="applyFilters">
            <option value="All">All Rooms</option>
            <option
              v-for="room in availableRooms"
              :key="room.id"
              :value="room.id"
            >
              {{ room.room_number }}
            </option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">&nbsp;</label>
          <button class="btn btn-secondary w-100" @click="resetFilters">
            <i class="fa fa-undo me-1"></i> Reset
          </button>
        </div>
      </div>
    </BaseBlock>

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
          :ds-data="schedulesWithSearchFields"
          :ds-sortby="sortBy"
          :ds-search-in="['searchableSection', 'searchableSubject', 'searchableFaculty', 'day_of_week', 'searchableRoom']"
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
                        <td>{{ row.section_subject?.section?.section || '-'  }}</td>
                        <td>{{ row.section_subject?.subject?.subject || '-' }}</td>
                        <td>
                          <div>{{ row.section_subject?.faculty?.name || '-' }}</div>
                          <small class="text-muted">{{ row.section_subject?.faculty?.faculty_id || '' }}</small>
                        </td>
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
                              class="btn btn-sm btn-success"
                              @click="confirmStartSession(row)"
                              title="Start Class Session"
                            >
                              <i class="fa fa-fw fa-play"></i>
                            </button>
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
    :sectionSubjects="sectionSubjectsForModal"
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
            Room: <strong>{{ scheduleToDelete?.room?.room_number }}</strong><br>
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

  <!-- Start Session Confirmation Modal -->
  <div
    class="modal"
    :class="{ show: showStartSessionModal, 'd-block': showStartSessionModal }"
    tabindex="-1"
    role="dialog"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Start Class Session</h5>
          <button
            type="button"
            class="btn-close"
            @click="cancelStartSession"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <p v-if="scheduleToStartSession">
            Are you sure you want to start a class session for this schedule?
          </p>
          <p class="text-muted mb-0">
            Section: <strong>{{ scheduleToStartSession?.section_subject?.section?.section }}</strong><br>
            Subject: <strong>{{ scheduleToStartSession?.section_subject?.subject?.subject }}</strong><br>
            Faculty: <strong>{{ scheduleToStartSession?.section_subject?.faculty?.name }}</strong><br>
            Day: <strong>{{ scheduleToStartSession?.day_of_week }}</strong><br>
            Room: <strong>{{ scheduleToStartSession?.room?.room_number }}</strong><br>
            Time: <strong>{{ formatTime(scheduleToStartSession?.start_time) }} - {{ formatTime(scheduleToStartSession?.end_time) }}</strong>
          </p>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="cancelStartSession"
          >
            Cancel
          </button>
          <button type="button" class="btn btn-success" @click="startClassSession">
            <i class="fa fa-play me-1"></i> Start Session
          </button>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="showStartSessionModal"
    class="modal-backdrop fade"
    :class="{ show: showStartSessionModal }"
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
