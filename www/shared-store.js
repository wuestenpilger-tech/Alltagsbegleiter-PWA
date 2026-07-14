(()=>{'use strict';
const META='alltagsschrank.shared.v3',CHANGE='alltagsschrank.last_change.v3';
let busy=false;
function collect(){const d={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k!==META&&k!==CHANGE&&!k.startsWith('alltagsschrank.backup.'))d[k]=localStorage.getItem(k)}}catch(e){}return d}
function sync(reason,key){if(busy)return;busy=true;try{localStorage.setItem(META,JSON.stringify({schema:3,updatedAt:new Date().toISOString(),reason:reason||'sync',changedKey:key||null,page:location.pathname.split('/').pop()||'index.html',data:collect()}));localStorage.setItem(CHANGE,JSON.stringify({at:new Date().toISOString(),key:key||null,page:location.pathname.split('/').pop()||'index.html'}))}catch(e){}busy=false}
try{const s=Storage.prototype.setItem,r=Storage.prototype.removeItem,c=Storage.prototype.clear;
Storage.prototype.setItem=function(k,v){s.call(this,k,v);if(this===localStorage&&k!==META&&k!==CHANGE)queueMicrotask(()=>sync('setItem',String(k)))};
Storage.prototype.removeItem=function(k){r.call(this,k);if(this===localStorage&&k!==META&&k!==CHANGE)queueMicrotask(()=>sync('removeItem',String(k)))};
Storage.prototype.clear=function(){c.call(this);if(this===localStorage)queueMicrotask(()=>sync('clear',null))}}catch(e){}
window.AlltagsschrankStore={sync:()=>sync('manual',null),snapshot:collect,sharedKey:META};
document.addEventListener('DOMContentLoaded',()=>sync('page-load',null),{once:true});
})();