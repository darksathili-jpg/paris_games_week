import {test,expect} from "@playwright/test";

test("grille V8 stable",async({page})=>{
 await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
 await expect(page.locator("[data-mission-grid] .mission")).toHaveCount(6);
 const cards=page.locator("[data-mission-grid] .mission");
 for(let i=0;i<6;i++){const box=await cards.nth(i).boundingBox();expect(box?.width??0).toBeGreaterThan(250);expect(box?.height??0).toBeGreaterThan(220);}
 await page.locator("#missions").scrollIntoViewIfNeeded();
 await expect(page.locator("#missions")).toHaveScreenshot("missions-grid.png",{animations:"disabled"});
});

test("images approuvees chargees sans erreur",async({page})=>{
 const status=await (await fetch("http://127.0.0.1:4173/assets/v8/mission-status.json")).json();
 const approved=new Set(["MASTER_APPROVED","RESPONSIVE_BUILD","INTEGRATED","QA_PASSED"]);
 const expected=Object.entries(status.missions).filter(([,m])=>approved.has(m.state)).map(([id])=>String(Number(id)));
 const failures=[];
 page.on("response",r=>{
   const m=r.url().match(/\/assets\/v8\/generated\/mission-(\d{2})\//);
   if(m && approved.has(status.missions[m[1]]?.state) && r.status()>=400) failures.push([r.status(),r.url()]);
 });
 await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
 for(const id of expected){
   const img=page.locator('.mission[data-mission="'+id+'"] .mission__media img');
   await expect(img).toHaveCount(1);
   const ok=await img.evaluate(el=>el.complete&&el.naturalWidth>0);
   expect(ok,"mission image "+id).toBeTruthy();
 }
 expect(failures).toEqual([]);
});


test("progression séquentielle et persistance locale",async({page})=>{
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  await page.evaluate(()=>localStorage.removeItem("pgw-v8-progress-v1"));
  await page.reload({waitUntil:"networkidle"});
  await expect(page.locator('.mission[data-mission="1"] [data-open-mission="1"]')).toBeEnabled();
  await expect(page.locator('.mission[data-mission="2"] [data-open-mission="2"]')).toBeDisabled();

  await page.locator('[data-open-mission="1"]').click();
  await page.locator('[data-answer="interests"]').first().check();
  await page.locator('[data-answer="objectives"]').fill("Comprendre un mécanisme réseau concret et comparer une formation post-bac adaptée à mon profil NSI.");
  await page.locator('[data-mission-form="1"] button[type="submit"]').click();

  await expect(page.locator('.mission[data-mission="1"]')).toHaveClass(/is-complete/);
  await expect(page.locator('.mission[data-mission="2"] [data-open-mission="2"]')).toBeEnabled();
  await expect(page.locator("[data-progress-xp]").first()).toHaveText("100 XP");

  await page.reload({waitUntil:"networkidle"});
  await expect(page.locator('.mission[data-mission="1"]')).toHaveClass(/is-complete/);
  await expect(page.locator('.mission[data-mission="2"] [data-open-mission="2"]')).toBeEnabled();
  await expect(page.locator("[data-progress-xp]").first()).toHaveText("100 XP");
});


const makeValue=(q)=>q.type==="checkboxes"?[q.options[0]]:q.type==="radio"?q.options[0]:"Réponse terrain suffisamment détaillée pour satisfaire la validation pédagogique et tester le parcours complet sans contourner les contraintes.";

async function completeMission(page,id){
  const content=await page.evaluate(()=>window.PGW_CONTENT);
  const mission=content.missions.find(m=>m.order===id);
  await page.locator(`[data-open-mission="${id}"]`).click();
  for(const q of mission.questions){
    if(!q.required) continue;
    const loc=page.locator(`[data-answer="${q.key}"]`);
    if(q.type==="checkboxes"||q.type==="radio") await loc.first().check();
    else await loc.fill(makeValue(q));
  }
  await page.locator(`[data-mission-form="${id}"] button[type="submit"]`).click();
}

test("parcours terrain complet M01 vers Boss Final",async({page})=>{
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  await page.evaluate(()=>localStorage.removeItem("pgw-v8-progress-v1"));
  await page.reload({waitUntil:"networkidle"});
  for(let id=1;id<=6;id++){
    await expect(page.locator(`[data-open-mission="${id}"]`)).toBeEnabled();
    if(id<6) await expect(page.locator(`[data-open-mission="${id+1}"]`)).toBeDisabled();
    await completeMission(page,id);
    await expect(page.locator(`.mission[data-mission="${id}"]`)).toHaveClass(/is-complete/);
  }
  await expect(page.locator("[data-progress-xp]").first()).toHaveText("1350 XP");
  await expect(page.locator("[data-progress-percent]").first()).toHaveText("100%");
  await expect(page.locator("[data-progress-missions]").first()).toHaveText("6 / 6");
  await expect(page.locator("[data-progress-rank]").first()).toHaveText("NSI Quest Master");
  await page.reload({waitUntil:"networkidle"});
  await expect(page.locator("[data-progress-xp]").first()).toHaveText("1350 XP");
  await expect(page.locator(".mission.is-complete")).toHaveCount(6);
});

test("verrouillage impossible a contourner par interaction UI",async({page})=>{
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  await page.evaluate(()=>localStorage.removeItem("pgw-v8-progress-v1"));
  await page.reload({waitUntil:"networkidle"});
  for(let id=2;id<=6;id++) await expect(page.locator(`[data-open-mission="${id}"]`)).toBeDisabled();
  await page.evaluate(()=>document.querySelector('[data-open-mission="6"]').click());
  await expect(page.locator("[data-mission-drawer]")).toBeHidden();
});

test("contenu pedagogique complet exploite par le drawer",async({page})=>{
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  const report=await page.evaluate(()=>{
    const c=window.PGW_CONTENT;
    return {
      missions:c.missions.length,
      xp:c.missions.reduce((s,m)=>s+m.xp,0),
      badges:c.badges.length,
      uniqueKeys:new Set(c.missions.flatMap(m=>m.questions.map(q=>q.key))).size,
      questionCount:c.missions.reduce((s,m)=>s+m.questions.length,0),
      rawQuestionCount:c.missions.flatMap(m=>m.questions).length,
      bad:c.missions.flatMap(m=>m.questions).filter(q=>!q.key||!q.label||!["text","textarea","radio","checkboxes"].includes(q.type)||(q.type==="radio"||q.type==="checkboxes")&&(!q.options||!q.options.length)).length
    };
  });
  expect(report).toEqual({missions:6,xp:1350,badges:6,uniqueKeys:61,questionCount:61,rawQuestionCount:61,bad:0});
  for(let id=1;id<=6;id++){
    await page.evaluate(n=>{
      const raw=JSON.parse(localStorage.getItem("pgw-v8-progress-v1")||'{"answers":{},"validated":[]}');
      raw.validated=Array.from({length:n-1},(_,i)=>i+1);
      localStorage.setItem("pgw-v8-progress-v1",JSON.stringify(raw));
    },id);
    await page.reload({waitUntil:"networkidle"});
    await page.locator(`[data-open-mission="${id}"]`).click();
    const expected=await page.evaluate(n=>window.PGW_CONTENT.missions.find(m=>m.order===n).questions.length,id);
    await expect(page.locator("[data-mission-drawer] .drawer-question")).toHaveCount(expected);
    await page.locator("[data-drawer-close]").last().click();
  }
});

test("drawer lisible et contenu dans le viewport",async({page})=>{
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  await page.evaluate(()=>localStorage.removeItem("pgw-v8-progress-v1"));
  await page.reload({waitUntil:"networkidle"});
  await page.locator('[data-open-mission="1"]').click();
  const box=await page.locator(".mission-drawer__panel").boundingBox();
  const vp=page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x+box.width).toBeLessThanOrEqual(vp.width+1);
  expect(box.height).toBeLessThanOrEqual(vp.height+1);
  await expect(page.locator(".mission-drawer__close")).toBeVisible();
  await expect(page.locator('[data-mission-form="1"] button[type="submit"]')).toBeVisible();
});
