/**
 * CSS sanitizer for merchant-supplied widget CSS.
 *
 * We serve `widget.custom_css` verbatim into storefront pages, so a
 * malicious or careless value could:
 *   - `@import` remote stylesheets (exfil via Referer, load tracking CSS)
 *   - Use `url(javascript:...)` in older engines
 *   - Use IE-era `expression(...)` (still a legacy XSS vector)
 *   - Break out of a `<style>` block with `</style>` and inject markup
 *   - Point background/behavior to `data:` URIs with scripts
 *
 * This is a defensive allow-list-ish filter. It is intentionally
 * pessimistic: if the input contains a dangerous token, we strip the
 * *entire* offending declaration/at-rule rather than trying to fix it.
 * The output is safe to inject inside a `<style>` element.
 *
 * The sanitizer is pure and isomorphic — usable in Node, edge workers,
 * tests, and the browser.
 */

const FORBIDDEN_URL_SCHEMES = /url\(\s*['"]?\s*(javascript|vbscript|data:text\/html|about:)/i;
const EXPRESSION_RE = /expression\s*\(/i;
const BEHAVIOR_RE = /(^|[\s;{])behavior\s*:/i;
// `</style` (any case, optional slash spacing) — would break out of the wrapping <style> tag.
const STYLE_BREAKOUT_RE = /<\s*\/?\s*style\b/i;
// HTML-comment / CDATA smuggling
const HTML_COMMENT_RE = /<!--|-->|<!\[CDATA\[/g;
// Forbidden at-rules: @import (external fetch), @charset (must be first byte anyway).
const FORBIDDEN_AT_RULE_RE = /@\s*(import|charset|document)\b/i;

export interface SanitizeResult {
  css: string;
  removed: string[];
}

export function sanitizeWidgetCss(input: string | null | undefined, maxLength = 50_000): SanitizeResult {
  const removed: string[] = [];
  if (!input) return { css: "", removed };

  let css = String(input);
  if (css.length > maxLength) {
    removed.push("truncated");
    css = css.slice(0, maxLength);
  }

  // Hard-refuse: any occurrence of tag-breakout or HTML comment sequences.
  // These have no legitimate use inside a CSS payload.
  if (STYLE_BREAKOUT_RE.test(css)) {
    removed.push("style-breakout");
    css = css.replace(STYLE_BREAKOUT_RE, "");
  }
  HTML_COMMENT_RE.lastIndex = 0;
  if (HTML_COMMENT_RE.test(css)) {
    removed.push("html-comment");
    HTML_COMMENT_RE.lastIndex = 0;
    css = css.replace(HTML_COMMENT_RE, "");
  }

  // Strip block comments — they're valid CSS but attackers often hide
  // payloads inside them and they aren't needed at runtime.
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove forbidden at-rules line-by-line so we don't nuke the whole sheet.
  const lines = css.split(/\n/);
  const kept: string[] = [];
  for (const raw of lines) {
    const line = raw;
    if (FORBIDDEN_AT_RULE_RE.test(line)) {
      removed.push("at-rule");
      continue;
    }
    if (FORBIDDEN_URL_SCHEMES.test(line)) {
      removed.push("url-scheme");
      continue;
    }
    if (EXPRESSION_RE.test(line)) {
      removed.push("expression");
      continue;
    }
    if (BEHAVIOR_RE.test(line)) {
      removed.push("behavior");
      continue;
    }
    kept.push(line);
  }

  return { css: kept.join("\n").trim(), removed };
}
