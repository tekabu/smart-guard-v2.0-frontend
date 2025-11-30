import { createRouter, createWebHistory } from "vue-router";

import NProgress from "nprogress/nprogress.js";
import { useAuthStore } from "@/stores/auth";

// Layouts
import LayoutBackend from "@/layouts/variations/Backend.vue";
import LayoutSimple from "@/layouts/variations/Simple.vue";

// Components
const Dashboard = () => import("@/views/dashboard/DashboardView.vue");
const Users = () => import("@/views/users/UsersView.vue");
const Students = () => import("@/views/students/StudentsView.vue");
const Faculty = () => import("@/views/faculty/FacultyView.vue");
const Devices = () => import("@/views/devices/DevicesView.vue");
const DeviceBoards = () => import("@/views/deviceBoards/DeviceBoardsView.vue");
const Rooms = () => import("@/views/rooms/RoomsView.vue");
const Subjects = () => import("@/views/subjects/SubjectsView.vue");
const Schedules = () => import("@/views/schedules/SchedulesView.vue");
const Sections = () => import("@/views/sections/SectionsView.vue");
const SectionSubjects = () => import("@/views/sectionSubjects/SectionSubjectsView.vue");
const SectionSubjectStudents = () => import("@/views/sectionSubjectStudents/SectionSubjectStudentsView.vue");
const SectionSubjectSchedules = () => import("@/views/sectionSubjectSchedules/SectionSubjectSchedulesView.vue");

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
    path: "/students",
    component: LayoutBackend,
    children: [
      {
        path: "",
        name: "students",
        component: Students,
      },
    ],
  },
  {
    path: "/faculty",
    component: LayoutBackend,
    children: [
      {
        path: "",
        name: "faculty",
        component: Faculty,
      },
    ],
  },
  {
    path: "/devices",
    component: LayoutBackend,
    children: [
      {
        path: "",
        name: "devices",
        component: Devices,
      },
    ],
  },
  {
    path: "/device-boards",
    component: LayoutBackend,
    children: [
      {
        path: "",
        name: "deviceBoards",
        component: DeviceBoards,
      },
    ],
  },
  {
    path: "/rooms",
    component: LayoutBackend,
    children: [
      {
        path: "",
        name: "rooms",
        component: Rooms,
      },
    ],
  },
  {
    path: "/subjects",
    component: LayoutBackend,
    children: [
      {
        path: "",
        name: "subjects",
        component: Subjects,
      },
    ],
  },
  // {
  //   path: "/schedules",
  //   component: LayoutBackend,
  //   children: [
  //     {
  //       path: "",
  //       name: "schedules",
  //       component: Schedules,
  //     },
  //   ],
  // },
  {
    path: "/sections",
    component: LayoutBackend,
    children: [
      {
        path: "",
        name: "sections",
        component: Sections,
      },
    ],
  },
  {
    path: "/section-subjects",
    component: LayoutBackend,
    children: [
      {
        path: "",
        name: "sectionSubjects",
        component: SectionSubjects,
      },
    ],
  },
  {
    path: "/section-subject-students",
    component: LayoutBackend,
    children: [
      {
        path: "",
        name: "sectionSubjectStudents",
        component: SectionSubjectStudents,
      },
    ],
  },
  {
    path: "/section-subject-schedules",
    component: LayoutBackend,
    children: [
      {
        path: "",
        name: "sectionSubjectSchedules",
        component: SectionSubjectSchedules,
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
    // Only try to fetch user if we're not coming from a failed login attempt
    // and we're not already on the login page
    if (from.name !== 'auth-signin' && to.name !== 'auth-signin') {
      try {
        await authStore.fetchUser();
      } catch (error) {
        // If fetch fails, clear auth and redirect to login
        authStore.clearAuth();
        console.warn('Authentication check failed:', error);
      }
    }

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
