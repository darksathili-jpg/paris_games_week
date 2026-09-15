import fs from "node:fs";

const file=process.argv[2]||"/tmp/lighthouse-v8.json";
const report=JSON.parse(fs.readFileSync(file,"utf8"));
const categories=report.categories||{};
const scores={
  performance:categories.performance?.score??0,
  accessibility:categories.accessibility?.score??0,
  bestPractices:categories["best-practices"]?.score??0
};
const thresholds={performance:0.75,accessibility:0.95,bestPractices:0.90};
console.log("LIGHTHOUSE_V8",JSON.stringify({scores,thresholds}));
const failed=Object.entries(thresholds).filter(([key,min])=>scores[key]<min);
if(failed.length){
  for(const [key,min] of failed)console.error(`Lighthouse ${key}: ${Math.round(scores[key]*100)} < ${Math.round(min*100)}`);
  process.exit(1);
}
