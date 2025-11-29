<script setup>
import { reactive, computed, onMounted, ref } from "vue";

import {
  Dataset,
  DatasetItem,
  DatasetInfo,
  DatasetPager,
  DatasetSearch,
  DatasetShow,
} from "vue-dataset";

import EditUserModal from "./EditUserModal.vue";

// Dummy user data
const users = reactive([
  { id: 1, name: "John Doe", email: "john.doe@example.com", active: true },
  { id: 2, name: "Jane Smith", email: "jane.smith@example.com", active: true },
  { id: 3, name: "Michael Johnson", email: "michael.j@example.com", active: true },
  { id: 4, name: "Emily Davis", email: "emily.davis@example.com", active: false },
  { id: 5, name: "David Wilson", email: "david.wilson@example.com", active: true },
  { id: 6, name: "Sarah Brown", email: "sarah.brown@example.com", active: true },
  { id: 7, name: "Robert Taylor", email: "robert.t@example.com", active: true },
  { id: 8, name: "Lisa Anderson", email: "lisa.anderson@example.com", active: false },
  { id: 9, name: "James Martinez", email: "james.m@example.com", active: true },
  { id: 10, name: "Jennifer Garcia", email: "jennifer.g@example.com", active: true },
  { id: 11, name: "William Rodriguez", email: "william.r@example.com", active: true },
  { id: 12, name: "Maria Martinez", email: "maria.martinez@example.com", active: true },
  { id: 13, name: "Christopher Lee", email: "chris.lee@example.com", active: false },
  { id: 14, name: "Patricia White", email: "patricia.w@example.com", active: true },
  { id: 15, name: "Daniel Harris", email: "daniel.harris@example.com", active: true },
  { id: 16, name: "Nancy Clark", email: "nancy.clark@example.com", active: true },
  { id: 17, name: "Matthew Lewis", email: "matthew.lewis@example.com", active: true },
  { id: 18, name: "Linda Walker", email: "linda.walker@example.com", active: true },
  { id: 19, name: "Anthony Hall", email: "anthony.hall@example.com", active: false },
  { id: 20, name: "Barbara Allen", email: "barbara.allen@example.com", active: true },
]);

// Helper variables
const cols = reactive([
  {
    name: "Name",
    field: "name",
    sort: "",
  },
  {
    name: "Email",
    field: "email",
    sort: "",
  },
]);

// Sort by functionality
const sortBy = computed(() => {
  return cols.reduce((acc, o) => {
    if (o.sort) {
      o.sort === "asc" ? acc.push(o.field) : acc.push("-" + o.field);
    }
    return acc;
  }, []);
});

// On sort th click
function onSort(event, i) {
  let toset;
  const sortEl = cols[i];

  if (!event.shiftKey) {
    cols.forEach((o) => {
      if (o.field !== sortEl.field) {
        o.sort = "";
      }
    });
  }

  if (!sortEl.sort) {
    toset = "asc";
  }

  if (sortEl.sort === "desc") {
    toset = event.shiftKey ? "" : "asc";
  }

  if (sortEl.sort === "asc") {
    toset = "desc";
  }

  sortEl.sort = toset;
}

// Apply a few Bootstrap 5 optimizations
onMounted(() => {
  // Remove labels from
  document.querySelectorAll("#datasetLength label").forEach((el) => {
    el.remove();
  });

  // Replace select classes
  let selectLength = document.querySelector("#datasetLength select");

  if (selectLength) {
    selectLength.classList = "";
    selectLength.classList.add("form-select");
    selectLength.style.width = "80px";
  }
});

// Modal state
const showEditModal = ref(false);
const selectedUser = ref(null);

// Edit user
function editUser(user) {
  selectedUser.value = { ...user };
  showEditModal.value = true;
}

// Save user
function saveUser(updatedUser) {
  const index = users.findIndex((u) => u.id === updatedUser.id);
  if (index !== -1) {
    // Update user in the list (excluding password fields for display)
    users[index] = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      active: updatedUser.active,
    };
  }
  showEditModal.value = false;
}
</script>

<style lang="scss" scoped>
.gg-select {
  box-sizing: border-box;
  position: relative;
  display: block;
  transform: scale(1);
  width: 22px;
  height: 22px;
}
.gg-select::after,
.gg-select::before {
  content: "";
  display: block;
  box-sizing: border-box;
  position: absolute;
  width: 8px;
  height: 8px;
  left: 7px;
  transform: rotate(-45deg);
}
.gg-select::before {
  border-left: 2px solid;
  border-bottom: 2px solid;
  bottom: 4px;
  opacity: 0.3;
}
.gg-select::after {
  border-right: 2px solid;
  border-top: 2px solid;
  top: 4px;
  opacity: 0.3;
}
th.sort {
  cursor: pointer;
  user-select: none;
  &.asc {
    .gg-select::after {
      opacity: 1;
    }
  }
  &.desc {
    .gg-select::before {
      opacity: 1;
    }
  }
}
</style>

<template>
  <!-- Hero -->
  <BasePageHeading title="Users" subtitle="Manage application users.">
    <!-- <template #extra>
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb breadcrumb-alt">
          <li class="breadcrumb-item" aria-current="page">Users</li>
        </ol>
      </nav>
    </template> -->
  </BasePageHeading>
  <!-- END Hero -->

  <!-- Page Content -->
  <div class="content">
    <BaseBlock title="User List" content-full>
      <Dataset
        v-slot="{ ds }"
        :ds-data="users"
        :ds-sortby="sortBy"
        :ds-search-in="['name', 'email']"
      >
        <div class="row" :data-page-count="ds.dsPagecount">
          <div id="datasetLength" class="col-md-8 py-2">
            <DatasetShow />
          </div>
          <div class="col-md-4 py-2">
            <DatasetSearch ds-search-placeholder="Search..." />
          </div>
        </div>
        <hr />
        <div class="row">
          <div class="col-md-12">
            <div class="table-responsive">
              <table class="table table-striped mb-0">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th
                      v-for="(th, index) in cols"
                      :key="th.field"
                      :class="['sort', th.sort]"
                      @click="onSort($event, index)"
                    >
                      {{ th.name }} <i class="gg-select float-end"></i>
                    </th>
                    <th scope="col" class="text-center">Actions</th>
                  </tr>
                </thead>
                <DatasetItem tag="tbody" class="fs-sm">
                  <template #default="{ row, rowIndex }">
                    <tr>
                      <th scope="row">{{ rowIndex + 1 }}</th>
                      <td style="min-width: 150px">{{ row.name }}</td>
                      <td>{{ row.email }}</td>
                      <td class="text-center">
                        <div class="btn-group">
                          <button
                            type="button"
                            class="btn btn-sm btn-alt-secondary"
                            @click="editUser(row)"
                            title="Edit User"
                          >
                            <i class="fa fa-fw fa-pencil-alt"></i>
                          </button>
                          <button
                            type="button"
                            class="btn btn-sm btn-alt-secondary"
                            title="Delete User"
                          >
                            <i class="fa fa-fw fa-times"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </template>
                </DatasetItem>
              </table>
            </div>
          </div>
        </div>
        <div
          class="d-flex flex-md-row flex-column justify-content-between align-items-center"
        >
          <DatasetInfo class="py-3 fs-sm" />
          <DatasetPager class="flex-wrap py-3 fs-sm" />
        </div>
      </Dataset>
    </BaseBlock>
  </div>
  <!-- END Page Content -->

  <!-- Edit User Modal -->
  <EditUserModal
    :user="selectedUser"
    :show="showEditModal"
    @update:show="showEditModal = $event"
    @save="saveUser"
  />
</template>
