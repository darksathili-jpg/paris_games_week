import {test,expect} from "@playwright/test";
test("grille V8 stable",async({page})=>{
 await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
 await expect(page.locator("[data-mission-grid] .mission")).toHaveCount(6);
 const cards=page.locator("[data-mission-grid] .mission");
 for(let i=0;i<6;i++){const box=await cards.nth(i).boundingBox();expect(box?.width??0).toBeGreaterThan(250);expect(box?.height??0).toBeGreaterThan(220);}
 await page.locator("#missions").scrollIntoViewIfNeeded();
 await expect(page.locator("#missions")).toHaveScreenshot("missions-grid.png",{animations:"disabled"});
});
test("aucune image de mission cassée",async({page})=>{
 const failures=[];page.on("response",r=>{if(r.url().includes("/assets/v8/generated/")&&r.status()>=400)failures.push([r.status(),r.url()]);});
 await page.goto("/preview-v8.html",{waitUntil:"networkidle"});
 const imgs=page.locator(".mission__media img");await expect(imgs).toHaveCount(6);
 for(let i=0;i<6;i++){const ok=await imgs.nth(i).evaluate(img=>img.complete&&img.naturalWidth>0);expect(ok,"mission image "+(i+1)).toBeTruthy();}
 expect(failures).toEqual([]);
});
