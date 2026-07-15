import { create } from "zustand";

type UiState = {
  searchOpen: boolean;
  uploadVideoOpen: boolean;
  createWidgetOpen: boolean;
  createProductOpen: boolean;
  createCollectionOpen: boolean;
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  setSearchOpen: (o: boolean) => void;
  setUploadVideoOpen: (o: boolean) => void;
  setCreateWidgetOpen: (o: boolean) => void;
  setCreateProductOpen: (o: boolean) => void;
  setCreateCollectionOpen: (o: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (c: boolean) => void;
  setSidebarMobileOpen: (o: boolean) => void;
  toggleSidebarMobile: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  searchOpen: false,
  uploadVideoOpen: false,
  createWidgetOpen: false,
  createProductOpen: false,
  createCollectionOpen: false,
  sidebarCollapsed: true,
  sidebarMobileOpen: false,
  setSearchOpen: (o) => set({ searchOpen: o }),
  setUploadVideoOpen: (o) => set({ uploadVideoOpen: o }),
  setCreateWidgetOpen: (o) => set({ createWidgetOpen: o }),
  setCreateProductOpen: (o) => set({ createProductOpen: o }),
  setCreateCollectionOpen: (o) => set({ createCollectionOpen: o }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (c) => set({ sidebarCollapsed: c }),
  setSidebarMobileOpen: (o) => set({ sidebarMobileOpen: o }),
  toggleSidebarMobile: () => set((s) => ({ sidebarMobileOpen: !s.sidebarMobileOpen })),
}));
