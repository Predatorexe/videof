/**
 * Profile store — backed by `profiles` table + auth user email.
 * Public shape (firstName, lastName, email, role, avatarUrl) is unchanged;
 * `full_name` is split/joined at the adapter boundary.
 */
import { create } from "zustand";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, updateProfile } from "@/lib/api/profile.functions";

export type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl: string;
};

type ProfileState = {
  profile: ProfileData;
  _hydrated: boolean;
  saveProfile: (p: ProfileData) => void;
  setAvatar: (url: string) => void;
  hydrate: () => Promise<void>;
};

const DEFAULT_PROFILE: ProfileData = {
  firstName: "Mira",
  lastName: "Wren",
  email: "mira@atelier-north.com",
  role: "Owner",
  avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=founder",
};

function splitName(full: string | null | undefined): { first: string; last: string } {
  const parts = (full ?? "").trim().split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] ?? "", last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

async function loadProfile(): Promise<ProfileData | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  const [row, roleRow] = await Promise.all([
    getProfile().catch(() => null),
    supabase.from("user_roles").select("role").eq("user_id", data.session.user.id).limit(1).maybeSingle(),
  ]);
  const { first, last } = splitName(row?.full_name ?? data.session.user.user_metadata?.full_name);
  const seed = encodeURIComponent(data.session.user.email ?? data.session.user.id);
  return {
    firstName: first || DEFAULT_PROFILE.firstName,
    lastName: last,
    email: row?.email ?? data.session.user.email ?? "",
    role: (roleRow.data?.role as string | undefined) ?? "Member",
    avatarUrl: row?.avatar_url ?? `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`,
  };
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: DEFAULT_PROFILE,
  _hydrated: false,
  hydrate: async () => {
    try {
      const p = await loadProfile();
      if (p) set({ profile: p, _hydrated: true });
      else set({ _hydrated: true });
    } catch {
      set({ _hydrated: true });
    }
  },
  saveProfile: (p) => {
    const prev = get().profile;
    set({ profile: p });
    updateProfile({
      data: {
        fullName: `${p.firstName} ${p.lastName}`.trim(),
        avatarUrl: p.avatarUrl,
      },
    }).catch((err) => {
      set({ profile: prev });
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    });
  },
  setAvatar: (url) => {
    const prev = get().profile;
    set((s) => ({ profile: { ...s.profile, avatarUrl: url } }));
    updateProfile({ data: { avatarUrl: url } }).catch((err) => {
      set({ profile: prev });
      toast.error(err instanceof Error ? err.message : "Failed to update avatar");
    });
  },
}));

// Hydrate once on the client — the profile is not shop-scoped so it doesn't
// need to react to shop-context changes.
if (typeof window !== "undefined") {
  void useProfileStore.getState().hydrate();
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "USER_UPDATED") void useProfileStore.getState().hydrate();
    if (event === "SIGNED_OUT") useProfileStore.setState({ profile: DEFAULT_PROFILE, _hydrated: false });
  });
}
