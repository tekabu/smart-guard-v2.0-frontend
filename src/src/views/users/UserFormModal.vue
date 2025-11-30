<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  user: {
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
  role: "STAFF",
  active: true,
});

// Watch for user prop changes to populate form
watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      formData.value = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        password: "",
        confirmPassword: "",
        role: newUser.role || "STAFF",
        active: newUser.active !== undefined ? newUser.active : true,
      };
    }
  },
  { immediate: true }
);

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save user
function saveUser() {
  // Validate passwords match
  if (formData.value.password && formData.value.password !== formData.value.confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  // Emit save event with form data
  emit("save", { ...formData.value });
  // Don't close modal here - let parent component handle it after API request
}
</script>

<template>
  <div
    class="modal"
    :class="{ show: show, 'd-block': show }"
    tabindex="-1"
    role="dialog"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Edit User</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveUser">
            <!-- Name -->
            <div class="mb-3">
              <label for="user-name" class="form-label">Name</label>
              <input
                type="text"
                class="form-control"
                id="user-name"
                autocomplete="name"
                v-model="formData.name"
                required
              />
            </div>

            <!-- Email -->
            <div class="mb-3">
              <label for="user-email" class="form-label">Email</label>
              <input
                type="email"
                class="form-control"
                id="user-email"
                autocomplete="username"
                v-model="formData.email"
                required
              />
            </div>

            <!-- Password -->
            <div class="mb-3">
              <label for="user-password" class="form-label">Password</label>
              <input
                type="password"
                class="form-control"
                id="user-password"
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
              <label for="user-confirm-password" class="form-label"
                >Confirm Password</label
              >
              <input
                type="password"
                class="form-control"
                id="user-confirm-password"
                autocomplete="new-password"
                v-model="formData.confirmPassword"
                placeholder="Confirm new password"
              />
            </div>

            <!-- Role -->
            <div class="mb-3">
              <label for="user-role" class="form-label">Role</label>
              <select 
                class="form-select" 
                id="user-role"
                v-model="formData.role"
                required
              >
                <option value="ADMIN">ADMIN</option>
                <option value="STAFF">STAFF</option>
              </select>
            </div>

            <!-- Active Toggle -->
            <div class="mb-3">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="user-active"
                  v-model="formData.active"
                />
                <label class="form-check-label" for="user-active">
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
          <button type="button" class="btn btn-primary" @click="saveUser">
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
