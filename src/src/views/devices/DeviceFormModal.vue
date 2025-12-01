<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  device: {
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
const isEditMode = computed(() => !!props.device?.id);

// Form data
const formData = ref({
  id: null,
  device_id: "",
  door_open_duration_seconds: 5,
});

// Form validation
const formErrors = ref({});

// Watch for device prop changes to populate form
watch(
  () => props.device,
  (newDevice) => {
    if (newDevice && newDevice.id) {
      // Editing existing device
      formData.value = {
        id: newDevice.id,
        device_id: newDevice.device_id || "",
        door_open_duration_seconds: newDevice.door_open_duration_seconds || 5,
      };
    } else {
      // Creating new device - reset form
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for show prop to reset form when modal opens for new device
watch(
  () => props.show,
  (newShow) => {
    if (newShow && !props.device) {
      resetForm();
    }
  }
);

// Reset form to defaults
function resetForm() {
  formData.value = {
    id: null,
    device_id: "",
    door_open_duration_seconds: 5,
  };
  formErrors.value = {};
}

// Validate form
function validateForm() {
  formErrors.value = {};
  
  // Device ID validation
  if (!formData.value.device_id.trim()) {
    formErrors.value.device_id = "Device ID is required";
  }
  
  // Door open duration validation
  if (!formData.value.door_open_duration_seconds || formData.value.door_open_duration_seconds < 1) {
    formErrors.value.door_open_duration_seconds = "Door open duration must be at least 1 second";
  }
  
  if (formData.value.door_open_duration_seconds > 60) {
    formErrors.value.door_open_duration_seconds = "Door open duration cannot exceed 60 seconds";
  }
  
  return Object.keys(formErrors.value).length === 0;
}

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save device
function saveDevice() {
  // Validate form
  if (!validateForm()) {
    return;
  }

  // Prepare data for submission
  const dataToSave = { ...formData.value };
  
  // Remove id if it's null (for creating new device)
  if (!dataToSave.id) {
    delete dataToSave.id;
  }
  
  // Emit save event with form data
  emit("save", dataToSave);
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
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ isEditMode ? "Edit Device" : "Add New Device" }}</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveDevice">
            <div class="row">
              <div class="col-md-6">
                <!-- Device ID -->
                <div class="mb-3">
                  <label for="device-id" class="form-label">Device ID <span class="text-danger">*</span></label>
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.device_id }"
                    id="device-id"
                    autocomplete="off"
                    v-model="formData.device_id"
                    required
                  />
                  <div v-if="formErrors.device_id" class="invalid-feedback">
                    {{ formErrors.device_id }}
                  </div>
                </div>
              </div>
              
              <div class="col-md-6">
                <!-- Door Open Duration -->
                <div class="mb-3">
                  <label for="door-duration" class="form-label">Door Open Duration (seconds) <span class="text-danger">*</span></label>
                  <input
                    type="number"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.door_open_duration_seconds }"
                    id="door-duration"
                    autocomplete="off"
                    v-model="formData.door_open_duration_seconds"
                    min="1"
                    max="60"
                    required
                  />
                  <div v-if="formErrors.door_open_duration_seconds" class="invalid-feedback">
                    {{ formErrors.door_open_duration_seconds }}
                  </div>
                  <div class="form-text">Duration must be between 1 and 60 seconds</div>
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
          <button type="button" class="btn btn-primary" @click="saveDevice">
            {{ isEditMode ? "Save Changes" : "Create Device" }}
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