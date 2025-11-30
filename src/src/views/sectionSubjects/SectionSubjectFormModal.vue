<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  sectionSubject: {
    type: Object,
    default: null,
  },
  show: {
    type: Boolean,
    default: false,
  },
  sections: {
    type: Array,
    default: () => [],
  },
  subjects: {
    type: Array,
    default: () => [],
  },
  faculty: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:show", "save"]);

// Determine if we're editing or creating
const isEditMode = computed(() => !!props.sectionSubject?.id);

// Form data
const formData = ref({
  id: null,
  section_id: null,
  subject_id: null,
  faculty_id: null,
});

// Form validation
const formErrors = ref({});

// Watch for sectionSubject prop changes to populate form
watch(
  () => props.sectionSubject,
  (newSectionSubject) => {
    if (newSectionSubject && newSectionSubject.id) {
      // Editing existing section subject
      formData.value = {
        id: newSectionSubject.id,
        section_id: newSectionSubject.section_id || null,
        subject_id: newSectionSubject.subject_id || null,
        faculty_id: newSectionSubject.faculty_id || null,
      };
    } else {
      // Creating new section subject - reset form
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for show prop to reset form when modal opens for new section subject
watch(
  () => props.show,
  (newShow) => {
    if (newShow && !props.sectionSubject) {
      resetForm();
    }
  }
);

// Reset form to defaults
function resetForm() {
  formData.value = {
    id: null,
    section_id: null,
    subject_id: null,
    faculty_id: null,
  };
  formErrors.value = {};
}

// Validate form
function validateForm() {
  formErrors.value = {};

  // Section validation
  if (!formData.value.section_id) {
    formErrors.value.section_id = "Section is required";
  }

  // Subject validation
  if (!formData.value.subject_id) {
    formErrors.value.subject_id = "Subject is required";
  }

  // Faculty validation
  if (!formData.value.faculty_id) {
    formErrors.value.faculty_id = "Faculty is required";
  }

  return Object.keys(formErrors.value).length === 0;
}

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save section subject
function saveSectionSubject() {
  // Validate form
  if (!validateForm()) {
    return;
  }

  // Prepare data for submission
  const dataToSave = { ...formData.value };

  // Remove id if it's null (for creating new section subject)
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
          <h5 class="modal-title">{{ isEditMode ? "Edit Section Subject" : "Add New Section Subject" }}</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveSectionSubject">
            <div class="row">
              <div class="col-md-6">
                <!-- Section -->
                <div class="mb-3">
                  <label for="section-select" class="form-label">Section <span class="text-danger">*</span></label>
                  <select
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.section_id }"
                    id="section-select"
                    v-model="formData.section_id"
                    required
                  >
                    <option :value="null">Select a section</option>
                    <option
                      v-for="section in sections"
                      :key="section.id"
                      :value="section.id"
                    >
                      {{ section.section }}
                    </option>
                  </select>
                  <div v-if="formErrors.section_id" class="invalid-feedback">
                    {{ formErrors.section_id }}
                  </div>
                </div>

                <!-- Subject -->
                <div class="mb-3">
                  <label for="subject-select" class="form-label">Subject <span class="text-danger">*</span></label>
                  <select
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.subject_id }"
                    id="subject-select"
                    v-model="formData.subject_id"
                    required
                  >
                    <option :value="null">Select a subject</option>
                    <option
                      v-for="subject in subjects"
                      :key="subject.id"
                      :value="subject.id"
                    >
                      {{ subject.subject }}
                    </option>
                  </select>
                  <div v-if="formErrors.subject_id" class="invalid-feedback">
                    {{ formErrors.subject_id }}
                  </div>
                </div>
              </div>

              <div class="col-md-6">
                <!-- Faculty -->
                <div class="mb-3">
                  <label for="faculty-select" class="form-label">Faculty <span class="text-danger">*</span></label>
                  <select
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.faculty_id }"
                    id="faculty-select"
                    v-model="formData.faculty_id"
                    required
                  >
                    <option :value="null">Select a faculty</option>
                    <option
                      v-for="facultyMember in faculty"
                      :key="facultyMember.id"
                      :value="facultyMember.id"
                    >
                      {{ facultyMember.name }} ({{ facultyMember.faculty_id }})
                    </option>
                  </select>
                  <div v-if="formErrors.faculty_id" class="invalid-feedback">
                    {{ formErrors.faculty_id }}
                  </div>
                </div>
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
          <button type="button" class="btn btn-primary" @click="saveSectionSubject">
            {{ isEditMode ? "Save Changes" : "Create Section Subject" }}
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
