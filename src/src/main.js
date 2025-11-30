import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

// You can use the following starter router instead of the default one as a clean starting point
// import router from "./router/starter";
import router from "./router";

// Template components
import BaseBlock from "@/components/BaseBlock.vue";
import BaseBackground from "@/components/BaseBackground.vue";
import BasePageHeading from "@/components/BasePageHeading.vue";

// Template directives
import clickRipple from "@/directives/clickRipple";

// Bootstrap framework
import * as bootstrap from "bootstrap";
window.bootstrap = bootstrap;

// Craft new application
const app = createApp(App);

// Register global components
app.component("BaseBlock", BaseBlock);
app.component("BaseBackground", BaseBackground);
app.component("BasePageHeading", BasePageHeading);

// Register global directives
app.directive("click-ripple", clickRipple);

// Use Pinia and Vue Router
app.use(createPinia());
app.use(router);

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // If it's an unauthorized error, clear auth and redirect
  if (event.reason?.response?.status === 401) {
    // Clear auth store
    const { useAuthStore } = require('@/stores/auth');
    const authStore = useAuthStore();
    authStore.clearAuth();
    
    // Only redirect if not already on login page
    if (window.location.pathname !== '/signin') {
      window.location.href = '/signin';
    }
  }
  
  // Prevent the default browser behavior
  event.preventDefault();
});

// ..and finally mount it!
app.mount("#app");
