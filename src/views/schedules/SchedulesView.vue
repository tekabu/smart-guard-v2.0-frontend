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

import EditScheduleModal from "./EditScheduleModal.vue";
import schedulesService from "@/services/schedules";
import facultyService from "@/services/faculty";
import roomsService from "@/services/rooms";
import subjectsService from "@/services/subjects";

// Schedules data from API
const schedules = ref([]);
const isLoading = ref(true);
const error = ref(null);

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

// Modal state
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedSchedule = ref(null);
const scheduleToDelete = ref(null);

// Edit schedule
function editSchedule(schedule) {
  selectedSchedule.value = { ...schedule };
  showEditModal.value = true;
}

// Save schedule
async function saveSchedule(updatedSchedule) {
  try {
    const response = await schedulesService.update(updatedSchedule.id, updatedSchedule);
    
    // Update schedule in local list
    const index = schedules.value.findIndex((s) => s.id === updatedSchedule.id);
    if (index !== -1) {
      schedules.value[index] = response.data;
    }
    
    showEditModal.value = false;
  } catch (err) {
    console.error('Error saving schedule:', err);
    alert('Failed to save schedule. Please try again.');
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
    alert('Failed to delete schedule. Please try again.');
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
</script>

<template>
  <!-- Hero -->
  <BasePageHeading title="Schedules" subtitle="Manage faculty teaching schedules.">
  </BasePageHeading>
  <!-- END Hero -->

  <!-- Page Content -->
  <div class="content">
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
          :ds-data="schedules"
          :ds-sortby="sortBy"
          :ds-search-in="['user.name', 'day_of_week', 'room.room_number', 'subject.subject']"
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
                        <td style="min-width: 150px">{{ getFacultyName(row.user) }}</td>
                        <td>{{ row.day_of_week }}</td>
                        <td>{{ getRoomNumber(row.room) }}</td>
                        <td>{{ getSubjectName(row.subject) }}</td>
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
            <DatasetInfo class="py-3 fs-sm" />
            <DatasetPager class="flex-wrap py-3 fs-sm" />
          </div>
        </Dataset>
      </template>
    </BaseBlock>
  </div>
  <!-- END Page Content -->

  <!-- Edit Schedule Modal -->
  <EditScheduleModal
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