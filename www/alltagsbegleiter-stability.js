(function(){
'use strict';
const VERSION='22.6.1';
function deviceHome(){
  try{
    if(window.AndroidApp && typeof window.AndroidApp.getDeviceType==='function'){
      return window.AndroidApp.getDeviceType()==='handy'?'handy.html':'tablet.html';
    }
  }catch(e){}
  return Math.min(screen.width||innerWidth,screen.height||innerHeight)<700?'handy.html':'tablet.html';
}
function isHome(){
  const n=(location.pathname.split('/').pop()||'').toLowerCase();
  return !n || n==='index.html' || n==='tablet.html' || n==='handy.html';
}
function addChrome(){
  document.documentElement.setAttribute('data-ab-version',VERSION);
  if(isHome()) return;
  const nav=document.createElement('nav');
  nav.className='ab-fixed-nav';
  nav.setAttribute('aria-label','Seitennavigation');
  nav.innerHTML='<button type="button" class="ab-nav-btn" data-ab-back aria-label="Zurück">← <span>Zurück</span></button><button type="button" class="ab-nav-btn ab-home" data-ab-home aria-label="Zum Alltagsbegleiter">⌂ <span>Start</span></button>';
  document.body.appendChild(nav);
  nav.querySelector('[data-ab-back]').addEventListener('click',function(){
    if(history.length>1) history.back(); else location.href=deviceHome();
  });
  nav.querySelector('[data-ab-home]').addEventListener('click',function(){ location.href=deviceHome(); });
}
function improveFileInputs(){
  document.addEventListener('click',function(ev){
    let input=null;
    const target=ev.target;
    if(target && target.matches && target.matches('input[type="file"]')) input=target;
    if(!input && target && target.closest){
      const label=target.closest('label');
      if(label){
        if(label.htmlFor) input=document.getElementById(label.htmlFor);
        if(!input) input=label.querySelector('input[type="file"]');
      }
    }
    if(input && window.AlltagsbegleiterFiles && window.AlltagsbegleiterFiles.isNative){
      ev.preventDefault(); ev.stopPropagation();
      window.AlltagsbegleiterFiles.openForInput(input);
    }
  },true);
  document.querySelectorAll('input[type="file"]').forEach(function(input){
    input.setAttribute('aria-label',input.getAttribute('aria-label')||'Datei auswählen');
  });
}
function markWideElements(){
  document.querySelectorAll('table').forEach(function(table){
    if(table.parentElement && !table.parentElement.classList.contains('ab-table-scroll')){
      const wrap=document.createElement('div'); wrap.className='ab-table-scroll';
      table.parentNode.insertBefore(wrap,table); wrap.appendChild(table);
    }
  });
}
document.addEventListener('DOMContentLoaded',function(){addChrome();improveFileInputs();markWideElements();});
})();
