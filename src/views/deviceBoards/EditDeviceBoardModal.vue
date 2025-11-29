<script setup>
import { ref, watch } from "vue";

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

// Watch for board prop changes to populate form
watch(
  () => props.board,
  (newBoard) => {
    if (newBoard) {
      formData.value = {
        id: newBoard.id,
        device_id: newBoard.device_id || null,
        board_type: newBoard.board_type || "FINGERPRINT",
        mac_address: newBoard.mac_address || "",
        firmware_version: newBoard.firmware_version || "",
        active: newBoard.active !== undefined ? newBoard.active : true,
      };
    }
  },
  { immediate: true }
);

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save device board
function saveDeviceBoard() {
  // Validate MAC address format
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  if (formData.value.mac_address && !macRegex.test(formData.value.mac_address)) {
    alert("Please enter a valid MAC address format (e.g., AA:BB:CC:DD:EE:FF)");
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
          <h5 class="modal-title">Edit Device Board</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveDeviceBoard">
            <div class="row">
              <div class="col-md-6">
                <!-- Device Selection -->
                <div class="mb-3">
                  <label for="board-device" class="form-label">Device</label>
                  <select
                    class="form-select"
                    id="board-device"
                    v-model="formData.device_id"
                    required
                  >
                    <option :value="null">Select Device</option>
                    <option
                      v-for="device in devices"
                      :key="device.id"
                      :value="device.id"
                    >
                      {{ device.device_id }}
                    </option>
                  </select>
                </div>

                <!-- Board Type -->
                <div class="mb-3">
                  <label for="board-type" class="form-label">Board Type</label>
                  <select
                    class="form-select"
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
                </div>
              </div>
              
              <div class="col-md-6">
                <!-- MAC Address -->
                <div class="mb-3">
                  <label for="board-mac" class="form-label">MAC Address</label>
                  <input
                    type="text"
                    class="form-control"
                    id="board-mac"
                    autocomplete="off"
                    v-model="formData.mac_address"
                    placeholder="AA:BB:CC:DD:EE:FF"
                    pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
                    required
                  />
                  <small class="form-text text-muted"
                    >Format: AA:BB:CC:DD:EE:FF</small
                  >
                </div>

                <!-- Firmware Version -->
                <div class="mb-3">
                  <label for="board-firmware" class="form-label">Firmware Version</label>
                  <input
                    type="text"
                    class="form-control"
                    id="board-firmware"
                    autocomplete="off"
                    v-model="formData.firmware_version"
                    placeholder="e.g., v1.2.3"
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
          <button type="button" class="btn btn-primary" @click="saveDeviceBoard">
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