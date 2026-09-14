export const missions = [
  {id:1,slug:"launch-zone",title:"Launch Zone",label:"MISSION 01",description:"Préparer sa stratégie avant de se disperser dans le salon.",xp:100,state:"ready",accent:"var(--cyan)"},
  {id:2,slug:"campus-scan",title:"Campus Scan",label:"MISSION 02",description:"Comparer deux formations avec des critères vérifiables.",xp:200,state:"locked",accent:"var(--green)"},
  {id:3,slug:"code-scanner",title:"Code Scanner",label:"MISSION 03",description:"Identifier les mécanismes NSI invisibles derrière un jeu ou une démo.",xp:300,state:"locked",accent:"var(--orange)"},
  {id:4,slug:"innovation-lab",title:"Innovation Lab",label:"MISSION 04",description:"Analyser IA, données, automatisation et fiabilité au-delà du discours commercial.",xp:250,state:"locked",accent:"var(--violet)"},
  {id:5,slug:"pro-link",title:"Pro Link",label:"MISSION 05",description:"Rencontrer une personne du numérique et comprendre son parcours réel.",xp:200,state:"locked",accent:"var(--pink)"},
  {id:6,slug:"boss-final",title:"Boss Final",label:"MISSION 06",description:"Construire un bilan argumenté sur informatique, études et orientation.",xp:300,state:"locked",accent:"var(--yellow)"}
];
export const totalXp = missions.reduce((sum,m)=>sum+m.xp,0);