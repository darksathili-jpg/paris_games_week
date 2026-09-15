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
  await expect(page.locator("[data-mission-drawer] .mission-drawer__close")).toBeVisible();
  await expect(page.locator('[data-mission-form="1"] button[type="submit"]')).toBeVisible();
});


test("autosauvegarde des réponses avant validation",async({page})=>{
 await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
 await page.evaluate(()=>{localStorage.removeItem("pgw-v8-progress-v1");localStorage.removeItem("pgw-v8-progress-v1-backup");});
 await page.reload({waitUntil:"networkidle"});
 await page.locator('[data-open-mission="1"]').click();
 await page.locator('[data-answer="objectives"]').fill("Cette réponse est sauvegardée avant validation complète de la mission pour résister à une fermeture accidentelle.");
 await page.locator('[data-drawer-close]').last().click();
 await page.reload({waitUntil:"networkidle"});
 await page.locator('[data-open-mission="1"]').click();
 await expect(page.locator('[data-answer="objectives"]')).toHaveValue(/sauvegardée avant validation/);
});

test("backup local récupérable si état principal corrompu",async({page})=>{
 await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
 await page.evaluate(()=>{
   localStorage.setItem("pgw-v8-progress-v1","{corrompu");
   localStorage.setItem("pgw-v8-progress-v1-backup",JSON.stringify({answers:{"1":{objectives:"Réponse restaurée depuis le backup local."}},validated:[]}));
 });
 await page.reload({waitUntil:"networkidle"});
 await page.locator('[data-open-mission="1"]').click();
 await expect(page.locator('[data-answer="objectives"]')).toHaveValue("Réponse restaurée depuis le backup local.");
});


test("mission deja validee ne promet pas de nouveaux XP",async({page})=>{
 await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
 await page.evaluate(()=>localStorage.setItem("pgw-v8-progress-v1",JSON.stringify({answers:{},validated:[1]})));
 await page.reload({waitUntil:"networkidle"});
 await page.locator('[data-open-mission="1"]').click();
 const submit=page.locator('[data-mission-form="1"] button[type="submit"]');
 await expect(submit).toHaveText("Enregistrer les modifications");
 await expect(submit).not.toContainText("+100 XP");
});


test("queue idempotente remplace une réponse sans duplication",async({page})=>{
 await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
 await page.evaluate(()=>localStorage.removeItem("pgw-v8-sync-queue-v1"));
 await page.reload({waitUntil:"networkidle"});
 await page.locator('[data-open-mission="1"]').click();
 const field=page.locator('[data-answer="objectives"]');
 await field.fill("Première version assez longue pour être enregistrée localement.");
 await field.fill("Deuxième version assez longue qui doit remplacer la précédente.");
 const q=await page.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-queue-v1")||"[]"));
 const hits=q.filter(x=>x.id==="answer:1:objectives");
 expect(hits).toHaveLength(1);
 expect(hits[0].payload.value).toContain("Deuxième version");
});

test("coupure réseau conserve la queue puis reprise tente la synchronisation",async({page,context})=>{
 await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
 await page.evaluate(()=>{localStorage.removeItem("pgw-v8-sync-queue-v1");localStorage.removeItem("pgw-v8-sync-context-v1");});
 await context.setOffline(true);
 // La page est déjà chargée : simule une coupure pendant la visite, cas terrain réel.
 await page.evaluate(()=>window.dispatchEvent(new Event("offline")));
 await page.locator('[data-open-mission="1"]').click();
 await page.locator('[data-answer="objectives"]').fill("Réponse créée hors ligne et conservée dans la file locale.");
 await expect(page.locator("[data-sync-status]")).toContainText("Synchronisation en attente");
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-queue-v1")||"[]").length);
 expect(before).toBeGreaterThan(0);
 await context.setOffline(false);
 await page.waitForTimeout(500);
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-queue-v1")||"[]").length);
 expect(after).toBe(before);
 await expect(page.locator("[data-sync-status]")).toContainText("Synchronisation en attente");
});


test("LIVE join anonyme puis synchronisation Supabase idempotente",async({page})=>{
  test.setTimeout(45000);
  const pseudo="QA-"+Date.now(), classe="QA-V8";
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  await page.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith("pgw-v8"))localStorage.removeItem(k);sessionStorage.clear();});
  await page.reload({waitUntil:"networkidle"});
  await page.locator("[data-join-open]").click();
  await page.locator('[data-join-form] input[name="code"]').fill("PGW26");
  await page.locator('[data-join-form] input[name="classe"]').fill(classe);
  await page.locator('[data-join-form] input[name="pseudo"]').fill(pseudo);
  await page.locator('[data-join-form] button[type="submit"]').click();
  await expect(page.locator("[data-join-open]")).toContainText(pseudo,{timeout:15000});
  const ctx=await page.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-context-v1")));
  expect(ctx.userId).toBeTruthy(); expect(ctx.visitSessionId).toBeTruthy();

  await page.locator('[data-open-mission="1"]').click();
  const f=page.locator('[data-answer="objectives"]');
  await f.fill("QA SYNC VERSION A — réponse suffisamment longue pour validation.");
  await page.locator('[data-drawer-close]').last().click();
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-queue-v1")||"[]").length),{timeout:15000}).toBe(0);

  await page.locator('[data-open-mission="1"]').click();
  await f.fill("QA SYNC VERSION B — dernière version idempotente attendue.");
  await page.locator('[data-drawer-close]').last().click();
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-queue-v1")||"[]").length),{timeout:15000}).toBe(0);
  console.log("LIVE_QA_CONTEXT",JSON.stringify({pseudo,classe,...ctx}));
});


test("LIVE progression M01 puis M02 hors ligne et rattrapage automatique",async({page,context})=>{
  test.setTimeout(60000);
  const pseudo="QA-PROGRESS-"+Date.now(), classe="QA-V8";
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  await page.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith("pgw-v8"))localStorage.removeItem(k);sessionStorage.clear();});
  await page.reload({waitUntil:"networkidle"});

  await page.locator("[data-join-open]").click();
  await page.locator('[data-join-form] input[name="code"]').fill("PGW26");
  await page.locator('[data-join-form] input[name="classe"]').fill(classe);
  await page.locator('[data-join-form] input[name="pseudo"]').fill(pseudo);
  await page.locator('[data-join-form] button[type="submit"]').click();
  await expect(page.locator("[data-join-open]")).toContainText(pseudo,{timeout:15000});
  const ctx=await page.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-context-v1")));

  await page.locator('[data-open-mission="1"]').click();
  await page.locator('[data-answer="interests"][value="Développement / programmation"]').check();
  await page.locator('[data-answer="objectives"]').fill("Comparer les technologies utilisées et identifier une formation informatique adaptée à mon projet.");
  await page.locator('[data-mission-form="1"] button[type="submit"]').click();
  await expect(page.locator('[data-open-mission="2"]')).toBeEnabled();
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-queue-v1")||"[]").length),{timeout:15000}).toBe(0);

  await context.setOffline(true);
  await page.evaluate(()=>window.dispatchEvent(new Event("offline")));
  await page.locator('[data-open-mission="2"]').click();
  const values={
    school1:"École QA Alpha",diploma1:"BUT Informatique",admission1:"Baccalauréat et dossier",
    coding1:"Python, Java et projets",workstudy1:"Stages et alternance",
    distinct1:"Projets encadrés observés sur le stand et présentés par les étudiants.",
    school2:"École QA Beta",diploma2:"Licence Informatique",admission2:"Baccalauréat et dossier",
    coding2:"Python, C et projets",workstudy2:"Stage en troisième année",
    distinct2:"Parcours universitaire avec projets pratiques présentés pendant la visite.",
    bestfit:"Le BUT paraît adapté au profil NSI grâce au volume de programmation et aux projets concrets présentés."
  };
  for(const [key,value] of Object.entries(values)) await page.locator(`[data-answer="${key}"]`).fill(value);
  await page.locator('[data-mission-form="2"] button[type="submit"]').click();
  await expect(page.locator("[data-sync-status]")).toContainText("Synchronisation en attente");
  const queued=await page.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-queue-v1")||"[]").length);
  expect(queued).toBeGreaterThan(0);

  await context.setOffline(false);
  await page.evaluate(()=>window.dispatchEvent(new Event("online")));
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-queue-v1")||"[]").length),{timeout:20000}).toBe(0);
  await expect(page.locator("[data-sync-status]")).toContainText("Synchronisé");
  console.log("LIVE_PROGRESS_CONTEXT",JSON.stringify({pseudo,classe,...ctx,queuedBeforeReconnect:queued}));
});


test("teacher public shell V8.10 sans héritage visuel",async({page})=>{
  await page.goto("/teacher.html",{waitUntil:"networkidle"});
  await expect(page.locator(".teacher-brand")).toContainText("LYCÉE WATTEAU");
  await expect(page.locator(".teacher-version")).toContainText("V8.10");
  await expect(page.locator("#theme-toggle")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/eSport|Arcade|Cyber/i);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2);
  expect(overflow).toBeFalsy();
});


test("FIELD safe-exit bloque le départ hors ligne puis confirme après rattrapage",async({page,context})=>{
  test.setTimeout(60000);
  const pseudo="QA-FIELD-"+Date.now();
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  await page.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith("pgw-v8"))localStorage.removeItem(k);sessionStorage.clear();});
  await page.reload({waitUntil:"networkidle"});
  await page.locator("[data-join-open]").click();
  await page.locator('[data-join-form] input[name="code"]').fill("PGW26");
  await page.locator('[data-join-form] input[name="classe"]').fill("QA-FIELD");
  await page.locator('[data-join-form] input[name="pseudo"]').fill(pseudo);
  await page.locator('[data-join-form] button[type="submit"]').click();
  await expect(page.locator("[data-join-open]")).toContainText(pseudo,{timeout:15000});
  await context.setOffline(true); await page.evaluate(()=>window.dispatchEvent(new Event("offline")));
  await page.locator('[data-open-mission="1"]').click();
  await page.locator('[data-answer="interests"][value="Développement / programmation"]').check();
  await page.locator('[data-answer="objectives"]').fill("Tester le contrôle terrain de synchronisation avant le départ du salon.");
  await page.locator('[data-mission-form="1"] button[type="submit"]').click();
  await expect(page.locator("[data-field-exit]")).toContainText("Ne ferme pas");
  await expect(page.locator("[data-field-exit]")).toHaveAttribute("data-ready","false");
  await context.setOffline(false); await page.evaluate(()=>window.dispatchEvent(new Event("online")));
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-queue-v1")||"[]").length),{timeout:20000}).toBe(0);
  await expect(page.locator("[data-field-exit]")).toContainText("tu peux quitter");
  await expect(page.locator("[data-field-exit]")).toHaveAttribute("data-ready","true");
});


test("END-OF-VISIT contrat: session fermée bloque nouveau JOIN sans bloquer sync existante",async({page,context})=>{
  test.setTimeout(60000);
  const pseudo="QA-END-"+Date.now();
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  await page.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith("pgw-v8"))localStorage.removeItem(k);sessionStorage.clear();});
  await page.reload({waitUntil:"networkidle"});
  await page.locator("[data-join-open]").click();
  await page.locator('[data-join-form] input[name="code"]').fill("PGW26");
  await page.locator('[data-join-form] input[name="classe"]').fill("QA-END");
  await page.locator('[data-join-form] input[name="pseudo"]').fill(pseudo);
  await page.locator('[data-join-form] button[type="submit"]').click();
  await expect(page.locator("[data-join-open]")).toContainText(pseudo,{timeout:15000});

  await context.setOffline(true); await page.evaluate(()=>window.dispatchEvent(new Event("offline")));
  await page.locator('[data-open-mission="1"]').click();
  await page.locator('[data-answer="interests"][value="Développement / programmation"]').check();
  await page.locator('[data-answer="objectives"]').fill("Vérifier que la synchronisation reste possible après fermeture des nouvelles inscriptions.");
  await page.locator('[data-mission-form="1"] button[type="submit"]').click();
  await expect(page.locator("[data-field-exit]")).toHaveAttribute("data-ready","false");
  await context.setOffline(false); await page.evaluate(()=>window.dispatchEvent(new Event("online")));
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-queue-v1")||"[]").length),{timeout:20000}).toBe(0);
  await expect(page.locator("[data-field-exit]")).toHaveAttribute("data-ready","true");
});


test("END-OF-VISIT serveur: nouveau JOIN refusé sur session QA fermée",async({page})=>{
  test.setTimeout(30000);
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  await page.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith("pgw-v8"))localStorage.removeItem(k);sessionStorage.clear();});
  await page.reload({waitUntil:"networkidle"});
  await page.locator("[data-join-open]").click();
  await page.locator('[data-join-form] input[name="code"]').fill("QAEND12");
  await page.locator('[data-join-form] input[name="classe"]').fill("QA-END-CLOSED");
  await page.locator('[data-join-form] input[name="pseudo"]').fill("QA-REFUSED-"+Date.now());
  await page.locator('[data-join-form] button[type="submit"]').click();
  await expect(page.locator("[data-join-error]")).toContainText(/fermée|invalide/i,{timeout:15000});
  expect(await page.evaluate(()=>localStorage.getItem("pgw-v8-sync-context-v1"))).toBeNull();
});
