import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SAME_ORIGIN = "http://127.0.0.1:4173";

function blockingAxe(violations){
  return violations
    .filter(v=>["serious","critical"].includes(v.impact))
    .map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.length}));
}

test("RELEASE runtime sans erreur JS ni ressource locale 4xx/5xx",async({page})=>{
  const consoleErrors=[];
  const pageErrors=[];
  const badResponses=[];
  page.on("console",msg=>{if(msg.type()==="error")consoleErrors.push(msg.text())});
  page.on("pageerror",err=>pageErrors.push(String(err)));
  page.on("response",response=>{
    const url=response.url();
    if(url.startsWith(SAME_ORIGIN)&&response.status()>=400) badResponses.push([response.status(),url]);
  });
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  await expect(page.locator("#hero-title")).toBeVisible();
  await page.goto("/teacher.html",{waitUntil:"networkidle"});
  await expect(page.locator("body")).toBeVisible();
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(badResponses).toEqual([]);
});

test("RELEASE accessibilite WCAG: aucune violation serious/critical",async({page})=>{
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  let report=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa","wcag22aa"]).analyze();
  expect(blockingAxe(report.violations)).toEqual([]);
  await page.locator('[data-open-mission="1"]').click();
  report=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa","wcag22aa"]).analyze();
  expect(blockingAxe(report.violations)).toEqual([]);
});

test("RELEASE clavier: skip-link et mission utilisables sans souris",async({page})=>{
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#missions$/);
  await page.locator('[data-open-mission="1"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-mission-drawer]")).toBeVisible();
  await expect(page.locator(".mission-drawer__close")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-mission-drawer]")).toBeHidden();
});

test("RELEASE petit smartphone 360px sans debordement et cibles tactiles",async({browser})=>{
  const context=await browser.newContext({viewport:{width:360,height:780},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2);
  expect(overflow).toBeFalsy();
  const badTargets=await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll('button,a[href],input,textarea,select')];
    return nodes.filter(el=>{
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      if(s.display==="none"||s.visibility==="hidden"||r.width===0||r.height===0||el.disabled)return false;
      return r.width<24||r.height<24;
    }).map(el=>({tag:el.tagName,text:(el.textContent||el.getAttribute('aria-label')||el.name||'').trim().slice(0,60),width:Math.round(el.getBoundingClientRect().width),height:Math.round(el.getBoundingClientRect().height)}));
  });
  expect(badTargets).toEqual([]);
  await page.locator('[data-open-mission="1"]').click();
  const drawer=await page.locator(".mission-drawer__panel").boundingBox();
  expect(drawer.x).toBeGreaterThanOrEqual(0);
  expect(drawer.x+drawer.width).toBeLessThanOrEqual(361);
  await context.close();
});

test("RELEASE reseau lent: shell et mission restent utilisables",async({page})=>{
  const cdp=await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions",{offline:false,latency:150,downloadThroughput:93750,uploadThroughput:31250,connectionType:"cellular3g"});
  const started=Date.now();
  await page.goto("/preview-v8.html",{waitUntil:"domcontentloaded",timeout:30000});
  await expect(page.locator("#hero-title")).toBeVisible({timeout:10000});
  await expect(page.locator('[data-open-mission="1"]')).toBeVisible({timeout:15000});
  expect(Date.now()-started).toBeLessThan(20000);
  await cdp.send("Network.disable");
});

test("RELEASE budget poids initial raisonnable",async({page})=>{
  await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
  const bytes=await page.evaluate(()=>{
    const nav=performance.getEntriesByType("navigation")[0];
    const resources=performance.getEntriesByType("resource");
    const size=e=>Math.max(e.transferSize||0,e.encodedBodySize||0);
    return size(nav)+resources.reduce((sum,e)=>sum+size(e),0);
  });
  expect(bytes).toBeLessThan(3_500_000);
});

test("RELEASE aucune cle privilegiee exposee dans les sources client V8",async({request})=>{
  const paths=["preview-v8.html","js/v8-app.js","js/v8-join.js","js/v8-session.js","js/v8-supabase.js","js/v8-supabase-config.js","js/v8-sync.js"];
  const findings=[];
  for(const path of paths){
    const response=await request.get("/"+path);
    expect(response.ok()).toBeTruthy();
    const body=await response.text();
    if(/service_role|sb_secret_/i.test(body))findings.push(path);
  }
  expect(findings).toEqual([]);
});
