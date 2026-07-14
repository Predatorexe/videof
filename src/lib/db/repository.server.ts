/**
 * Base repository abstraction. Instantiated per-request with an authenticated
 * Supabase client so all queries run under the caller's RLS.
 *
 * *.server.ts — never import from route/component code; use only inside
 * server-function handlers.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  NotFoundError,
  ExternalServiceError,
} from "@/lib/errors";
import type { Paginated, Pagination } from "@/lib/types";
import { normalizePagination } from "@/lib/types";

export type DB = SupabaseClient<Database>;
export type Table = keyof Database["public"]["Tables"];

export class Repository<T extends Table> {
  constructor(
    protected readonly db: DB,
    protected readonly table: T,
  ) {}

  protected q() {
    return this.db.from(this.table);
  }

  async findById(id: string) {
    const { data, error } = await this.q().select("*").eq("id" as never, id).maybeSingle();
    if (error) throw new ExternalServiceError("database", error.message, error);
    if (!data) throw new NotFoundError(String(this.table));
    return data;
  }

  async list(opts: {
    where?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    pagination?: Partial<Pagination>;
    select?: string;
  } = {}): Promise<Paginated<Record<string, unknown>>> {
    const { page, pageSize } = normalizePagination(opts.pagination);
    let query = this.db
      .from(this.table)
      .select(opts.select ?? "*", { count: "exact" });

    if (opts.where) {
      for (const [k, v] of Object.entries(opts.where)) {
        query = query.eq(k as never, v as never);
      }
    }
    if (opts.order) {
      query = query.order(opts.order.column, {
        ascending: opts.order.ascending ?? true,
      });
    }
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw new ExternalServiceError("database", error.message, error);
    const total = count ?? 0;
    return {
      items: ((data ?? []) as unknown) as Record<string, unknown>[],
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async insert(row: Record<string, unknown>) {
    const { data, error } = await this.q()
      .insert(row as never)
      .select()
      .single();
    if (error) throw new ExternalServiceError("database", error.message, error);
    return data;
  }

  async update(id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.q()
      .update(patch as never)
      .eq("id" as never, id)
      .select()
      .single();
    if (error) throw new ExternalServiceError("database", error.message, error);
    return data;
  }

  async remove(id: string) {
    const { error } = await this.q().delete().eq("id" as never, id);
    if (error) throw new ExternalServiceError("database", error.message, error);
    return { ok: true as const };
  }
}
