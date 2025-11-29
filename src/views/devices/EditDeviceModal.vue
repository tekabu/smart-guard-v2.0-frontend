<script setup>
import { ref, watch } from "vue";

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

// Form data
const formData = ref({
  id: null,
  device_id: "",
  door_open_duration_seconds: 5,
  active: true,
});

// Watch for device prop changes to populate form
watch(
  () => props.device,
  (newDevice) => {
    if (newDevice) {
      formData.value = {
        id: newDevice.id,
        device_id: newDevice.device_id || "",
        door_open_duration_seconds: newDevice.door_open_duration_seconds || 5,
        active: newDevice.active !== undefined ? newDevice.active : true,
      };
    }
  },
  { immediate: true }
);

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save device
function saveDevice() {
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
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Edit Device</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveDevice">
            <!-- Device ID -->
            <div class="mb-3">
              <label for="device-id" class="form-label">Device ID</label>
              <input
                type="text"
                class="form-control"
                id="device-id"
                autocomplete="off"
                v-model="formData.device_id"
                required
              />
            </div>

            <!-- Door Open Duration -->
            <div class="mb-3">
              <label for="door-duration" class="form-label">Door Open Duration (seconds)</label>
              <input
                type="number"
                class="form-control"
                id="door-duration"
                v-model="formData.door_open_duration_seconds"
                min="1"
                required
              />
            </div>

            <!-- Active Toggle -->
            <div class="mb-3">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="device-active"
                  v-model="formData.active"
                />
                <label class="form-check-label" for="device-active">
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
          <button type="button" class="btn btn-primary" @click="saveDevice">
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