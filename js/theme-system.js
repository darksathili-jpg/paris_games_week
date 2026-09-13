(() => {
  "use strict";

  const KEY = "pgw-nsi-skin";
  const ALLOWED = new Set(["cyber", "arcade", "esport"]);
  const THEME_COLORS = {
    cyber: "#0a1022",
    arcade: "#140d25",
    esport: "#081126"
  };

  function normalize(value) {
    return ALLOWED.has(value) ? value : "cyber";
  }

  function applySkin(value, persist = true) {
    const skin = normalize(value);
    document.documentElement.dataset.skin = skin;
    if (persist) localStorage.setItem(KEY, skin);

    document.querySelectorAll("#skin-select").forEach(select => {
      if (select.value !== skin) select.value = skin;
    });

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && document.documentElement.dataset.theme !== "light") {
      meta.setAttribute("content", THEME_COLORS[skin] || THEME_COLORS.cyber);
    }
  }

  function init() {
    const stored = localStorage.getItem(KEY);
    applySkin(stored || document.documentElement.dataset.skin || "cyber", false);

    document.querySelectorAll("#skin-select").forEach(select => {
      select.addEventListener("change", () => applySkin(select.value));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
