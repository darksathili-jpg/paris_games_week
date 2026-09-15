import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from "./v8-supabase-config.js";
const CTX="pgw-v8-sync-context-v1";
const AUTH="pgw-v8-access-token";
const REFRESH="pgw-v8-refresh-token";
const H={"apikey":SUPABASE_PUBLISHABLE_KEY,"Content-Type":"application/json"};

async function json(r){const t=await r.text();let b={};try{b=t?JSON.parse(t):{}}catch{}if(!r.ok)throw new Error(b.message||b.error_description||b.hint||`HTTP ${r.status}`);return b}
async function rpc(name,body,token){
 return json(await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:"POST",headers:{...H,Authorization:`Bearer ${token||SUPABASE_PUBLISHABLE_KEY}`},body:JSON.stringify(body)}));
}
async function anonymousAuth(){
 const b=await json(await fetch(`${SUPABASE_URL}/auth/v1/signup`,{method:"POST",headers:H,body:JSON.stringify({data:{pgw_student:true}})}));
 if(!b.access_token||!b.user?.id) throw new Error("Authentification anonyme indisponible");
 sessionStorage.setItem(AUTH,b.access_token); if(b.refresh_token)sessionStorage.setItem(REFRESH,b.refresh_token); return b;
}
export function getJoinContext(){try{return JSON.parse(localStorage.getItem(CTX)||"null")}catch{return null}}
export async function joinStudent({code,pseudo,classe}){
 const prepared=await rpc("prepare_student_join",{p_code:code,p_pseudo:pseudo,p_classe:classe});
 const auth=await anonymousAuth();
 try{
   const claimed=await rpc("claim_student_join",{p_ticket:prepared.ticket},auth.access_token);
   const ctx={userId:claimed.user_id,visitSessionId:claimed.visit_session_id,pseudo:claimed.pseudo,classe:claimed.classe,title:prepared.title,joinedAt:new Date().toISOString()};
   localStorage.setItem(CTX,JSON.stringify(ctx)); return ctx;
 }catch(e){sessionStorage.removeItem(AUTH);sessionStorage.removeItem(REFRESH);throw e}
}
