(function(){
  'use strict';

  const isNative = !!(window.AndroidApp &&
    typeof window.AndroidApp.saveTextFile === 'function' &&
    typeof window.AndroidApp.openTextFile === 'function');

  let pendingInput = null;
  let saveResolve = null;
  let saveReject = null;

  function decodeBase64(encoded){
    const binary = atob(encoded || '');
    const bytes = new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function mimeForName(name){
    const n = String(name || '').toLowerCase();
    if(n.endsWith('.csv')) return 'text/csv';
    if(n.endsWith('.json') || n.endsWith('.abg') || n.endsWith('.dkbackup')) return 'application/json';
    if(n.endsWith('.txt')) return 'text/plain';
    return 'application/octet-stream';
  }

  function nativeSave(filename, content){
    if(!isNative) return Promise.reject(new Error('Android-Dateibrücke nicht verfügbar.'));
    return new Promise((resolve, reject) => {
      saveResolve = resolve;
      saveReject = reject;
      try {
        window.AndroidApp.saveTextFile(String(filename || 'Alltagsbegleiter-Export.txt'), String(content == null ? '' : content));
      } catch(err){
        saveResolve = null;
        saveReject = null;
        reject(err);
      }
    });
  }

  function nativeOpenForInput(input){
    if(!isNative) return false;
    pendingInput = input || null;
    try {
      window.AndroidApp.openTextFile();
      return true;
    } catch(err){
      pendingInput = null;
      return false;
    }
  }

  window.AlltagsbegleiterFiles = {
    isNative,
    saveText: nativeSave,
    openForInput: nativeOpenForInput
  };

  if(!isNative) return;

  const previousReceive = window.__alltagsbegleiterReceiveFile;
  window.__alltagsbegleiterReceiveFile = function(encodedName, encodedContent){
    try {
      if(pendingInput){
        const nameBytes = decodeBase64(encodedName);
        const contentBytes = decodeBase64(encodedContent);
        const filename = new TextDecoder('utf-8').decode(nameBytes) || 'import.txt';
        const file = new File([contentBytes], filename, {type:mimeForName(filename)});
        const transfer = new DataTransfer();
        transfer.items.add(file);
        pendingInput.files = transfer.files;
        const input = pendingInput;
        pendingInput = null;
        input.dispatchEvent(new Event('change', {bubbles:true}));
        return;
      }
      if(typeof previousReceive === 'function') previousReceive(encodedName, encodedContent);
    } catch(err){
      pendingInput = null;
      if(typeof previousReceive === 'function') previousReceive(encodedName, encodedContent);
      else alert('Import fehlgeschlagen: ' + err.message);
    }
  };

  const previousSaved = window.__alltagsbegleiterFileSaved;
  window.__alltagsbegleiterFileSaved = function(){
    if(typeof previousSaved === 'function'){
      try{ previousSaved(); }catch(e){}
    }
    if(saveResolve){
      const resolve = saveResolve;
      saveResolve = null;
      saveReject = null;
      resolve(true);
    }
    window.dispatchEvent(new CustomEvent('alltagsbegleiter:file-saved'));
  };

  const originalInputClick = HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click = function(){
    if(this.type === 'file' && nativeOpenForInput(this)) return;
    return originalInputClick.call(this);
  };

  const originalAnchorClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function(){
    const anchor = this;
    if(anchor.download && anchor.href && anchor.href.indexOf('blob:') === 0){
      fetch(anchor.href)
        .then(response => response.blob())
        .then(blob => blob.text())
        .then(text => nativeSave(anchor.download, text))
        .catch(err => alert('Export fehlgeschlagen: ' + err.message));
      return;
    }
    return originalAnchorClick.call(anchor);
  };
})();
