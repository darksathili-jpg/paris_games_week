import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const specs = [
  { id: "hero", file: "assets/v8/masters/hero.png", minW: 2400, minH: 1200, minRatio: 1.5, maxRatio: 2.1, required: false },
  ...Array.from({length:6},(_,i)=>({
    id: `mission-${String(i+1).padStart(2,"0")}`,
    file: `assets/v8/masters/mission-${String(i+1).padStart(2,"0")}.png`,
    minW: 1600,
    minH: 1000,
    minRatio: 1.45,
    maxRatio: 1.75,
    required: i===0
  }))
];

let failed = false;
for (const spec of specs) {
  try {
    await fs.access(spec.file);
    const meta = await sharp(spec.file).metadata();
    const ratio = (meta.width ?? 0) / (meta.height ?? 1);
    const ok = (meta.width ?? 0) >= spec.minW &&
      (meta.height ?? 0) >= spec.minH &&
      ratio >= spec.minRatio &&
      ratio <= spec.maxRatio;

    if (!ok) {
      failed = true;
      console.error(`✗ ${spec.id}: ${meta.width}×${meta.height}, ratio ${ratio.toFixed(3)}`);
    } else {
      console.log(`✓ ${spec.id}: ${meta.width}×${meta.height}, ratio ${ratio.toFixed(3)}`);
    }
  } catch {
    if (spec.required) {
      failed = true;
      console.error(`✗ ${spec.id}: master requis absent (${spec.file})`);
    } else {
      console.log(`· ${spec.id}: master non présent, ignoré pour l'instant`);
    }
  }
}

if (failed) process.exit(1);
