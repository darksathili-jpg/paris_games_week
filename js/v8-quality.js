import {missions,totalXp} from "./v8-data.js";
const checks=[];
const add=(name,ok,detail="")=>checks.push({name,ok,detail});
const cards=[...document.querySelectorAll("[data-mission]")];
add("6 missions",cards.length===6,`${cards.length}/6`);
add("IDs uniques",new Set(cards.map(c=>c.dataset.mission)).size===cards.length);
add("XP = 1350",totalXp===1350,String(totalXp));
add("6 données",missions.length===6,String(missions.length));
add("Aucun débordement horizontal",document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,`${document.documentElement.scrollWidth}/${document.documentElement.clientWidth}`);
add("Un numéro HTML par carte",cards.every(c=>c.querySelectorAll(".mission__num").length===1));
add("Un XP HTML par carte",cards.every(c=>c.querySelectorAll(".mission__xp").length===1));
const failed=checks.filter(c=>!c.ok);
console.group("%cPGW V8 quality gate", "color:#57efff;font-weight:bold");
for(const c of checks) console[c.ok?"log":"error"](`${c.ok?"✓":"✗"} ${c.name}${c.detail?" — "+c.detail:""}`);
console.groupEnd();
document.documentElement.dataset.qa=failed.length?"failed":"passed";
if(failed.length){
  const n=document.createElement("div");
  n.setAttribute("role","status");
  n.style.cssText="position:fixed;z-index:9999;right:8px;bottom:8px;padding:7px 9px;border:1px solid #ff6a7a;border-radius:8px;background:#190810;color:#fff;font:700 11px system-ui";
  n.textContent=`V8 QA: ${failed.length} échec(s)`;
  document.body.appendChild(n);
}