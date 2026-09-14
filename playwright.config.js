import {defineConfig} from "@playwright/test";
export default defineConfig({
 testDir:"./tests/visual",timeout:30000,
 expect:{toHaveScreenshot:{maxDiffPixelRatio:0.015,animations:"disabled"}},
 use:{baseURL:"http://127.0.0.1:4173",locale:"fr-FR",timezoneId:"Europe/Paris"},
 webServer:{command:"npm run serve:v8",url:"http://127.0.0.1:4173/preview-v8.html",reuseExistingServer:!process.env.CI,timeout:30000},
 projects:[
  {name:"mobile-390",use:{viewport:{width:390,height:844},deviceScaleFactor:1}},
  {name:"tablet-760",use:{viewport:{width:760,height:900},deviceScaleFactor:1}},
  {name:"desktop-1440",use:{viewport:{width:1440,height:1000},deviceScaleFactor:1}}
 ]
});
