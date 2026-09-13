(() => {
  "use strict";

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia?.("(hover:hover) and (pointer:fine)").matches;
  const app = document.getElementById("app");
  const content = window.PGW_CONTENT;
  const config = window.PGW_CONFIG || {};

  document.documentElement.dataset.theme = "dark";
  localStorage.setItem("pgw-nsi-theme", "dark");

  function enhanceBrand() {
    const brand = document.querySelector(".brand");
    if (!brand || brand.querySelector(".v5-brand-logo")) return;
    const img = document.createElement("img");
    img.src = "assets/watteau-logo.svg";
    img.alt = "";
    img.className = "v5-brand-logo";
    brand.prepend(img);
  }

  function buildLanding() {
    const oldHero = app?.querySelector(".hero");
    if (!oldHero || app.querySelector(".v5-hero") || !content?.missions?.length) return;

    const nodes = content.missions.map(m => `
      <article class="v5-orbit-node" data-order="${m.order}" aria-label="Mission ${m.order} : ${m.title}">
        <span class="v5-node-number">${String(m.order).padStart(2,"0")}</span>
        <span class="v5-node-copy"><b>${m.title}</b><small>${m.kicker}</small></span>
        <span class="v5-node-xp">+${m.xp} XP</span>
      </article>`).join("");

    const strip = content.missions.map(m => `<span><b>${String(m.order).padStart(2,"0")}</b> ${m.title}</span>`).join("");

    const hero = document.createElement("section");
    hero.className = "v5-hero";
    hero.setAttribute("aria-labelledby", "v5-title");
    hero.innerHTML = `
      <div class="v5-hero-glow" aria-hidden="true"></div>
      <div class="v5-hero-grid">
        <div class="v5-hero-copyblock">
          <div class="v5-school-lockup">
            <img src="assets/watteau-logo.svg" alt="Logo du Lycée Watteau">
            <div><b>LYCÉE WATTEAU</b><small>VALENCIENNES · TERMINALE NSI</small></div>
          </div>
          <p class="v5-kicker">PARIS GAMES WEEK 2026 · QUÊTE NSI GRANDEUR NATURE</p>
          <h1 id="v5-title"><span>PGW</span><strong>NSI QUEST</strong></h1>
          <p class="v5-lead">${content.intro}</p>
          <div class="v5-meta">
            <span>${content.visitLabel}</span>
            <span>${config.venue || "Paris Expo – Porte de Versailles"}</span>
            <span>${content.totalXp} XP À GAGNER</span>
          </div>
          <a class="v5-start" href="#join-title"><span>LANCER L’AVENTURE</span><i aria-hidden="true">→</i></a>
        </div>
        <div class="v5-level-select" aria-label="Les ${content.missions.length} missions de la quête">
          <div class="v5-core" aria-hidden="true"><div class="v5-core-ring"></div><span>${String(content.missions.length).padStart(2,"0")}</span><small>MISSIONS</small></div>
          <div class="v5-orbit" aria-hidden="true"></div>
          <div class="v5-nodes">${nodes}</div>
        </div>
      </div>
      <div class="v5-mission-strip" aria-label="Liste des missions">${strip}</div>`;

    oldHero.replaceWith(hero);

    const join = app.querySelector(".join-card");
    if (join && !join.classList.contains("v5-join")) {
      join.classList.add("v5-join");
      const head = join.querySelector(".section-head");
      if (head) {
        head.className = "v5-join-intro";
        head.insertAdjacentHTML("afterbegin", '<span class="v5-ready-dot" aria-hidden="true"></span>');
        const copy = head.querySelector("div");
        if (copy) copy.insertAdjacentHTML("afterbegin", '<small>SESSION PGW26 · PRÊTE</small>');
      }
      const submit = join.querySelector('button[type="submit"]');
      if (submit) submit.classList.add("v5-join-button");
    }

    bindHeroPointer();
  }

  function createFloaters() {
    if (reduceMotion || document.querySelector(".v5-floaters")) return;
    const layer = document.createElement("div");
    layer.className = "v5-floaters";
    layer.setAttribute("aria-hidden", "true");
    const colors = [["#48e7ff","#5576ff"],["#9d68ff","#ff58c7"],["#6df6ad","#48e7ff"],["#ffd65a","#ff9758"]];
    for (let i=0;i<14;i++) {
      const item = document.createElement("span");
      item.className = "v5-floater";
      const [c1,c2] = colors[i % colors.length];
      item.style.left = `${Math.random()*96}%`;
      item.style.top = `${Math.random()*96}%`;
      item.style.setProperty("--s", `${18+Math.random()*46}px`);
      item.style.setProperty("--r", i%3===0 ? "50%" : i%3===1 ? "10px" : "3px");
      item.style.setProperty("--c1", c1);
      item.style.setProperty("--c2", c2);
      item.style.setProperty("--d", `${7+Math.random()*9}s`);
      item.style.setProperty("--x", `${-35+Math.random()*70}px`);
      item.style.setProperty("--y", `${-45+Math.random()*90}px`);
      layer.appendChild(item);
    }
    document.body.prepend(layer);
  }

  function bindHeroPointer() {
    const hero = document.querySelector(".v5-hero");
    if (!hero || hero.dataset.v5Pointer === "1" || !finePointer || reduceMotion) return;
    hero.dataset.v5Pointer = "1";
    hero.addEventListener("pointermove", e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", `${((e.clientX-r.left)/r.width)*100}%`);
      hero.style.setProperty("--my", `${((e.clientY-r.top)/r.height)*100}%`);
    }, {passive:true});
  }

  function decorateMissionCards() {
    document.querySelectorAll(".mission-grid .mission-card").forEach((card,index) => {
      card.dataset.level = String(index+1).padStart(2,"0");
      if (!finePointer || reduceMotion || card.dataset.v5Tilt === "1") return;
      card.dataset.v5Tilt = "1";
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        const x=((e.clientX-r.left)/r.width)-.5;
        const y=((e.clientY-r.top)/r.height)-.5;
        card.style.transform=`perspective(900px) rotateX(${-y*2.2}deg) rotateY(${x*2.8}deg) translateY(-7px)`;
      },{passive:true});
      card.addEventListener("pointerleave",()=>{card.style.transform="";});
    });
  }

  function spark(x,y) {
    if (reduceMotion) return;
    for (let i=0;i<7;i++) {
      const s=document.createElement("span");
      s.className="v5-spark";
      s.style.left=`${x}px`;s.style.top=`${y}px`;
      const a=(Math.PI*2*i)/7,d=18+Math.random()*22;
      s.style.setProperty("--sx",`${Math.cos(a)*d}px`);
      s.style.setProperty("--sy",`${Math.sin(a)*d}px`);
      document.body.appendChild(s);setTimeout(()=>s.remove(),800);
    }
  }

  document.addEventListener("click",e=>{
    const target=e.target.closest(".v5-start,.v5-join-button,.mission-card .btn");
    if(!target)return;
    const r=target.getBoundingClientRect();spark(r.left+r.width/2,r.top+r.height/2);
  });

  function enhance(){enhanceBrand();buildLanding();bindHeroPointer();decorateMissionCards();}

  enhanceBrand();createFloaters();enhance();
  if(app)new MutationObserver(()=>requestAnimationFrame(enhance)).observe(app,{childList:true,subtree:true});
})();
