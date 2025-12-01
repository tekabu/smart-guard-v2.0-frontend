<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  student: {
    type: Object,
    default: null,
  },
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:show", "save"]);

// Determine if we're editing or creating
const isEditMode = computed(() => !!props.student?.id);

// Form data
const formData = ref({
  id: null,
  name: "",
  email: "",
  role: "STUDENT",
  active: true,
  student_id: "",
  course: "",
  year_level: "",
  attendance_rate: "",
  department: "",
});

// Form validation
const formErrors = ref({});

// Watch for student prop changes to populate form
watch(
  () => props.student,
  (newStudent) => {
    if (newStudent && newStudent.id) {
      // Editing existing student
      formData.value = {
        id: newStudent.id,
        name: newStudent.name || "",
        email: newStudent.email || "",
        role: "STUDENT",
        active: newStudent.active !== undefined ? newStudent.active : true,
        student_id: newStudent.student_id || "",
        course: newStudent.course || "",
        year_level: newStudent.year_level || "",
        attendance_rate: newStudent.attendance_rate || "",
        department: newStudent.department || "",
      };
    } else {
      // Creating new student - reset form
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for show prop to reset form when modal opens for new student
watch(
  () => props.show,
  (newShow) => {
    if (newShow && !props.student) {
      resetForm();
    }
  }
);

// Reset form to defaults
function resetForm() {
  formData.value = {
    id: null,
    name: "",
    email: "",
    role: "STUDENT",
    active: true,
    student_id: "",
    course: "",
    year_level: "",
    attendance_rate: "",
    department: "",
  };
  formErrors.value = {};
}

// Validate form
function validateForm() {
  formErrors.value = {};
  
  // Name validation
  if (!formData.value.name.trim()) {
    formErrors.value.name = "Name is required";
  }
  
  // Email validation
  if (!formData.value.email.trim()) {
    formErrors.value.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(formData.value.email)) {
    formErrors.value.email = "Email is invalid";
  }
  
  // Student ID validation
  if (!formData.value.student_id.trim()) {
    formErrors.value.student_id = "Student ID is required";
  }

  // Year level validation
  if (formData.value.year_level && (formData.value.year_level < 1 || formData.value.year_level > 6)) {
    formErrors.value.year_level = "Year level must be between 1 and 6";
  }
  
  return Object.keys(formErrors.value).length === 0;
}

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save student
function saveStudent() {
  // Validate form
  if (!validateForm()) {
    return;
  }

  // Prepare data for submission
  const dataToSave = { ...formData.value };

  // Remove id if it's null (for creating new student)
  if (!dataToSave.id) {
    delete dataToSave.id;
  }
  
  // Emit save event with form data
  emit("save", dataToSave);
}
</script>

<template>
  <div
    class="modal"
    :class="{ show: show, 'd-block': show }"
    tabindex="-1"
    role="dialog"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ isEditMode ? "Edit Student" : "Add New Student" }}</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveStudent">
            <div class="row">
              <div class="col-md-6">
                <!-- Name -->
                <div class="mb-3">
                  <label for="student-name" class="form-label">Name <span class="text-danger">*</span></label>
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.name }"
                    id="student-name"
                    autocomplete="name"
                    v-model="formData.name"
                    required
                  />
                  <div v-if="formErrors.name" class="invalid-feedback">
                    {{ formErrors.name }}
                  </div>
                </div>

                <!-- Email -->
                <div class="mb-3">
                  <label for="student-email" class="form-label">Email <span class="text-danger">*</span></label>
                  <input
                    type="email"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.email }"
                    id="student-email"
                    autocomplete="username"
                    v-model="formData.email"
                    required
                  />
                  <div v-if="formErrors.email" class="invalid-feedback">
                    {{ formErrors.email }}
                  </div>
                </div>

                <!-- Student ID -->
                <div class="mb-3">
                  <label for="student-id" class="form-label">Student ID <span class="text-danger">*</span></label>
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.student_id }"
                    id="student-id"
                    autocomplete="off"
                    v-model="formData.student_id"
                    required
                  />
                  <div v-if="formErrors.student_id" class="invalid-feedback">
                    {{ formErrors.student_id }}
                  </div>
                </div>

              </div>

              <div class="col-md-6">
                <!-- Year Level -->
                <div class="mb-3">
                  <label for="student-year" class="form-label">Year Level</label>
                  <input
                    type="number"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.year_level }"
                    id="student-year"
                    autocomplete="off"
                    v-model="formData.year_level"
                    min="1"
                    max="6"
                  />
                  <div v-if="formErrors.year_level" class="invalid-feedback">
                    {{ formErrors.year_level }}
                  </div>
                </div>

                <!-- Department -->
                <div class="mb-3">
                  <label for="student-department" class="form-label">Department</label>
                  <input
                    type="text"
                    class="form-control"
                    id="student-department"
                    autocomplete="organization"
                    v-model="formData.department"
                  />
                </div>

                <!-- Course -->
                <div class="mb-3">
                  <label for="student-course" class="form-label">Course</label>
                  <input
                    type="text"
                    class="form-control"
                    id="student-course"
                    autocomplete="organization-title"
                    v-model="formData.course"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="closeModal"
          >
            Cancel
          </button>
          <button type="button" class="btn btn-primary" @click="saveStudent">
            {{ isEditMode ? "Save Changes" : "Create Student" }}
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
</style>