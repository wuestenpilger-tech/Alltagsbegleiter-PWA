(()=>{
'use strict';
const nativeAvailable=()=>window.AndroidApp && typeof AndroidApp.scheduleAlarm==='function';
window.AlltagsbegleiterNativeAlarms={
 available:nativeAvailable(),
 schedule({id,triggerAt,title,text,repeatMs=0}){
   if(!nativeAvailable()) return false;
   AndroidApp.scheduleAlarm(Number(id),Number(triggerAt),String(title||'Alltagsbegleiter'),String(text||'Erinnerung'),Number(repeatMs||0));
   return true;
 },
 cancel(id){
   if(!nativeAvailable()) return false;
   AndroidApp.cancelAlarm(Number(id)); return true;
 },
 list(){
   if(!nativeAvailable()) return [];
   try{return JSON.parse(AndroidApp.getScheduledAlarms()||'[]')}catch(e){return[]}
 },
 exactAllowed(){
   return nativeAvailable() && AndroidApp.canScheduleExactAlarms();
 },
 requestExact(){
   if(nativeAvailable()) AndroidApp.requestExactAlarmPermission();
 }
};
})();