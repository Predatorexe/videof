import { create } from "zustand";

export type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type ProfileState = {
  profile: ProfileData;
  saveProfile: (p: ProfileData) => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: {
    firstName: "Mira",
    lastName: "Wren",
    email: "mira@atelier-north.com",
    role: "Owner",
  },
  saveProfile: (p) => set({ profile: p }),
}));
