import { create } from "zustand";

type UiState = {
  searchOpen: boolean;
  uploadVideoOpen: boolean;
  createWidgetOpen: boolean;
  createProductOpen: boolean;
  createCollectionOpen: boolean;
  updateCardOpen: boolean;
  setSearchOpen: (o: boolean) => void;
  setUploadVideoOpen: (o: boolean) => void;
  setCreateWidgetOpen: (o: boolean) => void;
  setCreateProductOpen: (o: boolean) => void;
  setCreateCollectionOpen: (o: boolean) => void;
  setUpdateCardOpen: (o: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  searchOpen: false,
  uploadVideoOpen: false,
  createWidgetOpen: false,
  createProductOpen: false,
  createCollectionOpen: false,
  updateCardOpen: false,
  setSearchOpen: (o) => set({ searchOpen: o }),
  setUploadVideoOpen: (o) => set({ uploadVideoOpen: o }),
  setCreateWidgetOpen: (o) => set({ createWidgetOpen: o }),
  setCreateProductOpen: (o) => set({ createProductOpen: o }),
  setCreateCollectionOpen: (o) => set({ createCollectionOpen: o }),
  setUpdateCardOpen: (o) => set({ updateCardOpen: o }),
}));
