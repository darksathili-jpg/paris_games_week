import fs from "node:fs/promises";
import sharp from "sharp";

const status=JSON.parse(await fs.readFile("assets/v8/mission-status.json","utf8"));
const approvedStates=new Set(["MASTER_APPROVED","RESPONSIVE_BUILD","INTEGRATED","QA_PASSED"]);
let failed=false;

for(const [num,mission] of Object.entries(status.missions)){
  const id=`mission-${num}`;
  if(!approvedStates.has(mission.state)){
    console.log(`· ${id}: ${mission.state}, validation raster différée`);
    continue;
  }
  const expected=`assets/v8/masters/${id}.png`;
  if(mission.master!==expected){
    failed=true; console.error(`✗ ${id}: master approuvé doit être ${expected}`); continue;
  }
  try{await fs.access(expected)}catch{
    failed=true; console.error(`✗ ${id}: PNG approuvé absent`); continue;
  }
  const meta=await sharp(expected).metadata();
  const width=meta.width??0,height=meta.height??0,ratio=width/(height||1);
  const ok=width>=1500&&height>=930&&ratio>=1.55&&ratio<=1.65;
  if(!ok){failed=true;console.error(`✗ ${id}: ${width}×${height}, ratio ${ratio.toFixed(3)}`);}
  else console.log(`✓ ${id}: ${width}×${height}, ratio ${ratio.toFixed(3)}`);
}
if(failed)process.exit(1);
