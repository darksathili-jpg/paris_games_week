import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const jobs = [
  {id:"hero",src:"assets/v8/masters/hero.png",widths:[960,1600,2400],qualityWebp:86,qualityAvif:58},
  ...Array.from({length:6},(_,i)=>({
    id:`mission-${String(i+1).padStart(2,"0")}`,
    src:`assets/v8/masters/mission-${String(i+1).padStart(2,"0")}.png`,
    widths:[480,720,1200],
    qualityWebp:86,
    qualityAvif:58
  }))
];

const manifest = {version:1,generatedAt:new Date().toISOString(),assets:{}};

for (const job of jobs) {
  try {
    await fs.access(job.src);
  } catch {
    console.log(`· ${job.id}: source absente, build ignoré`);
    continue;
  }

  const meta = await sharp(job.src).metadata();
  if (!meta.width || !meta.height) throw new Error(`${job.id}: dimensions inconnues`);

  const outDir = path.join("assets","v8","generated",job.id);
  await fs.mkdir(outDir,{recursive:true});
  manifest.assets[job.id]=[];

  for (const width of job.widths) {
    if (width > meta.width) throw new Error(`${job.id}: upscale interdit (${width} > ${meta.width})`);
    const height = Math.round(width * meta.height / meta.width);

    for (const format of ["webp","avif"]) {
      const outfile = path.join(outDir,`${job.id}-${width}.${format}`);
      let pipeline = sharp(job.src).resize({width,withoutEnlargement:true,kernel:sharp.kernel.lanczos3});
      pipeline = format==="webp"
        ? pipeline.webp({quality:job.qualityWebp,smartSubsample:true})
        : pipeline.avif({quality:job.qualityAvif,effort:6});

      await pipeline.toFile(outfile);
      const stat = await fs.stat(outfile);
      manifest.assets[job.id].push({
        format,
        width,
        height,
        bytes:stat.size,
        src:outfile.replaceAll(path.sep,"/")
      });
      console.log(`✓ ${outfile} — ${Math.round(stat.size/1024)} KiB`);
    }
  }
}

await fs.mkdir("assets/v8",{recursive:true});
await fs.writeFile("assets/v8/manifest.json",JSON.stringify(manifest,null,2));
console.log("✓ assets/v8/manifest.json");
