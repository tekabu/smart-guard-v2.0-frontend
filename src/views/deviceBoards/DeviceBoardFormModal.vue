<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  board: {
    type: Object,
    default: null,
  },
  show: {
    type: Boolean,
    default: false,
  },
  devices: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:show", "save"]);

// Determine if we're editing or creating
const isEditMode = computed(() => !!props.board?.id);

// Board types
const boardTypes = [
  "FINGERPRINT",
  "RFID", 
  "LOCK",
  "CAMERA",
  "DISPLAY"
];

// Form data
const formData = ref({
  id: null,
  device_id: null,
  board_type: "FINGERPRINT",
  mac_address: "",
  firmware_version: "",
  active: true,
});

// Form validation
const formErrors = ref({});

// Watch for board prop changes to populate form
watch(
  () => props.board,
  (newBoard) => {
    if (newBoard && newBoard.id) {
      // Editing existing board
      formData.value = {
        id: newBoard.id,
        device_id: newBoard.device_id || null,
        board_type: newBoard.board_type || "FINGERPRINT",
        mac_address: newBoard.mac_address || "",
        firmware_version: newBoard.firmware_version || "",
        active: newBoard.active !== undefined ? newBoard.active : true,
      };
    } else {
      // Creating new board - reset form
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for show prop to reset form when modal opens for new board
watch(
  () => props.show,
  (newShow) => {
    if (newShow && !props.board) {
      resetForm();
    }
  }
);

// Reset form to defaults
function resetForm() {
  formData.value = {
    id: null,
    device_id: null,
    board_type: "FINGERPRINT",
    mac_address: "",
    firmware_version: "",
    active: true,
  };
  formErrors.value = {};
}

// Validate form
function validateForm() {
  formErrors.value = {};
  
  // Device ID validation
  if (!formData.value.device_id) {
    formErrors.value.device_id = "Device is required";
  }
  
  // Board type validation
  if (!formData.value.board_type) {
    formErrors.value.board_type = "Board type is required";
  }
  
  // MAC address validation
  if (formData.value.mac_address && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(formData.value.mac_address)) {
    formErrors.value.mac_address = "Invalid MAC address format (XX:XX:XX:XX:XX:XX)";
  }
  
  return Object.keys(formErrors.value).length === 0;
}

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save board
function saveBoard() {
  // Validate form
  if (!validateForm()) {
    return;
  }

  // Prepare data for submission
  const dataToSave = { ...formData.value };
  
  // Remove id if it's null (for creating new board)
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
          <h5 class="modal-title">{{ isEditMode ? "Edit Device Board" : "Add New Device Board" }}</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveBoard">
            <div class="row">
              <div class="col-md-6">
                <!-- Device -->
                <div class="mb-3">
                  <label for="device-select" class="form-label">Device <span class="text-danger">*</span></label>
                  <select
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.device_id }"
                    id="device-select"
                    v-model="formData.device_id"
                    required
                  >
                    <option :value="null">Select a device</option>
                    <option
                      v-for="device in devices"
                      :key="device.id"
                      :value="device.id"
                    >
                      {{ device.device_id }}
                    </option>
                  </select>
                  <div v-if="formErrors.device_id" class="invalid-feedback">
                    {{ formErrors.device_id }}
                  </div>
                </div>

                <!-- Board Type -->
                <div class="mb-3">
                  <label for="board-type" class="form-label">Board Type <span class="text-danger">*</span></label>
                  <select
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.board_type }"
                    id="board-type"
                    v-model="formData.board_type"
                    required
                  >
                    <option
                      v-for="type in boardTypes"
                      :key="type"
                      :value="type"
                    >
                      {{ type }}
                    </option>
                  </select>
                  <div v-if="formErrors.board_type" class="invalid-feedback">
                    {{ formErrors.board_type }}
                  </div>
                </div>
              </div>
              
              <div class="col-md-6">
                <!-- MAC Address -->
                <div class="mb-3">
                  <label for="mac-address" class="form-label">MAC Address</label>
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.mac_address }"
                    id="mac-address"
                    autocomplete="off"
                    v-model="formData.mac_address"
                    placeholder="XX:XX:XX:XX:XX:XX"
                  />
                  <div v-if="formErrors.mac_address" class="invalid-feedback">
                    {{ formErrors.mac_address }}
                  </div>
                  <!-- <div class="form-text">Format: XX:XX:XX:XX:XX:XX (optional)</div> -->
                </div>

                <!-- Firmware Version -->
                <div class="mb-3">
                  <label for="firmware-version" class="form-label">Firmware Version</label>
                  <input
                    type="text"
                    class="form-control"
                    id="firmware-version"
                    autocomplete="off"
                    v-model="formData.firmware_version"
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
                  id="board-active"
                  v-model="formData.active"
                />
                <label class="form-check-label" for="board-active">
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
          <button type="button" class="btn btn-primary" @click="saveBoard">
            {{ isEditMode ? "Save Changes" : "Create Device Board" }}
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