(() => {
  "use strict";

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  function mountLayers() {
    if (document.querySelector(".fx-stage")) return;
    const stage = document.createElement("div");
    stage.className = "fx-stage";
    stage.setAttribute("aria-hidden", "true");
    stage.innerHTML = '<canvas class="fx-stars"></canvas><div class="fx-cursor"></div><div class="fx-scanlines"></div><div class="fx-vignette"></div><div class="fx-flash"></div>';
    document.body.prepend(stage);
  }

  function initStars() {
    if (reduceMotion) return;
    const canvas = document.querySelector(".fx-stars");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    let w = 0, h = 0, dpr = 1, stars = [], raf = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(1.6, window.devicePixelRatio || 1);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(110, Math.max(42, Math.floor((w * h) / 17000)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * .8 + .2,
        vy: Math.random() * .13 + .025,
        phase: Math.random() * Math.PI * 2
      }));
    }

    function color(alpha) {
      const skin = document.documentElement.dataset.skin || "cyber";
      if (skin === "arcade") return `rgba(255,228,92,${alpha})`;
      if (skin === "esport") return `rgba(82,220,255,${alpha})`;
      return `rgba(93,246,255,${alpha})`;
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y += s.vy * s.z;
        if (s.y > h + 6) { s.y = -6; s.x = Math.random() * w; }
        const twinkle = .24 + (Math.sin(t * .0015 + s.phase) + 1) * .13;
        ctx.fillStyle = color(twinkle * s.z);
        ctx.fillRect(s.x, s.y, Math.max(.7, 1.5 * s.z), Math.max(.7, 1.5 * s.z));
      }
      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    raf = requestAnimationFrame(draw);
    window.addEventListener("pagehide", () => cancelAnimationFrame(raf), { once: true });
  }

  function initCursorGlow() {
    if (reduceMotion || !window.matchMedia?.("(hover:hover) and (pointer:fine)").matches) return;
    const glow = document.querySelector(".fx-cursor");
    if (!glow) return;
    let x = -999, y = -999, tx = -999, ty = -999, raf = 0;
    window.addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const animate = () => {
      x += (tx - x) * .12;
      y += (ty - y) * .12;
      glow.style.transform = `translate3d(${x - 180}px,${y - 180}px,0)`;
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    window.addEventListener("pagehide", () => cancelAnimationFrame(raf), { once: true });
  }

  function initRevealObserver() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    const selector = ".hero, .join-card, .mission-card, .badge, .panel, .progress-card, .question-card, .summary-card, .stat";
    const seen = new WeakSet();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("fx-visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: .08, rootMargin: "0px 0px -4% 0px" });

    const scan = () => {
      document.querySelectorAll(selector).forEach((el, i) => {
        if (seen.has(el)) return;
        seen.add(el);
        el.classList.add("fx-reveal");
        el.style.transitionDelay = `${Math.min(i % 8, 5) * 55}ms`;
        observer.observe(el);
      });
    };

    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.getElementById("app") || document.body, { childList: true, subtree: true });
  }

  function initCardTilt() {
    if (reduceMotion || !window.matchMedia?.("(hover:hover) and (pointer:fine)").matches) return;
    const bound = new WeakSet();
    const bind = () => {
      document.querySelectorAll(".mission-card, .hud-card").forEach(card => {
        if (bound.has(card)) return;
        bound.add(card);
        card.addEventListener("pointermove", e => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          const rx = (py - .5) * -4.5;
          const ry = (px - .5) * 6;
          card.style.setProperty("--mx", `${Math.round(px * 100)}%`);
          card.style.setProperty("--my", `${Math.round(py * 100)}%`);
          card.style.transform = `translateY(-4px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
        card.addEventListener("pointerleave", () => {
          card.style.transform = "";
          card.style.removeProperty("--mx");
          card.style.removeProperty("--my");
        });
      });
    };
    bind();
    new MutationObserver(bind).observe(document.getElementById("app") || document.body, { childList: true, subtree: true });
  }

  function initButtonFlash() {
    if (reduceMotion) return;
    const flash = document.querySelector(".fx-flash");
    if (!flash) return;
    document.addEventListener("click", e => {
      const trigger = e.target.closest?.(".btn-primary, .btn-secondary, .mission-card .btn");
      if (!trigger) return;
      flash.classList.remove("on");
      void flash.offsetWidth;
      flash.classList.add("on");
    });
  }

  function initBrandLogo() {
    document.querySelectorAll(".brand").forEach(brand => {
      brand.classList.add("brand-school");
      const mark = brand.querySelector(".brand-mark");
      if (!mark || mark.querySelector("img")) return;
      mark.classList.add("logo-mark");
      mark.textContent = "";
      const img = document.createElement("img");
      img.src = "assets/watteau-logo.svg";
      img.alt = "";
      img.decoding = "async";
      mark.appendChild(img);
    });
  }

  function init() {
    mountLayers();
    initBrandLogo();
    initStars();
    initCursorGlow();
    initRevealObserver();
    initCardTilt();
    initButtonFlash();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
