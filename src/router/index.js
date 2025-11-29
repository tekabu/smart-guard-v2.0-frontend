import { createRouter, createWebHistory } from "vue-router";

import NProgress from "nprogress/nprogress.js";
import { useAuthStore } from "@/stores/auth";

// Layouts
import LayoutBackend from "@/layouts/variations/Backend.vue";
import LayoutSimple from "@/layouts/variations/Simple.vue";

// Components
const Dashboard = () => import("@/views/dashboard/DashboardView.vue");
const Users = () => import("@/views/users/UsersView.vue");

// Auth
const AuthSignIn = () => import("@/views/auth/SignInView.vue");
const AuthSignUp = () => import("@/views/auth/SignUpView.vue");
const AuthForgotPassword = () => import("@/views/auth/ForgotPasswordView.vue");

const BackendPagesGenericProfile = () => import("@/views/backend/pages/generic/ProfileView.vue");

// Errors
const Error404 = () => import("@/views/errors/404View.vue");

// Set all routes
const routes = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    component: LayoutBackend,
    children: [
      {
        path: "",
        name: "dashboard",
        component: Dashboard,
      },
    ],
  },
  {
    path: "/users",
    component: LayoutBackend,
    children: [
      {
        path: "",
        name: "users",
        component: Users,
      },
    ],
  },
  {
    path: "/signin",
    component: LayoutSimple,
    children: [
      {
        path: "",
        name: "auth-signin",
        component: AuthSignIn,
      },
    ],
  },
  // Temporarily disabled
  // {
  //   path: "/signup",
  //   component: LayoutSimple,
  //   children: [
  //     {
  //       path: "",
  //       name: "auth-signup", 
  //       component: AuthSignUp,
  //     },
  //   ],
  // },
  // {
  //   path: "/forgot-password",
  //   component: LayoutSimple,
  //   children: [
  //     {
  //       path: "",
  //       name: "auth-forgot-password",
  //       component: AuthForgotPassword,
  //     },
  //   ],
  // },
  {
    path: "/profile",
    name: "backend-pages-generic-profile",
    component: BackendPagesGenericProfile,
  },
  {
    path: "/:catchAll(.*)",
    component: Error404,
  },
];

// Create Router
const router = createRouter({
  history: createWebHistory(),
  linkActiveClass: "active",
  linkExactActiveClass: "",
  scrollBehavior() {
    return { left: 0, top: 0 };
  },
  routes,
});

// NProgress
/*eslint-disable no-unused-vars*/
NProgress.configure({ showSpinner: false });

// Authentication Guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Routes that don't require authentication
  const publicRoutes = [
    'auth-signin',
    // Temporarily disabled
    // 'auth-signup',
    // 'auth-forgot-password',
  ];

  const isPublicRoute = publicRoutes.includes(to.name);

  // If user is trying to access public routes (auth pages) and is already authenticated
  if (isPublicRoute && authStore.isAuthenticated) {
    return next({ name: 'dashboard' });
  }

  // If route requires auth and user is not authenticated
  if (!isPublicRoute && !authStore.isAuthenticated) {
    // Try to fetch user (in case they have a valid session)
    await authStore.fetchUser();

    // If still not authenticated, redirect to login
    if (!authStore.isAuthenticated) {
      return next({ name: 'auth-signin' });
    }
  }

  next();
});

router.beforeResolve((to, from, next) => {
  if (to.name) {
    NProgress.start();
  }

  next();
});

router.afterEach(() => {
  NProgress.done();
});
/*eslint-enable no-unused-vars*/

export default router;
