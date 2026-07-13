import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <PageShell eyebrow="Configure" title="Settings" description="Workspace configuration, appearance, and integrations.">
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
              <Input defaultValue="Atelier North" />
            </FormRow>
            <FormRow label="Website">
              <Input defaultValue="https://atelier-north.com" />
            </FormRow>
            <FormRow label="Language">
              <Select defaultValue="en">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Timezone">
              <Select defaultValue="Europe/Berlin">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">New York</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Berlin">Berlin</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <Save />
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <Card title="Branding">
            <FormRow label="Brand color">
              <Input type="color" defaultValue="#c8f542" className="h-10 w-24" />
            </FormRow>
            <FormRow label="Logo">
              <Button variant="outline">Upload logo</Button>
            </FormRow>
            <FormRow label="Default widget theme">
              <Select defaultValue="dark">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="auto">Match storefront</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <Save />
          </Card>
        </TabsContent>


        <TabsContent value="notifications" className="mt-6">
          <Card title="Email & alerts">
            <ToggleRow label="Upload success" defaultChecked />
            <ToggleRow label="Upload failed" defaultChecked />
            <ToggleRow label="Billing alerts" defaultChecked />
            <ToggleRow label="Weekly performance digest" />
            <ToggleRow label="Product update newsletter" />
            <Save />
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card title="Security">
            <FormRow label="Current password">
              <Input type="password" placeholder="••••••••" />
            </FormRow>
            <FormRow label="New password">
              <Input type="password" placeholder="••••••••" />
            </FormRow>
            <ToggleRow label="Two-factor authentication" defaultChecked />
            <ToggleRow label="Require SSO for team members" />
            <Save label="Update security" />
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <Card title="API keys">
            <FormRow label="Publishable key">
              <Input readOnly defaultValue="vf_pub_9a4c2e1f_placeholder" className="font-mono" />
            </FormRow>
            <FormRow label="Secret key">
              <Input readOnly defaultValue="vf_sk_••••••••••••••••" className="font-mono" />
            </FormRow>
            <FormRow label="Webhook endpoint">
              <Input placeholder="https://your-app.com/webhooks/videofy" />
            </FormRow>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => toast("Key rotated")}>Rotate keys</Button>
              <Save />
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

function ToggleRow({ label, hint, defaultChecked }: { label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm">{label}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
        <Switch defaultChecked={defaultChecked} />
      </div>
      <Separator className="mt-4" />
    </div>
  );
}

function Save({ label = "Save changes" }: { label?: string }) {
  return (
    <div className="pt-2">
      <Button onClick={() => toast.success("Saved")}>{label}</Button>
    </div>
  );
}
