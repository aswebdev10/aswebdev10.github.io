<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Daily Calorie Tracker</title>
<style>
:root{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#18312a;background:#f4f8f5}*{box-sizing:border-box}body{margin:0;padding:36px 16px}.wrap{max-width:620px;margin:auto}h1{margin:0 0 6px;font-size:2rem}p{color:#66766d;margin:0 0 24px}.summary{background:#174f3a;color:white;border-radius:22px;padding:28px;margin:24px 0;box-shadow:0 12px 30px #174f3a22}.summary small{opacity:.8}.total{font-size:3.5rem;font-weight:800;line-height:1.2}.panel{background:white;border:1px solid #e2ebe5;border-radius:18px;padding:22px;margin-bottom:18px;box-shadow:0 4px 20px #163c2610}h2{font-size:1.15rem;margin:0 0 18px}label{display:block;font-size:.9rem;font-weight:650;margin-bottom:7px}input{width:100%;padding:13px 14px;border:1px solid #cbd9d0;border-radius:10px;font:inherit;margin-bottom:16px}input:focus{outline:2px solid #2a8960;outline-offset:1px}button{font:inherit;cursor:pointer;border:0;border-radius:10px;padding:12px 18px;font-weight:700}.add{width:100%;background:#247b52;color:white}.add:hover{background:#195c3e}.entry{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;column-gap:14px;row-gap:10px;padding:16px 0;border-bottom:1px solid #e8eee9}.entry:last-child{border-bottom:0}.entry-name{font-weight:650;overflow-wrap:anywhere;min-width:0}.entry-right{display:flex;align-items:center;justify-content:flex-end;gap:7px;flex-wrap:wrap}.entry-calories{font-size:1rem;font-weight:750;white-space:nowrap;text-align:right}.entry-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px}.edit,.remove{font-size:.82rem;padding:7px 12px;border-radius:8px}.edit{background:#e8f2ec;color:#195c3e}.remove{background:#fff1f1;color:#9d3131}.edit:hover{background:#d6e9dd}.remove:hover{background:#fce1e1}.empty{color:#748178;text-align:center;padding:22px 0}.foot{font-size:.8rem;text-align:center;color:#7b8980;margin-top:20px}.clear{background:transparent;color:#9d3131;border:1px solid #edcccc;padding:8px 12px;font-size:.85rem}.heading{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}.heading h2{margin:0}@media(max-width:400px){.total{font-size:2.8rem}.panel{padding:17px}}
.mathkeys{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:-5px 0 16px}.mathkeys button{padding:10px 3px;background:#e8f2ec;color:#195c3e;font-size:.85rem;white-space:nowrap}@media(max-width:420px){.mathkeys button{font-size:.74rem}}
.open-modal{width:100%;background:#247b52;color:white;margin-bottom:18px;font-size:1.05rem}
.modal{border:0;border-radius:20px;padding:0;width:min(540px,calc(100% - 24px));max-height:min(90dvh,850px);overflow:auto;box-shadow:0 25px 80px #09271e55}
.modal[open]{position:fixed;top:24px;bottom:auto;margin:0 auto;left:0;right:0;border-radius:20px;max-height:calc(100dvh - 48px)}
.modal::backdrop{background:#0a241ba8}
.modal-inner{padding:24px}.modal-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}.modal-top h2{margin:0}.close-modal{background:#edf3ef;color:#18312a;padding:7px 13px;font-size:1.3rem}
body.modal-open{overflow:hidden}
@media(max-width:440px){.modal-inner{padding:20px}}
</style>
</head>
<body>
<main class="wrap">
<h1>🥗 Daily Calorie Tracker</h1><p id="dateLabel"></p>
<section class="summary" aria-live="polite"><small>NET CALORIES TODAY</small><div class="total"><span id="total">0</span> <span style="font-size:1rem;font-weight:500">kcal</span></div><small id="count">0 entries logged</small></section>
<button type="button" id="openAdd" class="open-modal">+ Add food or exercise</button>
<dialog id="entryModal" class="modal" aria-labelledby="formHeading"><div class="modal-inner"><div class="modal-top"><h2 id="formHeading">Add food or exercise</h2><button type="button" id="closeModal" class="close-modal" aria-label="Close">×</button></div><form id="foodForm"><label for="food">Food or exercise</label><input id="food" name="food" placeholder="e.g. Greek yogurt or walking" maxlength="120" required autocomplete="off"><label for="calories">Calories (kcal)</label><input id="calories" name="calories" type="text" inputmode="decimal" placeholder="e.g. 150, -200, or 100x3" required><div class="mathkeys" aria-label="Calculation buttons"><button type="button" data-op="×">× Multiply</button><button type="button" data-op="+">+ Add</button><button type="button" data-op="÷">÷ Divide</button><button type="button" data-op="-">− Subtract</button></div><button class="add" id="submitButton" type="submit">+ Add entry</button><button id="cancelEdit" type="button" class="clear" style="margin-top:10px;width:100%" hidden>Cancel editing</button><div style="font-size:.82rem;color:#66766d;margin-top:10px">You can enter calculations like 100x3 or -50x2.</div></form></div></dialog>
<section class="panel"><div class="heading"><h2>Today's entries</h2><button class="clear" id="clear" type="button" hidden>Clear today</button></div><div id="entries" aria-live="polite"></div></section>
<div class="foot">Saved only in this browser. Use negative calories for exercise. Previous days are deleted when a new day starts.</div>
</main>
<script>
(()=>{
'use strict';
const KEY='daily-calorie-tracker-v1';
const $=id=>document.getElementById(id);
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
let state={date:today(),entries:[]};let editingId=null;
function openModal(){const modal=$("entryModal");if(!modal.open)modal.showModal();document.body.classList.add("modal-open");setTimeout(()=>$("food").focus(),0)}
function closeModal(){const modal=$("entryModal");if(modal.open)modal.close();document.body.classList.remove("modal-open");stopEditing()}

function stopEditing(){editingId=null;$('formHeading').textContent='Add food or exercise';$('submitButton').textContent='+ Add entry';$('cancelEdit').hidden=true;$('foodForm').reset()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){console.warn('Storage unavailable',e)}}
function load(){try{const raw=JSON.parse(localStorage.getItem(KEY));if(raw&&raw.date===today()&&Array.isArray(raw.entries)){state={date:raw.date,entries:raw.entries.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.calories)&&x.calories>=-100000)}}else save()}catch(e){save()}}
function ensureToday(){if(state.date!==today()){state={date:today(),entries:[]};closeModal();save()} }
function render(){ensureToday();$('dateLabel').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});const total=state.entries.reduce((sum,e)=>sum+e.calories,0);$('total').textContent=total.toLocaleString();$('count').textContent=`${state.entries.length} entr${state.entries.length===1?'y':'ies'} logged`;$('clear').hidden=!state.entries.length;const box=$('entries');box.replaceChildren();if(!state.entries.length){const el=document.createElement('div');el.className='empty';el.textContent='No entries yet. Tap Add food or exercise to get started!';box.append(el);return}for(const item of [...state.entries].reverse()){const row=document.createElement('div');row.className='entry';const left=document.createElement('div');const name=document.createElement('div');name.className='entry-name';name.textContent=item.name;left.append(name);const kcal=document.createElement('strong');kcal.className='entry-calories';kcal.textContent=`${item.calories.toLocaleString()} kcal`;const actions=document.createElement('div');actions.className='entry-actions';const edit=document.createElement('button');edit.type='button';edit.className='edit';edit.textContent='Edit';edit.setAttribute('aria-label',`Edit ${item.name}`);edit.onclick=()=>{ensureToday();const current=state.entries.find(e=>e.id===item.id);if(!current)return;editingId=current.id;$('food').value=current.name;$('calories').value=current.calories;$('formHeading').textContent='Edit entry';$('submitButton').textContent='Save changes';$('cancelEdit').hidden=false;openModal()};const del=document.createElement('button');del.type='button';del.className='remove';del.textContent='Remove';del.setAttribute('aria-label',`Remove ${item.name}`);del.onclick=()=>{ensureToday();if(!state.entries.some(e=>e.id===item.id))return;if(!confirm(`Delete "${item.name}" (${item.calories} kcal)?`))return;state.entries=state.entries.filter(e=>e.id!==item.id);if(editingId===item.id)stopEditing();save();render()};actions.append(edit,del);row.append(left,kcal,actions);box.append(row)}}

function calculateCalories(input){
 const tokens=input.replace(/[×xX]/g,'*').replace(/÷/g,'/').replace(/\s+/g,'').match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+*/-]/g);
 if(!tokens||tokens.join('')!==input.replace(/[×xX]/g,'*').replace(/÷/g,'/').replace(/\s+/g,''))throw Error('Invalid expression');
 let i=0;
 function factor(){
  if(tokens[i]==='+'){i++;return factor()}
  if(tokens[i]==='-'){i++;return -factor()}
  if(tokens[i]==='('){i++;const v=expr();if(tokens[i++]!==')')throw Error('Missing closing parenthesis');return v}
  const t=tokens[i++];if(!t||! /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(t))throw Error('Invalid number');
  return Number(t);
 }
 function term(){let v=factor();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],b=factor();v=op==='*'?v*b:v/b}return v}
 function expr(){let v=term();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=term();v=op==='+'?v+b:v-b}return v}
 const result=expr();if(i!==tokens.length||!Number.isFinite(result)||!Number.isSafeInteger(result)||Math.abs(result)>100000)throw Error('Enter a calculation resulting in a whole number between -100,000 and 100,000');
 return result;
}

document.querySelectorAll('[data-op]').forEach(button=>button.addEventListener('click',()=>{const field=$('calories');const op=button.dataset.op;const start=field.selectionStart??field.value.length,end=field.selectionEnd??field.value.length;field.setRangeText(op,start,end,'end');field.focus()}));
$('foodForm').addEventListener('submit',e=>{e.preventDefault();ensureToday();const name=$('food').value.trim();let calories;try{calories=calculateCalories($('calories').value)}catch(err){alert(err.message);return}if(!name)return;if(editingId!==null){const item=state.entries.find(x=>x.id===editingId);if(!item){stopEditing();render();return}item.name=name;item.calories=calories}else{state.entries.push({id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`,name,calories,})}save();closeModal();render()});
$('cancelEdit').addEventListener('click',closeModal);
$('openAdd').addEventListener('click',()=>{stopEditing();openModal()});
$('closeModal').addEventListener('click',closeModal);
$('entryModal').addEventListener('cancel',()=>{document.body.classList.remove('modal-open');stopEditing()});
$('entryModal').addEventListener('click',e=>{if(e.target===$('entryModal'))closeModal()});
$('clear').addEventListener('click',()=>{if(confirm('Delete all entries logged today?')){ensureToday();state.entries=[];stopEditing();save();render()}});
load();render();setInterval(render,15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});window.addEventListener('focus',render);window.addEventListener('storage',e=>{if(e.key===KEY){load();render()}});
})();
</script>
</body>
</html>
