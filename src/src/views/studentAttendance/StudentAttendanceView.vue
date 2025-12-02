<script setup>
import { reactive, computed, onMounted, ref } from "vue";
import { showErrorToast } from "@/utils/errorHandler";
import { naturalCompare } from "@/utils/naturalSort";

import {
  Dataset,
  DatasetItem,
  DatasetInfo,
  DatasetPager,
  DatasetSearch,
  DatasetShow,
} from "vue-dataset";

import scheduleAttendanceService from "@/services/scheduleAttendance";
import sectionsService from "@/services/sections";
import subjectsService from "@/services/subjects";
import usersService from "@/services/users";

// Attendance data from API
const attendanceRecords = ref([]);
const isLoading = ref(true);
const error = ref(null);
const pageSize = ref("10");

// Available options for filters
const availableSections = ref([]);
const availableSubjects = ref([]);
const availableFaculty = ref([]);

// Filters
const filters = ref({
  section_id: "",
  subject_id: "",
  faculty_id: "",
  date_in: ""
});

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
    name: "Student",
    field: "student",
    sort: "",
  },
  {
    name: "Date",
    field: "date_in",
    sort: "",
  },
  {
    name: "Time In",
    field: "time_in",
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

    // Fetch attendance with current filters
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
    if (filters.value.date_in) filterData.date_in = filters.value.date_in;

    const response = await scheduleAttendanceService.getOverview(filterData);
    attendanceRecords.value = response.data;
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
    date_in: ""
  };
  applyFilters();
};

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
}

// Format time to 12-hour format
function formatTime(time24) {
  if (!time24) return '-';
  const [hours, minutes, seconds] = time24.split(":");
  let hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minutes} ${ampm}`;
}

// Print PDF function
function printPDF() {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');

  // Generate the HTML content for the print window
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Student Attendance Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        h1 {
          text-align: center;
          margin-bottom: 20px;
        }
        .filters-info {
          margin-bottom: 20px;
          padding: 10px;
          background-color: #f5f5f5;
          border-radius: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <h1>Student Attendance Report</h1>
      ${generateFiltersInfo()}
      <table>
        <thead>
          <tr>
            <th>Section</th>
            <th>Subject</th>
            <th>Faculty</th>
            <th>Student</th>
            <th>Student ID</th>
            <th>Date</th>
            <th>Time In</th>
          </tr>
        </thead>
        <tbody>
          ${generateTableRows()}
        </tbody>
      </table>
      <div class="footer">
        Generated on ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = function() {
    printWindow.print();
    printWindow.onafterprint = function() {
      printWindow.close();
    };
  };
}

// Generate filters info for print
function generateFiltersInfo() {
  const filterInfo = [];

  if (filters.value.section_id) {
    const section = availableSections.value.find(s => s.id === filters.value.section_id);
    if (section) filterInfo.push(`Section: ${section.section}`);
  }

  if (filters.value.subject_id) {
    const subject = availableSubjects.value.find(s => s.id === filters.value.subject_id);
    if (subject) filterInfo.push(`Subject: ${subject.subject}`);
  }

  if (filters.value.faculty_id) {
    const faculty = availableFaculty.value.find(f => f.id === filters.value.faculty_id);
    if (faculty) filterInfo.push(`Faculty: ${faculty.name}`);
  }

  if (filters.value.date_in) {
    filterInfo.push(`Date: ${formatDate(filters.value.date_in)}`);
  }

  if (filterInfo.length === 0) {
    return '<div class="filters-info"><strong>Filters:</strong> All Records</div>';
  }

  return `<div class="filters-info"><strong>Filters:</strong> ${filterInfo.join(' | ')}</div>`;
}

// Generate table rows for print
function generateTableRows() {
  return attendanceRecords.value.map(row => `
    <tr>
      <td>${row.section || '-'}</td>
      <td>${row.subject || '-'}</td>
      <td>${row.faculty || '-'}${row.faculty_id ? '<br><small>' + row.faculty_id + '</small>' : ''}</td>
      <td>${row.student || '-'}${row.student_id ? '<br><small>' + row.student_id + '</small>' : ''}</td>
      <td>${row.student_id || '-'}</td>
      <td>${formatDate(row.date_in)}</td>
      <td>${formatTime(row.time_in)}</td>
    </tr>
  `).join('');
}
</script>

<template>
  <!-- Hero -->
  <BasePageHeading title="Student Attendance" subtitle="View student attendance records.">
    <template #extra>
      <button
        class="btn btn-primary"
        @click="printPDF"
        :disabled="attendanceRecords.length === 0"
      >
        <i class="fa fa-print me-1"></i> Print PDF
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
        <div class="col-md-3">
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
          <label class="form-label">Date</label>
          <input
            type="date"
            class="form-control"
            v-model="filters.date_in"
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

    <BaseBlock title="Attendance Records" content-full>
      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading attendance records...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <!-- Data table -->
      <template v-else>
        <Dataset
          v-slot="{ ds }"
          :ds-data="attendanceRecords"
          :ds-sortby="sortBy"
          :ds-search-in="['section', 'subject', 'faculty', 'student', 'student_id', 'faculty_id']"
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
                    </tr>
                  </thead>
                  <DatasetItem tag="tbody">
                    <template #default="{ row, rowIndex }">
                      <tr>
                        <td>{{ row.section || '-' }}</td>
                        <td>{{ row.subject || '-' }}</td>
                        <td>
                          <div>{{ row.faculty || '-' }}</div>
                          <small class="text-muted">{{ row.faculty_id || '' }}</small>
                        </td>
                        <td>
                          <div>{{ row.student || '-' }}</div>
                          <small class="text-muted">{{ row.student_id || '' }}</small>
                        </td>
                        <td>{{ formatDate(row.date_in) }}</td>
                        <td>{{ formatTime(row.time_in) }}</td>
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
</style>
