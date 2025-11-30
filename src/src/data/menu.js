/*
 * Main and demo navigation arrays
 *
 * 'to' attribute points to the route name, not the path url
 */

export default {
  main: [
    {
      name: "Dashboard",
      to: "dashboard",
      icon: "si si-speedometer",
    },
    {
      name: "Users",
      icon: "si si-users",
      to: "users",
    },
    {
      name: "Students",
      icon: "si si-graduation",
      to: "students",
    },
    {
      name: "Faculty",
      icon: "si si-graduation",
      to: "faculty",
    },
    {
      name: "Devices",
      icon: "si si-screen-desktop",
      to: "devices",
    },
    {
      name: "Device Boards",
      icon: "si si-wallet",
      to: "deviceBoards",
    },
    {
      name: "Rooms",
      icon: "si si-home",
      to: "rooms",
    },
    {
      name: "Subjects",
      icon: "si si-book-open",
      to: "subjects",
    },
    {
      name: "Schedules",
      icon: "si si-calendar",
      to: "schedules",
    },
    {
      name: "Sections",
      icon: "si si-layers",
      to: "sections",
    },
    {
      name: "Section Subjects",
      icon: "si si-organization",
      to: "sectionSubjects",
    },
    {
      name: "Section Subject Students",
      icon: "si si-people",
      to: "sectionSubjectStudents",
    },
  ],
  boxed: [
    {
      name: "Dashboard",
      to: "dashboard",
      icon: "si si-compass",
    },
    {
      name: "Go Back",
      to: "dashboard",
      icon: "si si-action-undo",
    },
  ],
};