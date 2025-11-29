<script setup>
defineProps({
  ds: {
    type: Object,
    required: true
  }
});

// Handle page count change
function handlePageCountChange(event) {
  const value = event.target.value;
  if (typeof value !== 'undefined') {
    // Try to call setPageCount if it exists
    if (window.ds && window.ds.setPageCount) {
      window.ds.setPageCount(value);
    }
  }
}

// Expose handle for parent to set ds reference
defineExpose({
  setDataset(ds) {
    window.ds = ds;
  }
});
</script>

<template>
  <div class="d-flex align-items-center gap-2">
    <label class="form-label mb-0 fs-sm">Show</label>
    <select 
      class="form-select form-select-sm" 
      style="width: auto; min-width: 65px; max-width: 80px;"
      @input="handlePageCountChange"
    >
      <option value="10">10</option>
      <option value="25">25</option>
      <option value="50">50</option>
      <option value="100">100</option>
    </select>
    <label class="form-label mb-0 fs-sm">entries</label>
  </div>
</template>