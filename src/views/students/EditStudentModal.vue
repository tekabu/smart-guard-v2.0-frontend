<script setup>
import { ref, watch } from "vue";

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

// Form data
const formData = ref({
  id: null,
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "STUDENT",
  active: true,
  student_id: "",
  course: "",
  year_level: "",
  attendance_rate: "",
  department: "",
});

// Watch for student prop changes to populate form
watch(
  () => props.student,
  (newStudent) => {
    if (newStudent) {
      formData.value = {
        id: newStudent.id,
        name: newStudent.name || "",
        email: newStudent.email || "",
        password: "",
        confirmPassword: "",
        role: "STUDENT",
        active: newStudent.active !== undefined ? newStudent.active : true,
        student_id: newStudent.student_id || "",
        course: newStudent.course || "",
        year_level: newStudent.year_level || "",
        attendance_rate: newStudent.attendance_rate || "",
        department: newStudent.department || "",
      };
    }
  },
  { immediate: true }
);

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save student
function saveStudent() {
  // Validate passwords match
  if (formData.value.password && formData.value.password !== formData.value.confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  // Emit save event with form data
  emit("save", { ...formData.value });
  closeModal();
}
</script>

<template>
  <div
    class="modal"
    :class="{ show: show, 'd-block': show }"
    tabindex="-1"
    role="dialog"
    @click.self="closeModal"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Edit Student</h5>
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
                  <label for="student-name" class="form-label">Name</label>
                  <input
                    type="text"
                    class="form-control"
                    id="student-name"
                    autocomplete="name"
                    v-model="formData.name"
                    required
                  />
                </div>

                <!-- Email -->
                <div class="mb-3">
                  <label for="student-email" class="form-label">Email</label>
                  <input
                    type="email"
                    class="form-control"
                    id="student-email"
                    autocomplete="username"
                    v-model="formData.email"
                    required
                  />
                </div>

                <!-- Student ID -->
                <div class="mb-3">
                  <label for="student-id" class="form-label">Student ID</label>
                  <input
                    type="text"
                    class="form-control"
                    id="student-id"
                    autocomplete="off"
                    v-model="formData.student_id"
                    required
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
              
              <div class="col-md-6">
                <!-- Password -->
                <div class="mb-3">
                  <label for="student-password" class="form-label">Password</label>
                  <input
                    type="password"
                    class="form-control"
                    id="student-password"
                    autocomplete="new-password"
                    v-model="formData.password"
                    placeholder="Leave blank to keep current password"
                  />
                  <small class="form-text text-muted"
                    >Leave blank to keep current password</small
                  >
                </div>

                <!-- Confirm Password -->
                <div class="mb-3">
                  <label for="student-confirm-password" class="form-label"
                    >Confirm Password</label
                  >
                  <input
                    type="password"
                    class="form-control"
                    id="student-confirm-password"
                    autocomplete="new-password"
                    v-model="formData.confirmPassword"
                    placeholder="Confirm new password"
                  />
                </div>

                <!-- Year Level -->
                <div class="mb-3">
                  <label for="student-year" class="form-label">Year Level</label>
                  <input
                    type="number"
                    class="form-control"
                    id="student-year"
                    autocomplete="off"
                    v-model="formData.year_level"
                    min="1"
                    max="6"
                  />
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
              </div>
            </div>

            <!-- Active Toggle -->
            <div class="mb-3">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="student-active"
                  v-model="formData.active"
                />
                <label class="form-check-label" for="student-active">
                  Active
                </label>
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
            Save Changes
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