import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useProfileStore, type ProfileData } from "@/stores/profile-store";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const connected = [
  { name: "Shopify", status: "Connected", handle: "atelier-north.myshopify.com" },
  { name: "Cloudinary", status: "Connected", handle: "cloud: atelier-north" },
  { name: "Instagram", status: "Not connected", handle: "" },
  { name: "TikTok", status: "Not connected", handle: "" },
];

function ProfilePage() {
  const profile = useProfileStore((s) => s.profile);
  const saveProfile = useProfileStore((s) => s.saveProfile);
  const [draft, setDraft] = useState<ProfileData>(profile);

  const set = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

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
              <AvatarImage src="https://api.dicebear.com/9.x/notionists/svg?seed=founder" />
              <AvatarFallback>
                {draft.firstName.charAt(0)}
                {draft.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-3 font-display text-2xl">
              {draft.firstName} {draft.lastName}
            </div>
            <div className="text-xs text-muted-foreground">{draft.role} · Atelier North</div>
            <Button size="sm" variant="outline" className="mt-4">
              Change avatar
            </Button>
          </div>
        </aside>

        <div className="space-y-4">
          <section className="rounded-xl border bg-card">
            <div className="border-b p-5">
              <h3 className="font-display text-xl">Personal details</h3>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field
                label="First name"
                value={draft.firstName}
                onChange={(v) => set("firstName", v)}
              />
              <Field
                label="Last name"
                value={draft.lastName}
                onChange={(v) => set("lastName", v)}
              />
              <Field
                label="Email"
                value={draft.email}
                type="email"
                onChange={(v) => set("email", v)}
              />
              <Field label="Role" value={draft.role} onChange={(v) => set("role", v)} />
            </div>
            <div className="border-t p-5">
              <Button
                onClick={() => {
                  saveProfile(draft);
                  toast.success("Profile saved");
                }}
              >
                Save changes
              </Button>
            </div>
          </section>

          <section className="rounded-xl border bg-card">
            <div className="border-b p-5">
              <h3 className="font-display text-xl">Connected accounts</h3>
            </div>
            <ul className="divide-y">
              {connected.map((c) => (
                <li key={c.name} className="flex items-center justify-between p-5">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    {c.handle && <div className="text-xs text-muted-foreground">{c.handle}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={c.status === "Connected" ? "default" : "secondary"}>
                      {c.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      {c.status === "Connected" ? "Manage" : "Connect"}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
