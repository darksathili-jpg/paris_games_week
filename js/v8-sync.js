const QUEUE_KEY="pgw-v8-sync-queue-v1";
const STATUS_EVENT="pgw:sync-status";
const LAST_SYNC_KEY="pgw-v8-last-sync-v1";
const RETRY_DELAYS=[700,1500,3000,6000];
let adapter=null,flushing=false,retryTimer=null;

const read=()=>{try{const q=JSON.parse(localStorage.getItem(QUEUE_KEY)||"[]");return Array.isArray(q)?q:[]}catch{return []}};
const write=q=>localStorage.setItem(QUEUE_KEY,JSON.stringify(q));
const emit=(state,detail={})=>window.dispatchEvent(new CustomEvent(STATUS_EVENT,{detail:{state,pending:read().length,...detail}}));
const makeId=(kind,payload)=>[kind,payload.missionId??"",payload.questionKey??""].join(":");
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const errorDetail=error=>({message:String(error?.message||error),status:error?.status||null,transient:Boolean(error?.transient)});

export function syncSnapshot(){let last=null;try{last=JSON.parse(localStorage.getItem(LAST_SYNC_KEY)||"null")}catch{}return {pending:read().length,lastSync:last?.at||null,online:navigator.onLine};}
export function setSyncAdapter(next){adapter=next;emit(adapter?"local":"local",{configured:Boolean(adapter)});if(adapter&&navigator.onLine&&read().length)void flushQueue();}
export function pendingCount(){return read().length;}

export function enqueue(kind,payload){
 const item={id:makeId(kind,payload),kind,payload,updatedAt:new Date().toISOString(),attempts:0};
 const q=read();const i=q.findIndex(x=>x.id===item.id);if(i>=0)q[i]=item;else q.push(item);
 write(q);emit("pending");if(navigator.onLine)void flushQueue();return item.id;
}

function scheduleRetry(attempt){
 clearTimeout(retryTimer);
 const delay=RETRY_DELAYS[Math.min(attempt,RETRY_DELAYS.length-1)];
 retryTimer=setTimeout(()=>{retryTimer=null;void flushQueue();},delay);
}

export async function flushQueue(){
 if(flushing||!adapter||!navigator.onLine){emit(read().length?"pending":"local");return false}
 flushing=true;clearTimeout(retryTimer);retryTimer=null;emit("syncing");
 try{
   let q=read();
   while(q.length&&navigator.onLine){
     const item=q[0];
     try{
       await adapter(item);
       q=read().filter(x=>x.id!==item.id);write(q);
     }catch(error){
       q=read();const i=q.findIndex(x=>x.id===item.id);
       const attempts=i>=0?(q[i].attempts||0)+1:1;
       if(i>=0){q[i]={...q[i],attempts,lastError:errorDetail(error),lastAttemptAt:new Date().toISOString()};write(q)}
       console.error("PGW sync item failed",{id:item.id,attempts,...errorDetail(error)});
       emit("pending",{error:true,status:error?.status||null});
       if(error?.transient&&navigator.onLine) scheduleRetry(attempts-1);
       return false;
     }
   }
   q=read();
   const at=Date.now();
   if(!q.length)localStorage.setItem(LAST_SYNC_KEY,JSON.stringify({at}));
   emit(q.length?"pending":"synced",{at});
   return q.length===0;
 }finally{flushing=false}
}
window.addEventListener("online",()=>{clearTimeout(retryTimer);retryTimer=null;void flushQueue()});
window.addEventListener("offline",()=>{clearTimeout(retryTimer);retryTimer=null;emit(read().length?"pending":"local")});
emit(read().length?"pending":"local");
