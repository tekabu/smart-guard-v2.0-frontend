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