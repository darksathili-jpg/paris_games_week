import {joinStudent,getJoinContext} from "./v8-join.js";
import {enqueue,flushQueue,setSyncAdapter,pendingCount} from "./v8-sync.js";
import {supabaseAdapter} from "./v8-supabase.js";
import {missions as cardData,totalXp} from "./v8-data.js";

const content=window.PGW_CONTENT;
const grid=document.querySelector("[data-mission-grid]");
const drawer=document.querySelector("[data-mission-drawer]");
const drawerContent=document.querySelector("[data-drawer-content]");
const toast=document.querySelector("[data-v8-toast]");
const STORAGE_KEY="pgw-v8-progress-v1";
const BACKUP_KEY="pgw-v8-progress-v1-backup";
const syncStatus=document.querySelector("[data-sync-status]");
// Synchronisation distante activée seulement après liaison explicite de la visite.
if(getJoinContext()) setSyncAdapter(supabaseAdapter());
window.addEventListener("pgw:sync-status",e=>{
 if(!syncStatus)return; const {state,pending}=e.detail;
 const labels={local:"Enregistré sur cet appareil",pending:`Synchronisation en attente${pending?` · ${pending}`:""}`,syncing:"Synchronisation…",synced:"Synchronisé"};
 syncStatus.textContent=labels[state]||labels.local; syncStatus.dataset.state=state;
});


const escapeHtml=(value)=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));

const state=loadState();
function loadState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(parsed&&typeof parsed==="object") return {answers:parsed.answers||{},validated:parsed.validated||[]};
  }catch{}
  try{
    const backup=JSON.parse(localStorage.getItem(BACKUP_KEY)||"null");
    if(backup&&typeof backup==="object") return {answers:backup.answers||{},validated:backup.validated||[]};
  }catch{}
  return {answers:{},validated:[]};
}
function saveState(){
  const payload=JSON.stringify(state);
  try{
    const current=localStorage.getItem(STORAGE_KEY);
    if(current) localStorage.setItem(BACKUP_KEY,current);
    localStorage.setItem(STORAGE_KEY,payload);
    window.dispatchEvent(new CustomEvent("pgw:local-saved",{detail:{at:Date.now()}}));
    return true;
  }catch(error){
    console.error("PGW local save failed",error);
    return false;
  }
}
function missionContent(id){return content?.missions?.find(m=>m.order===id);}
function isValidated(id){return state.validated.includes(id);}
function isUnlocked(id){return id===1||isValidated(id-1);}
function questionValid(q,value){
  if(!q.required) return true;
  if(q.type==="checkboxes") return Array.isArray(value)&&value.length>0;
  if(q.type==="radio") return Boolean(value);
  const s=String(value??"").trim();
  return s.length>=(q.minLength||1);
}
function stats(){
  const done=cardData.filter(m=>isValidated(m.id));
  const xp=done.reduce((sum,m)=>sum+m.xp,0);
  const badges=(content?.badges||[]).filter(b=>xp>=b.minXp);
  return {done:done.length,xp,badges,percent:Math.round((xp/totalXp)*100)};
}
function pictureFor(m){
  const id=`mission-${String(m.id).padStart(2,"0")}`;
  const sizes="(max-width:390px) 100vw, (max-width:760px) 50vw, (max-width:1100px) 50vw, 33vw";
  return `<picture><source type="image/avif" srcset="assets/v8/generated/${id}/${id}-480.avif 480w, assets/v8/generated/${id}/${id}-720.avif 720w, assets/v8/generated/${id}/${id}-1200.avif 1200w" sizes="${sizes}"><source type="image/webp" srcset="assets/v8/generated/${id}/${id}-480.webp 480w, assets/v8/generated/${id}/${id}-720.webp 720w, assets/v8/generated/${id}/${id}-1200.webp 1200w" sizes="${sizes}"><img src="assets/v8/generated/${id}/${id}-720.webp" width="1200" height="750" loading="lazy" decoding="async" alt=""></picture>`;
}
function missionCard(m){
  const unlocked=isUnlocked(m.id),done=isValidated(m.id);
  const status=done?"✓ COMPLETE":unlocked?"● READY":"◇ LOCKED";
  return `<article class="mission ${done?"is-complete":""} ${unlocked?"is-unlocked":"is-locked"}" style="--accent:${m.accent}" data-mission="${m.id}">
    <div class="mission__media" aria-hidden="true">${pictureFor(m)}</div><div class="mission__shade" aria-hidden="true"></div>
    <div class="mission__body">
      <div class="mission__top"><span class="mission__num">${String(m.id).padStart(2,"0")}</span><span class="mission__xp">+${m.xp} XP</span></div>
      <div class="mission__content"><span class="mission__label">${escapeHtml(m.label)}</span><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.description)}</p>
      <div class="mission__footer"><span class="mission__state ${done||unlocked?"is-ready":""}">${status}</span><button class="mission__button" type="button" aria-label="${done?"Revoir":"Ouvrir"} ${escapeHtml(m.title)}" ${unlocked?"":"disabled"} data-open-mission="${m.id}">${done?"↺":"›"}</button></div></div>
    </div></article>`;
}
function render(){
  if(grid) grid.innerHTML=cardData.map(missionCard).join("");
  document.querySelectorAll("[data-total-xp]").forEach(el=>el.textContent=totalXp);
  updateHud();
}
function updateHud(){
  const s=stats();
  document.querySelectorAll("[data-progress-percent]").forEach(el=>el.textContent=s.percent+"%");
  document.querySelectorAll("[data-progress-missions]").forEach(el=>el.textContent=`${s.done} / 6`);
  document.querySelectorAll("[data-progress-xp]").forEach(el=>el.textContent=`${s.xp} XP`);
  document.querySelectorAll("[data-progress-badges]").forEach(el=>el.textContent=`${s.badges.length} badge${s.badges.length>1?"s":""}`);
  const rank=s.badges.at(-1)?.label||"Enquêteur·se en herbe";
  document.querySelectorAll("[data-progress-rank]").forEach(el=>el.textContent=rank);
  document.querySelectorAll("[data-progress-ring]").forEach(el=>{
    el.style.setProperty("--progress",s.percent*3.6+"deg");
    el.setAttribute("aria-label",`Progression ${s.percent} %`);
  });
}
function questionControl(q,value){
  const name=`q-${q.key}`,hint=q.hint?`<p class="drawer-question__hint">${escapeHtml(q.hint)}</p>`:"";
  let control="";
  if(q.type==="textarea") control=`<textarea data-answer="${q.key}" maxlength="${q.maxLength||1200}" placeholder="${escapeHtml(q.placeholder||"")}">${escapeHtml(value||"")}</textarea>`;
  else if(q.type==="text") control=`<input data-answer="${q.key}" type="text" maxlength="500" value="${escapeHtml(value||"")}" placeholder="${escapeHtml(q.placeholder||"")}">`;
  else if(q.type==="radio") control=`<div class="drawer-choices">${q.options.map(o=>`<label><input data-answer="${q.key}" type="radio" name="${name}" value="${escapeHtml(o)}" ${value===o?"checked":""}><span>${escapeHtml(o)}</span></label>`).join("")}</div>`;
  else if(q.type==="checkboxes"){const arr=Array.isArray(value)?value:[];control=`<div class="drawer-choices">${q.options.map(o=>`<label><input data-answer="${q.key}" type="checkbox" value="${escapeHtml(o)}" ${arr.includes(o)?"checked":""}><span>${escapeHtml(o)}</span></label>`).join("")}</div>`;}
  return `<div class="drawer-question" data-question="${q.key}"><div class="drawer-question__head"><span>${q.required?"REQUIS":"OPTION"}</span><b>${escapeHtml(q.label)}</b></div>${hint}${control}</div>`;
}
function openMission(id){
  const m=missionContent(id); if(!m||!isUnlocked(id)) return;
  const answers=state.answers[id]||{};
  const required=m.questions.filter(q=>q.required);
  const done=required.filter(q=>questionValid(q,answers[q.key])).length;
  drawerContent.innerHTML=`<div class="drawer-hero"><span>MISSION ${String(id).padStart(2,"0")}</span><h2 id="drawer-title">${escapeHtml(m.title)}</h2><p>${escapeHtml(m.description)}</p><div class="drawer-progress"><span style="width:${required.length?Math.round(done/required.length*100):0}%"></span></div><small>${done}/${required.length} critères requis complétés</small></div>
  <form class="drawer-form" data-mission-form="${id}">${m.questions.map(q=>questionControl(q,answers[q.key])).join("")}
  <div class="drawer-actions"><button type="button" class="drawer-secondary" data-drawer-close>Fermer</button><button type="submit" class="drawer-primary">${isValidated(id)?"Enregistrer les modifications":`Valider la mission · +${m.xp} XP`}</button></div></form>`;
  drawer.hidden=false; document.body.classList.add("drawer-open");
  drawer.querySelector(".mission-drawer__close")?.focus();
}
function closeDrawer(){drawer.hidden=true;document.body.classList.remove("drawer-open");}
function collectForm(id,form){
  const m=missionContent(id); const answers={...(state.answers[id]||{})};
  for(const q of m.questions){
    const nodes=[...form.querySelectorAll(`[data-answer="${CSS.escape(q.key)}"]`)];
    if(q.type==="checkboxes") answers[q.key]=nodes.filter(n=>n.checked).map(n=>n.value);
    else if(q.type==="radio") answers[q.key]=nodes.find(n=>n.checked)?.value||"";
    else answers[q.key]=nodes[0]?.value??"";
  }
  state.answers[id]=answers;
  for(const q of m.questions) enqueue("answer",{missionId:id,questionKey:q.key,value:answers[q.key]??(q.type==="checkboxes"?[]:"")});
  const saved=saveState();
  if(!saved) showToast("⚠ Impossible d’enregistrer localement. Ne ferme pas cette page.");
  return answers;
}
function showToast(message){toast.textContent=message;toast.classList.add("is-visible");clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove("is-visible"),3200);}
function validateMission(id,form){
  const m=missionContent(id),answers=collectForm(id,form);
  const invalid=m.questions.filter(q=>!questionValid(q,answers[q.key]));
  form.querySelectorAll(".drawer-question").forEach(el=>el.classList.remove("is-invalid"));
  if(invalid.length){
    invalid.forEach(q=>form.querySelector(`[data-question="${CSS.escape(q.key)}"]`)?.classList.add("is-invalid"));
    form.querySelector(".is-invalid")?.scrollIntoView({behavior:"smooth",block:"center"});
    showToast(`${invalid.length} réponse${invalid.length>1?"s":""} requise${invalid.length>1?"s":""} à compléter.`);return;
  }
  if(!isValidated(id)) state.validated.push(id);
  enqueue("progress",{missionId:id,completed:true,xp:m.xp});
  saveState(); void flushQueue(); closeDrawer(); render();

const joinDialog=document.querySelector("[data-join-dialog]"),joinForm=document.querySelector("[data-join-form]"),joinChip=document.querySelector("[data-join-open]"),joinError=document.querySelector("[data-join-error]");
function paintJoin(){const c=getJoinContext();if(joinChip)joinChip.textContent=c?`${c.pseudo} · ${c.classe}`:"Relier cette visite";}
joinChip?.addEventListener("click",()=>{if(!getJoinContext())joinDialog.hidden=false;});
document.querySelectorAll("[data-join-close]").forEach(b=>b.addEventListener("click",()=>joinDialog.hidden=true));
joinForm?.addEventListener("submit",async e=>{e.preventDefault();joinError.textContent="";const b=joinForm.querySelector('button[type="submit"]');b.disabled=true;b.textContent="Connexion…";try{const fd=new FormData(joinForm);await joinStudent({code:fd.get("code"),classe:fd.get("classe"),pseudo:fd.get("pseudo")});setSyncAdapter(supabaseAdapter());paintJoin();joinDialog.hidden=true;void flushQueue();showToast("✓ Visite reliée — synchronisation activée");}catch(err){joinError.textContent=err.message||"Connexion impossible";}finally{b.disabled=false;b.textContent="Relier ma visite";}});
paintJoin();
  const next=id<6?cardData.find(m=>m.id===id+1):null;
  showToast(id===6?"★ Boss Final validé — NSI Quest terminée !":`Mission ${String(id).padStart(2,"0")} validée · +${m.xp} XP${next?" · Mission suivante débloquée":""}`);
}
document.addEventListener("click",e=>{
  const open=e.target.closest("[data-open-mission]"); if(open){openMission(Number(open.dataset.openMission));return;}
  if(e.target.closest("[data-drawer-close]")) closeDrawer();
});
document.addEventListener("submit",e=>{const f=e.target.closest("[data-mission-form]");if(!f)return;e.preventDefault();validateMission(Number(f.dataset.missionForm),f);});
document.addEventListener("input",e=>{const f=e.target.closest("[data-mission-form]");if(!f)return;collectForm(Number(f.dataset.missionForm),f);});
document.querySelector("[data-enter]")?.addEventListener("click",()=>document.querySelector("#missions")?.scrollIntoView({behavior:"smooth"}));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!drawer.hidden)closeDrawer();});
render();
