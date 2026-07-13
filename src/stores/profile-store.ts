import { create } from "zustand";

export type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl: string;
};

type ProfileState = {
  profile: ProfileData;
  saveProfile: (p: ProfileData) => void;
  setAvatar: (url: string) => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: {
    firstName: "Mira",
    lastName: "Wren",
    email: "mira@atelier-north.com",
    role: "Owner",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=founder",
  },
  saveProfile: (p) => set({ profile: p }),
  setAvatar: (url) => set((s) => ({ profile: { ...s.profile, avatarUrl: url } })),
}));
