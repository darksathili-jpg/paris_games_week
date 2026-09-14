import {missions,totalXp} from "./v8-data.js";
const grid=document.querySelector("[data-mission-grid]");
const total=document.querySelector("[data-total-xp]");
const escapeHtml=(value)=>String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
const pictureFor=(m)=>{
  const id=`mission-${String(m.id).padStart(2,"0")}`;
  const sizes="(max-width:390px) 100vw, (max-width:760px) 50vw, (max-width:1100px) 50vw, 33vw";
  return `<picture><source type="image/avif" srcset="assets/v8/generated/${id}/${id}-480.avif 480w, assets/v8/generated/${id}/${id}-720.avif 720w, assets/v8/generated/${id}/${id}-1200.avif 1200w" sizes="${sizes}"><source type="image/webp" srcset="assets/v8/generated/${id}/${id}-480.webp 480w, assets/v8/generated/${id}/${id}-720.webp 720w, assets/v8/generated/${id}/${id}-1200.webp 1200w" sizes="${sizes}"><img src="assets/v8/generated/${id}/${id}-720.webp" width="1200" height="750" loading="lazy" decoding="async" alt=""></picture>`;
};
function missionCard(m){
  const ready=m.state==="ready";
  return `<article class="mission" style="--accent:${m.accent}" data-mission="${m.id}">
    <div class="mission__media" aria-hidden="true">${pictureFor(m)}</div><div class="mission__shade" aria-hidden="true"></div>
    <div class="mission__body">
      <div class="mission__top"><span class="mission__num">${String(m.id).padStart(2,"0")}</span><span class="mission__xp">+${m.xp} XP</span></div>
      <div class="mission__content"><span class="mission__label">${escapeHtml(m.label)}</span><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.description)}</p>
      <div class="mission__footer"><span class="mission__state ${ready?"is-ready":""}">${ready?"● READY":"◇ LOCKED"}</span><button class="mission__button" type="button" aria-label="Ouvrir ${escapeHtml(m.title)}" ${ready?"":"disabled"}>›</button></div></div>
    </div></article>`;
}
if(grid) grid.innerHTML=missions.map(missionCard).join("");
if(total) total.textContent=totalXp;
document.querySelector("[data-enter]")?.addEventListener("click",()=>document.querySelector("#missions")?.scrollIntoView({behavior:"smooth"}));