<script setup>
import { ref, onMounted, watch } from 'vue';
import Swal from "sweetalert2";

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

// Fetch periods for this schedule
const fetchPeriods = async () => {
  if (!props.scheduleId) return;
  
  try {
    isLoading.value = true;
    error.value = null;
    const schedulePeriodsService = (await import('@/services/schedulePeriods')).default;
    const response = await schedulePeriodsService.getByScheduleId(props.scheduleId);
    periods.value = response.data;
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

// Reset form
const resetForm = () => {
  formData.value = {
    start_time: '',
    end_time: '',
    active: true,
  };
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
  showCreateForm.value = true;
};

// Save period (create or update)
const savePeriod = async () => {
  // Validation
  if (!formData.value.start_time || !formData.value.end_time) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Please fill in all required fields',
      showConfirmButton: false,
      timer: 3000
    });
    return;
  }
  
  if (formData.value.start_time >= formData.value.end_time) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'End time must be after start time',
      showConfirmButton: false,
      timer: 3000
    });
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
      await schedulePeriodsService.update(editingPeriod.value.id, periodData);
      
      // Update period in local list
      const index = periods.value.findIndex(p => p.id === editingPeriod.value.id);
      if (index !== -1) {
        periods.value[index] = { ...periods.value[index], ...periodData };
      }
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Period updated successfully',
        showConfirmButton: false,
        timer: 3000
      });
    } else {
      // Create new period
      const response = await schedulePeriodsService.create(periodData);
      periods.value.push(response.data);
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Period created successfully',
        showConfirmButton: false,
        timer: 3000
      });
    }
    
    resetForm();
    showCreateForm.value = false;
  } catch (err) {
    console.error('Error saving period:', err);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Failed to save period',
      showConfirmButton: false,
      timer: 3000
    });
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
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Period deleted successfully',
          showConfirmButton: false,
          timer: 3000
        });
      } catch (err) {
        console.error('Error deleting period:', err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to delete period',
          showConfirmButton: false,
          timer: 3000
        });
      }
    }
  });
};

// Cancel form
const cancelForm = () => {
  resetForm();
  showCreateForm.value = false;
};

// Format time
const formatTime = (timeString) => {
  if (!timeString) return '-';
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
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
        class="btn btn-primary btn-sm"
        @click="showCreatePeriodForm"
      >
        <i class="fa fa-plus me-1"></i> Add New Period
      </button>
    </div>
    
    <!-- Create/Edit Form -->
    <div v-if="showCreateForm" class="card mb-3">
      <div class="card-body">
        <h6 class="card-title">
          {{ editingPeriod ? 'Edit Period' : 'Create New Period' }}
        </h6>
        <form @submit.prevent="savePeriod">
          <div class="row">
            <div class="col-md-4">
              <label class="form-label">Start Time</label>
              <input
                type="time"
                class="form-control form-control-sm"
                v-model="formData.start_time"
                required
              />
            </div>
            <div class="col-md-4">
              <label class="form-label">End Time</label>
              <input
                type="time"
                class="form-control form-control-sm"
                v-model="formData.end_time"
                required
              />
            </div>
            <div class="col-md-2">
              <label class="form-label">Active</label>
              <div class="form-check mt-2">
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
            <div class="col-md-2">
              <label class="form-label">&nbsp;</label>
              <div class="d-grid gap-1">
                <button type="submit" class="btn btn-success btn-sm">
                  <i class="fa fa-save me-1"></i> Save
                </button>
                <button type="button" class="btn btn-secondary btn-sm" @click="cancelForm">
                  <i class="fa fa-times me-1"></i> Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
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
    
    <div v-else-if="periods.length === 0" class="text-center py-4 bg-white rounded">
      <p class="text-muted mb-0">No periods found for this schedule.</p>
    </div>
    
    <div v-else>
      <div class="table-responsive">
        <table class="table table-sm table-striped table-hover">
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
              <td>{{ formatTime(period.start_time) }}</td>
              <td>{{ formatTime(period.end_time) }}</td>
              <td>{{ calculateDuration(period.start_time, period.end_time) }}</td>
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
</template>