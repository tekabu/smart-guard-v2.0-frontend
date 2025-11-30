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
  sectionSubjects: {
    type: Array,
    default: () => [],
  },
  rooms: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:show", "save"]);

// Determine if we're editing or creating
const isEditMode = computed(() => !!props.schedule?.id);

// Days of the week
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
  section_subject_id: null,
  day_of_week: null,
  room_id: null,
  start_time: "",
  end_time: "",
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
        section_subject_id: newSchedule.section_subject_id || null,
        day_of_week: newSchedule.day_of_week || null,
        room_id: newSchedule.room_id || null,
        start_time: newSchedule.start_time ? convertTo12Hour(newSchedule.start_time) : "",
        end_time: newSchedule.end_time ? convertTo12Hour(newSchedule.end_time) : "",
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
    section_subject_id: null,
    day_of_week: null,
    room_id: null,
    start_time: "",
    end_time: "",
  };
  formErrors.value = {};
}

// Convert 24-hour time to 12-hour format (HH:MM to hh:mm AM/PM)
function convertTo12Hour(time24) {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":");
  let hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

// Convert 12-hour time to 24-hour format (hh:mm AM/PM to HH:MM:SS)
function convertTo24Hour(time12) {
  if (!time12) return "";
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time12;

  let [, hours, minutes, period] = match;
  hours = parseInt(hours);

  if (period.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

// Validate form
function validateForm() {
  formErrors.value = {};

  // Section subject validation
  if (!formData.value.section_subject_id) {
    formErrors.value.section_subject_id = "Section subject is required";
  }

  // Day of week validation
  if (!formData.value.day_of_week) {
    formErrors.value.day_of_week = "Day of week is required";
  }

  // Room validation
  if (!formData.value.room_id) {
    formErrors.value.room_id = "Room is required";
  }

  // Start time validation
  if (!formData.value.start_time.trim()) {
    formErrors.value.start_time = "Start time is required";
  }

  // End time validation
  if (!formData.value.end_time.trim()) {
    formErrors.value.end_time = "End time is required";
  }

  // Time comparison validation
  if (formData.value.start_time && formData.value.end_time) {
    const start24 = convertTo24Hour(formData.value.start_time);
    const end24 = convertTo24Hour(formData.value.end_time);

    if (start24 >= end24) {
      formErrors.value.end_time = "End time must be after start time";
    }
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

  // Prepare data for submission (convert times to 24-hour format)
  const dataToSave = {
    ...formData.value,
    start_time: convertTo24Hour(formData.value.start_time),
    end_time: convertTo24Hour(formData.value.end_time),
  };

  // Remove id if it's null (for creating new schedule)
  if (!dataToSave.id) {
    delete dataToSave.id;
  }

  // Emit save event with form data
  emit("save", dataToSave);
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

                <!-- Day of Week -->
                <div class="mb-3">
                  <label for="day-of-week" class="form-label">Day of Week <span class="text-danger">*</span></label>
                  <select
                    class="form-select"
                    :class="{ 'is-invalid': formErrors.day_of_week }"
                    id="day-of-week"
                    v-model="formData.day_of_week"
                    required
                  >
                    <option :value="null">Select a day</option>
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
                      v-for="room in rooms"
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
              </div>

              <div class="col-md-6">
                <!-- Start Time -->
                <div class="mb-3">
                  <label for="start-time" class="form-label">Start Time <span class="text-danger">*</span></label>
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.start_time }"
                    id="start-time"
                    v-model="formData.start_time"
                    placeholder="hh:mm AM/PM (e.g., 08:00 AM)"
                    required
                  />
                  <small class="form-text text-muted">Format: hh:mm AM/PM</small>
                  <div v-if="formErrors.start_time" class="invalid-feedback">
                    {{ formErrors.start_time }}
                  </div>
                </div>

                <!-- End Time -->
                <div class="mb-3">
                  <label for="end-time" class="form-label">End Time <span class="text-danger">*</span></label>
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.end_time }"
                    id="end-time"
                    v-model="formData.end_time"
                    placeholder="hh:mm AM/PM (e.g., 05:00 PM)"
                    required
                  />
                  <small class="form-text text-muted">Format: hh:mm AM/PM</small>
                  <div v-if="formErrors.end_time" class="invalid-feedback">
                    {{ formErrors.end_time }}
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
