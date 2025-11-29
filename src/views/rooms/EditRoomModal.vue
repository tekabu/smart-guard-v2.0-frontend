<script setup>
import { ref, watch } from "vue";
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

// Available devices
const availableDevices = ref([]);

// Form data
const formData = ref({
  id: null,
  room_number: "",
  device_id: null,
  active: true,
});

// Watch for room prop changes to populate form
watch(
  () => props.room,
  (newRoom) => {
    if (newRoom) {
      formData.value = {
        id: newRoom.id,
        room_number: newRoom.room_number || "",
        device_id: newRoom.device_id || null,
        active: newRoom.active !== undefined ? newRoom.active : true,
      };
    }
  },
  { immediate: true }
);

// Fetch devices on component mount
const fetchDevices = async () => {
  try {
    const response = await devicesService.getAll();
    availableDevices.value = response.data.filter(device => device.active);
  } catch (err) {
    console.error('Error fetching devices:', err);
  }
};

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save room
function saveRoom() {
  // Emit save event with form data
  emit("save", { ...formData.value });
  closeModal();
}

// Initialize devices when modal opens
watch(() => props.show, (newShow) => {
  if (newShow) {
    fetchDevices();
  }
});
</script>

<template>
  <div
    class="modal"
    :class="{ show: show, 'd-block': show }"
    tabindex="-1"
    role="dialog"
    @click.self="closeModal"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Edit Room</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveRoom">
            <!-- Room Number -->
            <div class="mb-3">
              <label for="room-number" class="form-label">Room Number</label>
              <input
                type="text"
                class="form-control"
                id="room-number"
                autocomplete="off"
                v-model="formData.room_number"
                required
              />
            </div>

            <!-- Device Selection -->
            <div class="mb-3">
              <label for="room-device" class="form-label">Device</label>
              <select
                class="form-select"
                id="room-device"
                v-model="formData.device_id"
              >
                <option :value="null">No Device</option>
                <option
                  v-for="device in availableDevices"
                  :key="device.id"
                  :value="device.id"
                >
                  {{ device.device_id }}
                </option>
              </select>
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