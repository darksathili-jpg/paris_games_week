import {test,expect} from "@playwright/test";

test("SESSION DURABILITY V8.16 — fermeture, refresh et reprise sans nouveau compte",async({browser})=>{
  test.setTimeout(90000);
  const pseudo=`QA-SESSION-816-${Date.now()}`;
  let signupCount=0;
  let refreshCount=0;

  const context1=await browser.newContext({viewport:{width:1280,height:800}});
  context1.on("request",request=>{
    const url=request.url();
    if(url.includes("/auth/v1/signup"))signupCount++;
    if(url.includes("/auth/v1/token?grant_type=refresh_token"))refreshCount++;
  });
  const page1=await context1.newPage();
  await page1.goto("/preview-v8.html",{waitUntil:"networkidle"});
  await page1.evaluate(()=>{
    for(const key of Object.keys(localStorage))if(key.startsWith("pgw-v8"))localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page1.reload({waitUntil:"networkidle"});

  await page1.locator("[data-join-open]").click();
  await page1.locator('[data-join-form] input[name="code"]').fill("PGW26");
  await page1.locator('[data-join-form] input[name="classe"]').fill("QA-SESSION");
  await page1.locator('[data-join-form] input[name="pseudo"]').fill(pseudo);
  await page1.locator('[data-join-form] button[type="submit"]').click();
  await expect(page1.locator("[data-join-open]")).toContainText(pseudo,{timeout:15000});

  const initial=await page1.evaluate(()=>({
    ctx:JSON.parse(localStorage.getItem("pgw-v8-sync-context-v1")||"null"),
    auth:JSON.parse(localStorage.getItem("pgw-v8-auth-session-v1")||"null"),
    legacyAccess:sessionStorage.getItem("pgw-v8-access-token"),
    legacyRefresh:sessionStorage.getItem("pgw-v8-refresh-token")
  }));
  expect(initial.ctx?.userId).toBeTruthy();
  expect(initial.auth?.accessToken).toBeTruthy();
  expect(initial.auth?.refreshToken).toBeTruthy();
  expect(initial.auth?.userId).toBe(initial.ctx.userId);
  expect(initial.legacyAccess).toBeNull();
  expect(initial.legacyRefresh).toBeNull();
  expect(signupCount).toBe(1);

  // Force un refresh au prochain démarrage tout en conservant exactement la même session locale.
  await page1.evaluate(()=>{
    const auth=JSON.parse(localStorage.getItem("pgw-v8-auth-session-v1"));
    auth.expiresAt=Date.now()+1000;
    localStorage.setItem("pgw-v8-auth-session-v1",JSON.stringify(auth));
  });
  const persisted=await context1.storageState();
  await context1.close();

  // Nouveau contexte = sessionStorage vidé, localStorage restauré : équivalent fermeture/réouverture navigateur.
  const context2=await browser.newContext({storageState:persisted,viewport:{width:1280,height:800}});
  context2.on("request",request=>{
    const url=request.url();
    if(url.includes("/auth/v1/signup"))signupCount++;
    if(url.includes("/auth/v1/token?grant_type=refresh_token"))refreshCount++;
  });
  const page2=await context2.newPage();
  let blockRefresh=false;
  await page2.route(/\/auth\/v1\/token\?grant_type=refresh_token/,async route=>{
    if(blockRefresh){
      await route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({message:"QA simulated transient refresh outage"})});
    }else{
      await route.continue();
    }
  });
  await page2.goto("/preview-v8.html",{waitUntil:"networkidle"});

  await expect(page2.locator("[data-join-open]")).toContainText(pseudo);
  await expect.poll(()=>refreshCount,{timeout:15000}).toBeGreaterThan(0);
  await expect.poll(async()=>page2.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-auth-session-v1")||"null")?.expiresAt||0),{timeout:15000}).toBeGreaterThan(Date.now()+10*60*1000);
  expect(signupCount).toBe(1);

  const reopened=await page2.evaluate(()=>({
    ctx:JSON.parse(localStorage.getItem("pgw-v8-sync-context-v1")||"null"),
    auth:JSON.parse(localStorage.getItem("pgw-v8-auth-session-v1")||"null"),
    legacyAccess:sessionStorage.getItem("pgw-v8-access-token")
  }));
  expect(reopened.ctx?.userId).toBe(initial.ctx.userId);
  expect(reopened.auth?.userId).toBe(initial.ctx.userId);
  expect(reopened.legacyAccess).toBeNull();

  // Simule maintenant une panne Auth transitoire : la réponse doit rester dans la queue locale.
  blockRefresh=true;
  await page2.evaluate(()=>{
    const auth=JSON.parse(localStorage.getItem("pgw-v8-auth-session-v1"));
    auth.expiresAt=Date.now()-1000;
    localStorage.setItem("pgw-v8-auth-session-v1",JSON.stringify(auth));
    localStorage.removeItem("pgw-v8-sync-queue-v1");
  });
  await page2.locator('[data-open-mission="1"]').click();
  await page2.locator('[data-answer="objectives"]').fill("V8.16 conserve cette réponse pendant une panne temporaire du renouvellement Auth Supabase.");
  await page2.locator('[data-drawer-close]').last().click();

  await expect.poll(async()=>page2.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-queue-v1")||"[]").length),{timeout:10000}).toBeGreaterThan(0);
  const queuedDuringFailure=await page2.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-queue-v1")||"[]").length);
  expect(queuedDuringFailure).toBeGreaterThan(0);
  expect(signupCount).toBe(1);

  // Retour Auth/réseau : refresh de la même identité puis vidage automatique de la queue.
  blockRefresh=false;
  await page2.evaluate(()=>window.dispatchEvent(new Event("online")));
  await expect.poll(async()=>page2.evaluate(()=>JSON.parse(localStorage.getItem("pgw-v8-sync-queue-v1")||"[]").length),{timeout:25000}).toBe(0);
  await expect(page2.locator("[data-sync-status]")).toContainText("Synchronisé");

  const finalState=await page2.evaluate(()=>({
    ctx:JSON.parse(localStorage.getItem("pgw-v8-sync-context-v1")||"null"),
    auth:JSON.parse(localStorage.getItem("pgw-v8-auth-session-v1")||"null")
  }));
  expect(finalState.ctx?.userId).toBe(initial.ctx.userId);
  expect(finalState.auth?.userId).toBe(initial.ctx.userId);
  expect(signupCount).toBe(1);
  expect(refreshCount).toBeGreaterThan(1);

  console.log("SESSION_DURABILITY_V816",JSON.stringify({pseudo,userId:initial.ctx.userId,signupCount,refreshCount,queuedDuringFailure}));
  await context2.close();
});
