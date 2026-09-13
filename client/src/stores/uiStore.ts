import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  notificationPanelOpen: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setNotificationPanelOpen: (isOpen: boolean) => void;
}

const getPreferredTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: getPreferredTheme(),
      sidebarOpen: false,
      notificationPanelOpen: false,
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const theme = state.theme === "light" ? "dark" : "light";
          applyTheme(theme);
          return { theme };
        }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setNotificationPanelOpen: (notificationPanelOpen) =>
        set({ notificationPanelOpen }),
    }),
    {
      name: "garageflow-ui",
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

applyTheme(useUIStore.getState().theme);
