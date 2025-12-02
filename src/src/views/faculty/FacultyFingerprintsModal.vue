<script setup>
import { ref, watch, computed } from "vue";
import { showErrorToast, showSuccessToast } from "@/utils/errorHandler";
import userFingerprintsService from "@/services/userFingerprints";

const props = defineProps({
  faculty: {
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

// Watch for faculty prop changes to load fingerprints
watch(
  () => props.faculty,
  async (newFaculty) => {
    if (newFaculty?.id) {
      await loadFingerprints();
    }
  },
  { immediate: true }
);

// Watch for show prop changes
watch(
  () => props.show,
  (newShow) => {
    if (newShow && props.faculty?.id) {
      loadFingerprints();
    }
  }
);

// Load fingerprints for the faculty
async function loadFingerprints() {
  if (!props.faculty?.id) return;

  try {
    isLoading.value = true;
    const response = await userFingerprintsService.getByUserId(props.faculty.id);
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
      user_id: props.faculty.id,
      fingerprint_id: parseInt(formData.value.fingerprint_id),
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
            Fingerprints - {{ faculty?.name || '' }}
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
                  <input
                    type="number"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.fingerprint_id }"
                    id="fingerprint-id"
                    v-model="formData.fingerprint_id"
                    required
                  />
                  <div v-if="formErrors.fingerprint_id" class="invalid-feedback">
                    {{ formErrors.fingerprint_id }}
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
