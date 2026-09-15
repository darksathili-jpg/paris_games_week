(() => {
  "use strict";
  const app = document.getElementById("teacher-app");
  const toastRegion = document.getElementById("toast-region");
  const config = window.PGW_CONFIG || {};
  const content = window.PGW_CONTENT;
  const supa = window.PGWSupabase;
  let client = null;
  let teacher = null;
  let sessions = [];
  let selectedSession = null;
  let participants = [];
  let responses = [];
  let progress = [];
  let refreshTimer = null;

  const THEME_KEY = "pgw-nsi-theme";
  const esc = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  const attr = value => esc(value).replace(/`/g, "&#96;");
  const allQuestions = content.missions.flatMap(m => m.questions.map(q => ({...q, missionKey:m.key, missionTitle:m.title})));
  const qByKey = Object.fromEntries(allQuestions.map(q => [q.key,q]));

  function toast(message, kind="") {
    const el=document.createElement("div"); el.className=`toast ${kind}`; el.textContent=message; toastRegion.appendChild(el); setTimeout(()=>el.remove(),3600);
  }
  function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem(THEME_KEY,theme);}
  function initTheme(){setTheme(localStorage.getItem(THEME_KEY)|| (matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"));document.getElementById("theme-toggle")?.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));}
  function initAmbient(){
    const canvas=document.getElementById("ambient-canvas"); if(!canvas||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const ctx=canvas.getContext("2d"); let w,h,dpr=Math.min(2,devicePixelRatio||1),nodes=[];
    function resize(){w=innerWidth;h=innerHeight;canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.setTransform(dpr,0,0,dpr,0,0);nodes=Array.from({length:Math.min(42,Math.max(18,Math.floor(w*h/42000)))},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.14,vy:(Math.random()-.5)*.14}));}
    function draw(){ctx.clearRect(0,0,w,h);ctx.strokeStyle=document.documentElement.dataset.theme==="light"?"rgba(73,72,170,.06)":"rgba(94,226,255,.08)";for(const n of nodes){n.x+=n.vx;n.y+=n.vy;if(n.x<0)n.x=w;if(n.x>w)n.x=0;if(n.y<0)n.y=h;if(n.y>h)n.y=0;}for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=dx*dx+dy*dy;if(d<105*105){ctx.globalAlpha=1-d/(105*105);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}ctx.globalAlpha=1;requestAnimationFrame(draw);}resize();addEventListener("resize",resize,{passive:true});requestAnimationFrame(draw);
  }

  function renderNotConfigured(){
    app.innerHTML=`<section class="auth-card"><div class="page-kicker">COCKPIT · SETUP</div><h1>Supabase à connecter.</h1><p>Le tableau de bord enseignant nécessite Supabase. L’application élève reste testable en mode local, mais aucune donnée de classe ne peut remonter tant que <code>config.js</code> n’est pas renseigné.</p><div class="notice notice-warn"><strong>À faire :</strong> exécuter <code>supabase/schema.sql</code>, activer Anonymous Sign-Ins, créer le compte enseignant, puis renseigner l’URL du projet et la clé publishable/anon dans <code>config.js</code>.</div><div style="margin-top:18px"><a class="btn btn-primary" href="README.md">Voir le README →</a></div></section>`;
  }

  function renderLogin(message=""){
    app.innerHTML=`<section class="auth-card"><div class="page-kicker">ACCÈS SÉCURISÉ</div><h1>Cockpit enseignant.</h1><p>Connectez-vous avec le compte Supabase auquel le rôle <strong>teacher</strong> a été attribué. Les élèves utilisent une session anonyme séparée.</p>${message?`<div class="notice notice-warn">${esc(message)}</div>`:""}<form id="teacher-login" class="form-stack" style="margin-top:18px"><div class="field"><label for="email">E-mail</label><input class="input" id="email" name="email" type="email" autocomplete="username" required placeholder="enseignant@lycee.fr" value="${attr(config.teacherEmailHint||"")}"></div><div class="field"><label for="password">Mot de passe</label><input class="input" id="password" name="password" type="password" autocomplete="current-password" required></div><button class="btn btn-primary btn-wide" type="submit">Ouvrir le cockpit →</button></form><div class="notice" style="margin-top:14px"><strong>Sécurité :</strong> aucune service-role key n’est utilisée dans le navigateur. Les autorisations reposent sur l’authentification Supabase et le Row Level Security.</div></section>`;
    document.getElementById("teacher-login")?.addEventListener("submit",login);
  }

  async function login(e){
    e.preventDefault(); const form=e.currentTarget; const fd=new FormData(form); const b=form.querySelector("button"); b.disabled=true;b.textContent="Connexion…";
    const {error}=await client.auth.signInWithPassword({email:String(fd.get("email")||"").trim(),password:String(fd.get("password")||"")});
    if(error){toast("Connexion refusée : "+error.message,"bad");b.disabled=false;b.textContent="Ouvrir le cockpit →";return;}
    await authenticateTeacher();
  }

  async function authenticateTeacher(){
    const {data:{session}}=await client.auth.getSession(); if(!session){teacher=null;renderLogin();return;}
    const {data,error}=await client.from("profiles").select("id,pseudo,classe,role").eq("id",session.user.id).single();
    if(error||data?.role!=="teacher"){
      await client.auth.signOut(); teacher=null; renderLogin("Ce compte n’a pas le rôle enseignant. Vérifiez l’étape « promotion teacher » du README."); return;
    }
    teacher={...data,email:session.user.email}; await loadSessions(); startAutoRefresh();
  }

  async function loadSessions(preferredId=null){
    const {data,error}=await client.from("visit_sessions").select("id,title,year,event_date,access_code,is_active,created_at").order("event_date",{ascending:false});
    if(error){toast("Impossible de charger les sessions : "+error.message,"bad");return;}
    sessions=data||[];
    selectedSession=sessions.find(s=>s.id===(preferredId||selectedSession?.id))||sessions[0]||null;
    if(selectedSession) await loadDashboardData(); else renderDashboard();
  }

  async function loadDashboardData(silent=false){
    if(!selectedSession){participants=[];responses=[];progress=[];renderDashboard();return;}
    if(!silent) toast("Actualisation des données…");
    const [pRes,rRes,gRes]=await Promise.all([
      client.from("profiles").select("id,pseudo,classe,created_at").eq("visit_session_id",selectedSession.id).eq("role","student").order("pseudo"),
      client.from("responses").select("user_id,mission_key,question_key,answer,updated_at").eq("visit_session_id",selectedSession.id),
      client.from("progress").select("user_id,mission_key,completed,xp,updated_at").eq("visit_session_id",selectedSession.id)
    ]);
    const err=pRes.error||rRes.error||gRes.error; if(err){toast("Lecture impossible : "+err.message,"bad");return;}
    participants=pRes.data||[];responses=rRes.data||[];progress=gRes.data||[];renderDashboard();
  }

  function statsForUser(userId){
    const rows=responses.filter(r=>r.user_id===userId);
    const done=progress.filter(r=>r.user_id===userId&&r.completed);
    const xp=done.reduce((sum,r)=>sum+Number(r.xp||0),0);
    const timestamps=[...rows.map(r=>r.updated_at),...progress.filter(r=>r.user_id===userId).map(r=>r.updated_at)].filter(Boolean).map(Date.parse).filter(Number.isFinite);
    const lastSync=timestamps.length?new Date(Math.max(...timestamps)):null;
    return {complete:done.length,xp,percent:Math.min(100,Math.round(xp/content.totalXp*100)),answerCount:rows.length,lastSync};
  }
  function syncLabel(st){
    if(!st.lastSync)return {text:"Aucune remontée",kind:"warn"};
    const age=Date.now()-st.lastSync.getTime();
    if(age<2*60*1000)return {text:"Synchronisé récemment",kind:"good"};
    return {text:"Dernière remontée "+st.lastSync.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),kind:""};
  }

  function sessionProgress(){
    return content.missions.map(m=>{
      const count=participants.filter(p=>progress.some(r=>r.user_id===p.id&&r.mission_key===`mission-${String(m.order).padStart(2,"0")}`&&r.completed)).length;
      return {mission:m,count,percent:participants.length?Math.round(count/participants.length*100):0};
    });
  }

  function renderDashboard(){
    const total=participants.length; const completed=participants.filter(p=>statsForUser(p.id).percent===100).length; const avg=total?Math.round(participants.reduce((a,p)=>a+statsForUser(p.id).percent,0)/total):0;
    const sessionOptions=sessions.map(s=>`<option value="${attr(s.id)}" ${s.id===selectedSession?.id?"selected":""}>${esc(s.title)} · ${esc(s.event_date)}${s.is_active?" · active":""}</option>`).join("");
    const rows=participants.map(p=>{const st=statsForUser(p.id),sy=syncLabel(st);return `<tr><td><b>${esc(p.pseudo||"Sans pseudo")}</b><br><small style="color:var(--muted)">${esc(p.classe||"")}</small></td><td>${st.answerCount}</td><td><div class="progress-inline"><div class="bar"><span style="width:${st.percent}%"></span></div><b>${st.percent}%</b></div></td><td>${st.xp} XP</td><td><span class="chip ${sy.kind==="good"?"chip-good":sy.kind==="warn"?"chip-warn":""}">${esc(sy.text)}</span></td><td><button class="btn btn-ghost btn-small view-student" data-user="${attr(p.id)}">Voir</button></td></tr>`;}).join("");
    const bars=sessionProgress().map(x=>`<div class="bar-item"><label>${esc(x.mission.title)}</label><div class="bar-track"><span style="width:${x.percent}%"></span></div><b>${x.count}/${total}</b></div>`).join("");
    app.innerHTML=`<div class="teacher-wrap">
      <section class="dashboard-head"><div><div class="page-kicker">COCKPIT · ${esc(teacher?.email||"")}</div><h1 class="page-title">Vue classe.</h1><p class="page-subtitle">Suivi pédagogique sans classement public : progression, réponses, missions et export des données.</p></div><div class="progress-card"><div class="progress-row"><span>Progression moyenne</span><b>${avg}%</b></div><div class="progress-track"><div class="progress-fill" style="width:${avg}%"></div></div><div class="progress-row" style="margin-top:10px"><small>${total} participants</small><small>${completed} terminés</small></div></div></section>

      <section class="teacher-toolbar panel">
        <div class="toolbar-group"><div class="field"><label for="session-select">Session</label><select id="session-select" class="select" ${sessions.length?"":"disabled"}>${sessionOptions||"<option>Aucune session</option>"}</select></div><button id="refresh" class="btn btn-ghost btn-small">↻ Actualiser</button></div>
        <div class="toolbar-group"><button id="new-session" class="btn btn-secondary btn-small">+ Nouvelle session</button><button id="export-csv" class="btn btn-primary btn-small" ${selectedSession?"":"disabled"}>Exporter CSV</button><button id="logout-teacher" class="btn btn-danger btn-small">Déconnexion</button></div>
      </section>

      ${selectedSession?`<section class="summary-grid"><div class="stat"><small>Participants</small><b>${total}</b></div><div class="stat"><small>Terminés</small><b>${completed}</b></div><div class="stat"><small>Progression</small><b>${avg}%</b></div><div class="stat"><small>Code mission</small><b style="font-size:22px">${esc(selectedSession.access_code)}</b></div></section>
      <section class="teacher-grid"><div class="panel"><h2>Progression par mission</h2><div class="bar-list">${bars||'<div class="empty"><b>Aucune donnée</b>Les barres apparaîtront dès que les élèves commenceront.</div>'}</div></div><div class="panel"><h2>Session</h2><p><b>${esc(selectedSession.title)}</b></p><p style="color:var(--muted)">${esc(selectedSession.event_date)} · ${selectedSession.year}</p><span class="chip ${selectedSession.is_active?"chip-good":"chip-warn"}">${selectedSession.is_active?"Active":"Fermée"}</span><div style="margin-top:16px"><button id="toggle-session" class="btn btn-ghost btn-small">${selectedSession.is_active?"Fermer les inscriptions":"Réouvrir la session"}</button></div></div></section>
      <section><div class="section-head"><div><h2>Participants</h2><p>Cliquez sur un élève pour consulter son questionnaire.</p></div></div><div class="table-wrap">${rows?`<table class="data-table"><thead><tr><th>Élève</th><th>Réponses</th><th>Progression</th><th>XP</th><th>Dernière remontée</th><th></th></tr></thead><tbody>${rows}</tbody></table>`:'<div class="empty"><b>Aucun participant</b>Partagez le code de mission aux élèves pour démarrer.</div>'}</div></section>`:`<section class="panel empty"><b>Aucune session.</b>Créez une session pour obtenir un code à partager aux élèves.</section>`}
    </div>
    <dialog id="session-dialog" class="dialog"><div class="dialog-inner"><div class="dialog-head"><h2>Nouvelle session</h2><button class="icon-btn" id="close-dialog" type="button">×</button></div><form id="session-form" class="form-stack"><div class="field"><label>Titre</label><input class="input" name="title" required value="PGW NSI ${new Date().getFullYear()}"></div><div class="field"><label>Année</label><input class="input" type="number" name="year" required min="2026" max="2100" value="${new Date().getFullYear()}"></div><div class="field"><label>Date</label><input class="input" type="date" name="event_date" required value="${config.visitDate||""}"></div><div class="field"><label>Code de mission</label><input class="input" name="access_code" required maxlength="20" value="PGW${String(new Date().getFullYear()).slice(-2)}"></div><button class="btn btn-primary" type="submit">Créer la session</button></form></div></dialog>`;
    bindDashboard();
  }

  function bindDashboard(){
    document.getElementById("session-select")?.addEventListener("change",async e=>{selectedSession=sessions.find(s=>s.id===e.target.value);await loadDashboardData(true);});
    document.getElementById("refresh")?.addEventListener("click",()=>loadDashboardData());
    document.getElementById("export-csv")?.addEventListener("click",exportCsv);
    document.getElementById("logout-teacher")?.addEventListener("click",async()=>{await client.auth.signOut();teacher=null;clearInterval(refreshTimer);renderLogin();});
    document.querySelectorAll(".view-student").forEach(b=>b.addEventListener("click",()=>openStudent(b.dataset.user)));
    document.getElementById("toggle-session")?.addEventListener("click",toggleSession);
    const dialog=document.getElementById("session-dialog");
    document.getElementById("new-session")?.addEventListener("click",()=>dialog.showModal());
    document.getElementById("close-dialog")?.addEventListener("click",()=>dialog.close());
    document.getElementById("session-form")?.addEventListener("submit",createSession);
  }

  async function createSession(e){
    e.preventDefault();const fd=new FormData(e.currentTarget);const row={title:String(fd.get("title")||"").trim(),year:Number(fd.get("year")),event_date:String(fd.get("event_date")),access_code:String(fd.get("access_code")||"").trim().toUpperCase(),is_active:true,created_by:teacher.id};
    const {data,error}=await client.from("visit_sessions").insert(row).select().single(); if(error){toast("Création impossible : "+error.message,"bad");return;} document.getElementById("session-dialog")?.close();toast("Session créée.","good");await loadSessions(data.id);
  }

  async function toggleSession(){
    if(!selectedSession)return;const next=!selectedSession.is_active;const {error}=await client.from("visit_sessions").update({is_active:next}).eq("id",selectedSession.id);if(error){toast(error.message,"bad");return;}selectedSession.is_active=next;toast(next?"Session rouverte.":"Inscriptions fermées.","good");renderDashboard();
  }

  function formatAnswer(v){if(v===null||v===undefined||v==="")return "—";if(Array.isArray(v))return v.join(" · ");if(typeof v==="object")return JSON.stringify(v);return String(v);}
  function openStudent(userId){
    const p=participants.find(x=>x.id===userId);if(!p)return;const userRows=responses.filter(r=>r.user_id===userId);const map=Object.fromEntries(userRows.map(r=>[r.question_key,r.answer?.value??r.answer]));const st=statsForUser(userId);
    const groups=content.missions.map(m=>`<div class="answer-group"><h3>${esc(m.title)} · ${m.xp} XP</h3>${m.questions.map(q=>`<div class="answer"><b>${esc(q.label)}</b><p>${esc(formatAnswer(map[q.key]))}</p></div>`).join("")}</div>`).join("");
    const back=document.createElement("div");back.className="drawer-backdrop";back.innerHTML=`<aside class="drawer" role="dialog" aria-modal="true" aria-label="Réponses de ${attr(p.pseudo)}"><div class="drawer-head"><div><div class="page-kicker">${esc(p.classe||"")}</div><h2 style="margin:0">${esc(p.pseudo||"Élève")}</h2><p style="margin:5px 0;color:var(--muted)">${st.percent}% · ${st.xp} XP · ${st.answerCount} réponses</p></div><button class="icon-btn close-drawer" type="button">×</button></div>${groups}</aside>`;document.body.appendChild(back);const close=()=>back.remove();back.querySelector(".close-drawer").addEventListener("click",close);back.addEventListener("click",e=>{if(e.target===back)close();});
  }

  function csvEscape(v){const s=String(v??"").replace(/\r?\n/g," ");return /[;"\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}
  function exportCsv(){
    if(!selectedSession)return;const questionKeys=allQuestions.map(q=>q.key);const headers=["pseudo","classe","missions_terminees","progression_pct","xp","derniere_remontee",...allQuestions.map(q=>`${q.missionTitle} — ${q.label}`)];const lines=[headers.map(csvEscape).join(";")];
    for(const p of participants){const st=statsForUser(p.id);const map=Object.fromEntries(responses.filter(r=>r.user_id===p.id).map(r=>[r.question_key,r.answer?.value??r.answer]));const row=[p.pseudo,p.classe,st.complete,st.percent,st.xp,st.lastSync?st.lastSync.toISOString():"",...questionKeys.map(k=>formatAnswer(map[k]))];lines.push(row.map(csvEscape).join(";"));}
    const blob=new Blob(["\uFEFF"+lines.join("\n")],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`pgw-nsi-${selectedSession.year}-${selectedSession.event_date}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast("Export CSV généré.","good");
  }

  function startAutoRefresh(){clearInterval(refreshTimer);refreshTimer=setInterval(()=>{if(document.visibilityState==="visible"&&selectedSession)loadDashboardData(true);},30000);}

  async function init(){
    initTheme();initAmbient();
    if(!supa?.configured?.()){renderNotConfigured();return;}
    client=supa.getTeacherClient();await authenticateTeacher();
  }
  window.addEventListener("DOMContentLoaded",init);
})();
