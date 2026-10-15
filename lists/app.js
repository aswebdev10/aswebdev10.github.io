(() => {
'use strict';
const $=id=>document.getElementById(id), KEY='myLists_v1';
let lists=[];try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(value)||value.some(l=>!l.id||typeof l.name!=='string'||!Array.isArray(l.items)))throw Error();lists=value;}catch{ $('status').textContent='Saved lists could not be read. Please reload before making changes.';return; }
let current=null,editingId=null,returnFocus=null,longPressTimer=null,touchDrag=null;
const rows=$('rows'),editor=$('editor'),collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
const active=()=>lists.find(l=>l.id===current);
const collection=()=>current?active().items:lists;
const canDrag=()=>!current||active().sort!=='aisle';
const notice=message=>{$('status').textContent=message;setTimeout(()=>{$('status').textContent=''},4000)};
function save(){try{localStorage.setItem(KEY,JSON.stringify(lists));}catch{notice('Could not save. Device storage may be full or disabled.');}}
const SETTINGS_KEY='myLists_settings_v1',DEFAULT_SETTINGS={rowHeight:64,aisleSize:14,fontSize:16};
let settings={...DEFAULT_SETTINGS};
try{const stored=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');for(const [key,min,max] of [['rowHeight',44,88],['aisleSize',11,24],['fontSize',11,24]]){const value=stored?.[key];if(Number.isFinite(value))settings[key]=Math.round(Math.max(min,Math.min(max,value)));}}catch{}
function applySettings(){for(const [key,css] of [['rowHeight','--list-row-height'],['aisleSize','--aisle-font-size'],['fontSize','--list-font-size']]){document.documentElement.style.setProperty(css,settings[key]+'px');$(key+'Range').value=settings[key];$(key+'Value').textContent=settings[key]+' px';}}
function saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{notice('Could not save appearance settings on this device.');}}
for(const key of Object.keys(DEFAULT_SETTINGS))$(key+'Range').addEventListener('input',()=>{settings[key]=Number($(key+'Range').value);applySettings();saveSettings();});
const settingsDialog=$('settingsDialog');
$('settingsBtn').onclick=()=>{applySettings();settingsDialog.showModal();$('rowHeightRange').focus();};
$('doneSettingsBtn').onclick=()=>{settingsDialog.close();$('settingsBtn').focus();};
$('resetSettingsBtn').onclick=()=>{settings={...DEFAULT_SETTINGS};applySettings();saveSettings();};
settingsDialog.addEventListener('click',e=>{if(e.target===settingsDialog){const r=settingsDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){settingsDialog.close();$('settingsBtn').focus();}}});
applySettings();
function sorted(items){return [...items].sort((a,b)=>{if(!a.aisle)return b.aisle?1:0;if(!b.aisle)return -1;return collator.compare(a.aisle,b.aisle)});}
function render(){
 const list=active();if(current&&!list){current=null;location.hash='';return;}
 $('back').hidden=!current;$('logo').hidden=!!current;$('title').textContent=list?list.name:'My lists';
 const n=list?list.items.length:lists.length;$('count').textContent=`${n} ${list?(n===1?'item':'items'):(n===1?'list':'lists')}`;
 $('sort').hidden=!list;$('sort').value=list?.sort||'manual';$('addBtn').setAttribute('aria-label',list?'Add item':'Add list');$('addBtn').setAttribute('title',list?'Add item':'Add list');
 $('hint').textContent=canDrag()?'Drag to reorder, or hold a row on your phone. Use a handle with Alt + ↑ / ↓ to move with the keyboard.': 'Aisles sort naturally: A2 before A10. Items without an aisle appear last. Choose Manual order to drag items.';
 rows.replaceChildren();const items=list&&list.sort==='aisle'?sorted(list.items):collection();
 if(!items.length){const empty=document.createElement('div');empty.className='empty';const strong=document.createElement('strong');strong.textContent=list?'No items yet':'No lists yet';empty.append(strong,document.createTextNode(list?'Add your first item and its aisle.':'Add a list to get started.'));rows.append(empty);}
 items.forEach(item=>rows.append(makeRow(item)));
}
function persistDomOrder(){const arr=collection();const order=[...rows.querySelectorAll('.task-row')].map(el=>arr.find(x=>x.id===el.dataset.id));if(order.length===arr.length){arr.splice(0,arr.length,...order);save();}}
function animateReorder(list,mutate){mutate();}
function makeRow(task){const key='rows';const row=document.createElement('div');row.className='task-row';row.dataset.id=task.id;row.draggable=canDrag();
 const handle=document.createElement('button');handle.className='handle';handle.textContent='⠿';handle.setAttribute('aria-label','Reorder '+task.name);handle.disabled=!canDrag();
 handle.addEventListener('keydown',e=>{if(!e.altKey||!['ArrowUp','ArrowDown'].includes(e.key)||!canDrag())return;e.preventDefault();const arr=collection(),i=arr.indexOf(task),j=i+(e.key==='ArrowUp'?-1:1);if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];save();render();[...rows.children][j].querySelector('.handle').focus();});
 const main=document.createElement('button');main.className='row-main';const title=document.createElement('div');title.className='row-title';title.textContent=task.name;main.append(title);
 main.addEventListener('click',()=>{if(current)openModal(task);else location.hash=encodeURIComponent(task.id)});
 row.append(handle,main);
 if(current){const aisle=document.createElement('span');aisle.className='aisle';aisle.textContent=task.aisle||'—';aisle.setAttribute('aria-label',task.aisle?'Aisle '+task.aisle:'No aisle');row.append(aisle);}else{const sub=document.createElement('div');sub.className='row-sub';sub.textContent=`${task.items.length} ${task.items.length===1?'item':'items'}`;main.append(sub);const edit=document.createElement('button');edit.className='edit';edit.textContent='⋯';edit.setAttribute('aria-label','Edit '+task.name);edit.onclick=()=>openModal(task);row.append(edit);}
    row.addEventListener("dragstart",e=>{
      if(!canDrag()){e.preventDefault();return;}
      row.classList.add("dragging");
      e.dataTransfer.effectAllowed="move";
      e.dataTransfer.setData("text/plain",task.id);
    });
    row.addEventListener("dragend",()=>{
      row.classList.remove("dragging");
      row.classList.add("drop-pop");
      persistDomOrder(key);
      row.addEventListener("animationend",()=>row.classList.remove("drop-pop"),{once:true});
    });
    row.addEventListener("dragover",e=>{
      e.preventDefault();
      const list=row.parentElement;
      const dragging=list.querySelector(".dragging");
      if(!dragging || dragging===row) return;
      const rect=row.getBoundingClientRect();
      const beforeNode=e.clientY < rect.top+rect.height/2 ? row : row.nextSibling;
      animateReorder(list,()=>list.insertBefore(dragging,beforeNode));
    });

    // Touch reordering: hold briefly, then the task follows your finger.
    // If scrolling/movement is detected first, reordering is disabled for that touch.
    let touchStartX=0, touchStartY=0, draggedByTouch=false, touchScrollDetected=false;

    const updateGhost=(clientX,clientY)=>{
      if(!touchDrag || !touchDrag.ghost) return;
      touchDrag.ghost.style.left=(clientX-touchDrag.offsetX)+"px";
      touchDrag.ghost.style.top=(clientY-touchDrag.offsetY)+"px";
    };

    const onTouchMove=(e)=>{
      const t=e.touches[0];
      if(!t) return;

      if(!touchDrag || touchDrag.row!==row){
        if(Math.hypot(t.clientX-touchStartX,t.clientY-touchStartY)>9){
          touchScrollDetected=true;
          clearTimeout(longPressTimer);
        }
        return;
      }

      e.preventDefault();
      draggedByTouch=true;
      updateGhost(t.clientX,t.clientY);

      const siblings=[...touchDrag.list.querySelectorAll(".task-row:not(.dragging)")];
      let before=null;
      for(const el of siblings){
        const r=el.getBoundingClientRect();
        if(t.clientY < r.top+r.height/2){
          before=el;
          break;
        }
      }

      if(before!==row && before!==row.nextElementSibling){
        animateReorder(touchDrag.list,()=>touchDrag.list.insertBefore(row,before));
      }
    };

    const finishTouch=()=>{
      clearTimeout(longPressTimer);
      document.removeEventListener("touchmove",onTouchMove,{passive:false});
      document.removeEventListener("touchend",finishTouch);
      document.removeEventListener("touchcancel",finishTouch);

      if(touchDrag && touchDrag.row===row){
        if(touchDrag.ghost) touchDrag.ghost.remove();
        row.classList.remove("dragging","drag-source");
        row.classList.add("drop-pop");
        document.body.style.overflow="";
        persistDomOrder(touchDrag.key);
        row.addEventListener("animationend",()=>row.classList.remove("drop-pop"),{once:true});
        touchDrag=null;
        setTimeout(()=>{draggedByTouch=false},100);
      }
    };

    row.addEventListener("touchstart",e=>{
      if(e.target.closest(".edit") || e.touches.length!==1) return;

      if(!canDrag()) return;
      const t=e.touches[0];
      touchStartX=t.clientX;
      touchStartY=t.clientY;
      draggedByTouch=false;
      touchScrollDetected=false;
      clearTimeout(longPressTimer);

      // Start watching movement immediately, during the long-press delay.
      // Any meaningful movement cancels reordering for this entire touch.
      document.addEventListener("touchmove",onTouchMove,{passive:false});
      document.addEventListener("touchend",finishTouch);
      document.addEventListener("touchcancel",finishTouch);

      longPressTimer=setTimeout(()=>{
        if(touchScrollDetected) return;
        const rect=row.getBoundingClientRect();
        const ghost=row.cloneNode(true);
        ghost.classList.remove("dragging","drag-source","drop-pop","completing");
        ghost.classList.add("drag-ghost");
        ghost.removeAttribute("draggable");
        ghost.style.width=rect.width+"px";
        ghost.style.height=rect.height+"px";
        ghost.style.left=rect.left+"px";
        ghost.style.top=rect.top+"px";

        const ghostCheck=ghost.querySelector(".check");
        if(ghostCheck) ghostCheck.disabled=true;

        document.body.appendChild(ghost);

        touchDrag={
          row,
          list:row.parentElement,
          key,
          ghost,
          offsetX:t.clientX-rect.left,
          offsetY:t.clientY-rect.top
        };

        row.classList.add("dragging","drag-source");
        document.body.style.overflow="hidden";
        if(navigator.vibrate) navigator.vibrate(25);
        updateGhost(t.clientX,t.clientY);
      },250);
    },{passive:true});

    row.addEventListener("touchend",()=>{
      if(!touchDrag || touchDrag.row!==row) clearTimeout(longPressTimer);
    },{passive:true});

    row.addEventListener("touchcancel",()=>{
      if(!touchDrag || touchDrag.row!==row) clearTimeout(longPressTimer);
    },{passive:true});

    row.addEventListener("click",e=>{
      if(draggedByTouch){
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },true);

 return row;
}
function openModal(item=null){returnFocus=document.activeElement;editingId=item?.id||null;$('modalTitle').textContent=`${item?'Edit':'Add'} ${current?'item':'list'}`;$('nameLabel').textContent=current?'Item name':'List name';$('name').value=item?.name||'';$('aisle').value=item?.aisle||'';$('aisleField').hidden=!current;$('deleteBtn').hidden=!item;editor.showModal();$('name').focus();}
function closeModal(){editor.close();returnFocus?.isConnected?returnFocus.focus():$('addBtn').focus();}
$('addBtn').onclick=()=>openModal();$('cancel').onclick=closeModal;editor.addEventListener('click',e=>{if(e.target===editor){const r=editor.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
$('form').onsubmit=e=>{e.preventDefault();const name=$('name').value.trim();if(!name){$('name').setCustomValidity('Enter a name.');$('name').reportValidity();return;}const arr=collection();if(editingId){const item=arr.find(x=>x.id===editingId);item.name=name;if(current)item.aisle=$('aisle').value.trim();}else{arr.push(current?{id:crypto.randomUUID(),name,aisle:$('aisle').value.trim()}:{id:crypto.randomUUID(),name,items:[],sort:'manual'});}save();closeModal();render();};
$('name').oninput=()=>$('name').setCustomValidity('');
$('deleteBtn').onclick=()=>{if(!confirm(current?'Delete this item?':'Delete this list and all its items?'))return;const arr=collection(),i=arr.findIndex(x=>x.id===editingId);if(i>=0)arr.splice(i,1);save();closeModal();render();};
$('sort').onchange=()=>{active().sort=$('sort').value;save();render();};$('back').onclick=()=>{location.hash='';};
function navigate(){if(editor.open)closeModal();try{current=decodeURIComponent(location.hash.slice(1))||null;}catch{current=null;}render();}window.addEventListener('hashchange',navigate);navigate();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
})();
