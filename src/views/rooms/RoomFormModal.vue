<script setup>
import { ref, watch, computed } from "vue";
import devicesService from "@/services/devices";

const props = defineProps({
  room: {
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
const isEditMode = computed(() => !!props.room?.id);

// Available devices
const availableDevices = ref([]);

// Form data
const formData = ref({
  id: null,
  room_number: "",
  device_id: null,
  active: true,
});

// Form validation
const formErrors = ref({});

// Watch for room prop changes to populate form
watch(
  () => props.room,
  (newRoom) => {
    if (newRoom && newRoom.id) {
      // Editing existing room
      formData.value = {
        id: newRoom.id,
        room_number: newRoom.room_number || "",
        device_id: newRoom.device_id || null,
        active: newRoom.active !== undefined ? newRoom.active : true,
      };
    } else {
      // Creating new room - reset form
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for show prop to reset form when modal opens for new room
watch(
  () => props.show,
  (newShow) => {
    if (newShow && !props.room) {
      resetForm();
    }
  }
);

// Reset form to defaults
function resetForm() {
  formData.value = {
    id: null,
    room_number: "",
    device_id: null,
    active: true,
  };
  formErrors.value = {};
}

// Validate form
function validateForm() {
  formErrors.value = {};
  
  // Room number validation
  if (!formData.value.room_number.trim()) {
    formErrors.value.room_number = "Room number is required";
  } else if (formData.value.room_number.trim().length < 2) {
    formErrors.value.room_number = "Room number must be at least 2 characters";
  } else if (formData.value.room_number.trim().length > 50) {
    formErrors.value.room_number = "Room number cannot exceed 50 characters";
  }
  
  return Object.keys(formErrors.value).length === 0;
}

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save room
function saveRoom() {
  // Validate form
  if (!validateForm()) {
    return;
  }

  // Prepare data for submission
  const dataToSave = { ...formData.value };
  
  // Remove id if it's null (for creating new room)
  if (!dataToSave.id) {
    delete dataToSave.id;
  }
  
  // Emit save event with form data
  emit("save", dataToSave);
  closeModal();
}

// Fetch devices on component mount
const fetchDevices = async () => {
  try {
    const response = await devicesService.getAll();
    availableDevices.value = response.data.filter(device => device.active);
  } catch (err) {
    console.error('Error fetching devices:', err);
  }
};

// Fetch devices when modal opens
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      fetchDevices();
    }
  }
);
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
          <h5 class="modal-title">{{ isEditMode ? "Edit Room" : "Add New Room" }}</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveRoom">
            <div class="row">
              <div class="col-md-6">
                <!-- Room Number -->
                <div class="mb-3">
                  <label for="room-number" class="form-label">Room Number <span class="text-danger">*</span></label>
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.room_number }"
                    id="room-number"
                    autocomplete="off"
                    v-model="formData.room_number"
                    placeholder="Enter room number"
                    required
                  />
                  <div v-if="formErrors.room_number" class="invalid-feedback">
                    {{ formErrors.room_number }}
                  </div>
                  <div class="form-text">Room number must be between 2 and 50 characters</div>
                </div>
              </div>
              
              <div class="col-md-6">
                <!-- Device -->
                <div class="mb-3">
                  <label for="device-select" class="form-label">Device</label>
                  <select
                    class="form-select"
                    id="device-select"
                    v-model="formData.device_id"
                  >
                    <option :value="null">Select a device (optional)</option>
                    <option
                      v-for="device in availableDevices"
                      :key="device.id"
                      :value="device.id"
                    >
                      {{ device.device_id }}
                    </option>
                  </select>
                  <div class="form-text">Assign a device to this room (optional)</div>
                </div>
              </div>
            </div>

            <!-- Active Toggle -->
            <div class="mb-3">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="room-active"
                  v-model="formData.active"
                />
                <label class="form-check-label" for="room-active">
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
          <button type="button" class="btn btn-primary" @click="saveRoom">
            {{ isEditMode ? "Save Changes" : "Create Room" }}
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