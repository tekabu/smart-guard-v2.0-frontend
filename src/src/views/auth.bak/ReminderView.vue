<script setup>
import { reactive, computed, ref } from "vue";
import { useTemplateStore } from "@/stores/template";
import api from "@/services/api";

// Vuelidate, for more info and examples you can check out https://github.com/vuelidate/vuelidate
import useVuelidate from "@vuelidate/core";
import { required, email } from "@vuelidate/validators";

// Main store
const store = useTemplateStore();

// Input state variables
const state = reactive({
  reminder: null,
});

// Loading and message states
const isSubmitting = ref(false);
const errorMessage = ref(null);
const successMessage = ref(null);

// Validation rules
const rules = computed(() => {
  return {
    reminder: {
      required,
      email,
    },
  };
});

// Use vuelidate
const v$ = useVuelidate(rules, state);

// On form submission
async function onSubmit() {
  const result = await v$.value.$validate();

  if (!result) {
    // notify user form is invalid
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    // Get CSRF cookie first
    await api.get('/sanctum/csrf-cookie');

    // Send password reset request
    await api.post('/api/forgot-password', {
      email: state.reminder,
    });

    // Show success message
    successMessage.value = "Password reset link has been sent to your email.";

    // Clear the input
    state.reminder = null;
    v$.value.$reset();
  } catch (error) {
    console.error("Password reset error:", error);

    if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message;
    } else if (error.response?.data?.errors?.email) {
      errorMessage.value = error.response.data.errors.email[0];
    } else {
      errorMessage.value = "Failed to send password reset email. Please try again.";
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <!-- Page Content -->
  <div class="hero-static d-flex align-items-center">
    <div class="content">
      <div class="row justify-content-center push">
        <div class="col-md-8 col-lg-6 col-xl-4">
          <!-- Reminder Block -->
          <BaseBlock title="Password Reminder" class="mb-0">
            <template #options>
              <RouterLink
                :to="{ name: 'auth-signin' }"
                class="btn-block-option"
              >
                <i class="fa fa-sign-in-alt"></i>
              </RouterLink>
            </template>

            <div class="p-sm-3 px-lg-4 px-xxl-5 py-lg-5">
              <h1 class="h2 mb-1">Smart Guard</h1>
              <p class="fw-medium text-muted">
                Please provide your account's email and we will send you a password reset link.
              </p>

              <!-- Success Message -->
              <div
                v-if="successMessage"
                class="alert alert-success alert-dismissible fade show"
                role="alert"
              >
                <i class="fa fa-check-circle me-2"></i>
                {{ successMessage }}
                <button
                  type="button"
                  class="btn-close"
                  @click="successMessage = null"
                  aria-label="Close"
                ></button>
              </div>

              <!-- Error Message -->
              <div
                v-if="errorMessage"
                class="alert alert-danger alert-dismissible fade show"
                role="alert"
              >
                <i class="fa fa-exclamation-triangle me-2"></i>
                {{ errorMessage }}
                <button
                  type="button"
                  class="btn-close"
                  @click="errorMessage = null"
                  aria-label="Close"
                ></button>
              </div>

              <!-- Reminder Form -->
              <form @submit.prevent="onSubmit">
                <div class="mb-4">
                  <input
                    type="email"
                    class="form-control form-control-lg form-control-alt"
                    id="reminder-credential"
                    name="reminder-credential"
                    placeholder="Email"
                    autocomplete="email"
                    :class="{
                      'is-invalid': v$.reminder.$errors.length,
                    }"
                    v-model="state.reminder"
                    @blur="v$.reminder.$touch"
                    :disabled="isSubmitting"
                  />
                  <div
                    v-if="v$.reminder.$errors.length"
                    class="invalid-feedback animated fadeIn"
                  >
                    Please enter a valid email address
                  </div>
                </div>
                <div class="row mb-4">
                  <div class="col-12 col-md-6 col-xl-5 ms-auto">
                    <button
                      type="submit"
                      class="btn w-100 btn-alt-primary text-nowrap"
                      :disabled="isSubmitting"
                    >
                      <i
                        v-if="!isSubmitting"
                        class="fa fa-fw fa-envelope me-1 opacity-50"
                      ></i>
                      <i
                        v-else
                        class="fa fa-fw fa-spinner fa-spin me-1 opacity-50"
                      ></i>
                      {{ isSubmitting ? "Sending..." : "Send Mail" }}
                    </button>
                  </div>
                </div>
              </form>
              <!-- END Reminder Form -->
            </div>
          </BaseBlock>
          <!-- END Reminder Block -->
        </div>
      </div>
      <div class="fs-sm text-muted text-center">
        <strong>{{ store.app.name + " " + store.app.version }}</strong> &copy;
        {{ store.app.copyright }}
      </div>
    </div>
  </div>
  <!-- END Page Content -->
</template>
