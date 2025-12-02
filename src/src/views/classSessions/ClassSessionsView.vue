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

import scheduleSessionsService from "@/services/scheduleSessions";
import sectionsService from "@/services/sections";
import subjectsService from "@/services/subjects";
import usersService from "@/services/users";

// Sessions data from API
const sessions = ref([]);
const isLoading = ref(true);
const error = ref(null);
const pageSize = ref("10");

// Available options for filters
const availableSections = ref([]);
const availableSubjects = ref([]);
const availableFaculty = ref([]);

// Static days of the week
const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// Filters
const filters = ref({
  section_id: "",
  subject_id: "",
  faculty_id: "",
  day_of_week: "",
  start_date: ""
});

// Modal state
const showCloseModal = ref(false);
const sessionToClose = ref(null);

// Helper variables
const cols = reactive([
  {
    name: "Section",
    field: "section",
    sort: "",
  },
  {
    name: "Subject",
    field: "subject",
    sort: "",
  },
  {
    name: "Faculty",
    field: "faculty",
    sort: "",
  },
  {
    name: "Day",
    field: "day_of_week",
    sort: "",
  },
  {
    name: "Start Date",
    field: "start_date",
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

    // Fetch filter options in parallel
    const [sectionsRes, subjectsRes, facultyRes] = await Promise.all([
      sectionsService.getAll(),
      subjectsService.getAll(),
      usersService.getByRole('FACULTY')
    ]);

    // Sort sections naturally
    availableSections.value = sectionsRes.data.sort((a, b) => naturalCompare(a.section, b.section));

    // Sort subjects naturally
    availableSubjects.value = subjectsRes.data.sort((a, b) => naturalCompare(a.subject, b.subject));

    // Sort faculty naturally by name
    availableFaculty.value = facultyRes.data.sort((a, b) => naturalCompare(a.name, b.name));

    // Fetch sessions with current filters
    await applyFilters();
  } catch (err) {
    console.error('Error fetching data:', err);
    error.value = 'Failed to load data. Please try again.';
    isLoading.value = false;
  }
};

// Apply filters
const applyFilters = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    const filterData = {};
    if (filters.value.section_id) filterData.section_id = filters.value.section_id;
    if (filters.value.subject_id) filterData.subject_id = filters.value.subject_id;
    if (filters.value.faculty_id) filterData.faculty_id = filters.value.faculty_id;
    if (filters.value.day_of_week) filterData.day_of_week = filters.value.day_of_week;
    if (filters.value.start_date) filterData.start_date = filters.value.start_date;

    const response = await scheduleSessionsService.getOverview(filterData);
    sessions.value = response.data;
  } catch (err) {
    console.error('Error applying filters:', err);
    error.value = 'Failed to apply filters. Please try again.';
    showErrorToast(err);
  } finally {
    isLoading.value = false;
  }
};

// Reset filters
const resetFilters = () => {
  filters.value = {
    section_id: "",
    subject_id: "",
    faculty_id: "",
    day_of_week: "",
    start_date: ""
  };
  applyFilters();
};

// Start session
async function startSession(session) {
  try {
    const response = await scheduleSessionsService.start(session.id);

    // Update the session in the local list
    const index = sessions.value.findIndex(s => s.id === session.id);
    if (index !== -1) {
      sessions.value[index] = { ...sessions.value[index], ...response.data };
    }

    showSuccessToast('Session started successfully');
  } catch (err) {
    console.error('Error starting session:', err);
    showErrorToast(err);
  }
}

// Show close confirmation
function confirmCloseSession(session) {
  sessionToClose.value = session;
  showCloseModal.value = true;
}

// Close session
async function closeSession() {
  try {
    const response = await scheduleSessionsService.close(sessionToClose.value.id);

    // Update the session in the local list
    const index = sessions.value.findIndex(s => s.id === sessionToClose.value.id);
    if (index !== -1) {
      sessions.value[index] = { ...sessions.value[index], ...response.data };
    }

    showCloseModal.value = false;
    sessionToClose.value = null;

    showSuccessToast('Session closed successfully');
  } catch (err) {
    console.error('Error closing session:', err);
    showErrorToast(err);
  }
}

// Cancel close
function cancelClose() {
  showCloseModal.value = false;
  sessionToClose.value = null;
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
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
  <BasePageHeading title="Class Sessions" subtitle="View class session schedules overview.">
  </BasePageHeading>
  <!-- END Hero -->

  <!-- Page Content -->
  <div class="content">
    <!-- Filters -->
    <BaseBlock title="Filters" content-full>
      <div class="row">
        <div class="col-md-2">
          <label class="form-label">Section</label>
          <select class="form-select" v-model="filters.section_id" @change="applyFilters">
            <option value="">All Sections</option>
            <option
              v-for="section in availableSections"
              :key="section.id"
              :value="section.id"
            >
              {{ section.section }}
            </option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">Subject</label>
          <select class="form-select" v-model="filters.subject_id" @change="applyFilters">
            <option value="">All Subjects</option>
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
          <label class="form-label">Faculty</label>
          <select class="form-select" v-model="filters.faculty_id" @change="applyFilters">
            <option value="">All Faculty</option>
            <option
              v-for="faculty in availableFaculty"
              :key="faculty.id"
              :value="faculty.id"
            >
              {{ faculty.name }}
            </option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">Day</label>
          <select class="form-select" v-model="filters.day_of_week" @change="applyFilters">
            <option value="">All Days</option>
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
          <label class="form-label">Start Date</label>
          <input
            type="date"
            class="form-control"
            v-model="filters.start_date"
            @change="applyFilters"
          />
        </div>
        <div class="col-md-2">
          <label class="form-label">&nbsp;</label>
          <button class="btn btn-secondary w-100" @click="resetFilters">
            <i class="fa fa-undo me-1"></i> Reset
          </button>
        </div>
      </div>
    </BaseBlock>

    <BaseBlock title="Class Sessions List" content-full>
      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading sessions...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <!-- Data table -->
      <template v-else>
        <Dataset
          v-slot="{ ds }"
          :ds-data="sessions"
          :ds-sortby="sortBy"
          :ds-search-in="['section', 'subject', 'faculty', 'day_of_week']"
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
                        <td>{{ row.section || '-' }}</td>
                        <td>{{ row.subject || '-' }}</td>
                        <td>{{ row.faculty?.name || row.faculty || '-' }}</td>
                        <td>
                          <span class="badge bg-primary">{{ row.day_of_week }}</span>
                        </td>
                        <td>{{ formatDate(row.start_date) }}</td>
                        <td>{{ formatTime(row.start_time) }}</td>
                        <td>{{ formatTime(row.end_time) }}</td>
                        <td class="text-center">
                          <div class="btn-group">
                            <button
                              v-if="!row.start_time"
                              type="button"
                              class="btn btn-sm btn-success"
                              @click="startSession(row)"
                              title="Start Session"
                            >
                              <i class="fa fa-fw fa-play"></i>
                            </button>
                            <button
                              v-if="row.start_time && !row.end_time"
                              type="button"
                              class="btn btn-sm btn-danger"
                              @click="confirmCloseSession(row)"
                              title="Close Session"
                            >
                              <i class="fa fa-fw fa-stop"></i>
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

  <!-- Close Session Confirmation Modal -->
  <div
    class="modal"
    :class="{ show: showCloseModal, 'd-block': showCloseModal }"
    tabindex="-1"
    role="dialog"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Close Class Session</h5>
          <button
            type="button"
            class="btn-close"
            @click="cancelClose"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <p v-if="sessionToClose">
            Are you sure you want to close this class session?
          </p>
          <p class="text-muted mb-0">
            Section: <strong>{{ sessionToClose?.section }}</strong><br>
            Subject: <strong>{{ sessionToClose?.subject }}</strong><br>
            Faculty: <strong>{{ sessionToClose?.faculty?.name || sessionToClose?.faculty }}</strong><br>
            Day: <strong>{{ sessionToClose?.day_of_week }}</strong><br>
            Date: <strong>{{ formatDate(sessionToClose?.start_date) }}</strong><br>
            Time: <strong>{{ formatTime(sessionToClose?.start_time) }} - {{ formatTime(sessionToClose?.end_time) }}</strong>
          </p>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="cancelClose"
          >
            Cancel
          </button>
          <button type="button" class="btn btn-danger" @click="closeSession">
            <i class="fa fa-stop me-1"></i> Close Session
          </button>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="showCloseModal"
    class="modal-backdrop fade"
    :class="{ show: showCloseModal }"
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
