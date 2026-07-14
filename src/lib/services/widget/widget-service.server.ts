/**
 * Widget service — CRUD, drafts, publishing with version history.
 * Publishing snapshots current config into widget_versions and points
 * widgets.published_version_id at it.
 */
import type { DB } from "@/lib/db/repository.server";
import { ExternalServiceError, NotFoundError } from "@/lib/errors";
import type { z } from "zod";
import type { widgetCreateSchema, widgetUpdateSchema } from "@/lib/validation/schemas";

type CreateInput = z.infer<typeof widgetCreateSchema>;
type UpdateInput = z.infer<typeof widgetUpdateSchema>;

export class WidgetService {
  constructor(private readonly db: DB) {}

  async create(input: CreateInput, createdBy?: string) {
    const { data, error } = await this.db.from("widgets").insert({
      shop_id: input.shopId,
      type: input.type,
      name: input.name,
      handle: input.handle,
      config: (input.config ?? {}) as never,
      custom_css: input.customCss,
      status: "draft",
      created_by: createdBy,
    } as never).select().single();
    if (error) throw new ExternalServiceError("widget.create", error.message);
    return data;
  }

  async update({ id, ...patch }: UpdateInput) {
    const row: Record<string, unknown> = {};
    if (patch.name) row.name = patch.name;
    if (patch.handle) row.handle = patch.handle;
    if (patch.config) row.config = patch.config;
    if (patch.customCss !== undefined) row.custom_css = patch.customCss;
    if (patch.type) row.type = patch.type;
    const { data, error } = await this.db.from("widgets").update(row as never).eq("id", id).select().single();
    if (error) throw new ExternalServiceError("widget.update", error.message);
    return data;
  }

  async publish(id: string, publishedBy?: string) {
    const { data: widget, error: readErr } = await this.db.from("widgets")
      .select("*").eq("id", id).maybeSingle();
    if (readErr) throw new ExternalServiceError("widget.publish.read", readErr.message);
    if (!widget) throw new NotFoundError("widget");

    const { data: last } = await this.db.from("widget_versions")
      .select("version").eq("widget_id", id).order("version", { ascending: false }).limit(1).maybeSingle();
    const nextVersion = (last?.version ?? 0) + 1;

    const { data: version, error: verErr } = await this.db.from("widget_versions").insert({
      widget_id: id,
      version: nextVersion,
      config: widget.config,
      custom_css: widget.custom_css,
      published_at: new Date().toISOString(),
      created_by: publishedBy,
    }).select().single();
    if (verErr) throw new ExternalServiceError("widget.publish.version", verErr.message);

    const { data: updated, error: updErr } = await this.db.from("widgets").update({
      status: "published",
      published_version_id: version.id,
    }).eq("id", id).select().single();
    if (updErr) throw new ExternalServiceError("widget.publish.update", updErr.message);
    return { widget: updated, version };
  }

  async unpublish(id: string) {
    const { data, error } = await this.db.from("widgets").update({ status: "draft" }).eq("id", id).select().single();
    if (error) throw new ExternalServiceError("widget.unpublish", error.message);
    return data;
  }

  async versions(widgetId: string) {
    const { data, error } = await this.db.from("widget_versions")
      .select("*").eq("widget_id", widgetId).order("version", { ascending: false });
    if (error) throw new ExternalServiceError("widget.versions", error.message);
    return data;
  }

  async remove(id: string) {
    const { error } = await this.db.from("widgets").delete().eq("id", id);
    if (error) throw new ExternalServiceError("widget.delete", error.message);
    return { ok: true as const };
  }
}
