import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from "./v8-supabase-config.js";
const CTX="pgw-v8-sync-context-v1";
const AUTH="pgw-v8-access-token";
const REFRESH="pgw-v8-refresh-token";
const H={"apikey":SUPABASE_PUBLISHABLE_KEY,"Content-Type":"application/json"};

async function json(stage,r){
 const t=await r.text();let b={};try{b=t?JSON.parse(t):{}}catch{b={raw:t}}
 if(r.ok)return b;
 const detail=b.message||b.error_description||b.hint||b.msg||`HTTP ${r.status}`;
 const e=new Error(r.status===429?"Trop de connexions simultanées. Réessaie dans quelques instants.":detail);
 e.stage=stage;e.status=r.status;e.code=b.code||b.error_code||null;e.retryAfter=r.headers.get("retry-after")||null;e.detail=b;
 console.error("PGW JOIN failed",{stage,status:e.status,code:e.code,retryAfter:e.retryAfter,detail:b});
 throw e;
}
async function rpc(name,body,token){
 return json("join-rpc",await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:"POST",headers:{...H,Authorization:`Bearer ${token||SUPABASE_PUBLISHABLE_KEY}`},body:JSON.stringify(body)}));
}
async function anonymousAuth(){
 const b=await json("anonymous-auth",await fetch(`${SUPABASE_URL}/auth/v1/signup`,{method:"POST",headers:H,body:JSON.stringify({data:{pgw_student:true}})}));
 if(!b.access_token||!b.user?.id) throw new Error("Authentification anonyme indisponible");
 sessionStorage.setItem(AUTH,b.access_token); if(b.refresh_token)sessionStorage.setItem(REFRESH,b.refresh_token); return b;
}
export function getJoinContext(){try{return JSON.parse(localStorage.getItem(CTX)||"null")}catch{return null}}
export async function joinStudent({code,pseudo,classe}){
 const auth=await anonymousAuth();
 try{
   const joined=await rpc("join_visit_session",{p_code:code,p_pseudo:pseudo,p_classe:classe},auth.access_token);
   const ctx={userId:joined.user_id,visitSessionId:joined.visit_session_id,pseudo:joined.pseudo,classe:joined.classe,title:joined.title,joinedAt:new Date().toISOString()};
   localStorage.setItem(CTX,JSON.stringify(ctx)); return ctx;
 }catch(e){sessionStorage.removeItem(AUTH);sessionStorage.removeItem(REFRESH);throw e}
}
