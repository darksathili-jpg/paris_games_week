import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from "./v8-supabase-config.js";
import {getOrCreateStudentSession,getValidAccessToken} from "./v8-session.js";

const CTX="pgw-v8-sync-context-v1";
const H={"apikey":SUPABASE_PUBLISHABLE_KEY,"Content-Type":"application/json"};

async function json(stage,r){
 const t=await r.text();let b={};try{b=t?JSON.parse(t):{}}catch{b={raw:t}}
 if(r.ok)return b;
 const detail=b.message||b.error_description||b.hint||b.msg||`HTTP ${r.status}`;
 const e=new Error(r.status===429?"Trop de connexions simultanées. Réessaie dans quelques instants.":detail);
 e.stage=stage;e.status=r.status;e.code=b.code||b.error_code||null;e.retryAfter=r.headers.get("retry-after")||null;e.detail=b;
 e.transient=[408,425,429,500,502,503,504,520].includes(r.status);
 console.error("PGW JOIN failed",{stage,status:e.status,code:e.code,retryAfter:e.retryAfter,detail:b});
 throw e;
}

async function rpc(name,body,token){
 let response;
 try{
   response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:"POST",headers:{...H,Authorization:`Bearer ${token||SUPABASE_PUBLISHABLE_KEY}`},body:JSON.stringify(body)});
 }catch(cause){
   const e=new Error("Réseau indisponible pendant la liaison de la visite.",{cause});
   e.stage="join-rpc-network";e.transient=true;throw e;
 }
 return json("join-rpc",response);
}

export function getJoinContext(){try{return JSON.parse(localStorage.getItem(CTX)||"null")}catch{return null}}

export async function joinStudent({code,pseudo,classe}){
 const auth=await getOrCreateStudentSession();
 let token=auth.accessToken;
 let joined;
 try{
   joined=await rpc("join_visit_session",{p_code:code,p_pseudo:pseudo,p_classe:classe},token);
 }catch(error){
   if(error?.status!==401)throw error;
   token=await getValidAccessToken({forceRefresh:true});
   joined=await rpc("join_visit_session",{p_code:code,p_pseudo:pseudo,p_classe:classe},token);
 }
 if(auth.userId&&joined.user_id&&auth.userId!==joined.user_id){
   const error=new Error("La session restaurée ne correspond pas au profil de cette visite.");
   error.stage="join-user-mismatch";error.status=401;error.code="user_mismatch";throw error;
 }
 const ctx={userId:joined.user_id,visitSessionId:joined.visit_session_id,pseudo:joined.pseudo,classe:joined.classe,title:joined.title,joinedAt:new Date().toISOString()};
 localStorage.setItem(CTX,JSON.stringify(ctx));
 return ctx;
}
