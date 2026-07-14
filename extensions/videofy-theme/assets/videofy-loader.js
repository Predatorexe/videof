/**
 * Videofy storefront loader.
 * Discovers every [data-videofy-widget] container on the page,
 * fetches its config, and mounts the runtime.
 *
 * The loader is deliberately tiny — the heavy runtime is code-split.
 */
(function () {
  "use strict";
  if (window.__videofyLoaded) return;
  window.__videofyLoaded = true;

  var APP_URL = document.currentScript
    ? new URL(document.currentScript.src).origin
    : "";

  var containers = document.querySelectorAll("[data-videofy-widget]");
  if (!containers.length) return;

  function loadRuntime(cb) {
    if (window.Videofy) return cb(window.Videofy);
    var s = document.createElement("script");
    s.src = APP_URL + "/videofy-widget.js";
    s.defer = true;
    s.onload = function () { cb(window.Videofy); };
    s.onerror = function () { console.warn("[videofy] runtime failed to load"); };
    document.head.appendChild(s);
  }

  loadRuntime(function (Videofy) {
    if (!Videofy) return;
    containers.forEach(function (el) {
      Videofy.mount(el, {
        widgetId: el.getAttribute("data-widget-id"),
        widgetType: el.getAttribute("data-widget-type"),
        shop: el.getAttribute("data-shop"),
        appUrl: APP_URL,
      });
    });
  });
})();
