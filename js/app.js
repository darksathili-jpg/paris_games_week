(() => {
  "use strict";

  const config = window.PGW_CONFIG || {};
  const content = window.PGW_CONTENT;
  const storage = window.PGWStorage;
  const app = document.getElementById("app");
  const toastRegion = document.getElementById("toast-region");
  const networkChip = document.getElementById("network-chip");
  const supa = window.PGWSupabase;
  const debounceTimers = new Map();

  const state = {
    profile: null,
    userId: null,
    session: null,
    answers: {},
    mode: "local",
    client: null,
    syncing: false,
    scope: null
  };

  const PROFILE_KEY = "pgw-nsi-profile-v1";
  const THEME_KEY = "pgw-nsi-theme";

  const esc = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  const attr = value => esc(value).replace(/`/g, "&#96;");

  function toast(message, kind = "") {
    const el = document.createElement("div");
    el.className = `toast ${kind}`;
    el.textContent = message;
    toastRegion.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const preferred = window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
    setTheme(saved || preferred);
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    });
  }

  function initAmbientCanvas() {
    const canvas = document.getElementById("ambient-canvas");
    if (!canvas || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    let nodes = [];

    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const count = Math.min(54, Math.max(20, Math.floor((w*h)/36000)));
      nodes = Array.from({length: count}, () => ({
        x: Math.random()*w, y: Math.random()*h,
        vx: (Math.random()-.5)*.18, vy: (Math.random()-.5)*.18,
        r: Math.random()*1.5+.6
      }));
    }

    function draw() {
      ctx.clearRect(0,0,w,h);
      const light = document.documentElement.dataset.theme === "light";
      const point = light ? "rgba(47,73,130,.22)" : "rgba(115,226,255,.30)";
      const line = light ? "rgba(74,81,168,.06)" : "rgba(115,160,255,.07)";
      ctx.fillStyle = point;
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < -10) n.x = w+10; if (n.x > w+10) n.x = -10;
        if (n.y < -10) n.y = h+10; if (n.y > h+10) n.y = -10;
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fill();
      }
      ctx.strokeStyle = line; ctx.lineWidth = 1;
      for (let i=0;i<nodes.length;i++) {
        for (let j=i+1;j<nodes.length;j++) {
          const a=nodes[i], b=nodes[j], dx=a.x-b.x, dy=a.y-b.y, dist2=dx*dx+dy*dy;
          if (dist2 < 110*110) {
            ctx.globalAlpha = 1 - dist2/(110*110);
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    resize(); window.addEventListener("resize", resize, {passive:true}); requestAnimationFrame(draw);
  }

  function configuredRemote() { return Boolean(supa?.configured?.()); }

  function updateNetworkChip(status) {
    if (!networkChip) return;
    networkChip.className = "chip";
    if (!configuredRemote()) {
      networkChip.classList.add("chip-warn");
      networkChip.textContent = "● Mode local";
      return;
    }
    if (!navigator.onLine) {
      networkChip.classList.add("chip-warn");
      networkChip.textContent = "● Hors ligne · local";
      return;
    }
    if (status === "syncing") {
      networkChip.classList.add("chip-accent");
      networkChip.textContent = "● Synchronisation…";
    } else if (status === "pending") {
      networkChip.classList.add("chip-warn");
      networkChip.textContent = "● À synchroniser";
    } else {
      networkChip.classList.add("chip-good");
      networkChip.textContent = "● Synchronisé";
    }
  }

  function persistProfile() {
    if (!state.profile || !state.session || !state.userId) return;
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
      profile: state.profile,
      session: state.session,
      userId: state.userId,
      mode: state.mode
    }));
  }

  function restoreProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
      if (!saved?.profile || !saved?.session || !saved?.userId) return false;
      Object.assign(state, saved);
      state.scope = `${state.userId}:${state.session.id}`;
      return true;
    } catch { return false; }
  }

  async function loadAnswers() {
    if (!state.scope) return;
    state.answers = await storage.getAnswers(state.scope);
    if (state.mode === "remote" && state.client && navigator.onLine) {
      try {
        const { data, error } = await state.client
          .from("responses")
          .select("mission_key,question_key,answer,updated_at")
          .eq("user_id", state.userId)
          .eq("visit_session_id", state.session.id);
        if (error) throw error;
        for (const row of data || []) {
          if (!(row.question_key in state.answers)) {
            const value = row.answer?.value ?? row.answer;
            state.answers[row.question_key] = value;
            await storage.saveAnswer(state.scope, row.mission_key, row.question_key, value);
          }
        }
      } catch (error) {
        console.warn("Lecture distante impossible", error);
        updateNetworkChip("pending");
      }
    }
  }

  function questionAnswered(q, value) {
    if (!q.required) return true;
    if (q.type === "checkboxes") return Array.isArray(value) && value.length > 0;
    if (value === null || value === undefined) return false;
    const s = String(value).trim();
    if (!s) return false;
    if (q.minLength && s.length < q.minLength) return false;
    return true;
  }

  function missionStats(mission) {
    const required = mission.questions.filter(q => q.required);
    const done = required.filter(q => questionAnswered(q, state.answers[q.key])).length;
    return { done, total: required.length, complete: required.length > 0 && done === required.length };
  }

  function overallStats() {
    const completed = content.missions.filter(m => missionStats(m).complete);
    const xp = completed.reduce((sum,m) => sum + m.xp, 0);
    return {
      completeCount: completed.length,
      missionCount: content.missions.length,
      xp,
      percent: Math.round((xp / content.totalXp) * 100)
    };
  }

  async function joinRemote(pseudo, classe, code) {
    state.client = supa.getStudentClient();
    if (!state.client) throw new Error("Supabase n’est pas configuré.");
    let { data: authData } = await state.client.auth.getSession();
    let session = authData?.session;
    if (!session) {
      const res = await state.client.auth.signInAnonymously();
      if (res.error) throw res.error;
      session = res.data.session;
    }
    const { data, error } = await state.client.rpc("join_visit_session", {
      p_code: code.trim(), p_pseudo: pseudo.trim(), p_classe: classe.trim()
    });
    if (error) throw error;
    state.mode = "remote";
    state.userId = session.user.id;
    state.profile = { pseudo: pseudo.trim(), classe: classe.trim() };
    state.session = {
      id: data.id,
      title: data.title,
      year: data.year,
      event_date: data.event_date,
      access_code: code.trim().toUpperCase()
    };
    state.scope = `${state.userId}:${state.session.id}`;
  }

  function joinLocal(pseudo, classe, code) {
    const expected = String(config.defaultSessionCode || "PGW26").toUpperCase();
    if (expected && code.trim().toUpperCase() !== expected) throw new Error("Code de mission incorrect.");
    const localId = localStorage.getItem("pgw-nsi-local-id") || crypto.randomUUID();
    localStorage.setItem("pgw-nsi-local-id", localId);
    state.mode = "local";
    state.userId = localId;
    state.profile = { pseudo: pseudo.trim(), classe: classe.trim() };
    state.session = {
      id: `local-${config.edition || 2026}`,
      title: `PGW NSI ${config.edition || 2026}`,
      year: config.edition || 2026,
      event_date: config.visitDate || "2026-10-23",
      access_code: code.trim().toUpperCase()
    };
    state.scope = `${state.userId}:${state.session.id}`;
  }

  async function handleJoin(form) {
    const fd = new FormData(form);
    const pseudo = String(fd.get("pseudo") || "").trim();
    const classe = String(fd.get("classe") || "").trim();
    const code = String(fd.get("code") || "").trim();
    if (pseudo.length < 2 || classe.length < 2 || code.length < 3) {
      toast("Complète le pseudo, la classe et le code de mission.", "bad"); return;
    }
    const button = form.querySelector("button[type=submit]");
    button.disabled = true; button.textContent = "Connexion…";
    try {
      if (configuredRemote() && navigator.onLine) {
        await joinRemote(pseudo, classe, code);
      } else if (config.allowLocalFallback !== false) {
        joinLocal(pseudo, classe, code);
        if (configuredRemote() && !navigator.onLine) toast("Connexion absente : démarrage en mode local.");
      } else {
        throw new Error("Connexion nécessaire pour rejoindre la mission.");
      }
      persistProfile();
      await loadAnswers();
      toast(`Bienvenue ${pseudo} — mission chargée.`, "good");
      location.hash = "#home";
      renderRoute();
      syncQueue();
    } catch (error) {
      console.error(error);
      toast(error.message || "Impossible de rejoindre la mission.", "bad");
    } finally {
      button.disabled = false; button.textContent = "Entrer dans la mission →";
    }
  }

  function renderLanding() {
    app.innerHTML = `
      <section class="hero">
        <div class="hero-grid">
          <div>
            <p class="eyebrow">Terminale NSI · Mission terrain</p>
            <h1>PGW <span class="accent">NSI QUEST</span></h1>
            <p class="hero-copy">${esc(content.intro)}</p>
            <div class="hero-meta">
              <span class="chip chip-accent">◈ ${esc(content.visitLabel)}</span>
              <span class="chip">⌖ ${esc(config.venue || "Paris Expo – Porte de Versailles")}</span>
              <span class="chip">XP ${content.totalXp}</span>
            </div>
          </div>
          <aside class="hud-card" aria-label="Objectifs de la mission">
            <div class="hud-label"><span>Mission system</span><span>READY</span></div>
            <div class="hud-value">6 QUESTS</div>
            <div class="hud-list">
              <div class="hud-line">Comparer des formations</div>
              <div class="hud-line">Traquer la NSI dans les jeux</div>
              <div class="hud-line">Questionner l’IA et la fiabilité</div>
              <div class="hud-line">Rencontrer un professionnel</div>
              <div class="hud-line">Construire un bilan argumenté</div>
            </div>
          </aside>
        </div>
      </section>

      <section class="join-card" aria-labelledby="join-title">
        <div class="section-head">
          <div><h2 id="join-title">Rejoindre la mission</h2><p>Aucune adresse e-mail élève n’est nécessaire.</p></div>
          <span class="chip ${configuredRemote() ? "chip-good" : "chip-warn"}">${configuredRemote() ? "Supabase prêt" : "Mode démo local"}</span>
        </div>
        <form id="join-form" class="join-grid">
          <div class="field"><label for="pseudo">Prénom ou pseudonyme</label><input class="input" id="pseudo" name="pseudo" autocomplete="nickname" maxlength="40" required placeholder="Ex. Alex"></div>
          <div class="field"><label for="classe">Classe</label><input class="input" id="classe" name="classe" maxlength="30" required placeholder="Ex. TNSI"></div>
          <div class="field"><label for="code">Code mission</label><input class="input" id="code" name="code" maxlength="20" required value="${attr(config.defaultSessionCode || "PGW26")}" autocapitalize="characters"></div>
          <button class="btn btn-primary" type="submit">Entrer dans la mission →</button>
        </form>
        <div class="notice ${configuredRemote() ? "notice-good" : "notice-warn"}" style="margin-top:14px">
          ${configuredRemote()
            ? "<strong>Sauvegarde hybride :</strong> chaque réponse est d’abord conservée sur l’appareil, puis synchronisée vers Supabase quand le réseau est disponible."
            : "<strong>Version prête à tester :</strong> Supabase n’est pas encore renseigné dans <code>config.js</code>. Les réponses restent sur cet appareil pour permettre de tester toute l’application."}
        </div>
      </section>`;
    document.getElementById("join-form")?.addEventListener("submit", e => { e.preventDefault(); handleJoin(e.currentTarget); });
  }

  function renderHome() {
    const stats = overallStats();
    const next = content.missions.find(m => !missionStats(m).complete);
    const missionCards = content.missions.map(m => {
      const s = missionStats(m);
      const segments = Array.from({length: Math.max(1, s.total)}, (_,i) => `<span class="${i < s.done ? "on" : ""}"></span>`).join("");
      return `<article class="mission-card ${s.complete ? "complete" : ""}">
        <div class="mission-top"><span class="mission-index">MISSION ${String(m.order).padStart(2,"0")}</span><span class="chip ${s.complete ? "chip-good" : "chip-muted"}">${s.complete ? `✓ +${m.xp} XP` : `${s.done}/${s.total}`}</span></div>
        <div><h3>${esc(m.title)}</h3><div class="mission-kicker">${esc(m.kicker)}</div></div>
        <div class="mini-progress">${segments}</div>
        <p>${esc(m.description)}</p>
        <a class="btn ${s.complete ? "btn-ghost" : "btn-primary"} btn-small" href="#mission/${m.key}">${s.complete ? "Revoir" : "Démarrer"} →</a>
      </article>`;
    }).join("");

    const badges = content.badges.map(b => `<div class="badge ${stats.xp >= b.minXp ? "unlocked" : ""}"><span class="badge-icon">${esc(b.icon)}</span><b>${esc(b.label)}</b><small>${stats.xp >= b.minXp ? "DÉBLOQUÉ" : `${b.minXp} XP`}</small></div>`).join("");

    app.innerHTML = `
      <section class="dashboard-head">
        <div>
          <div class="page-kicker">PLAYER · ${esc(state.profile.pseudo)} · ${esc(state.profile.classe)}</div>
          <h1 class="page-title">Mission control.</h1>
          <p class="page-subtitle">Avance à ton rythme. Une réponse précise avec une preuve observable vaut mieux qu’une longue réponse vague.</p>
        </div>
        <div class="progress-card">
          <div class="progress-row"><span>Progression globale</span><b>${stats.percent}%</b></div>
          <div class="progress-track"><div class="progress-fill" style="width:${stats.percent}%"></div></div>
          <div class="progress-row" style="margin-top:10px"><small>${stats.completeCount}/${stats.missionCount} missions</small><small>${stats.xp}/${content.totalXp} XP</small></div>
        </div>
      </section>

      ${next ? `<section class="section"><div class="notice notice-good"><strong>Prochaine quête recommandée :</strong> ${esc(next.title)} — ${esc(next.kicker)}. <a href="#mission/${next.key}">Continuer →</a></div></section>` : `<section class="section"><div class="notice notice-good"><strong>Quest complete.</strong> Toutes les missions sont validées. Ton bilan peut maintenant être relu avant l’export enseignant.</div></section>`}

      <section class="section">
        <div class="section-head"><div><h2>Carte des missions</h2><p>6 étapes, 1 350 XP, aucune course au classement.</p></div><a class="btn btn-ghost btn-small" href="#summary">Voir mon bilan</a></div>
        <div class="mission-grid">${missionCards}</div>
      </section>

      <section class="section">
        <div class="section-head"><div><h2>Badges de progression</h2><p>Ils valorisent ton parcours personnel, sans classement entre élèves.</p></div></div>
        <div class="badge-strip">${badges}</div>
      </section>

      <section class="section">
        <div class="notice"><strong>Conseil terrain :</strong> note le nom du stand, la technologie citée ou la personne interrogée. Le but est de pouvoir revenir sur tes observations après la visite.</div>
      </section>
      <section class="section" style="display:flex;justify-content:flex-end"><button id="logout-student" class="btn btn-danger btn-small" type="button">Quitter cette session sur cet appareil</button></section>`;

    document.getElementById("logout-student")?.addEventListener("click", logoutStudent);
  }

  function renderQuestion(q, idx) {
    const value = state.answers[q.key];
    const req = q.required ? `<span class="required" aria-label="obligatoire">*</span>` : "";
    const hint = q.hint ? `<div class="hint">${esc(q.hint)}</div>` : "";
    let control = "";
    if (q.type === "textarea") {
      control = `<textarea class="textarea answer-control" data-key="${attr(q.key)}" data-type="textarea" ${q.maxLength ? `maxlength="${q.maxLength}"` : ""} placeholder="${attr(q.placeholder || "")}">${esc(value ?? "")}</textarea>${q.maxLength ? `<div class="char-count" data-count-for="${attr(q.key)}">${String(value ?? "").length}/${q.maxLength}</div>` : ""}`;
    } else if (q.type === "text") {
      control = `<input class="input answer-control" data-key="${attr(q.key)}" data-type="text" value="${attr(value ?? "")}" placeholder="${attr(q.placeholder || "")}" maxlength="500">`;
    } else if (q.type === "radio") {
      control = `<div class="choice-grid">${q.options.map(opt => `<label class="choice"><input class="answer-control" type="radio" name="${attr(q.key)}" data-key="${attr(q.key)}" data-type="radio" value="${attr(opt)}" ${value === opt ? "checked" : ""}><span>${esc(opt)}</span></label>`).join("")}</div>`;
    } else if (q.type === "checkboxes") {
      const arr = Array.isArray(value) ? value : [];
      control = `<div class="choice-grid">${q.options.map(opt => `<label class="choice"><input class="answer-control" type="checkbox" data-key="${attr(q.key)}" data-type="checkboxes" value="${attr(opt)}" ${arr.includes(opt) ? "checked" : ""}><span>${esc(opt)}</span></label>`).join("")}</div>`;
    }
    return `<section class="question-card" data-question="${attr(q.key)}">
      <span class="question-number">Q${String(idx+1).padStart(2,"0")}</span>
      <p class="question-title">${esc(q.label)} ${req}</p>
      ${hint}${control}
    </section>`;
  }

  function bindQuestionEvents(mission) {
    app.querySelectorAll(".answer-control").forEach(el => {
      const eventName = el.matches("input[type=radio],input[type=checkbox]") ? "change" : "input";
      el.addEventListener(eventName, () => {
        const key = el.dataset.key;
        let value;
        if (el.dataset.type === "checkboxes") {
          value = Array.from(app.querySelectorAll(`input[data-key="${CSS.escape(key)}"]:checked`)).map(x => x.value);
        } else if (el.dataset.type === "radio") {
          value = app.querySelector(`input[data-key="${CSS.escape(key)}"]:checked`)?.value || "";
        } else value = el.value;
        const counter = app.querySelector(`[data-count-for="${CSS.escape(key)}"]`);
        const q = mission.questions.find(x => x.key === key);
        if (counter && q?.maxLength) counter.textContent = `${String(value).length}/${q.maxLength}`;
        scheduleSave(mission.key, key, value);
      });
    });

    document.getElementById("validate-mission")?.addEventListener("click", async () => {
      await flushDebounces();
      const s = missionStats(mission);
      app.querySelectorAll(".question-card.invalid").forEach(el => el.classList.remove("invalid"));
      if (!s.complete) {
        const missing = mission.questions.find(q => q.required && !questionAnswered(q, state.answers[q.key]));
        const card = app.querySelector(`[data-question="${CSS.escape(missing.key)}"]`);
        card?.classList.add("invalid");
        card?.scrollIntoView({behavior:"smooth", block:"center"});
        toast("Il reste une réponse obligatoire à préciser.", "bad");
        return;
      }
      await syncMissionProgress(mission);
      toast(`Mission validée : +${mission.xp} XP`, "good");
      location.hash = "#home";
    });
  }

  function renderMission(key) {
    const mission = content.missions.find(m => m.key === key);
    if (!mission) { location.hash = "#home"; return; }
    const stats = missionStats(mission);
    app.innerHTML = `<div class="mission-shell">
      <a class="btn btn-ghost btn-small" href="#home" style="margin-bottom:18px">← Mission control</a>
      <header class="mission-header">
        <div class="mission-number">${String(mission.order).padStart(2,"0")}</div>
        <div><div class="page-kicker">${esc(mission.kicker)} · ${mission.xp} XP</div><h1>${esc(mission.title)}</h1><p>${esc(mission.description)}</p></div>
      </header>
      <div class="notice" style="margin-bottom:14px"><strong>Règle :</strong> les réponses sont enregistrées localement au fil de la saisie. Si Supabase est connecté, elles sont synchronisées dès qu’un réseau est disponible.</div>
      <div class="question-list">${mission.questions.map(renderQuestion).join("")}</div>
      <div class="mission-actions">
        <span id="save-state" class="save-state ${state.mode === "remote" ? "synced" : ""}">${state.mode === "remote" ? "Sauvegardé" : "Sauvegardé sur l’appareil"}</span>
        <div style="display:flex;gap:8px;flex:1;justify-content:flex-end"><a class="btn btn-ghost btn-small" href="#home">Plus tard</a><button id="validate-mission" class="btn btn-primary btn-small" type="button">${stats.complete ? "Valider ✓" : `Valider ${stats.done}/${stats.total}`}</button></div>
      </div>
    </div>`;
    bindQuestionEvents(mission);
  }

  async function scheduleSave(missionKey, questionKey, value) {
    state.answers[questionKey] = value;
    const saveState = document.getElementById("save-state");
    if (saveState) { saveState.classList.remove("synced"); saveState.textContent = "Sauvegarde locale…"; }
    const mission = content.missions.find(m => m.key === missionKey);
    const button = document.getElementById("validate-mission");
    if (button && mission) {
      const s = missionStats(mission); button.textContent = s.complete ? "Valider ✓" : `Valider ${s.done}/${s.total}`;
    }
    clearTimeout(debounceTimers.get(questionKey));
    debounceTimers.set(questionKey, setTimeout(() => saveAnswer(missionKey, questionKey, value), 320));
  }

  async function flushDebounces() {
    const entries = Array.from(debounceTimers.entries());
    debounceTimers.clear();
    for (const [key, timer] of entries) {
      clearTimeout(timer);
      const mission = content.missions.find(m => m.questions.some(q => q.key === key));
      if (mission) await saveAnswer(mission.key, key, state.answers[key]);
    }
  }

  async function saveAnswer(missionKey, questionKey, value) {
    if (!state.scope) return;
    const row = await storage.saveAnswer(state.scope, missionKey, questionKey, value);
    const payload = {
      user_id: state.userId,
      visit_session_id: state.session.id,
      mission_key: missionKey,
      question_key: questionKey,
      answer: { value },
      updated_at: row.updatedAt
    };
    if (state.mode === "remote") {
      await storage.queue(state.scope, payload);
      updateNetworkChip("pending");
      if (navigator.onLine) syncQueue();
    }
    const saveState = document.getElementById("save-state");
    if (saveState) {
      saveState.textContent = state.mode === "remote" ? "Enregistré · synchronisation…" : "Enregistré sur l’appareil";
      if (state.mode !== "remote") saveState.classList.add("synced");
    }
  }

  async function syncQueue() {
    if (state.mode !== "remote" || !state.client || !state.scope || !navigator.onLine || state.syncing) return;
    state.syncing = true; updateNetworkChip("syncing");
    try {
      const queue = await storage.getQueue(state.scope);
      for (const item of queue) {
        const { error } = await state.client.from("responses").upsert(item.payload, { onConflict: "user_id,visit_session_id,question_key" });
        if (error) throw error;
        await storage.removeQueued(item.id);
      }
      updateNetworkChip("synced");
      const saveState = document.getElementById("save-state");
      if (saveState) { saveState.classList.add("synced"); saveState.textContent = "Synchronisé avec Supabase"; }
    } catch (error) {
      console.warn("Synchronisation différée", error);
      updateNetworkChip("pending");
    } finally { state.syncing = false; }
  }

  async function syncMissionProgress(mission) {
    if (state.mode !== "remote" || !state.client || !navigator.onLine) return;
    const complete = missionStats(mission).complete;
    try {
      await state.client.from("progress").upsert({
        user_id: state.userId,
        visit_session_id: state.session.id,
        mission_key: mission.key,
        completed: complete,
        xp: complete ? mission.xp : 0,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,visit_session_id,mission_key" });
    } catch (error) { console.warn("Progression distante non mise à jour", error); }
  }

  function renderSummary() {
    const stats = overallStats();
    const missionRows = content.missions.map(m => {
      const s = missionStats(m);
      return `<div class="stat"><small>${esc(m.title)}</small><b>${s.complete ? "✓" : `${s.done}/${s.total}`}</b></div>`;
    }).join("");
    const boss = content.missions.find(m => m.key === "boss");
    const summary = state.answers.summary || "Ton texte de synthèse apparaîtra ici après la mission Boss Final.";
    app.innerHTML = `<div class="mission-shell">
      <a class="btn btn-ghost btn-small" href="#home">← Mission control</a>
      <section class="section">
        <div class="page-kicker">PLAYER REPORT · ${esc(state.profile.pseudo)}</div>
        <h1 class="page-title">Mon bilan.</h1>
        <p class="page-subtitle">Un aperçu local de ta progression. L’enseignant dispose de son propre cockpit pour les réponses synchronisées.</p>
      </section>
      <section class="section summary-card">
        <div class="summary-grid">
          <div class="stat"><small>Progression</small><b>${stats.percent}%</b></div>
          <div class="stat"><small>XP</small><b>${stats.xp}</b></div>
          <div class="stat"><small>Missions</small><b>${stats.completeCount}/${stats.missionCount}</b></div>
          <div class="stat"><small>Boss final</small><b>${missionStats(boss).complete ? "OK" : "…"}</b></div>
        </div>
      </section>
      <section class="section"><div class="section-head"><div><h2>État des missions</h2></div></div><div class="summary-grid">${missionRows}</div></section>
      <section class="section panel"><h2>Synthèse express</h2><p style="white-space:pre-wrap;color:var(--muted);line-height:1.65">${esc(summary)}</p></section>
      <section class="section"><a class="btn btn-primary" href="#mission/boss">${missionStats(boss).complete ? "Relire le Boss Final" : "Terminer le Boss Final"} →</a></section>
    </div>`;
  }

  async function logoutStudent() {
    if (!confirm("Quitter la session sur cet appareil ? Les réponses locales restent stockées mais le profil actif sera déconnecté.")) return;
    try { if (state.mode === "remote" && state.client) await state.client.auth.signOut(); } catch {}
    localStorage.removeItem(PROFILE_KEY);
    state.profile = state.userId = state.session = state.scope = null; state.answers = {}; state.mode = "local";
    location.hash = ""; renderLanding(); updateNetworkChip();
  }

  function renderRoute() {
    if (!state.profile) { renderLanding(); return; }
    const hash = location.hash || "#home";
    if (hash.startsWith("#mission/")) renderMission(hash.split("/")[1]);
    else if (hash === "#summary") renderSummary();
    else renderHome();
    requestAnimationFrame(() => app.focus({preventScroll:true}));
  }

  async function init() {
    initTheme(); initAmbientCanvas(); updateNetworkChip();
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
    if (configuredRemote()) state.client = supa.getStudentClient();
    restoreProfile();
    if (state.profile) {
      if (state.mode === "remote" && state.client) {
        const { data } = await state.client.auth.getSession();
        if (!data?.session) {
          localStorage.removeItem(PROFILE_KEY);
          state.profile = null;
        } else state.userId = data.session.user.id;
      }
      if (state.profile) { state.scope = `${state.userId}:${state.session.id}`; await loadAnswers(); }
    }
    window.addEventListener("hashchange", renderRoute);
    window.addEventListener("online", () => { updateNetworkChip("pending"); syncQueue(); });
    window.addEventListener("offline", () => updateNetworkChip());
    renderRoute();
    syncQueue();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
