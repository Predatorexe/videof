import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useProfileStore, type ProfileData } from "@/stores/profile-store";
import { useActivityStore } from "@/stores/activity-store";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const initialConnections = [
  { name: "Shopify", connected: true, handle: "atelier-north.myshopify.com" },
  { name: "Cloudinary", connected: true, handle: "cloud: atelier-north" },
  { name: "Instagram", connected: false, handle: "" },
  { name: "TikTok", connected: false, handle: "" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ProfilePage() {
  const profile = useProfileStore((s) => s.profile);
  const saveProfile = useProfileStore((s) => s.saveProfile);
  const setAvatar = useProfileStore((s) => s.setAvatar);
  const log = useActivityStore((s) => s.log);
  const [draft, setDraft] = useState<ProfileData>(profile);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});
  const [connections, setConnections] = useState(initialConnections);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const set = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!draft.firstName.trim()) next.firstName = "Required";
    if (!draft.lastName.trim()) next.lastName = "Required";
    if (!EMAIL_RE.test(draft.email)) next.email = "Enter a valid email";
    if (!draft.role.trim()) next.role = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onAvatar = (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Pick an image file");
    if (file.size > 2 * 1024 * 1024) return toast.error("Avatar must be under 2 MB");
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setAvatar(url);
      setDraft((d) => ({ ...d, avatarUrl: url }));
      log("update", "Avatar updated");
      toast.success("Avatar updated");
    };
    reader.readAsDataURL(file);
  };

  return (
    <PageShell
      eyebrow="Account"
      title="Profile"
      description="Your personal profile, avatar, and connected accounts."
    >
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border bg-card p-5">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={draft.avatarUrl} />
              <AvatarFallback>
                {draft.firstName.charAt(0)}
                {draft.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-3 font-display text-2xl">
              {draft.firstName} {draft.lastName}
            </div>
            <div className="text-xs text-muted-foreground">{draft.role} · Atelier North</div>
            <Button size="sm" variant="outline" className="mt-4" onClick={() => fileRef.current?.click()}>
              Change avatar
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onAvatar(f);
                e.currentTarget.value = "";
              }}
            />
          </div>
        </aside>

        <div className="space-y-4">
          <section className="rounded-xl border bg-card">
            <div className="border-b p-5">
              <h3 className="font-display text-xl">Personal details</h3>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="First name" value={draft.firstName} onChange={(v) => set("firstName", v)} error={errors.firstName} />
              <Field label="Last name" value={draft.lastName} onChange={(v) => set("lastName", v)} error={errors.lastName} />
              <Field label="Email" value={draft.email} type="email" onChange={(v) => set("email", v)} error={errors.email} />
              <Field label="Role" value={draft.role} onChange={(v) => set("role", v)} error={errors.role} />
            </div>
            <div className="flex items-center gap-2 border-t p-5">
              <Button
                onClick={() => {
                  if (!validate()) return;
                  saveProfile(draft);
                  log("update", "Profile updated");
                  toast.success("Profile saved");
                }}
              >
                Save changes
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDraft(profile);
                  setErrors({});
                }}
              >
                Reset
              </Button>
            </div>
          </section>

          <section className="rounded-xl border bg-card">
            <div className="border-b p-5">
              <h3 className="font-display text-xl">Connected accounts</h3>
            </div>
            <ul className="divide-y">
              {connections.map((c) => (
                <li key={c.name} className="flex items-center justify-between p-5">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    {c.handle && <div className="text-xs text-muted-foreground">{c.handle}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={c.connected ? "default" : "secondary"}>
                      {c.connected ? "Connected" : "Not connected"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setConnections((prev) =>
                          prev.map((x) =>
                            x.name === c.name
                              ? {
                                  ...x,
                                  connected: !x.connected,
                                  handle: !x.connected ? `${c.name.toLowerCase()}@handle` : "",
                                }
                              : x,
                          ),
                        );
                        toast.success(c.connected ? `${c.name} disconnected` : `${c.name} connected`);
                        log("update", c.connected ? `${c.name} disconnected` : `${c.name} connected`);
                      }}
                    >
                      {c.connected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} maxLength={120} />
      {error && <div className="text-xs text-destructive">{error}</div>}
    </div>
  );
}
