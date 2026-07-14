/**
 * Videofy runtime — mounted by the loader once per widget container.
 * Renders the widget UI and posts analytics events back to the app.
 *
 * Ships as vanilla JS to avoid a React runtime on the storefront. The
 * embedded admin uses a React renderer that mirrors this file's config shape.
 */
(function () {
  "use strict";

  function track(appUrl, events) {
    if (!events || !events.length) return;
    var body = JSON.stringify({ events: events });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(appUrl + "/api/public/analytics/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch(appUrl + "/api/public/analytics/track", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true,
      }).catch(function () {});
    }
  }

  function fetchConfig(appUrl, widgetId) {
    return fetch(appUrl + "/api/public/widget/" + encodeURIComponent(widgetId), { credentials: "omit" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }

  function renderCarousel(el, data, opts) {
    var wrap = document.createElement("div");
    wrap.className = "vf-carousel vf-" + (opts.widgetType || "carousel");
    (data.videos || []).forEach(function (join) {
      var v = join.video || {};
      var card = document.createElement("div");
      card.className = "vf-card";
      var poster = v.poster_url || v.thumbnail_url || "";
      card.innerHTML =
        '<div class="vf-thumb" style="background-image:url(' + JSON.stringify(poster) + ')"></div>' +
        '<div class="vf-title">' + (v.title || "") + "</div>";
      card.addEventListener("click", function () {
        track(opts.appUrl, [{
          shopId: data.widget.shop_id,
          widgetId: data.widget.id,
          videoId: v.id,
          eventType: "video_start",
          sessionId: opts.sessionId,
        }]);
      });
      wrap.appendChild(card);
    });
    el.innerHTML = "";
    el.appendChild(wrap);
    if (data.widget.custom_css) {
      var style = document.createElement("style");
      style.textContent = data.widget.custom_css;
      el.appendChild(style);
    }
  }

  var Videofy = {
    mount: function (el, opts) {
      if (!opts || !opts.widgetId || !opts.appUrl) return;
      opts.sessionId = opts.sessionId || (Math.random().toString(36).slice(2) + Date.now().toString(36));
      fetchConfig(opts.appUrl, opts.widgetId)
        .then(function (data) {
          renderCarousel(el, data, opts);
          track(opts.appUrl, [{
            shopId: data.widget.shop_id,
            widgetId: data.widget.id,
            eventType: "impression",
            sessionId: opts.sessionId,
          }]);
        })
        .catch(function (err) { console.warn("[videofy] mount failed", err); });
    },
  };

  window.Videofy = Videofy;
})();
