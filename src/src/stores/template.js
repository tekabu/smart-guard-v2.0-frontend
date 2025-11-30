import { defineStore } from "pinia";

// localStorage keys for persistence
const STORAGE_KEYS = {
  COLOR_THEME: 'smartguard_colorTheme',
  DARK_MODE: 'smartguard_darkMode',
  DARK_MODE_SYSTEM: 'smartguard_darkModeSystem',
  SIDEBAR_LEFT: 'smartguard_sidebarLeft',
  SIDEBAR_MINI: 'smartguard_sidebarMini',
  SIDEBAR_DARK: 'smartguard_sidebarDark',
  SIDEBAR_VISIBLE_DESKTOP: 'smartguard_sidebarVisibleDesktop',
  SIDEBAR_VISIBLE_MOBILE: 'smartguard_sidebarVisibleMobile',
  SIDEBAR_VISIBLE: 'smartguard_sidebarVisible',
  SIDE_OVERLAY_HOVERABLE: 'smartguard_sideOverlayHoverable',
  PAGE_OVERLAY: 'smartguard_pageOverlay',
  HEADER_FIXED: 'smartguard_headerFixed',
  HEADER_DARK: 'smartguard_headerDark',
  HEADER_SEARCH: 'smartguard_headerSearch',
  HEADER_LOADER: 'smartguard_headerLoader',
  PAGE_LOADER: 'smartguard_pageLoader',
  RTL_SUPPORT: 'smartguard_rtlSupport',
  SIDE_TRANSITIONS: 'smartguard_sideTransitions',
  MAIN_CONTENT: 'smartguard_mainContent'
};

// Helper functions for localStorage
const getStorageValue = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const setStorageValue = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error writing ${key} to localStorage:`, error);
  }
};

// Main Pinia Store
export const useTemplateStore = defineStore({
  id: "template",
  state: () => ({
    // App vital details
    app: {
      name: "Smart Guard",
      version: "1.0.0",
      copyright: new Date().getFullYear(),
    },

    // Default layout options
    layout: {
      header: true,
      sidebar: true,
      sideOverlay: true,
      footer: true,
    },

    // Default template settings - initialized from localStorage
    // Various of them are also set in each layout variation under layouts/variations/ folder
    settings: {
      colorTheme: getStorageValue(STORAGE_KEYS.COLOR_THEME, ""), // 'amethyst', 'city', 'flat', 'modern', 'smooth'
      darkMode: getStorageValue(STORAGE_KEYS.DARK_MODE, false),
      darkModeSystem: getStorageValue(STORAGE_KEYS.DARK_MODE_SYSTEM, true),
      sidebarLeft: getStorageValue(STORAGE_KEYS.SIDEBAR_LEFT, true),
      sidebarMini: getStorageValue(STORAGE_KEYS.SIDEBAR_MINI, false),
      sidebarDark: getStorageValue(STORAGE_KEYS.SIDEBAR_DARK, true),
      sidebarVisibleDesktop: getStorageValue(STORAGE_KEYS.SIDEBAR_VISIBLE_DESKTOP, true),
      sidebarVisibleMobile: getStorageValue(STORAGE_KEYS.SIDEBAR_VISIBLE_MOBILE, false),
      sideOverlayVisible: getStorageValue(STORAGE_KEYS.SIDEBAR_VISIBLE, false),
      sideOverlayHoverable: getStorageValue(STORAGE_KEYS.SIDE_OVERLAY_HOVERABLE, false),
      pageOverlay: getStorageValue(STORAGE_KEYS.PAGE_OVERLAY, true),
      headerFixed: getStorageValue(STORAGE_KEYS.HEADER_FIXED, true),
      headerDark: getStorageValue(STORAGE_KEYS.HEADER_DARK, false),
      headerSearch: getStorageValue(STORAGE_KEYS.HEADER_SEARCH, false),
      pageLoader: getStorageValue(STORAGE_KEYS.PAGE_LOADER, false),
      rtlSupport: getStorageValue(STORAGE_KEYS.RTL_SUPPORT, false),
      sideTransitions: getStorageValue(STORAGE_KEYS.SIDE_TRANSITIONS, true),
      mainContent: getStorageValue(STORAGE_KEYS.MAIN_CONTENT, ""), // 'boxed', 'narrow'
    },
  }),
  actions: {
    // Sets the layout, useful for setting different layouts (under layouts/variations/)
    setLayout(payload) {
      this.layout.header = payload.header;
      this.layout.sidebar = payload.sidebar;
      this.layout.sideOverlay = payload.sideOverlay;
      this.layout.footer = payload.footer;
    },
    // Sets sidebar visibility (open, close, toggle)
    sidebar(payload) {
      if (window.innerWidth > 991) {
        if (payload.mode === "open") {
          this.settings.sidebarVisibleDesktop = true;
        } else if (payload.mode === "close") {
          this.settings.sidebarVisibleDesktop = false;
        } else if (payload.mode === "toggle") {
          this.settings.sidebarVisibleDesktop =
            !this.settings.sidebarVisibleDesktop;
        }
      } else {
        if (payload.mode === "open") {
          this.settings.sidebarVisibleMobile = true;
        } else if (payload.mode === "close") {
          this.settings.sidebarVisibleMobile = false;
        } else if (payload.mode === "toggle") {
          this.settings.sidebarVisibleMobile =
            !this.settings.sidebarVisibleMobile;
        }
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.SIDEBAR_VISIBLE_DESKTOP, this.settings.sidebarVisibleDesktop);
      setStorageValue(STORAGE_KEYS.SIDEBAR_VISIBLE_MOBILE, this.settings.sidebarVisibleMobile);
    },
    // Sets sidebar mini mode (on, off, toggle)
    sidebarMini(payload) {
      if (window.innerWidth > 991) {
        if (payload.mode === "on") {
          this.settings.sidebarMini = true;
        } else if (payload.mode === "off") {
          this.settings.sidebarMini = false;
        } else if (payload.mode === "toggle") {
          this.settings.sidebarMini = !this.settings.sidebarMini;
        }
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.SIDEBAR_MINI, this.settings.sidebarMini);
    },
    // Sets sidebar position (left, right, toggle)
    sidebarPosition(payload) {
      if (payload.mode === "left") {
        this.settings.sidebarLeft = true;
      } else if (payload.mode === "right") {
        this.settings.sidebarLeft = false;
      } else if (payload.mode === "toggle") {
        this.settings.sidebarLeft = !this.settings.sidebarLeft;
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.SIDEBAR_LEFT, this.settings.sidebarLeft);
    },
    // Sets sidebar style (dark, light, toggle)
    sidebarStyle(payload) {
      if (payload.mode === "dark") {
        this.settings.sidebarDark = true;
      } else if (payload.mode === "light") {
        this.settings.sidebarDark = false;
      } else if (payload.mode === "toggle") {
        this.settings.sidebarDark = !this.settings.sidebarDark;
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.SIDEBAR_DARK, this.settings.sidebarDark);
    },
    // Sets side overlay visibility (open, close, toggle)
    sideOverlay(payload) {
      if (payload.mode === "open") {
        this.settings.sideOverlayVisible = true;
      } else if (payload.mode === "close") {
        this.settings.sideOverlayVisible = false;
      } else if (payload.mode === "toggle") {
        this.settings.sideOverlayVisible = !this.settings.sideOverlayVisible;
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.SIDEBAR_VISIBLE, this.settings.sideOverlayVisible);
    },
    // Sets side overlay hover mode (on, off, toggle)
    sideOverlayHover(payload) {
      if (payload.mode === "on") {
        this.settings.sideOverlayHoverable = true;
      } else if (payload.mode === "off") {
        this.settings.sideOverlayHoverable = false;
      } else if (payload.mode === "toggle") {
        this.settings.sideOverlayHoverable =
          !this.settings.sideOverlayHoverable;
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.SIDE_OVERLAY_HOVERABLE, this.settings.sideOverlayHoverable);
    },
    // Sets page overlay visibility (on, off, toggle)
    pageOverlay(payload) {
      if (payload.mode === "on") {
        this.settings.pageOverlay = true;
      } else if (payload.mode === "off") {
        this.settings.pageOverlay = false;
      } else if (payload.mode === "toggle") {
        this.settings.pageOverlay = !this.settings.pageOverlay;
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.PAGE_OVERLAY, this.settings.pageOverlay);
    },
    // Sets header mode (fixed, static, toggle)
    header(payload) {
      if (payload.mode === "fixed") {
        this.settings.headerFixed = true;
      } else if (payload.mode === "static") {
        this.settings.headerFixed = false;
      } else if (payload.mode === "toggle") {
        this.settings.headerFixed = !this.settings.headerFixed;
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.HEADER_FIXED, this.settings.headerFixed);
    },
    // Sets header style (dark, light, toggle)
    headerStyle(payload) {
      if (payload.mode === "dark") {
        this.settings.headerDark = true;
      } else if (payload.mode === "light") {
        this.settings.headerDark = false;
      } else if (payload.mode === "toggle") {
        this.settings.headerDark = !this.settings.headerDark;
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.HEADER_DARK, this.settings.headerDark);
    },
    // Sets header search visibility (on, off, toggle)
    headerSearch(payload) {
      if (payload.mode === "on") {
        this.settings.headerSearch = true;
      } else if (payload.mode === "off") {
        this.settings.headerSearch = false;
      } else if (payload.mode === "toggle") {
        this.settings.headerSearch = !this.settings.headerSearch;
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.HEADER_SEARCH, this.settings.headerSearch);
    },
    // Sets header loader visibility (on, off, toggle)
    headerLoader(payload) {
      if (payload.mode === "on") {
        this.settings.headerLoader = true;
      } else if (payload.mode === "off") {
        this.settings.headerLoader = false;
      } else if (payload.mode === "toggle") {
        this.settings.headerLoader = !this.settings.headerLoader;
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.HEADER_LOADER, this.settings.headerLoader);
    },
    // Sets page loader visibility (on, off, toggle)
    pageLoader(payload) {
      if (payload.mode === "on") {
        this.settings.pageLoader = true;
      } else if (payload.mode === "off") {
        this.settings.pageLoader = false;
      } else if (payload.mode === "toggle") {
        this.settings.pageLoader = !this.settings.pageLoader;
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.PAGE_LOADER, this.settings.pageLoader);
    },
    // Sets main content mode (full, boxed, narrow)
    mainContent(payload) {
      if (payload.mode === "full") {
        this.settings.mainContent = "";
      } else if (payload.mode === "boxed") {
        this.settings.mainContent = "boxed";
      } else if (payload.mode === "narrow") {
        this.settings.mainContent = "narrow";
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.MAIN_CONTENT, this.settings.mainContent);
    },
    // Dark Mode
    darkMode(payload) {
      if (payload.mode === "on") {
        this.settings.darkMode = true;
      } else if (payload.mode === "off") {
        this.settings.darkMode = false;
      } else if (payload.mode === "toggle") {
        this.settings.darkMode = !this.settings.darkMode;
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.DARK_MODE, this.settings.darkMode);
    },
    // Dark Mode System based
    darkModeSystem(payload) {
      if (payload.mode === "on") {
        this.settings.darkModeSystem = true;

        // Check system preference
        if (
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
          this.settings.darkMode = true;
        } else {
          this.settings.darkMode = false;
        }
      } else if (payload.mode === "off") {
        this.settings.darkModeSystem = false;
      }
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.DARK_MODE_SYSTEM, this.settings.darkModeSystem);
      setStorageValue(STORAGE_KEYS.DARK_MODE, this.settings.darkMode);
    },
    // Sets active color theme
    setColorTheme(payload) {
      // Matches all classes which start with 'theme-'
      let regx = new RegExp("\\btheme-[^ ]*[ ]?\\b", "g");

      // Set new theme
      this.settings.colorTheme = payload.theme || "";

      // Remove all classes which start with 'theme-' from body element
      document.body.className = document.body.className.replace(regx, "");

      // If theme is set, add the theme class to body element
      if (payload.theme) {
        document.body.classList.add("theme-" + payload.theme);
      }
      
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.COLOR_THEME, this.settings.colorTheme);
    },
    // Sets side transitions
    setSideTransitions(payload) {
      this.settings.sideTransitions = payload.transitions;
      // Save to localStorage
      setStorageValue(STORAGE_KEYS.SIDE_TRANSITIONS, this.settings.sideTransitions);
    },
    // Clear all theme settings from localStorage (for debugging)
    clearThemeSettings() {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('All theme settings cleared from localStorage');
    },
  },
});
