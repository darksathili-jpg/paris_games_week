import {missions,totalXp} from "./v8-data.js";
const grid=document.querySelector("[data-mission-grid]");
const total=document.querySelector("[data-total-xp]");
const escapeHtml=(value)=>String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
function missionCard(m){
  const ready=m.state==="ready";
  return `<article class="mission" style="--accent:${m.accent}" data-mission="${m.id}">
    <div class="mission__media" aria-hidden="true"></div><div class="mission__shade" aria-hidden="true"></div>
    <div class="mission__body">
      <div class="mission__top"><span class="mission__num">${String(m.id).padStart(2,"0")}</span><span class="mission__xp">+${m.xp} XP</span></div>
      <div class="mission__content"><span class="mission__label">${escapeHtml(m.label)}</span><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.description)}</p>
      <div class="mission__footer"><span class="mission__state ${ready?"is-ready":""}">${ready?"● READY":"◇ LOCKED"}</span><button class="mission__button" type="button" aria-label="Ouvrir ${escapeHtml(m.title)}" ${ready?"":"disabled"}>›</button></div></div>
    </div></article>`;
}
if(grid) grid.innerHTML=missions.map(missionCard).join("");
if(total) total.textContent=totalXp;
document.querySelector("[data-enter]")?.addEventListener("click",()=>document.querySelector("#missions")?.scrollIntoView({behavior:"smooth"}));