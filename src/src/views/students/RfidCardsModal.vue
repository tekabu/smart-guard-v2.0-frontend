<script setup>
import { ref, watch, computed, onUnmounted } from "vue";
import { showErrorToast, showSuccessToast } from "@/utils/errorHandler";
import userRfidsService from "@/services/userRfids";
import mqtt from "mqtt";

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

// RFID cards data
const rfidCards = ref([]);
const isLoading = ref(false);

// Form state
const showCardForm = ref(false);
const isEditMode = ref(false);
const editingCard = ref(null);

// Form data
const formData = ref({
  card_id: "",
});

// Form validation
const formErrors = ref({});

// MQTT state
const mqttClient = ref(null);
const isScanning = ref(false);
const isMqttConnected = ref(false);
const isMqttConnecting = ref(false);
const currentReference = ref(null);
const MQTT_BROKER = "ws://broker.emqx.io:8083/mqtt";
const TOPIC_PUBLISH = "dJfmRURS5LaJtZ1NZAHX86A9uAk4LZ-smart-guard-rfid";
const TOPIC_SUBSCRIBE = "dJfmRURS5LaJtZ1NZAHX86A9uAk4LZ-smart-guard-rfid-response";

// Watch for student prop changes to load RFID cards
watch(
  () => props.student,
  async (newStudent) => {
    if (newStudent?.id) {
      await loadRfidCards();
    }
  },
  { immediate: true }
);

// Watch for show prop changes
watch(
  () => props.show,
  (newShow) => {
    if (newShow && props.student?.id) {
      loadRfidCards();
    } else if (!newShow) {
      // Close MQTT connection when modal closes
      disconnectMqtt();
    }
  }
);

// Load RFID cards for the student
async function loadRfidCards() {
  if (!props.student?.id) return;

  try {
    isLoading.value = true;
    const response = await userRfidsService.getByUserId(props.student.id);
    rfidCards.value = response.data || [];
  } catch (err) {
    console.error('Error loading RFID cards:', err);
    showErrorToast(err);
  } finally {
    isLoading.value = false;
  }
}

// Show add card form
function showAddForm() {
  formData.value = {
    card_id: "",
  };
  formErrors.value = {};
  isEditMode.value = false;
  editingCard.value = null;
  showCardForm.value = true;
}

// Show edit card form
function showEditForm(card) {
  formData.value = {
    card_id: card.card_id,
  };
  formErrors.value = {};
  isEditMode.value = true;
  editingCard.value = card;
  showCardForm.value = true;
}

// Cancel form
function cancelForm() {
  showCardForm.value = false;
  formData.value = {
    card_id: "",
  };
  formErrors.value = {};
  isEditMode.value = false;
  editingCard.value = null;
}

// Validate form
function validateForm() {
  formErrors.value = {};

  if (!formData.value.card_id.trim()) {
    formErrors.value.card_id = "Card ID is required";
  }

  return Object.keys(formErrors.value).length === 0;
}

// Save card
async function saveCard() {
  if (!validateForm()) return;

  try {
    const cardData = {
      user_id: props.student.id,
      card_id: formData.value.card_id,
      active: true,
    };

    if (isEditMode.value) {
      await userRfidsService.update(editingCard.value.id, cardData);
      showSuccessToast('RFID card updated successfully');
    } else {
      await userRfidsService.create(cardData);
      showSuccessToast('RFID card added successfully');
    }

    await loadRfidCards();
    cancelForm();
  } catch (err) {
    console.error('Error saving RFID card:', err);
    showErrorToast(err);
  }
}

// Delete card
async function deleteCard(card) {
  if (!confirm(`Are you sure you want to delete card ${card.card_id}?`)) {
    return;
  }

  try {
    await userRfidsService.delete(card.id);
    showSuccessToast('RFID card deleted successfully');
    await loadRfidCards();
  } catch (err) {
    console.error('Error deleting RFID card:', err);
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
      console.log('Connected to MQTT broker');
      mqttClient.value.subscribe(TOPIC_SUBSCRIBE, (err) => {
        if (err) {
          console.error('Failed to subscribe:', err);
          showErrorToast('Failed to connect to RFID scanner');
          isMqttConnecting.value = false;
          isMqttConnected.value = false;
        } else {
          console.log('Subscribed to response topic');
          isMqttConnecting.value = false;
          isMqttConnected.value = true;
          showSuccessToast('Connected to RFID scanner');
        }
      });
    });

    mqttClient.value.on('message', (topic, message) => {
      if (topic === TOPIC_SUBSCRIBE) {
        try {
          const payload = JSON.parse(message.toString());
          console.log('Received MQTT message:', payload);

          // Check if this message is for our current request
          if (payload.reference === currentReference.value && payload.mode === 'REGISTER') {
            if (payload.data) {
              formData.value.card_id = payload.data;
              showSuccessToast('RFID card scanned successfully');
              isScanning.value = false;
              currentReference.value = null;
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
      console.log('MQTT connection closed');
      mqttClient.value = null;
      isMqttConnected.value = false;
      isMqttConnecting.value = false;
    });
  } catch (err) {
    console.error('Failed to connect to MQTT broker:', err);
    showErrorToast('Failed to connect to RFID scanner');
    isMqttConnecting.value = false;
    isMqttConnected.value = false;
  }
}

// Start RFID scan
function startRfidScan() {
  if (!mqttClient.value || !mqttClient.value.connected) {
    showErrorToast('Not connected to RFID scanner. Please try again.');
    return;
  }

  isScanning.value = true;
  currentReference.value = generateUUID();

  const payload = {
    reference: currentReference.value,
    position: "FRONT",
    mode: "REGISTER"
  };

  console.log('Publishing MQTT message:', payload);
  mqttClient.value.publish(TOPIC_PUBLISH, JSON.stringify(payload), (err) => {
    if (err) {
      console.error('Failed to publish:', err);
      showErrorToast('Failed to send scan request');
      isScanning.value = false;
      currentReference.value = null;
    } else {
      showSuccessToast('Waiting for RFID card scan...');
    }
  });
}

// Stop scanning
function stopRfidScan() {
  isScanning.value = false;
  currentReference.value = null;
}

// Disconnect MQTT
function disconnectMqtt() {
  if (mqttClient.value) {
    console.log('Disconnecting from MQTT broker');
    isScanning.value = false;
    currentReference.value = null;
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
            RFID Cards - {{ student?.name || '' }}
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

          <!-- Card form -->
          <div v-if="showCardForm" class="card mb-3">
            <div class="card-body">
              <h6 class="card-title">{{ isEditMode ? 'Edit RFID Card' : 'Add New RFID Card' }}</h6>
              <form @submit.prevent="saveCard">
                <div class="mb-3">
                  <label for="card-id" class="form-label">Card ID <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control"
                      :class="{ 'is-invalid': formErrors.card_id }"
                      id="card-id"
                      v-model="formData.card_id"
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
                    <!-- Show Scan button when connected -->
                    <button
                      v-if="isMqttConnected && !isEditMode"
                      type="button"
                      class="btn btn-info"
                      :class="{ 'btn-warning': isScanning }"
                      @click="isScanning ? stopRfidScan() : startRfidScan()"
                    >
                      <i class="fa" :class="isScanning ? 'fa-stop' : 'fa-wifi'"></i>
                      {{ isScanning ? 'Stop Scan' : 'Scan RFID' }}
                    </button>
                  </div>
                  <div v-if="formErrors.card_id" class="invalid-feedback d-block">
                    {{ formErrors.card_id }}
                  </div>
                  <small v-if="isScanning" class="text-warning d-block mt-1">
                    <i class="fa fa-spinner fa-spin me-1"></i>
                    Waiting for RFID card... Please scan your card now.
                  </small>
                  <small v-if="isMqttConnected && !isScanning && !isEditMode" class="text-success d-block mt-1">
                    <i class="fa fa-check-circle me-1"></i>
                    RFID scanner connected. Click "Scan RFID" to read a card.
                  </small>
                  <small v-if="isEditMode" class="text-muted d-block mt-1">
                    RFID scanning is only available when adding new cards.
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
          <div v-if="!showCardForm" class="mb-3">
            <button class="btn btn-primary btn-sm" @click="showAddForm">
              <i class="fa fa-plus me-1"></i>
              Add RFID Card
            </button>
          </div>

          <!-- Cards list -->
          <div v-if="!isLoading" class="table-responsive">
            <table class="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Card ID</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="rfidCards.length === 0">
                  <td colspan="4" class="text-center text-muted">
                    No RFID cards registered
                  </td>
                </tr>
                <tr v-for="card in rfidCards" :key="card.id">
                  <td>{{ card.card_id }}</td>
                  <td>{{ formatDate(card.created_at) }}</td>
                  <td>{{ formatDate(card.updated_at) }}</td>
                  <td class="text-center">
                    <div class="btn-group">
                      <button
                        type="button"
                        class="btn btn-sm btn-alt-secondary"
                        @click="showEditForm(card)"
                        title="Edit Card"
                      >
                        <i class="fa fa-fw fa-pencil-alt"></i>
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-alt-secondary"
                        @click="deleteCard(card)"
                        title="Delete Card"
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
