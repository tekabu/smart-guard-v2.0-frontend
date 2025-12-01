<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  schedule: {
    type: Object,
    default: null,
  },
  show: {
    type: Boolean,
    default: false,
  },
  facultyList: {
    type: Array,
    default: () => [],
  },
  roomList: {
    type: Array,
    default: () => [],
  },
  subjectList: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:show", "save"]);

// Determine if we're editing or creating
const isEditMode = computed(() => !!props.schedule?.id);

// Days of week
const daysOfWeek = [
  "SUNDAY",
  "MONDAY", 
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY"
];

// Form data
const formData = ref({
  id: null,
  user_id: null,
  day_of_week: "MONDAY",
  room_id: null,
  subject_id: null,
  
});

// Form validation
const formErrors = ref({});

// Watch for schedule prop changes to populate form
watch(
  () => props.schedule,
  (newSchedule) => {
    if (newSchedule && newSchedule.id) {
      // Editing existing schedule
      formData.value = {
        id: newSchedule.id,
        user_id: newSchedule.user_id || null,
        day_of_week: newSchedule.day_of_week || "MONDAY",
        room_id: newSchedule.room_id || null,
        subject_id: newSchedule.subject_id || null,
      };
    } else {
      // Creating new schedule - reset form
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for show prop to reset form when modal opens for new schedule
watch(
  () => props.show,
  (newShow) => {
    if (newShow && !props.schedule) {
      resetForm();
    }
  }
);

// Reset form to defaults
function resetForm() {
  formData.value = {
    id: null,
    user_id: null,
    day_of_week: "MONDAY",
    room_id: null,
    subject_id: null,
    
  };
  formErrors.value = {};
}

// Validate form
function validateForm() {
  formErrors.value = {};
  
  // Faculty validation
  if (!formData.value.user_id) {
    formErrors.value.user_id = "Faculty is required";
  }
  
  // Room validation
  if (!formData.value.room_id) {
    formErrors.value.room_id = "Room is required";
  }
  
  // Subject validation
  if (!formData.value.subject_id) {
    formErrors.value.subject_id = "Subject is required";
  }
  
  // Day validation
  if (!formData.value.day_of_week) {
    formErrors.value.day_of_week = "Day is required";
  }
  
  return Object.keys(formErrors.value).length === 0;
}

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save schedule
function saveSchedule() {
  // Validate form
  if (!validateForm()) {
    return;
  }

  // Prepare data for submission
  const dataToSave = { ...formData.value };
  
  // Remove id if it's null (for creating new schedule)
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
          <h5 class="modal-title">{{ isEditMode ? "Edit Schedule" : "Add New Schedule" }}</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveSchedule">
            <div class="row">
              <div class="col-md-6">
                <!-- Faculty -->
                <div class="mb-3">
                  <label for="faculty-select" class="form-label">Faculty <span class="text-danger">*</span></label>
                  <select
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.user_id }"
                    id="faculty-select"
                    v-model="formData.user_id"
                    required
                  >
                    <option :value="null">Select a faculty member</option>
                    <option
                      v-for="faculty in facultyList"
                      :key="faculty.id"
                      :value="faculty.id"
                    >
                      {{ faculty.name }}
                    </option>
                  </select>
                  <div v-if="formErrors.user_id" class="invalid-feedback">
                    {{ formErrors.user_id }}
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
                      v-for="subject in subjectList"
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
                <!-- Room -->
                <div class="mb-3">
                  <label for="room-select" class="form-label">Room <span class="text-danger">*</span></label>
                  <select
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.room_id }"
                    id="room-select"
                    v-model="formData.room_id"
                    required
                  >
                    <option :value="null">Select a room</option>
                    <option
                      v-for="room in roomList"
                      :key="room.id"
                      :value="room.id"
                    >
                      {{ room.room_number }}
                    </option>
                  </select>
                  <div v-if="formErrors.room_id" class="invalid-feedback">
                    {{ formErrors.room_id }}
                  </div>
                </div>

                <!-- Day of Week -->
                <div class="mb-3">
                  <label for="day-select" class="form-label">Day <span class="text-danger">*</span></label>
                  <select
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.day_of_week }"
                    id="day-select"
                    v-model="formData.day_of_week"
                    required
                  >
                    <option
                      v-for="day in daysOfWeek"
                      :key="day"
                      :value="day"
                    >
                      {{ day }}
                    </option>
                  </select>
                  <div v-if="formErrors.day_of_week" class="invalid-feedback">
                    {{ formErrors.day_of_week }}
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
          <button type="button" class="btn btn-primary" @click="saveSchedule">
            {{ isEditMode ? "Save Changes" : "Create Schedule" }}
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