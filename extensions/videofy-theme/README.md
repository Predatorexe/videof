# Videofy — Theme App Extension

This folder is a fully-structured Shopify Theme App Extension. Deploy with the
Shopify CLI once a Partner app exists (`shopify app deploy`).

## Layout

- `shopify.extension.toml`        Extension manifest (name, type, version)
- `blocks/`                       App blocks merchants add to theme sections
- `blocks/app-embed-*.liquid`     App embeds (site-wide, appear in Theme Editor)
- `snippets/`                     Shared Liquid partials
- `assets/`                       Compiled JS/CSS shipped to the storefront
  - `videofy-loader.js`           Tiny bootstrap; discovers widgets on the page
  - `videofy-widget.js`           Main runtime (loads widget config + videos)
  - `videofy.css`                 Base styles
- `locales/`                      i18n JSON for merchant-facing labels

## Data flow

1. Merchant drops a Videofy block into a section (or enables an App Embed).
2. Liquid renders `<div data-videofy-widget data-widget-id="{{ block.settings.widget_id }}"></div>`
   and includes `assets/videofy-loader.js` once per page.
3. Loader fetches `https://{app-url}/api/public/widget/{id}` for each container.
4. Loader mounts the runtime, which renders the widget and posts events to
   `https://{app-url}/api/public/analytics/track`.

## Widget types shipped

Homepage Carousel, Story, Floating, Product, Collection, Popup, Hero, Grid.
Plus an App Embed for the always-on floating widget.
