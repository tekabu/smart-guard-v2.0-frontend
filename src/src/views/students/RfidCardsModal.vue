<script setup>
import { ref, watch, computed } from "vue";
import { showErrorToast, showSuccessToast } from "@/utils/errorHandler";
import userRfidsService from "@/services/userRfids";

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
  active: true,
});

// Form validation
const formErrors = ref({});

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
    active: true,
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
    active: card.active,
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
    active: true,
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
      active: formData.value.active,
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
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.card_id }"
                    id="card-id"
                    v-model="formData.card_id"
                    :disabled="isEditMode"
                    required
                  />
                  <div v-if="formErrors.card_id" class="invalid-feedback">
                    {{ formErrors.card_id }}
                  </div>
                </div>
                <div class="mb-3">
                  <div class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="card-active"
                      v-model="formData.active"
                    />
                    <label class="form-check-label" for="card-active">
                      Active
                    </label>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary btn-sm">
                    <i class="fa fa-save me-1"></i>
                    {{ isEditMode ? 'Update' : 'Add' }}
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm" @click="cancelForm">
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
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="rfidCards.length === 0">
                  <td colspan="5" class="text-center text-muted">
                    No RFID cards registered
                  </td>
                </tr>
                <tr v-for="card in rfidCards" :key="card.id">
                  <td>{{ card.card_id }}</td>
                  <td>
                    <span :class="['badge', card.active ? 'bg-success' : 'bg-danger']">
                      {{ card.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
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
