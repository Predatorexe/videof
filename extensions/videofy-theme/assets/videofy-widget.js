/**
 * Videofy runtime — mounted by the loader once per widget container.
 * Renders the widget UI and posts analytics events back to the app.
 *
 * Ships as vanilla JS so the storefront pays no React cost. Uses event
 * delegation on the container (one listener per widget) instead of one
 * per card — critical for SPA/AJAX themes where the widget may re-render
 * many times per session.
 */
(function () {
  "use strict";

  function track(appUrl, events) {
    if (!events || !events.length) return;
    var body = JSON.stringify({ events: events });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          appUrl + "/api/public/analytics/track",
          new Blob([body], { type: "application/json" })
        );
        return;
      }
    } catch (_) {}
    fetch(appUrl + "/api/public/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
    }).catch(function () {});
  }

  function fetchConfig(appUrl, widgetId) {
    return fetch(appUrl + "/api/public/widget/" + encodeURIComponent(widgetId), {
      credentials: "omit",
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderCarousel(el, data, opts) {
    var wrap = document.createElement("div");
    wrap.className = "vf-carousel vf-" + (opts.widgetType || "carousel");
    var videos = data.videos || [];
    var html = "";
    for (var i = 0; i < videos.length; i++) {
      var v = (videos[i] && videos[i].video) || {};
      var poster = v.poster_url || v.thumbnail_url || "";
      // eager fetchpriority on first card only, to improve LCP.
      var imgAttrs =
        (i === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" decoding="async"');
      html +=
        '<div class="vf-card" data-vf-video-id="' + esc(v.id) + '" data-vf-index="' + i + '">' +
        (poster
          ? '<img class="vf-thumb" ' + imgAttrs + ' alt="" src="' + esc(poster) + '">'
          : '<div class="vf-thumb vf-thumb-empty"></div>') +
        '<div class="vf-title">' + esc(v.title) + "</div>" +
        "</div>";
    }
    wrap.innerHTML = html;

    // Single delegated listener — no per-card handlers to leak on re-render.
    wrap.addEventListener("click", function (evt) {
      var card = evt.target && evt.target.closest ? evt.target.closest(".vf-card") : null;
      if (!card || !wrap.contains(card)) return;
      var videoId = card.getAttribute("data-vf-video-id");
      if (!videoId) return;
      track(opts.appUrl, [{
        shopId: data.widget.shop_id,
        widgetId: data.widget.id,
        videoId: videoId,
        eventType: "video_start",
        sessionId: opts.sessionId,
      }]);
    });

    el.innerHTML = "";
    el.appendChild(wrap);

    // custom_css arrives server-sanitized (see src/lib/security/css-sanitizer.ts).
    if (data.widget.custom_css) {
      var style = document.createElement("style");
      style.textContent = data.widget.custom_css;
      el.appendChild(style);
    }
  }

  var Videofy = {
    mount: function (el, opts) {
      if (!el || !opts || !opts.widgetId || !opts.appUrl) return;
      opts.sessionId =
        opts.sessionId ||
        (Math.random().toString(36).slice(2) + Date.now().toString(36));
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
        .catch(function (err) {
          if (window && window.console) console.warn("[videofy] mount failed", err);
        });
    },
  };

  window.Videofy = Videofy;
})();
