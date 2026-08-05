(()=>{
  'use strict';
  const STORAGE_KEY='teenda-silent-board.custom.v1';
  const defaults=window.TEENDA_DEFAULTS||[];
  const $=id=>document.getElementById(id);
  const app=$('app'),picker=$('picker'),grid=$('messageGrid'),display=$('display'),stage=$('messageStage'),displayText=$('displayText'),confettiLayer=$('confettiLayer'),backButton=$('backButton'),addButton=$('addButton'),manageButton=$('manageButton'),instantButton=$('instantButton'),modal=$('modal'),closeModal=$('closeModal'),form=$('messageForm'),formTitle=$('formTitle'),labelField=$('labelField'),labelInput=$('labelInput'),textInput=$('textInput'),textFieldTitle=$('textFieldTitle'),categoryField=$('categoryField'),categoryInput=$('categoryInput'),effectField=$('effectField'),effectInput=$('effectInput'),charCounter=$('charCounter'),formSubmit=$('formSubmit');
  let currentTab='all',editing=false,editingId=null,formMode='save',customMessages=loadCustom(),resizeTimer=null;

  function loadCustom(){try{const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(parsed)?parsed.filter(isValidMessage):[]}catch(_){return[]}}
  function isValidMessage(item){return item&&typeof item.id==='string'&&typeof item.text==='string'&&item.text.trim()}
  function saveCustom(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(customMessages))}catch(_){}}
  function allMessages(){return defaults.concat(customMessages.map(item=>({...item,custom:true})))}

  function render(){
    instantButton.hidden=false;
    if(!customMessages.length)editing=false;
    const messages=allMessages().filter(item=>currentTab==='all'||item.category===currentTab);
    app.classList.toggle('editing',editing);
    manageButton.hidden=customMessages.length===0;
    manageButton.setAttribute('aria-pressed',String(editing));
    manageButton.textContent=editing?'管理を終了':'登録したセリフを管理';
    grid.textContent='';
    if(!messages.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='この分類にはまだセリフがありません';grid.appendChild(empty);return}
    const fragment=document.createDocumentFragment();
    for(const item of messages){
      const card=document.createElement('div');card.className='message-card'+(item.custom?' custom':'');card.dataset.category=item.category;card.dataset.effect=item.effect||'none';
      const button=document.createElement('button');button.className='message-button';button.type='button';button.textContent=item.label||item.text;button.addEventListener('click',()=>{if(!editing||!item.custom)showMessage(item)});card.appendChild(button);
      if(item.custom){const actions=document.createElement('div');actions.className='edit-actions';const edit=document.createElement('button');edit.type='button';edit.className='mini-action';edit.setAttribute('aria-label','この登録セリフを編集');edit.textContent='✎';edit.addEventListener('click',()=>openSaveForm(item));const del=document.createElement('button');del.type='button';del.className='mini-action delete';del.setAttribute('aria-label','この登録セリフを削除');del.textContent='×';del.addEventListener('click',()=>removeCustom(item.id));actions.append(edit,del);card.appendChild(actions)}
      fragment.appendChild(card);
    }
    grid.appendChild(fragment);
  }

  function showMessage(item){display.dataset.effect=item.effect||'none';displayText.textContent=item.text.trim();display.hidden=false;picker.setAttribute('aria-hidden','true');document.body.style.overflow='hidden';stage.scrollTop=0;confettiLayer.textContent='';if(item.effect==='celebrate'||item.effect==='win')createConfetti(item.effect==='win'?44:34);requestAnimationFrame(()=>requestAnimationFrame(fitText))}
  function hideMessage(){display.hidden=true;picker.removeAttribute('aria-hidden');document.body.style.overflow='';displayText.textContent='';confettiLayer.textContent=''}

  function fitText(){
    if(display.hidden||!displayText.textContent)return;
    stage.style.alignItems='center';displayText.style.margin='auto 0';displayText.style.width='100%';
    const s=getComputedStyle(stage),horizontalPadding=parseFloat(s.paddingLeft)+parseFloat(s.paddingRight),verticalPadding=parseFloat(s.paddingTop)+parseFloat(s.paddingBottom),availableWidth=Math.max(1,stage.clientWidth-horizontalPadding),availableHeight=Math.max(1,stage.clientHeight-verticalPadding);
    const maxSize=Math.min(138,Math.max(52,Math.floor(availableWidth*.32))),minSize=16,plainText=displayText.textContent,charCount=plainText.replace(/\s/g,'').length,explicitLines=plainText.split('\n').length,preferredMaxLines=charCount<=60?Math.max(explicitLines,Math.min(8,Math.ceil(charCount/6))):Infinity;
    let low=minSize,high=maxSize,best=minSize;
    while(low<=high){const mid=Math.floor((low+high)/2);displayText.style.fontSize=mid+'px';const computed=getComputedStyle(displayText),lineHeight=parseFloat(computed.lineHeight)||mid*1.14,lineCount=Math.ceil((displayText.scrollHeight-1)/lineHeight),fitsWidth=displayText.scrollWidth<=availableWidth+1,fitsHeight=displayText.scrollHeight<=availableHeight+1,readableLines=lineCount<=preferredMaxLines;if(fitsWidth&&fitsHeight&&readableLines){best=mid;low=mid+1}else high=mid-1}
    displayText.style.fontSize=best+'px';
    const stillTall=displayText.scrollHeight>availableHeight+1;stage.style.alignItems=stillTall?'flex-start':'center';displayText.style.margin=stillTall?'0':'auto 0';
  }

  function createConfetti(count){const colors=['#ffd23f','#ff5d73','#35d0ba','#ffffff','#ff8b22','#72a7ff'],fragment=document.createDocumentFragment();for(let i=0;i<count;i++){const bit=document.createElement('i');bit.className='confetti';bit.style.setProperty('--x',(Math.random()*100).toFixed(2)+'%');bit.style.setProperty('--w',(5+Math.random()*7).toFixed(1)+'px');bit.style.setProperty('--c',colors[i%colors.length]);bit.style.setProperty('--r',Math.floor(Math.random()*360)+'deg');bit.style.setProperty('--d',(2.2+Math.random()*1.7).toFixed(2)+'s');bit.style.setProperty('--delay',(Math.random()*.55).toFixed(2)+'s');bit.style.setProperty('--drift',(-60+Math.random()*120).toFixed(0)+'px');fragment.appendChild(bit)}confettiLayer.appendChild(fragment);setTimeout(()=>{confettiLayer.textContent=''},4700)}

  function setFormMode(mode){
    formMode=mode;const instant=mode==='instant';formTitle.textContent=instant?'自由メッセージ':'セリフを追加';labelField.hidden=instant;categoryField.hidden=instant;effectField.hidden=instant;textFieldTitle.textContent=instant?'一回だけ表示するメッセージ':'視聴者に見せるメッセージ';formSubmit.textContent=instant?'今すぐ表示':'保存する';formSubmit.classList.toggle('instant-submit',instant);
  }
  function openInstantForm(){editingId=null;setFormMode('instant');form.reset();updateCount();modal.hidden=false;document.body.style.overflow='hidden';setTimeout(()=>textInput.focus(),60)}
  function openSaveForm(item=null){editingId=item?item.id:null;setFormMode('save');formTitle.textContent=item?'セリフを編集':'セリフを追加';labelInput.value=item?(item.label||''):'';textInput.value=item?item.text:'';categoryInput.value=item?item.category:(currentTab==='all'?'gamble':currentTab);effectInput.value=item?(item.effect||'none'):'none';updateCount();modal.hidden=false;document.body.style.overflow='hidden';setTimeout(()=>textInput.focus(),60)}
  function closeForm(){modal.hidden=true;editingId=null;form.reset();document.body.style.overflow=''}
  function removeCustom(id){const target=customMessages.find(item=>item.id===id);if(!target||!confirm('「'+(target.label||target.text)+'」を削除しますか？'))return;customMessages=customMessages.filter(item=>item.id!==id);saveCustom();render()}
  function updateCount(){charCounter.textContent=textInput.value.length+' / 160'}

  form.addEventListener('submit',event=>{event.preventDefault();const text=textInput.value.trim();if(!text)return;if(formMode==='instant'){closeForm();showMessage({text,effect:'none'});return}const label=labelInput.value.trim()||text.replace(/\s+/g,' ').slice(0,30),item={id:editingId||('custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)),label,text,category:categoryInput.value,effect:effectInput.value};customMessages=editingId?customMessages.map(existing=>existing.id===editingId?item:existing):customMessages.concat(item);saveCustom();closeForm();render()});
  document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{currentTab=tab.dataset.tab;document.querySelectorAll('.tab').forEach(btn=>btn.classList.toggle('active',btn===tab));render()}));
  addButton.addEventListener('click',()=>openSaveForm());
  manageButton.addEventListener('click',()=>{editing=!editing;render()});
  instantButton.addEventListener('click',openInstantForm);
  closeModal.addEventListener('click',closeForm);
  modal.addEventListener('click',event=>{if(event.target===modal)closeForm()});
  textInput.addEventListener('input',updateCount);
  backButton.addEventListener('click',hideMessage);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(!modal.hidden)closeForm();else if(!display.hidden)hideMessage()}});
  window.addEventListener('pageshow',()=>{instantButton.hidden=false});
  const refit=()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(fitText,80)};window.addEventListener('resize',refit,{passive:true});window.visualViewport?.addEventListener('resize',refit,{passive:true});if('ResizeObserver'in window)new ResizeObserver(refit).observe(stage);
  try{navigator.storage?.persist?.()}catch(_){}render();
})();
