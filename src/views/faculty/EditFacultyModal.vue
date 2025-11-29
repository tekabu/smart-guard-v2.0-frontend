<script setup>
import { ref, watch } from "vue";

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

// Watch for faculty prop changes to populate form
watch(
  () => props.faculty,
  (newFaculty) => {
    if (newFaculty) {
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
    }
  },
  { immediate: true }
);

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save faculty member
function saveFacultyMember() {
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
          <h5 class="modal-title">Edit Faculty Member</h5>
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
                  <label for="faculty-name" class="form-label">Name</label>
                  <input
                    type="text"
                    class="form-control"
                    id="faculty-name"
                    autocomplete="name"
                    v-model="formData.name"
                    required
                  />
                </div>

                <!-- Email -->
                <div class="mb-3">
                  <label for="faculty-email" class="form-label">Email</label>
                  <input
                    type="email"
                    class="form-control"
                    id="faculty-email"
                    autocomplete="username"
                    v-model="formData.email"
                    required
                  />
                </div>

                <!-- Faculty ID -->
                <div class="mb-3">
                  <label for="faculty-id" class="form-label">Faculty ID</label>
                  <input
                    type="text"
                    class="form-control"
                    id="faculty-id"
                    autocomplete="off"
                    v-model="formData.faculty_id"
                    required
                  />
                </div>
              </div>
              
              <div class="col-md-6">
                <!-- Password -->
                <div class="mb-3">
                  <label for="faculty-password" class="form-label">Password</label>
                  <input
                    type="password"
                    class="form-control"
                    id="faculty-password"
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
                  <label for="faculty-confirm-password" class="form-label"
                    >Confirm Password</label
                  >
                  <input
                    type="password"
                    class="form-control"
                    id="faculty-confirm-password"
                    autocomplete="new-password"
                    v-model="formData.confirmPassword"
                    placeholder="Confirm new password"
                  />
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