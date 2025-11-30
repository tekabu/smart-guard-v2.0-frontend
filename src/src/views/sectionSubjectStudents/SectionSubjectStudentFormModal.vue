<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  sectionSubjectStudent: {
    type: Object,
    default: null,
  },
  show: {
    type: Boolean,
    default: false,
  },
  sectionSubjects: {
    type: Array,
    default: () => [],
  },
  students: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:show", "save"]);

// Determine if we're editing or creating
const isEditMode = computed(() => !!props.sectionSubjectStudent?.id);

// Form data
const formData = ref({
  id: null,
  section_subject_id: null,
  student_id: null,
});

// Form validation
const formErrors = ref({});

// Watch for sectionSubjectStudent prop changes to populate form
watch(
  () => props.sectionSubjectStudent,
  (newSectionSubjectStudent) => {
    if (newSectionSubjectStudent && newSectionSubjectStudent.id) {
      // Editing existing section subject student
      formData.value = {
        id: newSectionSubjectStudent.id,
        section_subject_id: newSectionSubjectStudent.section_subject_id || null,
        student_id: newSectionSubjectStudent.student_id || null,
      };
    } else {
      // Creating new section subject student - reset form
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for show prop to reset form when modal opens for new section subject student
watch(
  () => props.show,
  (newShow) => {
    if (newShow && !props.sectionSubjectStudent) {
      resetForm();
    }
  }
);

// Reset form to defaults
function resetForm() {
  formData.value = {
    id: null,
    section_subject_id: null,
    student_id: null,
  };
  formErrors.value = {};
}

// Validate form
function validateForm() {
  formErrors.value = {};

  // Section subject validation
  if (!formData.value.section_subject_id) {
    formErrors.value.section_subject_id = "Section subject is required";
  }

  // Student validation
  if (!formData.value.student_id) {
    formErrors.value.student_id = "Student is required";
  }

  return Object.keys(formErrors.value).length === 0;
}

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save section subject student
function saveSectionSubjectStudent() {
  // Validate form
  if (!validateForm()) {
    return;
  }

  // Prepare data for submission
  const dataToSave = { ...formData.value };

  // Remove id if it's null (for creating new section subject student)
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
          <h5 class="modal-title">{{ isEditMode ? "Edit Section Subject Student" : "Add New Section Subject Student" }}</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveSectionSubjectStudent">
            <div class="row">
              <div class="col-md-6">
                <!-- Section Subject -->
                <div class="mb-3">
                  <label for="section-subject-select" class="form-label">Section Subject <span class="text-danger">*</span></label>
                  <select
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.section_subject_id }"
                    id="section-subject-select"
                    v-model="formData.section_subject_id"
                    required
                  >
                    <option :value="null">Select a section subject</option>
                    <option
                      v-for="sectionSubject in sectionSubjects"
                      :key="sectionSubject.id"
                      :value="sectionSubject.id"
                    >
                      {{ sectionSubject.label }}
                    </option>
                  </select>
                  <div v-if="formErrors.section_subject_id" class="invalid-feedback">
                    {{ formErrors.section_subject_id }}
                  </div>
                </div>
              </div>

              <div class="col-md-6">
                <!-- Student -->
                <div class="mb-3">
                  <label for="student-select" class="form-label">Student <span class="text-danger">*</span></label>
                  <select
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.student_id }"
                    id="student-select"
                    v-model="formData.student_id"
                    required
                  >
                    <option :value="null">Select a student</option>
                    <option
                      v-for="student in students"
                      :key="student.id"
                      :value="student.id"
                    >
                      {{ student.name }} ({{ student.student_id }})
                    </option>
                  </select>
                  <div v-if="formErrors.student_id" class="invalid-feedback">
                    {{ formErrors.student_id }}
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
          <button type="button" class="btn btn-primary" @click="saveSectionSubjectStudent">
            {{ isEditMode ? "Save Changes" : "Create Section Subject Student" }}
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
