const QUEUE_KEY="pgw-v8-sync-queue-v1";
const STATUS_EVENT="pgw:sync-status";
let adapter=null,flushing=false;

const read=()=>{try{const q=JSON.parse(localStorage.getItem(QUEUE_KEY)||"[]");return Array.isArray(q)?q:[]}catch{return []}};
const write=q=>localStorage.setItem(QUEUE_KEY,JSON.stringify(q));
const emit=(state,detail={})=>window.dispatchEvent(new CustomEvent(STATUS_EVENT,{detail:{state,pending:read().length,...detail}}));
const makeId=(kind,payload)=>[kind,payload.missionId??"",payload.questionKey??""].join(":");

export function setSyncAdapter(next){adapter=next;emit(adapter?"local":"local",{configured:Boolean(adapter)});}
export function pendingCount(){return read().length;}
export function enqueue(kind,payload){
 const item={id:makeId(kind,payload),kind,payload,updatedAt:new Date().toISOString(),attempts:0};
 const q=read(); const i=q.findIndex(x=>x.id===item.id); if(i>=0) q[i]=item; else q.push(item);
 write(q); emit("pending"); if(navigator.onLine) void flushQueue(); return item.id;
}
export async function flushQueue(){
 if(flushing||!adapter||!navigator.onLine){emit(read().length?"pending":"local");return false}
 flushing=true; emit("syncing");
 try{
   let q=read();
   while(q.length&&navigator.onLine){
     const item=q[0];
     try{
       await adapter(item);
       q=read().filter(x=>x.id!==item.id);write(q);
     }catch(error){
       q=read(); const i=q.findIndex(x=>x.id===item.id);
       if(i>=0){q[i]={...q[i],attempts:(q[i].attempts||0)+1,lastError:String(error?.message||error)};write(q)}
       emit("pending",{error:true});return false;
     }
   }
   emit(q.length?"pending":"synced",{at:Date.now()});return q.length===0;
 }finally{flushing=false}
}
window.addEventListener("online",()=>void flushQueue());
window.addEventListener("offline",()=>emit(read().length?"pending":"local"));
emit(read().length?"pending":"local");
