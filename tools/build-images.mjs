import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const status=JSON.parse(await fs.readFile("assets/v8/mission-status.json","utf8"));
const approvedStates=new Set(["MASTER_APPROVED","RESPONSIVE_BUILD","INTEGRATED","QA_PASSED"]);
const manifest={version:3,generatedAt:new Date().toISOString(),assets:{}};

for(const [num,mission] of Object.entries(status.missions)){
  if(!approvedStates.has(mission.state)) continue;
  const id=`mission-${num}`;
  const src=`assets/v8/masters/${id}.png`;
  const meta=await sharp(src).metadata();
  if(!meta.width||!meta.height) throw new Error(`${id}: dimensions inconnues`);
  const outDir=path.join("assets","v8","generated",id);
  await fs.mkdir(outDir,{recursive:true});
  manifest.assets[id]=[];
  for(const width of [480,720,1200]){
    if(width>meta.width) throw new Error(`${id}: upscale interdit (${width} > ${meta.width})`);
    const height=Math.round(width*meta.height/meta.width);
    for(const format of ["webp","avif"]){
      const outfile=path.join(outDir,`${id}-${width}.${format}`);
      let pipeline=sharp(src).resize({width,withoutEnlargement:true,kernel:sharp.kernel.lanczos3});
      pipeline=format==="webp"?pipeline.webp({quality:86,smartSubsample:true}):pipeline.avif({quality:58,effort:6});
      await pipeline.toFile(outfile);
      const stat=await fs.stat(outfile);
      manifest.assets[id].push({format,width,height,bytes:stat.size,src:outfile.replaceAll(path.sep,"/")});
      console.log(`✓ ${outfile} — ${Math.round(stat.size/1024)} KiB`);
    }
  }
}
await fs.mkdir("assets/v8",{recursive:true});
await fs.writeFile("assets/v8/manifest.json",JSON.stringify(manifest,null,2));
console.log("✓ assets/v8/manifest.json");
