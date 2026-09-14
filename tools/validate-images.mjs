import fs from "node:fs/promises";
import sharp from "sharp";

const ids=["hero",...Array.from({length:6},(_,i)=>`mission-${String(i+1).padStart(2,"0")}`)];
async function findSource(id){
  for(const ext of ["png","svg"]){
    const file=`assets/v8/masters/${id}.${ext}`;
    try{await fs.access(file);return file;}catch{}
  }
  return null;
}
let failed=false;
for(const id of ids){
  const file=await findSource(id);
  const required=id!=="hero";
  if(!file){
    if(required){failed=true;console.error(`✗ ${id}: master requis absent`);}
    else console.log(`· ${id}: master non présent, ignoré`);
    continue;
  }
  const meta=await sharp(file,{density:144}).metadata();
  const width=meta.width??0,height=meta.height??0,ratio=width/(height||1);
  const isHero=id==="hero";
  const minW=isHero?2400:1600,minH=isHero?1200:1000,minRatio=isHero?1.5:1.45,maxRatio=isHero?2.1:1.75;
  const ok=width>=minW&&height>=minH&&ratio>=minRatio&&ratio<=maxRatio;
  if(!ok){failed=true;console.error(`✗ ${id}: ${width}×${height}, ratio ${ratio.toFixed(3)}`);}
  else console.log(`✓ ${id}: ${width}×${height}, ratio ${ratio.toFixed(3)} — ${file}`);
}
if(failed)process.exit(1);
