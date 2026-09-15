import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from "./v8-supabase-config.js";
const headers=()=>({"apikey":SUPABASE_PUBLISHABLE_KEY,"Content-Type":"application/json","Authorization":`Bearer ${sessionStorage.getItem("pgw-v8-access-token")||SUPABASE_PUBLISHABLE_KEY}`});
export function supabaseAdapter(){
 return async item=>{
   const ctx=JSON.parse(localStorage.getItem("pgw-v8-sync-context-v1")||"null");
   if(!ctx?.userId||!ctx?.visitSessionId) throw new Error("Session PGW non reliée à Supabase");
   if(item.kind==="answer"){
     const p=item.payload;
     const body={user_id:ctx.userId,visit_session_id:ctx.visitSessionId,mission_key:`mission-${String(p.missionId).padStart(2,"0")}`,question_key:p.questionKey,answer:p.value,updated_at:item.updatedAt};
     const r=await fetch(`${SUPABASE_URL}/rest/v1/responses?on_conflict=user_id,visit_session_id,question_key`,{method:"POST",headers:{...headers(),"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(body)});
     if(!r.ok) throw new Error(`responses ${r.status}`);
   }else if(item.kind==="progress"){
     const p=item.payload;
     const body={user_id:ctx.userId,visit_session_id:ctx.visitSessionId,mission_key:`mission-${String(p.missionId).padStart(2,"0")}`,completed:Boolean(p.completed),xp:p.xp||0,updated_at:item.updatedAt};
     const r=await fetch(`${SUPABASE_URL}/rest/v1/progress?on_conflict=user_id,visit_session_id,mission_key`,{method:"POST",headers:{...headers(),"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(body)});
     if(!r.ok) throw new Error(`progress ${r.status}`);
   }
 };
}
