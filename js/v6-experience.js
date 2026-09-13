(() => {
  "use strict";

  const app = document.getElementById("app");
  const content = window.PGW_CONTENT;
  const config = window.PGW_CONFIG || {};
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const symbols = ["◫","⌁","</>","◎","◇","★"];
  const accents = ["#53efff","#60f1a7","#ff9447","#9b63ff","#ff4d9d","#ffd94d"];

  document.documentElement.dataset.theme = "dark";
  localStorage.setItem("pgw-nsi-theme", "dark");

  const esc = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));

  function enhanceBrand() {
    const brand = document.querySelector(".brand");
    if (!brand || brand.querySelector(".v6-brand-logo")) return;
    brand.querySelector(".brand-mark")?.remove();
    const logo = document.createElement("img");
    logo.src = "assets/watteau-logo.svg";
    logo.alt = "";
    logo.className = "v6-brand-logo";
    brand.prepend(logo);
  }

  function makeFloaters() {
    if (reduceMotion || document.querySelector(".v6-floating")) return;
    const palette = [
      ["#53efff","#5578ff"],
      ["#9b63ff","#ff4fca"],
      ["#60f1a7","#53efff"],
      ["#ffd94d","#ff9447"]
    ];
    for (let i=0;i<9;i++) {
      const f = document.createElement("span");
      f.className = "v6-floating";
      const [a,b] = palette[i%palette.length];
      const size = 20 + Math.random()*46;
      f.style.width = `${size}px`;
      f.style.height = `${size}px`;
      f.style.left = `${4 + Math.random()*92}%`;
      f.style.top = `${10 + Math.random()*82}%`;
      f.style.setProperty("--c1",a);
      f.style.setProperty("--c2",b);
      f.style.setProperty("--dur",`${8 + Math.random()*8}s`);
      f.style.setProperty("--dx",`${-40 + Math.random()*80}px`);
      f.style.setProperty("--dy",`${-35 + Math.random()*70}px`);
      document.body.appendChild(f);
    }
  }

  function missionCards() {
    return content.missions.map((m,i) => `
      <article class="v6-card" style="--accent:${accents[i]}">
        <div class="v6-card-art">
          <span class="v6-level">${String(m.order).padStart(2,"0")}</span>
          <span class="symbol">${symbols[i]}</span>
        </div>
        <div class="v6-card-body">
          <h3>${esc(m.title)}</h3>
          <p>${esc(m.kicker)}</p>
          <span class="v6-xp">${m.xp} XP</span>
        </div>
      </article>`).join("");
  }

  function buildStage(joinCard) {
    const totalXp = content.totalXp;
    const stage = document.createElement("section");
    stage.className = "v6-stage";
    stage.innerHTML = `
      <div class="v6-hero">
        <div class="v6-agent-wrap" aria-hidden="true">
          <img class="v6-agent" src="assets/v6-gamer-agent.svg" alt="">
        </div>

        <div class="v6-center">
          <div class="v6-school">
            <img src="assets/watteau-logo.svg" alt="Logo du Lycée Watteau">
            <span><b>LYCÉE WATTEAU</b><small>VALENCIENNES // TERMINALE NSI</small></span>
          </div>
          <p class="v6-kicker">Opération PGW // NSI Field Quest</p>
          <h1 class="v6-title"><span>OPÉRATION</span><strong>PGW 2026</strong></h1>
          <div class="v6-subbrand">NSI · QUEST</div>
          <p class="v6-tagline">Explore · Apprends · Résous · Progresse</p>
          <p class="v6-lead">${esc(content.intro)}</p>
          <a class="v6-start" href="#v6-join"><span>Entrer dans la mission</span><i>›</i></a>
          <div class="v6-eventline">
            <span class="v6-pill cyan">◈ ${esc(content.visitLabel)}</span>
            <span class="v6-pill">⌖ ${esc(config.venue || "Paris Expo – Porte de Versailles")}</span>
            <span class="v6-pill">XP ${totalXp}</span>
          </div>
          <div class="v6-hashtags">Field link // Paris Expo // 6 missions // secure sync</div>
        </div>

        <aside class="v6-progress" aria-label="Progression initiale">
          <h3>Ta progression</h3>
          <div class="v6-ring" style="--p:0"><b>0%</b></div>
          <div class="v6-stats">
            <span><i>⌾</i>0 / ${content.missions.length} missions</span>
            <span><i>☆</i>0 XP</span>
            <span><i>◉</i>0 badge</span>
            <span><i>♟</i>Enquêteur·se en herbe</span>
          </div>
          <p class="v6-quote">« L’informatique n’est pas seulement une technologie, c’est une façon de comprendre le monde. »</p>
        </aside>
      </div>

      <div class="v6-missions" aria-label="Les six missions">
        ${missionCards()}
      </div>

      <div class="v6-info-row">
        <article class="v6-info"><h4>Événement</h4><p>📅 Vendredi 23 octobre 2026<br>📍 Paris Expo – Porte de Versailles</p></article>
        <article class="v6-info"><h4>Ta mission</h4><p>🎮 Observer, questionner, comparer et relier ce que tu vois aux notions de Terminale NSI.</p></article>
        <article class="v6-info"><h4>Tes récompenses</h4><div class="v6-reward-grid"><span class="v6-reward" style="--c:#ffd94d"><b>★</b>XP</span><span class="v6-reward" style="--c:#ff4fca"><b>◉</b>Badges</span><span class="v6-reward" style="--c:#9b63ff"><b>▣</b>Progression</span><span class="v6-reward" style="--c:#53efff"><b>▤</b>Bilan</span></div></article>
        <article class="v6-info"><h4>Cap</h4><p>« Les jeux vidéo d’aujourd’hui mobilisent les métiers numériques de demain. »</p></article>
      </div>

      <div class="v6-join-wrap" id="v6-join">
        <div class="v6-join-title">Connexion à la mission</div>
      </div>`;
    stage.querySelector(".v6-join-wrap").appendChild(joinCard);
    return stage;
  }

  function enhanceLanding() {
    if (!app || app.querySelector(".v6-stage")) return;
    const hero = app.querySelector(".hero");
    const join = app.querySelector(".join-card");
    if (!hero || !join) return;
    const stage = buildStage(join);
    hero.replaceWith(stage);
    stage.scrollIntoView({block:"start"});
  }

  function enhanceDashboard() {
    if (!app) return;
    const dash = app.querySelector(".dashboard-head");
    if (!dash) return;
    app.classList.add("v6-dashboard");
  }

  function enhance() {
    enhanceBrand();
    enhanceLanding();
    enhanceDashboard();
  }

  enhanceBrand();
  makeFloaters();
  enhance();

  if (app) {
    new MutationObserver(() => requestAnimationFrame(enhance)).observe(app,{childList:true,subtree:true});
  }
})();
