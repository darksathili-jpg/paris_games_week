import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ids=["hero",...Array.from({length:6},(_,i)=>`mission-${String(i+1).padStart(2,"0")}`)];
async function findSource(id){
  for(const ext of ["png","svg"]){
    const file=`assets/v8/masters/${id}.${ext}`;
    try{await fs.access(file);return file;}catch{}
  }
  return null;
}
const manifest={version:2,generatedAt:new Date().toISOString(),assets:{}};
for(const id of ids){
  const src=await findSource(id);
  if(!src){console.log(`· ${id}: source absente, build ignoré`);continue;}
  const isHero=id==="hero";
  const widths=isHero?[960,1600,2400]:[480,720,1200];
  const meta=await sharp(src,{density:144}).metadata();
  if(!meta.width||!meta.height)throw new Error(`${id}: dimensions inconnues`);
  const outDir=path.join("assets","v8","generated",id);
  await fs.mkdir(outDir,{recursive:true});
  manifest.assets[id]=[];
  for(const width of widths){
    if(width>meta.width)throw new Error(`${id}: upscale interdit (${width} > ${meta.width})`);
    const height=Math.round(width*meta.height/meta.width);
    for(const format of ["webp","avif"]){
      const outfile=path.join(outDir,`${id}-${width}.${format}`);
      let pipeline=sharp(src,{density:144}).resize({width,withoutEnlargement:true,kernel:sharp.kernel.lanczos3});
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
