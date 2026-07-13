import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useSettingsStore } from "@/stores/settings-store";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const general = useSettingsStore((s) => s.general);
  const appearance = useSettingsStore((s) => s.appearance);
  const notifications = useSettingsStore((s) => s.notifications);
  const security = useSettingsStore((s) => s.security);
  const api = useSettingsStore((s) => s.api);
  const saveGeneral = useSettingsStore((s) => s.saveGeneral);
  const saveAppearance = useSettingsStore((s) => s.saveAppearance);
  const saveNotifications = useSettingsStore((s) => s.saveNotifications);
  const saveSecurity = useSettingsStore((s) => s.saveSecurity);
  const saveApi = useSettingsStore((s) => s.saveApi);
  const rotateKeys = useSettingsStore((s) => s.rotateKeys);

  const [gen, setGen] = useState(general);
  const [app, setApp] = useState(appearance);
  const [notif, setNotif] = useState(notifications);
  const [sec, setSec] = useState(security);
  const [password, setPassword] = useState({ current: "", next: "" });
  const [apiState, setApiState] = useState(api);

  const commit = <T,>(saver: (v: T) => void, value: T, label = "Saved") => {
    saver(value);
    toast.success(label);
  };

  return (
    <PageShell
      eyebrow="Configure"
      title="Settings"
      description="Workspace configuration, appearance, and integrations."
    >
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="api">API keys</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card title="Workspace">
            <FormRow label="Workspace name">
              <Input
                value={gen.workspaceName}
                onChange={(e) => setGen({ ...gen, workspaceName: e.target.value })}
              />
            </FormRow>
            <FormRow label="Website">
              <Input
                value={gen.website}
                onChange={(e) => setGen({ ...gen, website: e.target.value })}
              />
            </FormRow>
            <FormRow label="Language">
              <Select value={gen.language} onValueChange={(v) => setGen({ ...gen, language: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Timezone">
              <Select value={gen.timezone} onValueChange={(v) => setGen({ ...gen, timezone: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">New York</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Berlin">Berlin</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <SaveBar onSave={() => commit(saveGeneral, gen)} />
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <Card title="Branding">
            <FormRow label="Brand color">
              <Input
                type="color"
                value={app.brandColor}
                onChange={(e) => setApp({ ...app, brandColor: e.target.value })}
                className="h-10 w-24"
              />
            </FormRow>
            <FormRow label="Logo">
              <Button variant="outline">Upload logo</Button>
            </FormRow>
            <FormRow label="Default widget theme">
              <Select
                value={app.widgetTheme}
                onValueChange={(v) => setApp({ ...app, widgetTheme: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="auto">Match storefront</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <SaveBar onSave={() => commit(saveAppearance, app)} />
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card title="Email & alerts">
            <ToggleRow
              label="Upload success"
              checked={notif.uploadSuccess}
              onChange={(v) => setNotif({ ...notif, uploadSuccess: v })}
            />
            <ToggleRow
              label="Upload failed"
              checked={notif.uploadFailed}
              onChange={(v) => setNotif({ ...notif, uploadFailed: v })}
            />
            <ToggleRow
              label="Billing alerts"
              checked={notif.billingAlerts}
              onChange={(v) => setNotif({ ...notif, billingAlerts: v })}
            />
            <ToggleRow
              label="Weekly performance digest"
              checked={notif.weeklyDigest}
              onChange={(v) => setNotif({ ...notif, weeklyDigest: v })}
            />
            <ToggleRow
              label="Product update newsletter"
              checked={notif.productNewsletter}
              onChange={(v) => setNotif({ ...notif, productNewsletter: v })}
            />
            <SaveBar onSave={() => commit(saveNotifications, notif)} />
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card title="Security">
            <FormRow label="Current password">
              <Input
                type="password"
                value={password.current}
                onChange={(e) => setPassword({ ...password, current: e.target.value })}
                placeholder="••••••••"
              />
            </FormRow>
            <FormRow label="New password">
              <Input
                type="password"
                value={password.next}
                onChange={(e) => setPassword({ ...password, next: e.target.value })}
                placeholder="••••••••"
              />
            </FormRow>
            <ToggleRow
              label="Two-factor authentication"
              checked={sec.twoFactor}
              onChange={(v) => setSec({ ...sec, twoFactor: v })}
            />
            <ToggleRow
              label="Require SSO for team members"
              checked={sec.requireSso}
              onChange={(v) => setSec({ ...sec, requireSso: v })}
            />
            <SaveBar
              label="Update security"
              onSave={() => {
                saveSecurity(sec);
                setPassword({ current: "", next: "" });
                toast.success("Security updated");
              }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <Card title="API keys">
            <FormRow label="Publishable key">
              <Input readOnly value={apiState.publishableKey} className="font-mono" />
            </FormRow>
            <FormRow label="Secret key">
              <Input readOnly value={apiState.secretKey} className="font-mono" />
            </FormRow>
            <FormRow label="Webhook endpoint">
              <Input
                value={apiState.webhookEndpoint}
                onChange={(e) => setApiState({ ...apiState, webhookEndpoint: e.target.value })}
                placeholder="https://your-app.com/webhooks/videofy"
              />
            </FormRow>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  rotateKeys();
                  const next = useSettingsStore.getState().api;
                  setApiState(next);
                  toast.success("Keys rotated");
                }}
              >
                Rotate keys
              </Button>
              <Button onClick={() => commit(saveApi, apiState)}>Save changes</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b p-5">
        <h3 className="font-display text-xl">{title}</h3>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <Label className="text-sm">{label}</Label>
      <div>{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm">{label}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
      <Separator className="mt-4" />
    </div>
  );
}

function SaveBar({ label = "Save changes", onSave }: { label?: string; onSave: () => void }) {
  return (
    <div className="pt-2">
      <Button onClick={onSave}>{label}</Button>
    </div>
  );
}
