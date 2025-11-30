<script setup>
import { ref, watch, computed } from "vue";
import { showErrorToast, showSuccessToast } from "@/utils/errorHandler";
import { naturalCompare } from "@/utils/naturalSort";
import usersService from "@/services/users";
import sectionSubjectStudentsService from "@/services/sectionSubjectStudents";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  sectionSubjects: {
    type: Array,
    default: () => [],
  },
  existingStudents: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:show", "saved"]);

// Students data
const students = ref([]);
const isLoading = ref(false);
const isSaving = ref(false);

// Selected students (using Set for efficient lookup)
const selectedStudentIds = ref(new Set());

// Form data
const selectedSectionSubject = ref(null);

// Search and filter
const searchQuery = ref("");
const courseFilter = ref("All");

// Computed: Available courses from students
const availableCourses = computed(() => {
  const courses = [...new Set(students.value.map(s => s.course).filter(c => c))];
  return ["All", ...courses.sort((a, b) => naturalCompare(a, b))];
});

// Computed: Filtered students
const filteredStudents = computed(() => {
  let result = students.value;

  // Filter out students already in the SELECTED section subject
  if (selectedSectionSubject.value !== null && selectedSectionSubject.value !== undefined) {
    const existingStudentIds = new Set(
      props.existingStudents
        .filter(es => es.section_subject_id === selectedSectionSubject.value)
        .map(es => es.student?.id)
        .filter(id => id)
    );
    result = result.filter(s => !existingStudentIds.has(s.id));
  }

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(s =>
      s.name?.toLowerCase().includes(query) ||
      s.student_id?.toLowerCase().includes(query) ||
      s.course?.toLowerCase().includes(query)
    );
  }

  // Apply course filter
  if (courseFilter.value !== "All") {
    result = result.filter(s => s.course === courseFilter.value);
  }

  return result;
});

// Computed: Selected count
const selectedCount = computed(() => selectedStudentIds.value.size);

// Computed: All filtered students selected
const allSelected = computed(() => {
  if (filteredStudents.value.length === 0) return false;
  return filteredStudents.value.every(s => selectedStudentIds.value.has(s.id));
});

// Computed: Can save
const canSave = computed(() => {
  return selectedCount.value > 0 &&
         selectedSectionSubject.value !== null &&
         selectedSectionSubject.value !== undefined &&
         !isSaving.value;
});

// Watch for show prop changes to load students
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      loadStudents();
      selectedStudentIds.value.clear();
      selectedSectionSubject.value = null;
      searchQuery.value = "";
      courseFilter.value = "All";
    }
  }
);

// Load students
async function loadStudents() {
  try {
    isLoading.value = true;
    const response = await usersService.getByRole('STUDENT');
    students.value = response.data.sort((a, b) => naturalCompare(a.name, b.name));
  } catch (err) {
    console.error('Error loading students:', err);
    showErrorToast(err);
  } finally {
    isLoading.value = false;
  }
}

// Toggle student selection
function toggleStudent(studentId) {
  if (selectedStudentIds.value.has(studentId)) {
    selectedStudentIds.value.delete(studentId);
  } else {
    selectedStudentIds.value.add(studentId);
  }
}

// Toggle all filtered students
function toggleAll() {
  if (allSelected.value) {
    // Deselect all filtered students
    filteredStudents.value.forEach(s => {
      selectedStudentIds.value.delete(s.id);
    });
  } else {
    // Select all filtered students
    filteredStudents.value.forEach(s => {
      selectedStudentIds.value.add(s.id);
    });
  }
}

// Clear selection
function clearSelection() {
  selectedStudentIds.value.clear();
}

// Save bulk students
async function saveBulkStudents() {
  if (selectedSectionSubject.value === null || selectedSectionSubject.value === undefined) {
    showErrorToast(new Error('Please select a section subject'));
    return;
  }

  if (selectedStudentIds.value.size === 0) {
    showErrorToast(new Error('Please select at least one student'));
    return;
  }

  try {
    isSaving.value = true;

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each selected student
    for (const studentId of selectedStudentIds.value) {
      try {
        await sectionSubjectStudentsService.create({
          section_subject_id: selectedSectionSubject.value,
          student_id: studentId,
        });
        successCount++;
      } catch (err) {
        errorCount++;
        const student = students.value.find(s => s.id === studentId);
        const studentName = student ? `${student.name} (${student.student_id})` : `Student ID: ${studentId}`;
        errors.push(`${studentName}: ${err.response?.data?.message || err.message}`);
        console.error(`Error adding student ${studentId}:`, err);
      }
    }

    // Show results
    if (successCount > 0) {
      showSuccessToast(`Successfully added ${successCount} student(s)`);
      emit('saved');
    }

    if (errorCount > 0) {
      errors.forEach(error => {
        showErrorToast(new Error(error));
      });
    }

    // Close modal if all succeeded
    if (errorCount === 0) {
      closeModal();
    } else {
      // Clear successful selections, keep failed ones
      const failedIds = new Set();
      for (const studentId of selectedStudentIds.value) {
        const student = students.value.find(s => s.id === studentId);
        if (student && errors.some(e => e.includes(student.name))) {
          failedIds.add(studentId);
        }
      }
      selectedStudentIds.value = failedIds;
    }

  } catch (err) {
    console.error('Error in bulk save:', err);
    showErrorToast(err);
  } finally {
    isSaving.value = false;
  }
}

// Close modal
function closeModal() {
  emit("update:show", false);
}
</script>

<template>
  <div
    class="modal"
    :class="{ show: show, 'd-block': show }"
    tabindex="-1"
    role="dialog"
  >
    <div class="modal-dialog modal-dialog-centered modal-xl" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            Bulk Add Students to Section Subject
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <!-- Section Subject Selection -->
          <div class="mb-4">
            <label class="form-label">Section Subject <span class="text-danger">*</span></label>
            <select
              class="form-select"
              v-model="selectedSectionSubject"
              :disabled="isSaving"
            >
              <option :value="null">Select a section subject...</option>
              <option
                v-for="sectionSubject in sectionSubjects"
                :key="sectionSubject.id"
                :value="sectionSubject.id"
              >
                {{ sectionSubject.label }}
              </option>
            </select>
          </div>

          <!-- Search and Filter -->
          <div class="row mb-3">
            <div class="col-md-6">
              <input
                type="text"
                class="form-control"
                placeholder="Search by name, student ID, or course..."
                v-model="searchQuery"
                :disabled="isSaving"
              />
            </div>
            <div class="col-md-4">
              <select class="form-select" v-model="courseFilter" :disabled="isSaving">
                <option
                  v-for="course in availableCourses"
                  :key="course"
                  :value="course"
                >
                  {{ course === 'All' ? 'All Courses' : course }}
                </option>
              </select>
            </div>
            <div class="col-md-2">
              <button
                class="btn btn-secondary w-100"
                @click="clearSelection"
                :disabled="selectedCount === 0 || isSaving"
              >
                Clear ({{ selectedCount }})
              </button>
            </div>
          </div>

          <!-- Select All -->
          <div class="mb-3">
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                id="select-all"
                :checked="allSelected"
                @change="toggleAll"
                :disabled="filteredStudents.length === 0 || isSaving"
              />
              <label class="form-check-label" for="select-all">
                Select All ({{ filteredStudents.length }} students)
              </label>
            </div>
          </div>

          <!-- Loading state -->
          <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading students...</p>
          </div>

          <!-- Students Grid -->
          <div v-else class="row g-3" style="max-height: 500px; overflow-y: auto;">
            <div
              v-for="student in filteredStudents"
              :key="student.id"
              class="col-md-4 col-lg-3"
            >
              <div
                class="card h-100 student-card"
                :class="{ 'border-primary': selectedStudentIds.has(student.id) }"
                @click="toggleStudent(student.id)"
                style="cursor: pointer;"
              >
                <div class="card-body p-3">
                  <div class="form-check mb-2">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :id="`student-${student.id}`"
                      :checked="selectedStudentIds.has(student.id)"
                      @click.stop
                      @change="toggleStudent(student.id)"
                      :disabled="isSaving"
                    />
                    <label class="form-check-label fw-bold" :for="`student-${student.id}`">
                      {{ student.name }}
                    </label>
                  </div>
                  <div class="small text-muted">
                    <div>ID: {{ student.student_id }}</div>
                    <div>Course: {{ student.course || '-' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="filteredStudents.length === 0 && !isLoading" class="col-12">
              <div class="text-center text-muted py-5">
                <i class="fa fa-users fa-3x mb-3"></i>
                <p>No students found</p>
              </div>
            </div>
          </div>

          <!-- Selected count -->
          <div v-if="selectedCount > 0" class="mt-3">
            <div class="alert alert-info mb-0">
              <i class="fa fa-info-circle me-2"></i>
              <strong>{{ selectedCount }}</strong> student(s) selected
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="closeModal"
            :disabled="isSaving"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="saveBulkStudents"
            :disabled="!canSave"
          >
            <span v-if="isSaving">
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              Saving...
            </span>
            <span v-else>
              <i class="fa fa-save me-2"></i>
              Add {{ selectedCount }} Student(s)
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="show"
    class="modal-backdrop fade"
    :class="{ show: show }"
  ></div>
</template>

<style scoped>
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

.student-card {
  transition: all 0.2s;
}

.student-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.student-card.border-primary {
  border-width: 2px !important;
}

/* Ensure labels adapt to theme */
.dark-mode .form-label,
.dark-mode .form-check-label {
  color: #d4d8dd !important;
}
</style>
