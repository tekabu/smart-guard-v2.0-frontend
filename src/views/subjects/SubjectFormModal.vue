<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  subject: {
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
const isEditMode = computed(() => !!props.subject?.id);

// Form data
const formData = ref({
  id: null,
  subject: "",
  active: true,
});

// Form validation
const formErrors = ref({});

// Watch for subject prop changes to populate form
watch(
  () => props.subject,
  (newSubject) => {
    if (newSubject && newSubject.id) {
      // Editing existing subject
      formData.value = {
        id: newSubject.id,
        subject: newSubject.subject || "",
        active: newSubject.active !== undefined ? newSubject.active : true,
      };
    } else {
      // Creating new subject - reset form
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for show prop to reset form when modal opens for new subject
watch(
  () => props.show,
  (newShow) => {
    if (newShow && !props.subject) {
      resetForm();
    }
  }
);

// Reset form to defaults
function resetForm() {
  formData.value = {
    id: null,
    subject: "",
    active: true,
  };
  formErrors.value = {};
}

// Validate form
function validateForm() {
  formErrors.value = {};
  
  // Subject name validation
  if (!formData.value.subject.trim()) {
    formErrors.value.subject = "Subject name is required";
  } else if (formData.value.subject.trim().length < 3) {
    formErrors.value.subject = "Subject name must be at least 3 characters";
  } else if (formData.value.subject.trim().length > 100) {
    formErrors.value.subject = "Subject name cannot exceed 100 characters";
  }
  
  return Object.keys(formErrors.value).length === 0;
}

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save subject
function saveSubject() {
  // Validate form
  if (!validateForm()) {
    return;
  }

  // Prepare data for submission
  const dataToSave = { ...formData.value };
  
  // Remove id if it's null (for creating new subject)
  if (!dataToSave.id) {
    delete dataToSave.id;
  }
  
  // Emit save event with form data
  emit("save", dataToSave);
  closeModal();
}
</script>

<template>
  <div
    class="modal"
    :class="{ show: show, 'd-block': show }"
    tabindex="-1"
    role="dialog"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ isEditMode ? "Edit Subject" : "Add New Subject" }}</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveSubject">
            <!-- Subject Name -->
            <div class="mb-3">
              <label for="subject-name" class="form-label">Subject Name <span class="text-danger">*</span></label>
              <input
                type="text"
                class="form-control"
                :class="{ 'is-invalid': formErrors.subject }"
                id="subject-name"
                autocomplete="off"
                v-model="formData.subject"
                placeholder="Enter subject name"
                required
              />
              <div v-if="formErrors.subject" class="invalid-feedback">
                {{ formErrors.subject }}
              </div>
              <div class="form-text">Subject name must be between 3 and 100 characters</div>
            </div>

            <!-- Active Toggle -->
            <div class="mb-3">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="subject-active"
                  v-model="formData.active"
                />
                <label class="form-check-label" for="subject-active">
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
          <button type="button" class="btn btn-primary" @click="saveSubject">
            {{ isEditMode ? "Save Changes" : "Create Subject" }}
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