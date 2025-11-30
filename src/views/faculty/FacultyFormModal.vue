<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  faculty: {
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
const isEditMode = computed(() => !!props.faculty?.id);

// Form data
const formData = ref({
  id: null,
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "FACULTY",
  active: true,
  faculty_id: "",
  department: "",
});

// Form validation
const formErrors = ref({});

// Watch for faculty prop changes to populate form
watch(
  () => props.faculty,
  (newFaculty) => {
    if (newFaculty && newFaculty.id) {
      // Editing existing faculty
      formData.value = {
        id: newFaculty.id,
        name: newFaculty.name || "",
        email: newFaculty.email || "",
        password: "",
        confirmPassword: "",
        role: "FACULTY",
        active: newFaculty.active !== undefined ? newFaculty.active : true,
        faculty_id: newFaculty.faculty_id || "",
        department: newFaculty.department || "",
      };
    } else {
      // Creating new faculty - reset form
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for show prop to reset form when modal opens for new faculty
watch(
  () => props.show,
  (newShow) => {
    if (newShow && !props.faculty) {
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
    password: "",
    confirmPassword: "",
    role: "FACULTY",
    active: true,
    faculty_id: "",
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
  
  // Faculty ID validation
  if (!formData.value.faculty_id.trim()) {
    formErrors.value.faculty_id = "Faculty ID is required";
  }
  
  // Password validation (required for new faculty)
  if (!isEditMode.value && !formData.value.password) {
    formErrors.value.password = "Password is required for new faculty";
  }
  
  // Password confirmation validation
  if (formData.value.password && formData.value.password !== formData.value.confirmPassword) {
    formErrors.value.confirmPassword = "Passwords do not match";
  }
  
  return Object.keys(formErrors.value).length === 0;
}

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save faculty member
function saveFacultyMember() {
  // Validate form
  if (!validateForm()) {
    return;
  }

  // Prepare data for submission
  const dataToSave = { ...formData.value };
  
  // Remove password fields if they're empty (for editing)
  if (isEditMode.value && !dataToSave.password) {
    delete dataToSave.password;
    delete dataToSave.confirmPassword;
  }
  
  // Remove confirmPassword field as it's not needed in the API call
  delete dataToSave.confirmPassword;
  
  // Remove id if it's null (for creating new faculty)
  if (!dataToSave.id) {
    delete dataToSave.id;
  }
  
  // Emit save event with form data
  emit("save", dataToSave);
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
          <h5 class="modal-title">{{ isEditMode ? "Edit Faculty Member" : "Add New Faculty Member" }}</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveFacultyMember">
            <div class="row">
              <div class="col-md-6">
                <!-- Name -->
                <div class="mb-3">
                  <label for="faculty-name" class="form-label">Name <span class="text-danger">*</span></label>
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.name }"
                    id="faculty-name"
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
                  <label for="faculty-email" class="form-label">Email <span class="text-danger">*</span></label>
                  <input
                    type="email"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.email }"
                    id="faculty-email"
                    autocomplete="username"
                    v-model="formData.email"
                    required
                  />
                  <div v-if="formErrors.email" class="invalid-feedback">
                    {{ formErrors.email }}
                  </div>
                </div>

                <!-- Faculty ID -->
                <div class="mb-3">
                  <label for="faculty-id" class="form-label">Faculty ID <span class="text-danger">*</span></label>
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.faculty_id }"
                    id="faculty-id"
                    autocomplete="off"
                    v-model="formData.faculty_id"
                    required
                  />
                  <div v-if="formErrors.faculty_id" class="invalid-feedback">
                    {{ formErrors.faculty_id }}
                  </div>
                </div>
              </div>
              
              <div class="col-md-6">
                <!-- Password -->
                <div class="mb-3">
                  <label for="faculty-password" class="form-label">
                    Password <span v-if="!isEditMode" class="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.password }"
                    id="faculty-password"
                    autocomplete="new-password"
                    v-model="formData.password"
                    :placeholder="isEditMode ? 'Leave blank to keep current password' : ''"
                  />
                  <small v-if="isEditMode" class="form-text text-muted"
                    >Leave blank to keep current password</small
                  >
                  <div v-if="formErrors.password" class="invalid-feedback">
                    {{ formErrors.password }}
                  </div>
                </div>

                <!-- Confirm Password -->
                <div class="mb-3">
                  <label for="faculty-confirm-password" class="form-label">
                    Confirm Password <span v-if="formData.password" class="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.confirmPassword }"
                    id="faculty-confirm-password"
                    autocomplete="new-password"
                    v-model="formData.confirmPassword"
                    placeholder="Confirm new password"
                  />
                  <div v-if="formErrors.confirmPassword" class="invalid-feedback">
                    {{ formErrors.confirmPassword }}
                  </div>
                </div>

                <!-- Department -->
                <div class="mb-3">
                  <label for="faculty-department" class="form-label">Department</label>
                  <input
                    type="text"
                    class="form-control"
                    id="faculty-department"
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
                  id="faculty-active"
                  v-model="formData.active"
                />
                <label class="form-check-label" for="faculty-active">
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
          <button type="button" class="btn btn-primary" @click="saveFacultyMember">
            {{ isEditMode ? "Save Changes" : "Create Faculty Member" }}
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