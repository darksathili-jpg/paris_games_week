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
