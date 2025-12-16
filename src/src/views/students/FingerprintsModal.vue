<script setup>
import { ref, watch, computed, onUnmounted } from "vue";
import { showErrorToast, showSuccessToast } from "@/utils/errorHandler";
import userFingerprintsService from "@/services/userFingerprints";
import mqtt from "mqtt";
import Swal from "sweetalert2";

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

const emit = defineEmits(["update:show"]);

// Fingerprints data
const fingerprints = ref([]);
const isLoading = ref(false);

// Form state
const showFingerprintForm = ref(false);
const isEditMode = ref(false);
const editingFingerprint = ref(null);

// Form data
const formData = ref({
  fingerprint_id: "",
});

// Form validation
const formErrors = ref({});

// MQTT state
const mqttClient = ref(null);
const isScanning = ref(false);
const isMqttConnected = ref(false);
const isMqttConnecting = ref(false);
const currentReference = ref(null);
const currentPosition = ref(null); // Track which position is being scanned
const MQTT_BROKER = "wss://broker.emqx.io:8084/mqtt";
const TOPIC_PUBLISH = "dJfmRURS5LaJtZ1NZAHX86A9uAk4LZ-smart-guard-fingerprint";
const TOPIC_SUBSCRIBE = "dJfmRURS5LaJtZ1NZAHX86A9uAk4LZ-smart-guard-fingerprint-response";

// Toast for showing log messages
const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

// Watch for student prop changes to load fingerprints
watch(
  () => props.student,
  async (newStudent) => {
    if (newStudent?.id) {
      await loadFingerprints();
    }
  },
  { immediate: true }
);

// Watch for show prop changes
watch(
  () => props.show,
  (newShow) => {
    if (newShow && props.student?.id) {
      loadFingerprints();
    } else if (!newShow) {
      // Close MQTT connection when modal closes
      disconnectMqtt();
    }
  }
);

// Load fingerprints for the student
async function loadFingerprints() {
  if (!props.student?.id) return;

  try {
    isLoading.value = true;
    const response = await userFingerprintsService.getByUserId(props.student.id);
    fingerprints.value = response.data || [];
  } catch (err) {
    console.error('Error loading fingerprints:', err);
    showErrorToast(err);
  } finally {
    isLoading.value = false;
  }
}

// Show add fingerprint form
function showAddForm() {
  formData.value = {
    fingerprint_id: "",
  };
  formErrors.value = {};
  isEditMode.value = false;
  editingFingerprint.value = null;
  showFingerprintForm.value = true;
}

// Show edit fingerprint form
function showEditForm(fingerprint) {
  formData.value = {
    fingerprint_id: fingerprint.fingerprint_id,
  };
  formErrors.value = {};
  isEditMode.value = true;
  editingFingerprint.value = fingerprint;
  showFingerprintForm.value = true;
}

// Cancel form
function cancelForm() {
  showFingerprintForm.value = false;
  formData.value = {
    fingerprint_id: "",
  };
  formErrors.value = {};
  isEditMode.value = false;
  editingFingerprint.value = null;
}

// Validate form
function validateForm() {
  formErrors.value = {};

  if (!formData.value.fingerprint_id) {
    formErrors.value.fingerprint_id = "Fingerprint ID is required";
  }

  return Object.keys(formErrors.value).length === 0;
}

// Save fingerprint
async function saveFingerprint() {
  if (!validateForm()) return;

  try {
    const fingerprintData = {
      user_id: props.student.id,
      fingerprint_id: formData.value.fingerprint_id,
      active: true,
    };

    if (isEditMode.value) {
      await userFingerprintsService.update(editingFingerprint.value.id, fingerprintData);
      showSuccessToast('Fingerprint updated successfully');
    } else {
      await userFingerprintsService.create(fingerprintData);
      showSuccessToast('Fingerprint added successfully');
    }

    await loadFingerprints();
    cancelForm();
  } catch (err) {
    console.error('Error saving fingerprint:', err);
    showErrorToast(err);
  }
}

// Delete fingerprint
async function deleteFingerprint(fingerprint) {
  if (!confirm(`Are you sure you want to delete fingerprint ID ${fingerprint.fingerprint_id}?`)) {
    return;
  }

  try {
    await userFingerprintsService.delete(fingerprint.id);
    showSuccessToast('Fingerprint deleted successfully');
    await loadFingerprints();
  } catch (err) {
    console.error('Error deleting fingerprint:', err);
    showErrorToast(err);
  }
}

// Close modal
function closeModal() {
  cancelForm();
  emit("update:show", false);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}

// Generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize MQTT connection
function initMqttConnection() {
  if (mqttClient.value) {
    return; // Already connected
  }

  try {
    isMqttConnecting.value = true;
    isMqttConnected.value = false;
    mqttClient.value = mqtt.connect(MQTT_BROKER);

    mqttClient.value.on('connect', () => {
      console.log('Connected to MQTT broker (Fingerprint)');
      mqttClient.value.subscribe(TOPIC_SUBSCRIBE, (err) => {
        if (err) {
          console.error('Failed to subscribe:', err);
          showErrorToast('Failed to connect to fingerprint scanner');
          isMqttConnecting.value = false;
          isMqttConnected.value = false;
        } else {
          console.log('Subscribed to fingerprint response topic');
          isMqttConnecting.value = false;
          isMqttConnected.value = true;
          showSuccessToast('Connected to fingerprint scanner');
        }
      });
    });

    mqttClient.value.on('message', (topic, message) => {
      if (topic === TOPIC_SUBSCRIBE) {
        try {
          const payload = JSON.parse(message.toString());
          console.log('Received MQTT fingerprint message:', payload);

          // Check if this message is for our current request and mode is REGISTER
          if (payload.reference === currentReference.value && payload.mode === 'REGISTER') {
            // Handle log messages (if present)
            if (payload.hasOwnProperty('log') && payload.log) {
              toast.fire({
                icon: 'info',
                title: payload.log
              });
            }

            // Only capture data if it exists and mode is REGISTER
            if (payload.hasOwnProperty('data') && payload.data !== null && payload.data !== undefined) {
              formData.value.fingerprint_id = payload.data.toString();
              showSuccessToast(`Fingerprint scanned successfully (${payload.position})`);
              isScanning.value = false;
              currentReference.value = null;
              currentPosition.value = null;
            }
          }
        } catch (err) {
          console.error('Error parsing MQTT message:', err);
        }
      }
    });

    mqttClient.value.on('error', (err) => {
      console.error('MQTT error:', err);
      showErrorToast('MQTT connection error');
      isScanning.value = false;
      isMqttConnecting.value = false;
      isMqttConnected.value = false;
    });

    mqttClient.value.on('close', () => {
      console.log('MQTT connection closed (Fingerprint)');
      mqttClient.value = null;
      isMqttConnected.value = false;
      isMqttConnecting.value = false;
    });
  } catch (err) {
    console.error('Failed to connect to MQTT broker:', err);
    showErrorToast('Failed to connect to fingerprint scanner');
    isMqttConnecting.value = false;
    isMqttConnected.value = false;
  }
}

// Start fingerprint scan
function startFingerprintScan(position) {
  if (!mqttClient.value || !mqttClient.value.connected) {
    showErrorToast('Not connected to fingerprint scanner. Please try again.');
    return;
  }

  isScanning.value = true;
  currentReference.value = generateUUID();
  currentPosition.value = position;

  const payload = {
    reference: currentReference.value,
    position: position,
    mode: "REGISTER"
  };

  console.log('Publishing MQTT fingerprint message:', payload);
  mqttClient.value.publish(TOPIC_PUBLISH, JSON.stringify(payload), (err) => {
    if (err) {
      console.error('Failed to publish:', err);
      showErrorToast('Failed to send scan request');
      isScanning.value = false;
      currentReference.value = null;
      currentPosition.value = null;
    } else {
      showSuccessToast(`Waiting for fingerprint scan (${position})...`);
    }
  });
}

// Stop scanning
function stopFingerprintScan() {
  isScanning.value = false;
  currentReference.value = null;
  currentPosition.value = null;
}

// Disconnect MQTT
function disconnectMqtt() {
  if (mqttClient.value) {
    console.log('Disconnecting from MQTT broker (Fingerprint)');
    isScanning.value = false;
    currentReference.value = null;
    currentPosition.value = null;
    isMqttConnected.value = false;
    isMqttConnecting.value = false;
    mqttClient.value.end();
    mqttClient.value = null;
  }
}

// Cleanup MQTT connection on unmount
onUnmounted(() => {
  disconnectMqtt();
});
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
          <h5 class="modal-title">
            Fingerprints - {{ student?.name || '' }}
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <!-- Loading state -->
          <div v-if="isLoading" class="text-center py-3">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>

          <!-- Fingerprint form -->
          <div v-if="showFingerprintForm" class="card mb-3">
            <div class="card-body">
              <h6 class="card-title">{{ isEditMode ? 'Edit Fingerprint' : 'Add New Fingerprint' }}</h6>
              <form @submit.prevent="saveFingerprint">
                <div class="mb-3">
                  <label for="fingerprint-id" class="form-label">Fingerprint ID <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control"
                      :class="{ 'is-invalid': formErrors.fingerprint_id }"
                      id="fingerprint-id"
                      v-model="formData.fingerprint_id"
                      required
                      :disabled="isScanning"
                    />
                    <!-- Show Connect button when not connected -->
                    <button
                      v-if="!isMqttConnected && !isEditMode"
                      type="button"
                      class="btn btn-secondary"
                      @click="initMqttConnection"
                      :disabled="isMqttConnecting"
                    >
                      <i class="fa" :class="isMqttConnecting ? 'fa-spinner fa-spin' : 'fa-plug'"></i>
                      {{ isMqttConnecting ? 'Connecting...' : 'Connect Scanner' }}
                    </button>
                    <!-- Show Scan buttons when connected -->
                    <button
                      v-if="isMqttConnected && !isEditMode"
                      type="button"
                      class="btn btn-info"
                      :class="{ 'btn-warning': isScanning && currentPosition === 'FRONT' }"
                      @click="isScanning && currentPosition === 'FRONT' ? stopFingerprintScan() : startFingerprintScan('FRONT')"
                      :disabled="isScanning && currentPosition !== 'FRONT'"
                    >
                      <i class="fa" :class="isScanning && currentPosition === 'FRONT' ? 'fa-stop' : 'fa-fingerprint'"></i>
                      {{ isScanning && currentPosition === 'FRONT' ? 'Stop Scan' : 'Scan Front' }}
                    </button>
                    <button
                      v-if="isMqttConnected && !isEditMode"
                      type="button"
                      class="btn btn-info ms-1"
                      :class="{ 'btn-warning': isScanning && currentPosition === 'BACK' }"
                      @click="isScanning && currentPosition === 'BACK' ? stopFingerprintScan() : startFingerprintScan('BACK')"
                      :disabled="isScanning && currentPosition !== 'BACK'"
                    >
                      <i class="fa" :class="isScanning && currentPosition === 'BACK' ? 'fa-stop' : 'fa-fingerprint'"></i>
                      {{ isScanning && currentPosition === 'BACK' ? 'Stop Scan' : 'Scan Back' }}
                    </button>
                  </div>
                  <div v-if="formErrors.fingerprint_id" class="invalid-feedback d-block">
                    {{ formErrors.fingerprint_id }}
                  </div>
                  <small v-if="isScanning" class="text-warning d-block mt-1">
                    <i class="fa fa-spinner fa-spin me-1"></i>
                    Waiting for fingerprint scan... Please place your finger on the scanner.
                  </small>
                  <small v-if="isMqttConnected && !isScanning && !isEditMode" class="text-success d-block mt-1">
                    <i class="fa fa-check-circle me-1"></i>
                    Fingerprint scanner connected. Click "Scan Fingerprint" to register.
                  </small>
                  <small v-if="isEditMode" class="text-muted d-block mt-1">
                    Fingerprint scanning is only available when adding new fingerprints.
                  </small>
                </div>
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary btn-sm" :disabled="isScanning">
                    <i class="fa fa-save me-1"></i>
                    {{ isEditMode ? 'Update' : 'Add' }}
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm" @click="cancelForm" :disabled="isScanning">
                    <i class="fa fa-times me-1"></i>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Add button -->
          <div v-if="!showFingerprintForm" class="mb-3">
            <button class="btn btn-primary btn-sm" @click="showAddForm">
              <i class="fa fa-plus me-1"></i>
              Add Fingerprint
            </button>
          </div>

          <!-- Fingerprints list -->
          <div v-if="!isLoading" class="table-responsive">
            <table class="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Fingerprint ID</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="fingerprints.length === 0">
                  <td colspan="4" class="text-center text-muted">
                    No fingerprints registered
                  </td>
                </tr>
                <tr v-for="fingerprint in fingerprints" :key="fingerprint.id">
                  <td>{{ fingerprint.fingerprint_id }}</td>
                  <td>{{ formatDate(fingerprint.created_at) }}</td>
                  <td>{{ formatDate(fingerprint.updated_at) }}</td>
                  <td class="text-center">
                    <div class="btn-group">
                      <button
                        type="button"
                        class="btn btn-sm btn-alt-secondary"
                        @click="showEditForm(fingerprint)"
                        title="Edit Fingerprint"
                      >
                        <i class="fa fa-fw fa-pencil-alt"></i>
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-alt-secondary"
                        @click="deleteFingerprint(fingerprint)"
                        title="Delete Fingerprint"
                      >
                        <i class="fa fa-fw fa-times"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="closeModal"
          >
            Close
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

/* Ensure labels and titles adapt to theme */
.dark-mode .form-label,
.dark-mode .form-check-label,
.dark-mode .card-title {
  color: #d4d8dd !important;
}
</style>
