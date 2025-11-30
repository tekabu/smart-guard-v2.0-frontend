<script setup>
import { reactive, ref, onMounted } from "vue";
import devicesService from "../../services/devices";
import roomsService from "../../services/rooms";
import schedulesService from "../../services/schedules";
import subjectsService from "../../services/subjects";
import usersService from "../../services/users";

// Dashboard statistics
const stats = reactive({
  devices: 0,
  rooms: 0,
  schedules: 0,
  subjects: 0,
  users: 0,
  loading: true,
  error: null,
});

// Load dashboard data
const loadDashboardData = async () => {
  stats.loading = true;
  stats.error = null;
  
  try {
    const [devicesCount, roomsCount, schedulesCount, subjectsCount, usersCount] = await Promise.all([
      devicesService.getCount(),
      roomsService.getCount(),
      schedulesService.getCount(),
      subjectsService.getCount(),
      usersService.getCount()
    ]);
    
    stats.devices = devicesCount;
    stats.rooms = roomsCount;
    stats.schedules = schedulesCount;
    stats.subjects = subjectsCount;
    stats.users = usersCount;
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    stats.error = "Failed to load dashboard statistics";
  } finally {
    stats.loading = false;
  }
};

// Load data on component mount
onMounted(() => {
  loadDashboardData();
});
</script>

<template>
  <!-- Hero -->
  <div class="content">
    <div
      class="d-flex flex-column flex-md-row justify-content-md-between align-items-md-center py-2 text-center text-md-start"
    >
      <div class="flex-grow-1 mb-1 mb-md-0">
        <h1 class="h3 fw-bold mb-2">Dashboard</h1>
        <h2 class="h6 fw-medium text-muted mb-0">
          Welcome to Smart Guard system overview
        </h2>
      </div>
      <div class="mt-3 mt-md-0 ms-md-3 space-x-1">
        <button
          type="button"
          class="btn btn-sm btn-alt-secondary space-x-1"
          @click="loadDashboardData"
          :disabled="stats.loading"
        >
          <i class="fa fa-sync-alt opacity-50" :class="{ 'fa-spin': stats.loading }"></i>
          <span>Refresh</span>
        </button>
      </div>
    </div>
  </div>
  <!-- END Hero -->

  <!-- Page Content -->
  <div class="content">
    <!-- Statistics Overview -->
    <div class="row items-push">
      <div class="col-sm-6 col-xl">
        <!-- Devices Count -->
        <BaseBlock class="d-flex flex-column h-100 mb-0">
          <template #content>
            <div
              class="block-content block-content-full flex-grow-1 d-flex justify-content-between align-items-center"
            >
              <dl class="mb-0">
                <dt class="fs-3 fw-bold" v-if="!stats.loading">
                  {{ stats.devices.toLocaleString() }}
                </dt>
                <dt class="fs-3 fw-bold" v-else>
                  <i class="fa fa-spinner fa-spin"></i>
                </dt>
                <dd class="fs-sm fw-medium text-muted mb-0">
                  Total Devices
                </dd>
              </dl>
              <div class="item item-rounded-lg bg-body-light">
                <i class="fas fa-desktop fs-3 text-primary"></i>
              </div>
            </div>
            <div class="bg-body-light rounded-bottom">
              <RouterLink
                class="block-content block-content-full block-content-sm fs-sm fw-medium d-flex align-items-center justify-content-between text-decoration-none"
                to="/backend/devices"
              >
                <span>Manage devices</span>
                <i class="fa fa-arrow-alt-circle-right ms-1 opacity-25 fs-base"></i>
              </RouterLink>
            </div>
          </template>
        </BaseBlock>
        <!-- END Devices Count -->
      </div>
      <div class="col-sm-6 col-xl">
        <!-- Rooms Count -->
        <BaseBlock class="d-flex flex-column h-100 mb-0">
          <template #content>
            <div
              class="block-content block-content-full flex-grow-1 d-flex justify-content-between align-items-center"
            >
              <dl class="mb-0">
                <dt class="fs-3 fw-bold" v-if="!stats.loading">
                  {{ stats.rooms.toLocaleString() }}
                </dt>
                <dt class="fs-3 fw-bold" v-else>
                  <i class="fa fa-spinner fa-spin"></i>
                </dt>
                <dd class="fs-sm fw-medium text-muted mb-0">
                  Total Rooms
                </dd>
              </dl>
              <div class="item item-rounded-lg bg-body-light">
                <i class="fas fa-door-open fs-3 text-info"></i>
              </div>
            </div>
            <div class="bg-body-light rounded-bottom">
              <RouterLink
                class="block-content block-content-full block-content-sm fs-sm fw-medium d-flex align-items-center justify-content-between text-decoration-none"
                to="/backend/rooms"
              >
                <span>Manage rooms</span>
                <i class="fa fa-arrow-alt-circle-right ms-1 opacity-25 fs-base"></i>
              </RouterLink>
            </div>
          </template>
        </BaseBlock>
        <!-- END Rooms Count -->
      </div>
      <div class="col-sm-6 col-xl">
        <!-- Schedules Count -->
        <BaseBlock class="d-flex flex-column h-100 mb-0">
          <template #content>
            <div
              class="block-content block-content-full flex-grow-1 d-flex justify-content-between align-items-center"
            >
              <dl class="mb-0">
                <dt class="fs-3 fw-bold" v-if="!stats.loading">
                  {{ stats.schedules.toLocaleString() }}
                </dt>
                <dt class="fs-3 fw-bold" v-else>
                  <i class="fa fa-spinner fa-spin"></i>
                </dt>
                <dd class="fs-sm fw-medium text-muted mb-0">
                  Total Schedules
                </dd>
              </dl>
              <div class="item item-rounded-lg bg-body-light">
                <i class="fas fa-calendar-alt fs-3 text-warning"></i>
              </div>
            </div>
            <div class="bg-body-light rounded-bottom">
              <RouterLink
                class="block-content block-content-full block-content-sm fs-sm fw-medium d-flex align-items-center justify-content-between text-decoration-none"
                to="/backend/schedules"
              >
                <span>Manage schedules</span>
                <i class="fa fa-arrow-alt-circle-right ms-1 opacity-25 fs-base"></i>
              </RouterLink>
            </div>
          </template>
        </BaseBlock>
        <!-- END Schedules Count -->
      </div>
      <div class="col-sm-6 col-xl">
        <!-- Subjects Count -->
        <BaseBlock class="d-flex flex-column h-100 mb-0">
          <template #content>
            <div
              class="block-content block-content-full flex-grow-1 d-flex justify-content-between align-items-center"
            >
              <dl class="mb-0">
                <dt class="fs-3 fw-bold" v-if="!stats.loading">
                  {{ stats.subjects.toLocaleString() }}
                </dt>
                <dt class="fs-3 fw-bold" v-else>
                  <i class="fa fa-spinner fa-spin"></i>
                </dt>
                <dd class="fs-sm fw-medium text-muted mb-0">
                  Total Subjects
                </dd>
              </dl>
              <div class="item item-rounded-lg bg-body-light">
                <i class="fas fa-book fs-3 text-success"></i>
              </div>
            </div>
            <div class="bg-body-light rounded-bottom">
              <RouterLink
                class="block-content block-content-full block-content-sm fs-sm fw-medium d-flex align-items-center justify-content-between text-decoration-none"
                to="/backend/subjects"
              >
                <span>Manage subjects</span>
                <i class="fa fa-arrow-alt-circle-right ms-1 opacity-25 fs-base"></i>
              </RouterLink>
            </div>
          </template>
        </BaseBlock>
        <!-- END Subjects Count -->
      </div>
      <div class="col-sm-6 col-xl">
        <!-- Users Count -->
        <BaseBlock class="d-flex flex-column h-100 mb-0">
          <template #content>
            <div
              class="block-content block-content-full flex-grow-1 d-flex justify-content-between align-items-center"
            >
              <dl class="mb-0">
                <dt class="fs-3 fw-bold" v-if="!stats.loading">
                  {{ stats.users.toLocaleString() }}
                </dt>
                <dt class="fs-3 fw-bold" v-else>
                  <i class="fa fa-spinner fa-spin"></i>
                </dt>
                <dd class="fs-sm fw-medium text-muted mb-0">
                  Total Users
                </dd>
              </dl>
              <div class="item item-rounded-lg bg-body-light">
                <i class="fas fa-users fs-3 text-danger"></i>
              </div>
            </div>
            <div class="bg-body-light rounded-bottom">
              <RouterLink
                class="block-content block-content-full block-content-sm fs-sm fw-medium d-flex align-items-center justify-content-between text-decoration-none"
                to="/backend/users"
              >
                <span>Manage users</span>
                <i class="fa fa-arrow-alt-circle-right ms-1 opacity-25 fs-base"></i>
              </RouterLink>
            </div>
          </template>
        </BaseBlock>
        <!-- END Users Count -->
      </div>
    </div>
    <!-- END Statistics Overview -->

    <!-- Error Message -->
    <div v-if="stats.error" class="row">
      <div class="col-12">
        <BaseBlock class="d-flex flex-column h-100 mb-0">
          <template #content>
            <div class="block-content block-content-full">
              <div class="alert alert-danger" role="alert">
                <i class="fa fa-exclamation-triangle me-2"></i>
                {{ stats.error }}
              </div>
            </div>
          </template>
        </BaseBlock>
      </div>
    </div>
    <!-- END Error Message -->

    <!-- System Status -->
    <div class="row">
      <div class="col-12">
        <BaseBlock title="System Status" class="flex-grow-1 d-flex flex-column">
          <template #content>
            <div class="block-content block-content-full">
              <div class="row items-push text-center">
                <div class="col-sm-6 col-md-3">
                  <dl class="mb-0">
                    <dt class="fs-2 fw-bold text-success">
                      <i class="fa fa-check-circle me-1"></i>
                      Active
                    </dt>
                    <dd class="fs-sm fw-medium text-muted mb-0">
                      System Status
                    </dd>
                  </dl>
                </div>
                <div class="col-sm-6 col-md-3">
                  <dl class="mb-0">
                    <dt class="fs-2 fw-bold" v-if="!stats.loading">
                      {{ (stats.devices + stats.rooms + stats.schedules + stats.subjects + stats.users).toLocaleString() }}
                    </dt>
                    <dt class="fs-2 fw-bold" v-else>
                      <i class="fa fa-spinner fa-spin"></i>
                    </dt>
                    <dd class="fs-sm fw-medium text-muted mb-0">
                      Total Resources
                    </dd>
                  </dl>
                </div>
                <div class="col-sm-6 col-md-3">
                  <dl class="mb-0">
                    <dt class="fs-2 fw-bold text-primary">
                      Smart Guard
                    </dt>
                    <dd class="fs-sm fw-medium text-muted mb-0">
                      Version 1.0.0
                    </dd>
                  </dl>
                </div>
                <div class="col-sm-6 col-md-3">
                  <dl class="mb-0">
                    <dt class="fs-2 fw-bold">
                      <i class="fa fa-server me-1"></i>
                      Online
                    </dt>
                    <dd class="fs-sm fw-medium text-muted mb-0">
                      API Status
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </template>
        </BaseBlock>
      </div>
    </div>
    <!-- END System Status -->
  </div>
  <!-- END Page Content -->
</template>