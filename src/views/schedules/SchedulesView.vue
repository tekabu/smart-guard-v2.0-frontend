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

import ScheduleFormModal from "./ScheduleFormModal.vue";
import SchedulePeriodsInline from "./SchedulePeriodsInline.vue";
import schedulesService from "@/services/schedules";
import facultyService from "@/services/faculty";
import roomsService from "@/services/rooms";
import subjectsService from "@/services/subjects";

// Schedules data from API
const schedules = ref([]);
const isLoading = ref(true);
const error = ref(null);
const pageSize = ref(10);

// Filter state
const activeFilter = ref("All");
const facultyFilter = ref("All");
const dayFilter = ref("All");
const roomFilter = ref("All");
const subjectFilter = ref("All");

// Dynamic filter options
const availableDays = ref([]);

// Computed filter options with natural sorting
const statusOptions = computed(() => ['All', 'Active', 'Inactive']);
const dayOptions = computed(() => {
  if (!availableDays.value || !availableDays.value.length) return ['All'];
  return getSortedFilterOptions(availableDays.value);
});
const roomOptions = computed(() => {
  if (!roomList.value || !roomList.value.length) return ['All'];
  const roomNumbers = roomList.value.map(r => r.room_number);
  return getSortedFilterOptions(roomNumbers);
});

// Reference data
const facultyList = ref([]);
const roomList = ref([]);
const subjectList = ref([]);

// Helper variables
const cols = reactive([
  {
    name: "Faculty",
    field: "user.name",
    sort: "",
  },
  {
    name: "Day",
    field: "day_of_week",
    sort: "",
  },
  {
    name: "Room",
    field: "room.room_number",
    sort: "",
  },
  {
    name: "Subject",
    field: "subject.subject",
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

// Apply a few Bootstrap 5 optimizations
onMounted(() => {
  // Fetch data on component mount
  applyFilters();
});

// Fetch all required data
const fetchAllData = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    // Fetch all data in parallel
    const [schedulesRes, facultyRes, roomsRes, subjectsRes] = await Promise.all([
      schedulesService.getAll(),
      facultyService.getAll(),
      roomsService.getAll(),
      subjectsService.getAll()
    ]);
    
    schedules.value = schedulesRes.data;
    facultyList.value = facultyRes.data.filter(f => f.active);
    roomList.value = roomsRes.data.filter(r => r.active);
    subjectList.value = subjectsRes.data.filter(s => s.active);
  } catch (err) {
    console.error('Error fetching data:', err);
    error.value = 'Failed to load schedules. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Apply filters
const applyFilters = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await schedulesService.getAll();
    let filteredData = response.data;
    
    // Extract unique days from API data
    const allDays = [...new Set(response.data
      .map(schedule => schedule.day_of_week)
      .filter(day => day))];
    
    availableDays.value = allDays;
    
    // Apply active filter
    if (activeFilter.value !== "All") {
      filteredData = filteredData.filter(schedule => 
        schedule.active === (activeFilter.value === 'Active')
      );
    }
    
    // Apply faculty filter
    if (facultyFilter.value !== "All") {
      filteredData = filteredData.filter(schedule => schedule.user_id === facultyFilter.value);
    }
    
    // Apply day filter
    if (dayFilter.value !== "All") {
      filteredData = filteredData.filter(schedule => schedule.day_of_week === dayFilter.value);
    }
    
    // Apply room filter
    if (roomFilter.value !== "All") {
      filteredData = filteredData.filter(schedule => schedule.room_id === roomFilter.value);
    }
    
    // Apply subject filter
    if (subjectFilter.value !== "All") {
      filteredData = filteredData.filter(schedule => schedule.subject_id === subjectFilter.value);
    }
    
    schedules.value = filteredData;
    
    // Still fetch reference data
    const [facultyRes, roomsRes, subjectsRes] = await Promise.all([
      facultyService.getAll(),
      roomsService.getAll(),
      subjectsService.getAll()
    ]);
    
    facultyList.value = facultyRes.data.filter(f => f.active);
    roomList.value = roomsRes.data.filter(r => r.active);
    subjectList.value = subjectsRes.data.filter(s => s.active);
  } catch (err) {
    console.error('Error applying filters:', err);
    error.value = 'Failed to apply filters. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Reset filters
const resetFilters = () => {
  activeFilter.value = "All";
  facultyFilter.value = "All";
  dayFilter.value = "All";
  roomFilter.value = "All";
  subjectFilter.value = "All";
  applyFilters();
};

// Modal state
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedSchedule = ref(null);
const scheduleToDelete = ref(null);
const isEditMode = ref(false);

// Expanded rows for periods
const expandedRows = ref(new Set());

// Toggle periods view
const togglePeriods = (scheduleId) => {
  if (expandedRows.value.has(scheduleId)) {
    expandedRows.value.delete(scheduleId);
  } else {
    expandedRows.value.add(scheduleId);
  }
};

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
      const response = await schedulesService.update(scheduleData.id, scheduleData);
      
      // Update schedule in local list
      const index = schedules.value.findIndex((s) => s.id === scheduleData.id);
      if (index !== -1) {
        schedules.value[index] = response.data;
      }
      
      showSuccessToast('Schedule updated successfully');
    } else {
      // Create new schedule
      const response = await schedulesService.create(scheduleData);
      
      // Add new schedule to local list
      schedules.value.unshift(response.data);
      
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
    await schedulesService.delete(scheduleToDelete.value.id);
    
    // Remove schedule from local list
    const index = schedules.value.findIndex((s) => s.id === scheduleToDelete.value.id);
    if (index !== -1) {
      schedules.value.splice(index, 1);
    }
    
    showDeleteModal.value = false;
    scheduleToDelete.value = null;
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

// Get display names
const getFacultyName = (user) => user?.name || 'Unknown';
const getRoomNumber = (room) => room?.room_number || 'Unknown';
const getSubjectName = (subject) => subject?.subject || 'Unknown';

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}
</script>

<template>
  <!-- Hero -->
  <BasePageHeading title="Schedules" subtitle="Manage faculty teaching schedules.">
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
          <label class="form-label">Faculty</label>
          <select class="form-select" v-model="facultyFilter" @change="applyFilters">
            <option :value="'All'">All Faculty</option>
            <option v-for="faculty in facultyList" :key="faculty.id" :value="faculty.id">
              {{ faculty.name }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Day</label>
          <select class="form-select" v-model="dayFilter" @change="applyFilters">
            <option
              v-for="day in dayOptions"
              :key="day"
              :value="day"
            >
              {{ day === 'All' ? 'All Days' : day }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Room</label>
          <select class="form-select" v-model="roomFilter" @change="applyFilters">
            <option
              v-for="(roomNumber, index) in roomOptions"
              :key="roomNumber"
              :value="roomNumber === 'All' ? 'All' : (roomList.value && roomList.value.find(r => r.room_number === roomNumber)?.id)"
            >
              {{ roomNumber === 'All' ? 'All Rooms' : roomNumber }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Subject</label>
          <select class="form-select" v-model="subjectFilter" @change="applyFilters">
            <option :value="'All'">All Subjects</option>
            <option v-for="subject in subjectList" :key="subject.id" :value="subject.id">
              {{ subject.subject }}
            </option>
          </select>
        </div>
      </div>
      <div class="row mt-3">
        <div class="col-md-3">
          <label class="form-label">Status</label>
          <select class="form-select" v-model="activeFilter" @change="applyFilters">
            <option
              v-for="status in statusOptions"
              :key="status"
              :value="status"
            >
              {{ status === 'All' ? 'All Status' : status }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">&nbsp;</label>
          <button class="btn btn-secondary w-100" @click="resetFilters()">
            <i class="fa fa-undo me-1"></i> Reset
          </button>
        </div>
      </div>
    </BaseBlock>

    <BaseBlock title="Schedule List" content-full>
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
          :ds-search-in="['user.name', 'day_of_week', 'room.room_number', 'subject.subject', 'active']"
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
                        <td style="min-width: 150px">{{ getFacultyName(row.user) }}</td>
                        <td>{{ row.day_of_week }}</td>
                        <td>{{ getRoomNumber(row.room) }}</td>
                        <td>{{ getSubjectName(row.subject) }}</td>
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
                              @click="togglePeriods(row.id)"
                              :title="expandedRows.has(row.id) ? 'Hide Periods' : 'Show Periods'"
                            >
                              <i class="fa fa-fw fa-clock"></i>
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
                      
                      <!-- Periods Row -->
                      <tr v-if="expandedRows.has(row.id)" :key="`periods-${row.id}`">
                        <td colspan="7" class="p-0 bg-body">
                          <div class="p-3">
                            <h6 class="mb-3">Schedule Periods</h6>
                            <div class="row">
                              <div class="col-12">
                                <SchedulePeriodsInline 
                                  :schedule-id="row.id" 
                                  :key="`inline-${row.id}`"
                                />
                              </div>
                            </div>
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
  <ScheduleFormModal
    :schedule="selectedSchedule"
    :show="showEditModal"
    :faculty-list="facultyList"
    :room-list="roomList"
    :subject-list="subjectList"
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
            Faculty: {{ getFacultyName(scheduleToDelete?.user) }}<br>
            Day: {{ scheduleToDelete?.day_of_week }}<br>
            Room: {{ getRoomNumber(scheduleToDelete?.room) }}
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