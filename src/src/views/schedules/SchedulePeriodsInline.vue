<script setup>
import { ref, onMounted, watch } from 'vue';
import Swal from "sweetalert2";
import { getErrorMessage, showErrorToast, showSuccessToast } from '@/utils/errorHandler';

const props = defineProps({
  scheduleId: {
    type: Number,
    required: true,
  },
});

const periods = ref([]);
const isLoading = ref(false);
const error = ref(null);
const showCreateForm = ref(false);
const editingPeriod = ref(null);

// Form data for new/edit period
const formData = ref({
  start_time: '',
  end_time: '',
  active: true,
});

// Computed properties to handle time input conversion
const startTimeInput = ref('');
const endTimeInput = ref('');

// Convert 12-hour time to 24-hour format for API
const convertTo24Hour = (time12) => {
  if (!time12) return '';
  
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time12;
  
  let [, hours, minutes, period] = match;
  hours = parseInt(hours);
  
  if (period.toLowerCase() === 'pm' && hours !== 12) {
    hours += 12;
  } else if (period.toLowerCase() === 'am' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
};

// Convert 24-hour time to 12-hour format for input
const convertTo12Hour = (time24) => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  let displayHours = hours % 12;
  
  if (displayHours === 0) {
    displayHours = 12;
  }
  
  return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Fetch periods for this schedule
const fetchPeriods = async () => {
  if (!props.scheduleId) return;
  
  try {
    isLoading.value = true;
    error.value = null;
    const schedulePeriodsService = (await import('@/services/schedulePeriods')).default;
    const response = await schedulePeriodsService.getByScheduleId(props.scheduleId);
    // Handle the API response format
    periods.value = response.data || response;
  } catch (err) {
    console.error('Error fetching periods:', err);
    error.value = 'Failed to load schedule periods';
  } finally {
    isLoading.value = false;
  }
};

// Watch for schedule changes
watch(() => props.scheduleId, (newScheduleId) => {
  if (newScheduleId) {
    fetchPeriods();
  }
}, { immediate: true });

// Watch for form changes to convert to 24-hour format
watch(startTimeInput, (newValue) => {
  formData.value.start_time = convertTo24Hour(newValue);
});

watch(endTimeInput, (newValue) => {
  formData.value.end_time = convertTo24Hour(newValue);
});

// Reset form
const resetForm = () => {
  formData.value = {
    start_time: '',
    end_time: '',
    active: true,
  };
  startTimeInput.value = '';
  endTimeInput.value = '';
  editingPeriod.value = null;
};

// Show create form
const showCreatePeriodForm = () => {
  resetForm();
  showCreateForm.value = true;
};

// Edit period
const editPeriod = (period) => {
  editingPeriod.value = period;
  formData.value = {
    start_time: period.start_time,
    end_time: period.end_time,
    active: period.active,
  };
  // Convert 24-hour times to 12-hour format for input
  startTimeInput.value = convertTo12Hour(period.start_time);
  endTimeInput.value = convertTo12Hour(period.end_time);
  showCreateForm.value = true;
};

// Save period (create or update)
const savePeriod = async () => {
  // Validation
  if (!formData.value.start_time || !formData.value.end_time) {
    showErrorToast(null, 'Please fill in all required fields');
    return;
  }
  
  if (formData.value.start_time >= formData.value.end_time) {
    showErrorToast(null, 'End time must be after start time');
    return;
  }
  
  try {
    const periodData = {
      schedule_id: props.scheduleId,
      start_time: formData.value.start_time,
      end_time: formData.value.end_time,
      active: formData.value.active,
    };
    
    const schedulePeriodsService = (await import('@/services/schedulePeriods')).default;
    
    if (editingPeriod.value) {
      // Update existing period
      const response = await schedulePeriodsService.update(editingPeriod.value.id, periodData);
      
      // Update period in local list
      const index = periods.value.findIndex(p => p.id === editingPeriod.value.id);
      if (index !== -1) {
        periods.value[index] = response.data || response;
      }
      
      showSuccessToast('Period updated successfully');
    } else {
      // Create new period
      const response = await schedulePeriodsService.create(periodData);
      periods.value.push(response.data || response);
      
      showSuccessToast('Period created successfully');
    }
    
    resetForm();
    showCreateForm.value = false;
  } catch (err) {
    console.error('Error saving period:', err);
    showErrorToast(err);
  }
};

// Delete period
const confirmDeletePeriod = (period) => {
  Swal.fire({
    title: 'Are you sure?',
    text: 'Are you sure you want to delete this period?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const schedulePeriodsService = (await import('@/services/schedulePeriods')).default;
        await schedulePeriodsService.delete(period.id);
        
        // Remove period from local list
        const index = periods.value.findIndex(p => p.id === period.id);
        if (index !== -1) {
          periods.value.splice(index, 1);
        }
        
        showSuccessToast('Period deleted successfully');
      } catch (err) {
        console.error('Error deleting period:', err);
        showErrorToast(err);
      }
    }
  });
};

// Cancel form
const cancelForm = () => {
  resetForm();
  showCreateForm.value = false;
};

// Format time to 12-hour format
const formatTime = (timeString) => {
  if (!timeString) return '-';
  
  // Split time into hours, minutes, seconds
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  let displayHours = hours % 12;
  
  // Handle 0 hours (midnight) as 12 AM
  if (displayHours === 0) {
    displayHours = 12;
  }
  
  // Format with leading zero for hours if needed
  const formattedHours = displayHours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  
  return `${formattedHours}:${formattedMinutes} ${period}`;
};

// Calculate duration
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '-';
  
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  const durationMinutes = endTotalMinutes - startTotalMinutes;
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
  } else {
    return `${minutes}m`;
  }
};
</script>

<template>
  <div>
    <!-- Add New Period Button -->
    <div class="mb-3">
      <button
        v-if="!showCreateForm"
        type="button"
        class="btn btn-primary"
        @click="showCreatePeriodForm"
      >
        <i class="fa fa-plus me-1"></i> Add New Period
      </button>
    </div>
    
    <!-- Create/Edit Form -->
    <div v-if="showCreateForm" class="mb-3">
      <div class="block block-rounded">
        <div class="block-content block-content-full">
          <h6 class="mb-3 fw-semibold">
            <i class="fa fa-clock me-2"></i>
            {{ editingPeriod ? 'Edit Period' : 'Create New Period' }}
          </h6>
          <form @submit.prevent="savePeriod">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Start Time</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="startTimeInput"
                  placeholder="08:00 AM"
                  pattern="^(1[0-2]|0?[1-9]):[0-5][0-9]\s*(AM|PM)$"
                  title="Enter time in 12-hour format (e.g., 08:00 AM)"
                  required
                />
                <div class="form-text">Use 12-hour format (e.g., 08:00 AM)</div>
              </div>
              <div class="col-md-4">
                <label class="form-label">End Time</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="endTimeInput"
                  placeholder="09:30 AM"
                  pattern="^(1[0-2]|0?[1-9]):[0-5][0-9]\s*(AM|PM)$"
                  title="Enter time in 12-hour format (e.g., 09:30 AM)"
                  required
                />
                <div class="form-text">Use 12-hour format (e.g., 09:30 AM)</div>
              </div>
              <div class="col-md-2">
                <label class="form-label">Status</label>
                <div class="form-check form-switch mt-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="formData.active"
                    id="activeCheckbox"
                  />
                  <label class="form-check-label" for="activeCheckbox">
                    Active
                  </label>
                </div>
              </div>
              <div class="col-md-2 d-flex align-items-end">
                <div class="btn-group w-100">
                  <button type="submit" class="btn btn-success">
                    <i class="fa fa-save me-1"></i> Save
                  </button>
                  <button type="button" class="btn btn-secondary" @click="cancelForm">
                    <i class="fa fa-times me-1"></i> Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Periods List -->
    <div v-if="isLoading" class="text-center py-3">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <span class="ms-2">Loading periods...</span>
    </div>
    
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <div v-else-if="periods.length === 0" class="text-center py-4">
      <p class="text-muted mb-0">No periods found for this schedule.</p>
    </div>
    
    <div v-else>
      <div class="block block-rounded">
        <div class="block-content block-content-full">
          <div class="table-responsive">
            <table class="table table-sm table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="period in periods" :key="period.id">
                  <td>
                    <span class="fw-semibold">{{ formatTime(period.start_time) }}</span>
                  </td>
                  <td>
                    <span class="fw-semibold">{{ formatTime(period.end_time) }}</span>
                  </td>
                  <td>
                    <span class="badge bg-primary">{{ calculateDuration(period.start_time, period.end_time) }}</span>
                  </td>
                  <td>
                    <span :class="['badge', period.active ? 'bg-success' : 'bg-danger']">
                      {{ period.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="btn-group">
                      <button
                        type="button"
                        class="btn btn-sm btn-alt-secondary"
                        @click="editPeriod(period)"
                        title="Edit Period"
                      >
                        <i class="fa fa-fw fa-pencil-alt"></i>
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-alt-secondary"
                        @click="confirmDeletePeriod(period)"
                        title="Delete Period"
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
      </div>
    </div>
  </div>
</template>