<script setup>
import { ref, watch } from "vue";

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

// Form data
const formData = ref({
  id: null,
  user_id: null,
  day_of_week: "MONDAY",
  room_id: null,
  subject_id: null,
  active: true,
});

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

// Watch for schedule prop changes to populate form
watch(
  () => props.schedule,
  (newSchedule) => {
    if (newSchedule) {
      formData.value = {
        id: newSchedule.id,
        user_id: newSchedule.user_id || null,
        day_of_week: newSchedule.day_of_week || "MONDAY",
        room_id: newSchedule.room_id || null,
        subject_id: newSchedule.subject_id || null,
        active: newSchedule.active !== undefined ? newSchedule.active : true,
      };
    }
  },
  { immediate: true }
);

// Close modal
function closeModal() {
  emit("update:show", false);
}

// Save schedule
function saveSchedule() {
  // Emit save event with form data
  emit("save", { ...formData.value });
  closeModal();
}
</script>

<template>
  <div
    class="modal"
    :class="{ show: show, 'd-block': show }"
    tabindex="-1"
    role="dialog"
    @click.self="closeModal"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Edit Schedule</h5>
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
                <!-- Faculty Selection -->
                <div class="mb-3">
                  <label for="schedule-faculty" class="form-label">Faculty</label>
                  <select
                    class="form-select"
                    id="schedule-faculty"
                    v-model="formData.user_id"
                    required
                  >
                    <option :value="null">Select Faculty</option>
                    <option
                      v-for="faculty in facultyList"
                      :key="faculty.id"
                      :value="faculty.id"
                    >
                      {{ faculty.name }}
                    </option>
                  </select>
                </div>

                <!-- Day of Week -->
                <div class="mb-3">
                  <label for="schedule-day" class="form-label">Day of Week</label>
                  <select
                    class="form-select"
                    id="schedule-day"
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
                </div>
              </div>
              
              <div class="col-md-6">
                <!-- Room Selection -->
                <div class="mb-3">
                  <label for="schedule-room" class="form-label">Room</label>
                  <select
                    class="form-select"
                    id="schedule-room"
                    v-model="formData.room_id"
                    required
                  >
                    <option :value="null">Select Room</option>
                    <option
                      v-for="room in roomList"
                      :key="room.id"
                      :value="room.id"
                    >
                      {{ room.room_number }}
                    </option>
                  </select>
                </div>

                <!-- Subject Selection -->
                <div class="mb-3">
                  <label for="schedule-subject" class="form-label">Subject</label>
                  <select
                    class="form-select"
                    id="schedule-subject"
                    v-model="formData.subject_id"
                    required
                  >
                    <option :value="null">Select Subject</option>
                    <option
                      v-for="subject in subjectList"
                      :key="subject.id"
                      :value="subject.id"
                    >
                      {{ subject.subject }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Active Toggle -->
            <div class="mb-3">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="schedule-active"
                  v-model="formData.active"
                />
                <label class="form-check-label" for="schedule-active">
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
          <button type="button" class="btn btn-primary" @click="saveSchedule">
            Save Changes
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