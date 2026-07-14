(()=>{
'use strict';
const SCHEMA=11;
const META_KEY='alltagsbegleiter.sync.meta.v11';
const BACKUP_PREFIX='alltagsbegleiter.localbackup.v11.';
const DEVICE_KEY='alltagsbegleiter.device.id.v11';

function uuid(){
  if(crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'dev-'+Date.now()+'-'+Math.random().toString(36).slice(2);
}
function deviceId(){
  let id=localStorage.getItem(DEVICE_KEY);
  if(!id){ id=uuid(); localStorage.setItem(DEVICE_KEY,id); }
  return id;
}
function collect(){
  const data={};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k || k===META_KEY || k.startsWith(BACKUP_PREFIX)) continue;
    data[k]=localStorage.getItem(k);
  }
  return data;
}
function parseMaybe(v){
  try{return JSON.parse(v)}catch(e){return v}
}
function stableString(v){
  try{return JSON.stringify(v)}catch(e){return String(v)}
}
function mergeArrays(a,b){
  const result=[],seen=new Set();
  [...a,...b].forEach(x=>{
    const key=stableString(x);
    if(!seen.has(key)){seen.add(key);result.push(x)}
  });
  return result;
}
function mergeObjects(a,b){
  const out={...a};
  Object.keys(b).forEach(k=>{
    if(!(k in out)){out[k]=b[k];return}
    const av=out[k],bv=b[k];
    if(Array.isArray(av)&&Array.isArray(bv)) out[k]=mergeArrays(av,bv);
    else if(av&&bv&&typeof av==='object'&&typeof bv==='object') out[k]=mergeObjects(av,bv);
    else out[k]=bv;
  });
  return out;
}
function mergeValue(existing,incoming){
  if(existing==null) return incoming;
  const a=parseMaybe(existing),b=parseMaybe(incoming);
  let merged;
  if(Array.isArray(a)&&Array.isArray(b)) merged=mergeArrays(a,b);
  else if(a&&b&&typeof a==='object'&&typeof b==='object') merged=mergeObjects(a,b);
  else merged=b;
  return typeof merged==='string'?merged:JSON.stringify(merged);
}
function snapshot(reason='manual'){
  return {
    format:'alltagsbegleiter-backup',
    schema:SCHEMA,
    exportedAt:new Date().toISOString(),
    sourceDevice:deviceId(),
    reason,
    appName:'Alltagsbegleiter',
    data:collect()
  };
}
function localBackup(reason='automatic'){
  const key=BACKUP_PREFIX+new Date().toISOString().replace(/[:.]/g,'-');
  const payload=snapshot(reason);
  try{
    localStorage.setItem(key,JSON.stringify(payload));
    const backups=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k&&k.startsWith(BACKUP_PREFIX)) backups.push(k);
    }
    backups.sort().reverse().slice(7).forEach(k=>localStorage.removeItem(k));
  }catch(e){}
  return payload;
}
function applyPayload(payload,mode='merge'){
  if(!payload || payload.format!=='alltagsbegleiter-backup' || !payload.data) throw new Error('Keine gültige Alltagsbegleiter-Sicherung.');
  localBackup('vor-import');
  if(mode==='replace'){
    const keepDevice=deviceId();
    localStorage.clear();
    localStorage.setItem(DEVICE_KEY,keepDevice);
  }
  Object.entries(payload.data).forEach(([k,v])=>{
    if(k===DEVICE_KEY) return;
    if(mode==='merge') localStorage.setItem(k,mergeValue(localStorage.getItem(k),v));
    else localStorage.setItem(k,String(v));
  });
  const meta={
    schema:SCHEMA,
    importedAt:new Date().toISOString(),
    sourceDevice:payload.sourceDevice||null,
    sourceExportedAt:payload.exportedAt||null,
    mode
  };
  localStorage.setItem(META_KEY,JSON.stringify(meta));
  return meta;
}
function download(payload,filename){
  const content=JSON.stringify(payload,null,2);
  if(window.AlltagsbegleiterFiles && window.AlltagsbegleiterFiles.isNative){
    return window.AlltagsbegleiterFiles.saveText(filename,content);
  }
  if(window.AndroidApp && typeof window.AndroidApp.saveTextFile==='function'){
    return new Promise((resolve,reject)=>{
      const previous=window.__alltagsbegleiterFileSaved;
      window.__alltagsbegleiterFileSaved=()=>{try{if(typeof previous==='function')previous()}finally{resolve(true)}};
      try{window.AndroidApp.saveTextFile(filename,content)}catch(err){reject(err)}
    });
  }
  const blob=new Blob([content],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  return Promise.resolve(true);
}
function dailyBackup(){
  const key='alltagsbegleiter.dailybackup.date.v11';
  const today=new Date().toISOString().slice(0,10);
  if(localStorage.getItem(key)!==today){
    localBackup('taeglich');
    localStorage.setItem(key,today);
  }
}
window.AlltagsbegleiterSync={
  schema:SCHEMA,deviceId:deviceId(),collect,snapshot,localBackup,applyPayload,download,mergeValue,
  meta(){try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')}catch(e){return{}}},
  backups(){
    const out=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k&&k.startsWith(BACKUP_PREFIX)){
        try{out.push({key:k,payload:JSON.parse(localStorage.getItem(k))})}catch(e){}
      }
    }
    return out.sort((a,b)=>b.key.localeCompare(a.key));
  },
  restoreLocal(key){
    const raw=localStorage.getItem(key);
    if(!raw) throw new Error('Sicherung nicht gefunden.');
    return applyPayload(JSON.parse(raw),'replace');
  }
};
document.addEventListener('DOMContentLoaded',dailyBackup,{once:true});
})();