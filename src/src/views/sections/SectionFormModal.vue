<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  section: {
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
const isEditMode = computed(() => !!props.section?.id);

// Form data
const formData = ref({
  id: null,
  section: "",
});

// Form validation
const formErrors = ref({});

// Watch for section prop changes to populate form
watch(
  () => props.section,
  (newSection) => {
    if (newSection && newSection.id) {
      // Editing existing section
      formData.value = {
        id: newSection.id,
        section: newSection.section || "",
      };
    } else {
      // Creating new section - reset form
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for show prop to reset form when modal opens for new section
watch(
  () => props.show,
  (newShow) => {
    if (newShow && !props.section) {
      resetForm();
    }
  }
);

// Reset form to defaults
function resetForm() {
  formData.value = {
    id: null,
    section: "",
  };
  formErrors.value = {};
}

// Validate form
function validateForm() {
  formErrors.value = {};

  // Section name validation
  if (!formData.value.section.trim()) {
    formErrors.value.section = "Section name is required";
  }

  return Object.keys(formErrors.value).length === 0;
}

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save section
function saveSection() {
  // Validate form
  if (!validateForm()) {
    return;
  }

  // Prepare data for submission
  const dataToSave = { ...formData.value };

  // Remove id if it's null (for creating new section)
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
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ isEditMode ? "Edit Section" : "Add New Section" }}</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveSection">
            <!-- Section Name -->
            <div class="mb-3">
              <label for="section-name" class="form-label">Section Name <span class="text-danger">*</span></label>
              <input
                type="text"
                class="form-control"
                :class="{ 'is-invalid': formErrors.section }"
                id="section-name"
                autocomplete="off"
                v-model="formData.section"
                required
              />
              <div v-if="formErrors.section" class="invalid-feedback">
                {{ formErrors.section }}
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
          <button type="button" class="btn btn-primary" @click="saveSection">
            {{ isEditMode ? "Save Changes" : "Create Section" }}
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
