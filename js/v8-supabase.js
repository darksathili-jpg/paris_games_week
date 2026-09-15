import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from "./v8-supabase-config.js";

const headers=()=>({"apikey":SUPABASE_PUBLISHABLE_KEY,"Content-Type":"application/json","Authorization":`Bearer ${sessionStorage.getItem("pgw-v8-access-token")||SUPABASE_PUBLISHABLE_KEY}`});

async function postgrestUpsert(path,body){
  let response;
  try{
    response=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{
      method:"POST",
      headers:{...headers(),"Prefer":"resolution=merge-duplicates,return=minimal"},
      body:JSON.stringify(body)
    });
  }catch(cause){
    const error=new Error("Supabase network failure",{cause});
    error.transient=true;
    throw error;
  }
  if(response.ok) return;
  let detail="";
  try{detail=await response.text()}catch{}
  const error=new Error(`Supabase ${response.status}${detail?` · ${detail.slice(0,500)}`:""}`);
  error.status=response.status;
  error.transient=[408,409,425,429,500,502,503,504,520].includes(response.status);
  throw error;
}

export function supabaseAdapter(){
 return async item=>{
   const ctx=JSON.parse(localStorage.getItem("pgw-v8-sync-context-v1")||"null");
   if(!ctx?.userId||!ctx?.visitSessionId) throw new Error("Session PGW non reliée à Supabase");
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
