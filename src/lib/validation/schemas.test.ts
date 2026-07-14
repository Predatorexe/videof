import { describe, it, expect } from "vitest";
import {
  listQuerySchema,
  analyticsBatchSchema,
  widgetCreateSchema,
  slug,
} from "./schemas";

describe("listQuerySchema", () => {
  it("caps pageSize at 100", () => {
    expect(() => listQuerySchema.parse({ pageSize: 101 })).toThrow();
    expect(listQuerySchema.parse({ pageSize: 100 }).pageSize).toBe(100);
  });
  it("rejects negative page", () => {
    expect(() => listQuerySchema.parse({ page: 0 })).toThrow();
  });
  it("accepts empty query", () => {
    expect(listQuerySchema.parse({})).toEqual({});
  });
});

describe("slug", () => {
  it("accepts kebab-case", () => {
    expect(slug.parse("hero-carousel")).toBe("hero-carousel");
  });
  it("rejects underscores / uppercase", () => {
    expect(() => slug.parse("Hero_Carousel")).toThrow();
  });
});

describe("widgetCreateSchema", () => {
  it("caps customCss length", () => {
    expect(() =>
      widgetCreateSchema.parse({
        shopId: "00000000-0000-0000-0000-000000000000",
        type: "hero",
        name: "x",
        handle: "x",
        customCss: "a".repeat(60_000),
      }),
    ).toThrow();
  });
});

describe("analyticsBatchSchema", () => {
  it("requires a non-empty events array", () => {
    expect(() => analyticsBatchSchema.parse({ events: [] })).toThrow();
  });
});
