import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from "./v8-supabase-config.js";

const SESSION_KEY="pgw-v8-auth-session-v1";
const LEGACY_ACCESS="pgw-v8-access-token";
const LEGACY_REFRESH="pgw-v8-refresh-token";
const CTX_KEY="pgw-v8-sync-context-v1";
const REFRESH_MARGIN_MS=5*60*1000;
const MIN_USABLE_MS=15*1000;
const RETRY_MS=15*1000;
const TRANSIENT_STATUS=new Set([408,425,429,500,502,503,504,520]);
let refreshPromise=null;
let refreshTimer=null;

const emit=(state,detail={})=>window.dispatchEvent(new CustomEvent("pgw:auth-status",{detail:{state,...detail}}));

function makeError(message,{stage="auth",status=null,code=null,transient=false,detail=null}={}){
  const error=new Error(message);
  error.stage=stage;error.status=status;error.code=code;error.transient=transient;error.detail=detail;
  return error;
}

function decodeClaims(token){
  try{
    const part=token.split(".")[1];
    if(!part)return {};
    const normalized=part.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(part.length/4)*4,"=");
    const binary=atob(normalized);
    const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }catch{return {}}
}

function readSession(){
  try{
    const value=JSON.parse(localStorage.getItem(SESSION_KEY)||"null");
    if(!value||typeof value!=="object")return null;
    if(!value.accessToken||!value.refreshToken)return null;
    return value;
  }catch{return null}
}

function contextUserId(){
  try{return JSON.parse(localStorage.getItem(CTX_KEY)||"null")?.userId||null}catch{return null}
}

function writeSession(session){
  const clean={
    version:1,
    accessToken:session.accessToken,
    refreshToken:session.refreshToken,
    expiresAt:Number(session.expiresAt)||0,
    userId:session.userId||null,
    updatedAt:Date.now(),
    lastError:null
  };
  localStorage.setItem(SESSION_KEY,JSON.stringify(clean));
  sessionStorage.removeItem(LEGACY_ACCESS);
  sessionStorage.removeItem(LEGACY_REFRESH);
  scheduleRefresh(clean);
  emit("ready",{expiresAt:clean.expiresAt,userId:clean.userId});
  return clean;
}

function recordError(error){
  const session=readSession();
  if(!session)return;
  session.lastError={at:Date.now(),stage:error?.stage||"auth",status:error?.status||null,code:error?.code||null,message:String(error?.message||error),transient:Boolean(error?.transient)};
  try{localStorage.setItem(SESSION_KEY,JSON.stringify(session))}catch{}
}

function normalizeSession(body,fallback={}){
  const accessToken=body?.access_token||fallback.accessToken;
  const refreshToken=body?.refresh_token||fallback.refreshToken;
  const claims=decodeClaims(accessToken||"");
  const expiresAt=body?.expires_at?Number(body.expires_at)*1000:claims.exp?Number(claims.exp)*1000:Date.now()+Number(body?.expires_in||3600)*1000;
  const userId=body?.user?.id||body?.user_id||claims.sub||fallback.userId||contextUserId();
  if(!accessToken||!refreshToken)throw makeError("Session Supabase incomplète.",{stage:"auth-session",status:401,code:"session_incomplete"});
  return {accessToken,refreshToken,expiresAt,userId};
}

function migrateLegacySession(){
  if(readSession())return;
  const accessToken=sessionStorage.getItem(LEGACY_ACCESS);
  const refreshToken=sessionStorage.getItem(LEGACY_REFRESH);
  if(!accessToken||!refreshToken)return;
  try{
    const claims=decodeClaims(accessToken);
    writeSession({
      accessToken,
      refreshToken,
      expiresAt:claims.exp?Number(claims.exp)*1000:Date.now()+45*60*1000,
      userId:claims.sub||contextUserId()
    });
    console.info("PGW Auth: session V8.15 migrée vers le stockage persistant V8.16");
  }catch(error){console.error("PGW Auth migration failed",error)}
}

async function responseJson(stage,response){
  const text=await response.text();
  let body={};
  try{body=text?JSON.parse(text):{}}catch{body={raw:text}}
  if(response.ok)return body;
  const detail=body.message||body.error_description||body.msg||body.error||`HTTP ${response.status}`;
  const error=makeError(response.status===429?"Trop de connexions simultanées. Réessaie dans quelques instants.":detail,{
    stage,status:response.status,code:body.code||body.error_code||body.error||null,transient:TRANSIENT_STATUS.has(response.status),detail:body
  });
  console.error("PGW Auth request failed",{stage,status:error.status,code:error.code,detail:body});
  throw error;
}

function transientNetworkError(stage,cause){
  const error=makeError("Réseau indisponible pour renouveler la session.",{stage,transient:true});
  error.cause=cause;return error;
}

function scheduleRetry(){
  clearTimeout(refreshTimer);
  refreshTimer=setTimeout(()=>{refreshTimer=null;void bootstrapStudentSession();},RETRY_MS);
}

function scheduleRefresh(session=readSession()){
  clearTimeout(refreshTimer);refreshTimer=null;
  if(!session?.refreshToken||!session?.expiresAt)return;
  const delay=Math.max(1000,Math.min(session.expiresAt-Date.now()-REFRESH_MARGIN_MS,2147480000));
  refreshTimer=setTimeout(()=>{
    refreshTimer=null;
    void refreshStoredSession().catch(error=>{
      recordError(error);
      if(error?.transient)scheduleRetry();
    });
  },delay);
}

async function withRefreshLock(task){
  if(globalThis.navigator?.locks?.request){
    return navigator.locks.request("pgw-v8-auth-refresh",{mode:"exclusive"},task);
  }
  return task();
}

export function getStoredStudentSession(){
  migrateLegacySession();
  return readSession();
}

export async function refreshStoredSession({force=false}={}){
  migrateLegacySession();
  const before=readSession();
  if(!before?.refreshToken)throw makeError("Session distante absente.",{stage:"refresh",status:401,code:"session_missing"});
  if(refreshPromise)return refreshPromise;

  refreshPromise=withRefreshLock(async()=>{
    const current=readSession();
    if(!current?.refreshToken)throw makeError("Session distante absente.",{stage:"refresh",status:401,code:"session_missing"});
    if(!force&&current.expiresAt-Date.now()>REFRESH_MARGIN_MS){scheduleRefresh(current);return current}
    if(force&&before.refreshToken!==current.refreshToken&&current.expiresAt-Date.now()>MIN_USABLE_MS){scheduleRefresh(current);return current}
    if(!navigator.onLine)throw transientNetworkError("refresh-offline");

    let response;
    try{
      response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{
        method:"POST",
        headers:{"apikey":SUPABASE_PUBLISHABLE_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({refresh_token:current.refreshToken})
      });
    }catch(cause){throw transientNetworkError("refresh-network",cause)}

    const body=await responseJson("refresh",response);
    const next=normalizeSession(body,current);
    if(current.userId&&next.userId&&current.userId!==next.userId){
      throw makeError("La session restaurée ne correspond pas à cet élève.",{stage:"refresh",status:401,code:"user_mismatch"});
    }
    return writeSession(next);
  }).finally(()=>{refreshPromise=null});

  return refreshPromise;
}

export async function getValidAccessToken({forceRefresh=false}={}){
  migrateLegacySession();
  const current=readSession();
  if(!current?.accessToken||!current?.refreshToken){
    const error=makeError("Session Supabase absente : les réponses restent conservées sur cet appareil.",{stage:"auth-session",status:401,code:"session_missing"});
    emit("missing",{error:true});throw error;
  }

  const remaining=current.expiresAt-Date.now();
  if(!forceRefresh&&remaining>REFRESH_MARGIN_MS){scheduleRefresh(current);return current.accessToken}

  try{
    const refreshed=await refreshStoredSession({force:forceRefresh});
    return refreshed.accessToken;
  }catch(error){
    recordError(error);
    if(!forceRefresh&&error?.transient&&remaining>MIN_USABLE_MS){
      emit("degraded",{error:true,expiresAt:current.expiresAt});
      scheduleRetry();
      return current.accessToken;
    }
    emit(error?.transient?"degraded":"expired",{error:true,status:error?.status||null,code:error?.code||null});
    if(error?.transient)scheduleRetry();
    throw error;
  }
}

export async function createAnonymousStudentSession(){
  if(!navigator.onLine)throw transientNetworkError("anonymous-auth-offline");
  let response;
  try{
    response=await fetch(`${SUPABASE_URL}/auth/v1/signup`,{
      method:"POST",
      headers:{"apikey":SUPABASE_PUBLISHABLE_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({data:{pgw_student:true}})
    });
  }catch(cause){throw transientNetworkError("anonymous-auth-network",cause)}
  const body=await responseJson("anonymous-auth",response);
  const session=normalizeSession(body);
  return writeSession(session);
}

export async function getOrCreateStudentSession(){
  migrateLegacySession();
  if(readSession()){
    await getValidAccessToken();
    return readSession();
  }
  return createAnonymousStudentSession();
}

export async function bootstrapStudentSession(){
  migrateLegacySession();
  const current=readSession();
  if(!current){emit("missing");return {status:"missing"}}
  try{
    await getValidAccessToken();
    const session=readSession();
    emit("ready",{expiresAt:session?.expiresAt||null,userId:session?.userId||null});
    return {status:"ready",session};
  }catch(error){
    const status=error?.transient?"degraded":"expired";
    emit(status,{error:true,statusCode:error?.status||null,code:error?.code||null});
    return {status,error};
  }
}

export function sessionSnapshot(){
  migrateLegacySession();
  const session=readSession();
  return session?{present:true,userId:session.userId||null,expiresAt:session.expiresAt,expiresInMs:session.expiresAt-Date.now(),lastError:session.lastError||null}:{present:false};
}

migrateLegacySession();
if(readSession())queueMicrotask(()=>void bootstrapStudentSession());
window.addEventListener("online",()=>{if(readSession())void bootstrapStudentSession()});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&readSession())void bootstrapStudentSession()});
