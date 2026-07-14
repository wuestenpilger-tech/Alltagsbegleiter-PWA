(()=>{
'use strict';
const KEY='alltagsbegleiter.device.view.v12';
function detect(){
 const saved=localStorage.getItem(KEY);
 if(saved==='tablet'||saved==='handy') return saved;
 if(window.AndroidApp && typeof window.AndroidApp.getDeviceType==='function'){ try{return window.AndroidApp.getDeviceType()}catch(e){} }
 const min=Math.min(screen.width||innerWidth,screen.height||innerHeight);
 const ua=navigator.userAgent||'';
 const mobile=/Android|iPhone|Mobile/i.test(ua);
 return mobile && min<700 ? 'handy' : 'tablet';
}
window.AlltagsbegleiterView={
 current:detect(),
 set(view){
   if(view!=='tablet'&&view!=='handy')return;
   localStorage.setItem(KEY,view);
   location.href=view==='handy'?'handy.html':'tablet.html';
 },
 auto(){
   localStorage.removeItem(KEY);
   location.href='index.html';
 }
};
})();
// Version 22.4: Android-Importfilter für CSV und weitere Sicherungsdateien korrigiert.
document.addEventListener('DOMContentLoaded',()=>{
  const style=document.createElement('style');
  style.id='alltagsbegleiter-v22-layout';
  style.textContent=`
    :root{--ab-safe-top:env(safe-area-inset-top,0px);--ab-safe-bottom:env(safe-area-inset-bottom,0px)}
    html{width:100%;max-width:100%;overflow-x:hidden}
    body{width:100%;max-width:100%;overflow-x:hidden;padding-top:var(--ab-safe-top);padding-bottom:var(--ab-safe-bottom)}
    *,*::before,*::after{min-width:0;box-sizing:border-box}
    img,svg,canvas,video,iframe{max-width:100%;height:auto}
    input,select,textarea,button{max-width:100%}
    textarea{width:100%}
    table{width:100%;max-width:100%;table-layout:fixed;border-collapse:collapse}
    th,td{overflow-wrap:anywhere;word-break:break-word}
    pre,code{white-space:pre-wrap;overflow-wrap:anywhere}
    .container,.wrap,.page,.content,main{max-width:100%}
    @media(max-width:700px){
      input,select,textarea{font-size:16px}
      .grid{max-width:100%}
      header{padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
      main{padding-left:max(12px,env(safe-area-inset-left,0px));padding-right:max(12px,env(safe-area-inset-right,0px))}
    }`;
  document.head.appendChild(style);
});
