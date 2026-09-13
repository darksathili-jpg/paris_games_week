(() => {
  "use strict";

  const LOGO = "assets/watteau-logo.svg";
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const app = document.getElementById("app");
  let audioEnabled = false;
  let audioCtx = null;
  let pointerFrame = 0;

  if (!localStorage.getItem("pgw-v4-theme-migrated")) {
    localStorage.setItem("pgw-nsi-theme", "dark");
    localStorage.setItem("pgw-v4-theme-migrated", "1");
    root.dataset.theme = "dark";
  }

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function flash() {
    if (reduceMotion) return;
    const f = el("div", "v4-flash");
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 500);
  }

  function beep(freq = 520, duration = .045, gain = .025) {
    if (!audioEnabled) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const amp = audioCtx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      amp.gain.value = gain;
      osc.connect(amp).connect(audioCtx.destination);
      osc.start();
      amp.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + duration);
      osc.stop(audioCtx.currentTime + duration);
    } catch {}
  }

  function injectWorld() {
    if (document.querySelector(".v4-world")) return;
    const world = el("div", "v4-world");
    world.setAttribute("aria-hidden", "true");
    document.body.prepend(world);
    document.body.append(el("div", "v4-scanlines"));
    document.body.append(el("div", "v4-scanbeam"));
    document.body.append(el("div", "v4-vignette"));

    if (!reduceMotion) {
      const glow = el("div", "v4-cursor-glow");
      document.body.appendChild(glow);
      window.addEventListener("pointermove", e => {
        cancelAnimationFrame(pointerFrame);
        pointerFrame = requestAnimationFrame(() => {
          glow.style.left = `${e.clientX}px`;
          glow.style.top = `${e.clientY}px`;
        });
      }, { passive: true });
      initParticles();
    }
  }

  function initParticles() {
    const canvas = document.createElement("canvas");
    canvas.id = "v4-particles";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = Math.min(2, devicePixelRatio || 1), particles = [];

    function resize() {
      w = innerWidth; h = innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const count = Math.min(85, Math.max(32, Math.floor((w*h)/24000)));
      particles = Array.from({length:count}, () => ({
        x:Math.random()*w, y:Math.random()*h,
        vx:(Math.random()-.5)*.22, vy:-.08-Math.random()*.24,
        r:.5+Math.random()*1.6, a:.18+Math.random()*.55,
        type:Math.random()>.78?1:0
      }));
    }

    function draw() {
      ctx.clearRect(0,0,w,h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -12) { p.y = h+12; p.x = Math.random()*w; }
        if (p.x < -12) p.x = w+12;
        if (p.x > w+12) p.x = -12;
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.type ? "#a071ff" : "#53f4ff";
        if (p.type) ctx.fillRect(p.x,p.y,p.r*3,.7);
        else { ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    resize();
    addEventListener("resize", resize, {passive:true});
    requestAnimationFrame(draw);
  }

  function boot() {
    if (sessionStorage.getItem("pgw-v4-boot-seen")) return;
    sessionStorage.setItem("pgw-v4-boot-seen", "1");
    const boot = el("div", "v4-boot", `
      <div class="v4-boot-card">
        <div class="v4-boot-top">
          <img class="v4-boot-logo" src="${LOGO}" alt="Logo du Lycée Watteau">
          <div>
            <div class="v4-boot-kicker">WATTEAU // NSI FIELD OPS</div>
            <h1 class="v4-boot-title">OPÉRATION <span>PGW 2026</span></h1>
          </div>
        </div>
        <div class="v4-boot-status" aria-live="polite">
          <div data-boot-line="1">[ SYS ] INITIALISATION DU TERMINAL...</div>
          <div data-boot-line="2">[ NET ] LIAISON SUPABASE...</div>
          <div data-boot-line="3">[ OPS ] CHARGEMENT DES 6 QUÊTES...</div>
        </div>
        <div class="v4-boot-track"><div class="v4-boot-fill"></div></div>
        <button class="v4-boot-skip" type="button">Passer l'introduction</button>
      </div>`);
    document.body.appendChild(boot);
    const close = () => {
      boot.classList.add("v4-leave");
      setTimeout(() => boot.remove(), 620);
    };
    boot.querySelector(".v4-boot-skip")?.addEventListener("click", close);
    const l2 = boot.querySelector('[data-boot-line="2"]');
    const l3 = boot.querySelector('[data-boot-line="3"]');
    setTimeout(() => { if (l2) l2.innerHTML = "[ NET ] LIAISON SUPABASE <b>OK</b>"; }, 650);
    setTimeout(() => { if (l3) l3.innerHTML = "[ OPS ] 6 QUÊTES CHARGÉES <b>READY</b>"; }, 1250);
    setTimeout(close, reduceMotion ? 900 : 2350);
  }

  function enhanceTopbar() {
    const brand = document.querySelector(".brand");
    const mark = brand?.querySelector(".brand-mark");
    if (!brand || brand.querySelector(".v4-brand-logo")) return;
    if (mark) mark.classList.add("v4-hidden-mark");
    const img = document.createElement("img");
    img.src = LOGO;
    img.alt = "";
    img.className = "v4-brand-logo";
    brand.prepend(img);

    const actions = document.querySelector(".topbar-actions");
    if (actions && !document.getElementById("v4-sfx-toggle")) {
      const b = document.createElement("button");
      b.type = "button";
      b.id = "v4-sfx-toggle";
      b.className = "icon-btn v4-sfx";
      b.textContent = "SFX OFF";
      b.setAttribute("aria-pressed","false");
      b.title = "Activer les effets sonores d'interface";
      b.addEventListener("click", () => {
        audioEnabled = !audioEnabled;
        b.textContent = audioEnabled ? "SFX ON" : "SFX OFF";
        b.setAttribute("aria-pressed", String(audioEnabled));
        if (audioEnabled) { beep(660,.07,.035); flash(); }
      });
      actions.insertBefore(b, actions.querySelector("#theme-toggle"));
    }
  }

  function enhanceLanding() {
    const hero = app?.querySelector(".hero");
    const join = app?.querySelector(".join-card");
    if (!hero || hero.classList.contains("v4-hero")) return;
    hero.classList.add("v4-hero");

    const left = hero.querySelector(".hero-grid > div:first-child");
    const eyebrow = hero.querySelector(".eyebrow");
    const title = hero.querySelector("h1");
    const hud = hero.querySelector(".hud-card");
    if (eyebrow) eyebrow.textContent = "OPÉRATION PGW // WATTEAU FIELD UNIT";
    if (title) title.innerHTML = `PGW <span class="accent">NSI QUEST</span>`;

    if (left && !left.querySelector(".v4-hero-insignia")) {
      left.prepend(el("div", "v4-hero-insignia", `<img src="${LOGO}" alt=""><span><b>LYCÉE WATTEAU</b><small>VALENCIENNES // TERMINALE NSI</small></span>`));
      left.append(el("div", "v4-hero-code", "FIELD LINK 23.10.2026 // PARIS EXPO // SECURE CHANNEL"));
    }
    if (hud && !hud.querySelector(".v4-radar")) {
      const label = hud.querySelector(".hud-label");
      label?.insertAdjacentElement("afterend", el("div", "v4-radar"));
      hud.append(el("div", "v4-telemetry", `<span>PGW GRID // ACTIVE</span><span>LINK STABLE</span>`));
    }

    if (join) {
      join.classList.add("v4-terminal");
      if (!join.querySelector(".v4-terminal-header")) {
        join.prepend(el("div", "v4-terminal-header", `<span>SECURE ACCESS NODE // STUDENT DEPLOYMENT</span><span>AUTH MODE // ANONYMOUS</span>`));
      }
      const submit = join.querySelector('button[type="submit"]');
      if (submit) submit.textContent = "DÉPLOYER L'AGENT →";
    }
    bindTilts();
  }

  function enhanceHome() {
    const dash = app?.querySelector(".dashboard-head");
    const grid = app?.querySelector(".mission-grid");
    if (!dash || !grid || grid.classList.contains("v4-mission-map")) return;
    dash.classList.add("v4-dashboard");
    grid.classList.add("v4-mission-map");
    const section = grid.closest(".section");
    const head = section?.querySelector(".section-head");
    if (head && !section.querySelector(".v4-map-label")) {
      head.insertAdjacentElement("afterend", el("div", "v4-map-label", `<b>OPERATION MAP // 06 NODES</b><span>ROUTE STATUS // LIVE</span>`));
    }
    const glyphs = ["⌬","◈","⟁","◎","◇","★"];
    grid.querySelectorAll(".mission-card").forEach((card, i) => {
      if (!card.querySelector(".v4-mission-glyph")) {
        card.append(el("span", "v4-mission-glyph", glyphs[i] || "◆"));
        const top = card.querySelector(".mission-top");
        top?.insertAdjacentElement("afterend", el("span", "v4-node-status", card.classList.contains("complete") ? "NODE CLEARED" : "NODE AVAILABLE"));
      }
    });
    bindTilts();
  }

  function enhanceMission() {
    const shell = app?.querySelector(".mission-shell");
    if (!shell || shell.classList.contains("v4-mission-shell")) return;
    shell.classList.add("v4-mission-shell");
    const cards = shell.querySelectorAll(".question-card");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      cards.forEach(c => c.classList.add("v4-reveal"));
    } else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("v4-reveal");
            io.unobserve(entry.target);
          }
        });
      }, {threshold:.12});
      cards.forEach(c => io.observe(c));
    }
    bindTilts();
  }

  function bindTilts() {
    if (reduceMotion || !window.matchMedia?.("(hover:hover) and (pointer:fine)").matches) return;
    document.querySelectorAll(".v4-mission-map .mission-card,.v4-hero .hud-card").forEach(card => {
      if (card.dataset.v4Tilt === "1") return;
      card.dataset.v4Tilt = "1";
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX-r.left)/r.width-.5;
        const y = (e.clientY-r.top)/r.height-.5;
        card.style.transform = `perspective(850px) rotateX(${-y*5}deg) rotateY(${x*6}deg) translateY(-4px)`;
      });
      card.addEventListener("pointerleave", () => card.style.transform = "");
    });
  }

  function feed() {
    const box = el("div", "v4-feed", `<b>OPS</b> // LINK INITIALIZED`);
    document.body.appendChild(box);
    const lines = [
      "<b>SCAN</b> // IDENTIFY TECHNOLOGIES",
      "<b>QUEST</b> // 06 OBJECTIVES ONLINE",
      "<b>FIELD</b> // OBSERVE · QUESTION · VERIFY",
      "<b>NSI</b> // CONNECT THEORY TO REAL SYSTEMS"
    ];
    let i = 0;
    setInterval(() => { box.innerHTML = lines[i++ % lines.length]; }, 4200);
  }

  function globalInteractions() {
    document.addEventListener("pointerdown", e => {
      const target = e.target.closest("button,.btn,a[href^='#']");
      if (!target) return;
      beep(target.matches(".btn-primary") ? 720 : 520, .045, .025);
      if (target.matches(".btn-primary")) flash();
    });
  }

  function enhance() {
    enhanceTopbar();
    enhanceLanding();
    enhanceHome();
    enhanceMission();
  }

  injectWorld();
  boot();
  enhanceTopbar();
  feed();
  globalInteractions();

  if (app) new MutationObserver(() => requestAnimationFrame(enhance)).observe(app, {childList:true,subtree:true});
  document.addEventListener("DOMContentLoaded", enhance, {once:true});
})();
