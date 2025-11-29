<script setup>
import { reactive, computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useTemplateStore } from "@/stores/template";
import { useAuthStore } from "@/stores/auth";

// Vuelidate, for more info and examples you can check out https://github.com/vuelidate/vuelidate
import useVuelidate from "@vuelidate/core";
import { required, minLength, email } from "@vuelidate/validators";

// Main store, Auth store and Router
const store = useTemplateStore();
const authStore = useAuthStore();
const router = useRouter();

// Input state variables
const state = reactive({
  email: null,
  password: null,
});

// Loading and error states
const isSubmitting = ref(false);
const errorMessage = ref(null);

// Validation rules
const rules = computed(() => {
  return {
    email: {
      required,
      email,
    },
    password: {
      required,
      minLength: minLength(5),
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

  try {
    // Attempt login with Laravel API
    const response = await authStore.login({
      email: state.email,
      password: state.password,
    });

    if (response.success) {
      // Redirect to dashboard on successful login
      router.push({ name: "dashboard" });
    } else {
      // Show error message
      errorMessage.value = response.error || "Login failed. Please try again.";
    }
  } catch (error) {
    console.error("Login error:", error);
    errorMessage.value = "An unexpected error occurred. Please try again.";
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
          <!-- Sign In Block -->
          <BaseBlock title="Sign In" class="mb-0">
            <template #options>
              <!-- <RouterLink
                :to="{ name: 'auth-forgot-password' }"
                class="btn-block-option fs-sm"
                >Forgot Password?</RouterLink
              > -->
              <!-- <RouterLink
                :to="{ name: 'auth-signup' }"
                class="btn-block-option"
              >
                <i class="fa fa-user-plus"></i>
              </RouterLink> -->
            </template>

            <div class="p-sm-3 px-lg-4 px-xxl-5 py-lg-5">
              <h1 class="h2 mb-1">SmartGuard</h1>
              <p class="fw-medium text-muted">Welcome, please login.</p>

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

              <!-- Sign In Form -->
              <form @submit.prevent="onSubmit">
                <div class="py-3">
                  <div class="mb-4">
                    <input
                      type="email"
                      class="form-control form-control-alt form-control-lg"
                      id="login-email"
                      name="login-email"
                      placeholder="Email"
                      autocomplete="email"
                      :class="{
                        'is-invalid': v$.email.$errors.length,
                      }"
                      v-model="state.email"
                      @blur="v$.email.$touch"
                      :disabled="isSubmitting"
                    />
                    <div
                      v-if="v$.email.$errors.length"
                      class="invalid-feedback animated fadeIn"
                    >
                      Please enter a valid email address
                    </div>
                  </div>
                  <div class="mb-4">
                    <input
                      type="password"
                      class="form-control form-control-alt form-control-lg"
                      id="login-password"
                      name="login-password"
                      placeholder="Password"
                      autocomplete="current-password"
                      :class="{
                        'is-invalid': v$.password.$errors.length,
                      }"
                      v-model="state.password"
                      @blur="v$.password.$touch"
                      :disabled="isSubmitting"
                    />
                    <div
                      v-if="v$.password.$errors.length"
                      class="invalid-feedback animated fadeIn"
                    >
                      Please enter your password
                    </div>
                  </div>
                  <div class="mb-4">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        value=""
                        id="login-remember"
                        name="login-remember"
                      />
                      <label class="form-check-label" for="login-remember"
                        >Remember Me</label
                      >
                    </div>
                  </div>
                </div>
                <div class="row mb-4">
                  <div class="col-12 col-md-6 col-xl-5 ms-auto">
                    <button
                      type="submit"
                      class="btn w-100 btn-alt-primary"
                      :disabled="isSubmitting"
                    >
                      <i
                        v-if="!isSubmitting"
                        class="fa fa-fw fa-sign-in-alt me-1 opacity-50"
                      ></i>
                      <i
                        v-else
                        class="fa fa-fw fa-spinner fa-spin me-1 opacity-50"
                      ></i>
                      {{ isSubmitting ? "Signing In..." : "Sign In" }}
                    </button>
                  </div>
                </div>
              </form>
              <!-- <div class="text-center">
                <span class="text-muted">Don't have an account?</span>
                <RouterLink :to="{ name: 'auth-signup' }" class="fw-medium">
                  Sign Up
                </RouterLink>
              </div> -->
              <!-- END Sign In Form -->
            </div>
          </BaseBlock>
          <!-- END Sign In Block -->
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
