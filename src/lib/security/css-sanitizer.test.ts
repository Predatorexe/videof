import { describe, it, expect } from "vitest";
import { sanitizeWidgetCss } from "./css-sanitizer";

describe("sanitizeWidgetCss", () => {
  it("returns empty for null / undefined / empty input", () => {
    expect(sanitizeWidgetCss(null).css).toBe("");
    expect(sanitizeWidgetCss(undefined).css).toBe("");
    expect(sanitizeWidgetCss("").css).toBe("");
  });

  it("preserves safe declarations", () => {
    const { css, removed } = sanitizeWidgetCss(
      ".vf-card { color: #fff; background: rgba(0,0,0,0.4); }",
    );
    expect(css).toContain(".vf-card");
    expect(css).toContain("color: #fff");
    expect(removed).toHaveLength(0);
  });

  it("strips @import at-rules", () => {
    const { css, removed } = sanitizeWidgetCss(
      "@import url('https://evil.example/track.css');\n.vf-card{color:red}",
    );
    expect(css).not.toContain("@import");
    expect(css).toContain(".vf-card");
    expect(removed).toContain("at-rule");
  });

  it("strips javascript: url() schemes", () => {
    const { css, removed } = sanitizeWidgetCss(
      ".x { background: url(javascript:alert(1)); }",
    );
    expect(css).not.toMatch(/javascript:/i);
    expect(removed).toContain("url-scheme");
  });

  it("strips IE expression()", () => {
    const { css, removed } = sanitizeWidgetCss(".x { width: expression(alert(1)); }");
    expect(css).not.toMatch(/expression\s*\(/i);
    expect(removed).toContain("expression");
  });

  it("strips behavior: declarations", () => {
    const { css, removed } = sanitizeWidgetCss(".x { behavior: url(evil.htc); }");
    expect(css).not.toMatch(/behavior\s*:/i);
    expect(removed).toContain("behavior");
  });

  it("removes </style> breakout attempts", () => {
    const { css, removed } = sanitizeWidgetCss(".x{}</style><script>alert(1)</script>");
    expect(css).not.toMatch(/<\s*\/?\s*style/i);
    expect(removed).toContain("style-breakout");
  });

  it("removes HTML comment smuggling", () => {
    const { css, removed } = sanitizeWidgetCss("<!--evil-->\n.x{color:red}");
    expect(css).not.toContain("<!--");
    expect(css).not.toContain("-->");
    expect(removed).toContain("html-comment");
  });

  it("truncates oversized input", () => {
    const big = ".x{color:red}".repeat(10_000);
    const { css, removed } = sanitizeWidgetCss(big, 1000);
    expect(css.length).toBeLessThanOrEqual(1000);
    expect(removed).toContain("truncated");
  });
});
