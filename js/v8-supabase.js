import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from "./v8-supabase-config.js";
import {getValidAccessToken} from "./v8-session.js";

const TRANSIENT_STATUS=new Set([408,409,425,429,500,502,503,504,520]);

async function request(path,body,token){
  try{
    return await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{
      method:"POST",
      headers:{
        "apikey":SUPABASE_PUBLISHABLE_KEY,
        "Content-Type":"application/json",
        "Authorization":`Bearer ${token}`,
        "Prefer":"resolution=merge-duplicates,return=minimal"
      },
      body:JSON.stringify(body)
    });
  }catch(cause){
    const error=new Error("Supabase network failure",{cause});
    error.transient=true;error.stage="data-api-network";
    throw error;
  }
}

async function postgrestUpsert(path,body){
  let token=await getValidAccessToken();
  let response=await request(path,body,token);
  if(response.status===401){
    token=await getValidAccessToken({forceRefresh:true});
    response=await request(path,body,token);
  }
  if(response.ok)return;
  let detail="";
  try{detail=await response.text()}catch{}
  const error=new Error(`Supabase ${response.status}${detail?` · ${detail.slice(0,500)}`:""}`);
  error.stage="data-api";
  error.status=response.status;
  error.transient=TRANSIENT_STATUS.has(response.status);
  throw error;
}

export function supabaseAdapter(){
 return async item=>{
   const ctx=JSON.parse(localStorage.getItem("pgw-v8-sync-context-v1")||"null");
   if(!ctx?.userId||!ctx?.visitSessionId){
     const error=new Error("Session PGW non reliée à Supabase");
     error.stage="sync-context";error.status=401;throw error;
   }
   if(item.kind==="answer"){
     const p=item.payload;
     await postgrestUpsert(
       "responses?on_conflict=user_id,visit_session_id,question_key",
       {user_id:ctx.userId,visit_session_id:ctx.visitSessionId,mission_key:`mission-${String(p.missionId).padStart(2,"0")}`,question_key:p.questionKey,answer:p.value,updated_at:item.updatedAt}
     );
   }else if(item.kind==="progress"){
     const p=item.payload;
     await postgrestUpsert(
       "progress?on_conflict=user_id,visit_session_id,mission_key",
       {user_id:ctx.userId,visit_session_id:ctx.visitSessionId,mission_key:`mission-${String(p.missionId).padStart(2,"0")}`,completed:Boolean(p.completed),xp:p.xp||0,updated_at:item.updatedAt}
     );
   }
 };
}
