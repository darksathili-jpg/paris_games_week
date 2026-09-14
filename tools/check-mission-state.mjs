import fs from "node:fs/promises";

const file = "assets/v8/mission-status.json";
const data = JSON.parse(await fs.readFile(file,"utf8"));
const order = data.states;
let failed = false;

for (const [id, mission] of Object.entries(data.missions)) {
  if (!order.includes(mission.state)) {
    console.error(`✗ mission ${id}: état inconnu "${mission.state}"`);
    failed = true;
    continue;
  }

  const idx = order.indexOf(mission.state);
  const needsMaster = idx >= order.indexOf("MASTER_APPROVED");

  if (needsMaster && !mission.master) {
    console.error(`✗ mission ${id}: état ${mission.state} mais aucun master déclaré`);
    failed = true;
  }

  if (mission.master) {
    try {
      await fs.access(mission.master);
      console.log(`✓ mission ${id}: ${mission.state} — master présent`);
    } catch {
      console.error(`✗ mission ${id}: master déclaré mais absent (${mission.master})`);
      failed = true;
    }
  } else {
    console.log(`· mission ${id}: ${mission.state}`);
  }
}

if (failed) process.exit(1);
