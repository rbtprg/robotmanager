const KEY='robotProgrammerManagerV1';
const hasLocalData=!!localStorage.getItem(KEY);
let db=JSON.parse(localStorage.getItem(KEY)||'null')||{
 robots:[], selectedRobot:null,
 settings:{},
 overhang:{old:[],new:[]}
};
const $=s=>document.querySelector(s);
const app=$('#app');

let localDbFileHandle=null;
function save(){
 const serialized=JSON.stringify(db,null,2);
 localStorage.setItem(KEY,serialized);
 if(localDbFileHandle && typeof localDbFileHandle.createWritable==='function'){
   localDbFileHandle.createWritable().then(async w=>{await w.write(serialized);await w.close();toast('Saved to browser and local JSON file');}).catch(e=>{console.error(e);toast('Saved in browser; file write failed. Reconnect file.');});
 } else { toast('Saved in this browser. Use Backup to save a JSON file.'); }
 render();
}
function toast(msg){let x=document.createElement('div');x.textContent=msg;x.style='position:fixed;right:18px;bottom:18px;background:#111827;color:white;padding:11px 15px;border-radius:8px;z-index:200';document.body.appendChild(x);setTimeout(()=>x.remove(),1800)}
function robot(){return db.robots.find(r=>r.id===db.selectedRobot)||db.robots[0]}
function ensureData(r){
 r.calibration ||= {base:'',tcp:'',frame:'',payload:'',mastering:'',zero:'',notes:''};
 r.io ||= {digitalIn:[],digitalOut:[],universalIn:[],universalOut:[],notes:''};
 // Ensure the four supported I/O tables use the required five-column format.
 for (const key of ['digitalIn','digitalOut','universalIn','universalOut']) {
   const old = Array.isArray(r.io[key]) ? r.io[key] : [];
   r.io[key] = Array.from({length:10}, (_,i) => { const x=old[i]||{}; return {range:x.range??x.address??'',rack:x.rack??'',slot:x.slot??'',start:x.start??''}; });
 }
 r.ethernet ||= {robotIP:'',controller:'',subnet:'',gateway:'',dns:'',mac:'',ports:[],notes:''};
 r.overhang ||= {old:[],new:[]};
 r.panel ||= {items:[]};
 r.details ||= {manufacturer:'',model:'',controller:'',software:'',welding:'',cell:'',programPath:'',backupPath:'',notes:''};
}
function changeGlobalRobot(id){if(!id)return;db.selectedRobot=id;save()}
window.changeGlobalRobot=changeGlobalRobot;

function nav(page){document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===page)); location.hash=page; render()}
document.querySelectorAll('.nav-item').forEach(x=>x.onclick=()=>{nav(x.dataset.page);$('#sidebar').classList.remove('open')});
$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');
$('#quickSave').onclick=save;
$('#addRobotTop').onclick=()=>openRobotModal();

function render(){
 let page=location.hash.slice(1)||'dashboard';
 const titles={dashboard:'Dashboard',robots:'Robots',calibration:'Calibration',io:'I/O Configuration',ethernet:'Ethernet Configuration',overhang:'Overhang Generator',panel:'Panel Diagram',details:'Other Details',backup:'Backup / Restore'};
 $('#pageTitle').textContent=titles[page]||'Dashboard';
 $('#currentRobotLabel').innerHTML=`<label class="top-robot-label">ROBOT <select onchange="changeGlobalRobot(this.value)">${db.robots.length?db.robots.map(r=>`<option value="${r.id}" ${r.id===db.selectedRobot?'selected':''}>${r.name}${r.model?' • '+r.model:''}</option>`).join(''):'<option>No Robot</option>'}</select></label>`;
 ({dashboard,robots,calibration,io,ethernet,overhang,panel,details,files,backup}[page]||dashboard)();
}
function dashboard(){
 const r=robot();
 app.innerHTML=`<div class="grid">
 <div class="card"><span class="muted">TOTAL ROBOTS</span><div class="stat">${db.robots.length}</div></div>
 <div class="card"><span class="muted">SELECTED ROBOT</span><div class="stat">${r?'1':'0'}</div></div>
 <div class="card"><span class="muted">I/O ENTRIES</span><div class="stat">${r?['digitalIn','digitalOut','universalIn','universalOut'].reduce((n,k)=>n+(r.io[k]||[]).filter(x=>x.range||x.rack||x.slot||x.start).length,0):0}</div></div>
 <div class="card"><span class="muted">OVERHANG RECORDS</span><div class="stat">${r?(r.overhang.old.length+r.overhang.new.length):0}</div></div></div>
 <div class="grid-2" style="margin-top:16px">
 <div class="card"><div class="section-title"><h2>Robot Programmer Database</h2><button class="btn primary" onclick="openRobotModal()">+ Add Robot</button></div>
 <p class="muted">Store robot calibration, I/O, Ethernet, overhang, panel and cell information in one place. Data is stored in this browser using local storage.</p>
 ${r?`<div class="kpi-list"><div class="kpi"><b>Robot</b><span>${r.name}</span></div><div class="kpi"><b>Model</b><span>${r.model||'-'}</span></div><div class="kpi"><b>Controller</b><span>${r.details.controller||'-'}</span></div><div class="kpi"><b>Robot IP</b><span class="mono">${r.ethernet.robotIP||'-'}</span></div></div>`:`<div class="empty">Add your first robot.</div>`}
 </div>
 <div class="card"><h2 style="margin-top:0">Quick Modules</h2><div class="actions">
 ${['calibration','io','ethernet','overhang','panel','details'].map(p=>`<button class="btn secondary" onclick="nav('${p}')">${titles[p]}</button>`).join('')}
 </div><div class="notice" style="margin-top:15px">Tip: Use Backup / Restore to move the database between a PC and phone.</div></div></div>`;
}
const titles={calibration:'Calibration',io:'I/O Configuration',ethernet:'Ethernet Configuration',overhang:'Overhang Generator',panel:'Panel Diagram',details:'Other Details'};
function robots(){
 app.innerHTML=`<div class="card"><div class="section-title"><h2>Robot List</h2><button class="btn primary" onclick="openRobotModal()">+ Add Robot</button></div>
 ${db.robots.length?`<div class="table-wrap"><table class="data-table"><tr><th>Name</th><th>Manufacturer</th><th>Model</th><th>Controller</th><th>IP</th><th>Status</th><th>Actions</th></tr>${db.robots.map(r=>`<tr><td><b>${r.name}</b></td><td>${r.manufacturer||'-'}</td><td>${r.model||'-'}</td><td>${r.details.controller||'-'}</td><td class="mono">${r.ethernet.robotIP||'-'}</td><td><span class="badge ok">LOCAL</span></td><td class="actions"><button class="btn secondary" onclick="selectRobot('${r.id}')">Open</button><button class="btn danger" onclick="deleteRobot('${r.id}')">Delete</button></td></tr>`).join('')}</table></div>`:'<div class="empty">No robots added.</div>'}</div>`;
}
function selectRobot(id){db.selectedRobot=id;save()}
function openRobotModal(id=null){
 const r=id?db.robots.find(x=>x.id===id):null;
 $('#modalTitle').textContent=r?'Edit Robot':'Add Robot';
 $('#modalBody').innerHTML=`<div class="form-grid">
 <div class="form-group"><label>Robot Name *</label><input id="m_name" value="${r?.name||''}"></div>
 <div class="form-group"><label>Manufacturer</label><input id="m_man" value="${r?.manufacturer||''}" placeholder="FANUC / KUKA / ABB / YASKAWA"></div>
 <div class="form-group"><label>Robot Model</label><input id="m_model" value="${r?.model||''}"></div>
 <div class="form-group"><label>Controller</label><input id="m_controller" value="${r?.details.controller||''}"></div>
 <div class="form-group full"><label>Notes</label><textarea id="m_notes">${r?.details.notes||''}</textarea></div></div>
 <div class="actions" style="margin-top:15px"><button class="btn primary" onclick="saveRobot('${id||''}')">Save Robot</button></div>`;
 $('#modal').classList.remove('hidden');
}
function saveRobot(id){
 let r=id?db.robots.find(x=>x.id===id):{id:crypto.randomUUID(),calibration:{},io:{digitalIn:[],digitalOut:[],universalIn:[],universalOut:[]},ethernet:{ports:[]},overhang:{old:[],new:[]},panel:{items:[]},details:{}};
 r.name=$('#m_name').value.trim()||'Unnamed Robot';r.manufacturer=$('#m_man').value;r.model=$('#m_model').value;r.details.controller=$('#m_controller').value;r.details.notes=$('#m_notes').value;
 ensureData(r);if(!id)db.robots.push(r);db.selectedRobot=r.id;closeModal();save();nav('dashboard');
}
function deleteRobot(id){if(confirm('Delete this robot and all its stored data?')){db.robots=db.robots.filter(r=>r.id!==id);if(db.selectedRobot===id)db.selectedRobot=db.robots[0]?.id||null;save();nav('robots')}}
function calibration(){
 const r=robot();if(!r)return needRobot();ensureData(r);
 const c=r.calibration;
 c.masterCounts ||= Array(9).fill('');
 app.innerHTML=`<div class="card calibration-card">
  <div class="section-title"><div><h2>Calibration</h2><p class="muted">Select a calibration function for the active robot.</p></div></div>
  <div class="cal-tabs">
   <button class="cal-tab active" onclick="showCalibrationProcess(this)">1. FOLLOW CALIBRATION PROCESS</button>
   <button class="cal-tab" onclick="showCalibrationValues(this)">2. CALIBRATION VALUES</button>
  </div>
  <div id="calibrationPanel"></div>
 </div>`;
 showCalibrationProcess(document.querySelector('.cal-tab'));
}
function showCalibrationProcess(btn){
 document.querySelectorAll('.cal-tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
 $('#calibrationPanel').innerHTML=`<div class="cal-process-head"><div><h3>FOLLOW CALIBRATION PROCESS</h3><p class="muted">Calibration procedure document for the selected robot.</p></div><a class="btn primary" href="cal.pdf" target="_blank">OPEN PDF</a></div>
 <div class="pdf-frame-wrap"><iframe class="cal-pdf" src="cal.pdf#view=FitH" title="Calibration Process PDF"></iframe></div>`;
}
function showCalibrationValues(btn){
 document.querySelectorAll('.cal-tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
 const r=robot(),c=r.calibration;
 const labels=['1','2','3','4','5','6','7','8','9'];
 $('#calibrationPanel').innerHTML=`<div class="section-title"><div><h3>CALIBRATION VALUES</h3><p class="muted">Enter the MASTER COUNT values from the robot. Nine positions are provided to match the displayed robot chart.</p></div><button class="btn primary" onclick="saveCalibrationValues()">SAVE VALUES</button></div>
 <div class="cal-master-card"><div class="cal-master-title"><span class="mono">$DMR_GRP[1].$MASTER_COUN</span><span class="badge">MASTER COUNT</span></div>
 <div class="table-wrap"><table class="data-table master-table"><tr><th>SR.NO</th><th>GROUP</th><th>MASTER COUNT</th></tr>${labels.map((n,i)=>`<tr><td>${n}</td><td>[${n}]</td><td><input class="master-input" data-master-index="${i}" value="${c.masterCounts[i]||''}" type="number" step="1" placeholder="Enter value"></td></tr>`).join('')}</table></div></div>
 <div class="form-grid" style="margin-top:16px">${[['base','BASE / J1 CALIBRATION'],['tcp','TCP / TOOL CALIBRATION'],['frame','USER FRAME / WORK OBJECT'],['payload','PAYLOAD / LOAD DATA'],['mastering','MASTERING / ZERO DATA'],['zero','ZERO POSITION / HOME DATA']].map(([k,l])=>`<div class="form-group"><label>${l}</label><textarea data-field="${k}" data-module="calibration">${c[k]||''}</textarea></div>`).join('')}<div class="form-group full"><label>CALIBRATION NOTES</label><textarea data-field="notes" data-module="calibration">${c.notes||''}</textarea></div></div>`;
}
function saveCalibrationValues(){
 const r=robot();ensureData(r);r.calibration.masterCounts=[...document.querySelectorAll('.master-input')].map(x=>x.value);
 document.querySelectorAll('[data-module="calibration"]').forEach(el=>r.calibration[el.dataset.field]=el.value);
 save();
}

function io(){
 const r=robot();if(!r)return needRobot();ensureData(r);
 const types=[['digitalIn','DIGITAL INPUT'],['digitalOut','DIGITAL OUTPUT'],['universalIn','UNIVERSAL INPUT'],['universalOut','UNIVERSAL OUTPUT']];
 app.innerHTML=`<div class="card"><div class="section-title"><div><h2>I/O Configuration</h2><p class="muted">Enter values for the selected robot. Each section has 10 rows; SR.NO is automatic.</p></div><button class="btn primary" onclick="saveIOTable()">SAVE I/O DATA</button></div><div class="tabs">${types.map((x,i)=>`<button class="tab ${i===0?'active':''}" data-iotype="${x[0]}" onclick="ioTab('${x[0]}',this)">${x[1]}</button>`).join('')}</div><div id="ioTable"></div></div>`;
 ioTab('digitalIn',document.querySelector('.tab'));
}
function ioTab(type,btn){
 // Preserve edits when the user switches between I/O sections without pressing Save first.
 persistVisibleIOTable();
 document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
 const r=robot();if(!r)return;ensureData(r);const arr=r.io[type]||[];
 const labels=[['range','RANGE'],['rack','RACK'],['slot','SLOT']];
 $('#ioTable').innerHTML=`<div class="section-title"><span class="muted">10 rows · Enter values in the fields below</span><button class="btn secondary" onclick="saveIOTable()">Save This Section</button></div><div class="table-wrap io-table-wrap"><table class="data-table io-data-table"><thead><tr><th>SR.NO</th><th>RANGE</th><th>RACK</th><th>SLOT</th></tr></thead><tbody>${Array.from({length:10},(_,i)=>`<tr><td>${i+1}</td>${labels.map(([k])=>`<td><input class="io-cell-input" data-iotype="${type}" data-row="${i}" data-field="${k}" value="${String(arr[i]?.[k]??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}" aria-label="${k} row ${i+1}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function persistVisibleIOTable(){
 const r=robot();if(!r)return;ensureData(r);
 const visibleType=document.querySelector('#ioTable .io-cell-input')?.dataset.iotype;
 if(!visibleType)return;
 const rows=Array.from({length:10},(_,i)=>({range:'',rack:'',slot:''}));
 document.querySelectorAll('#ioTable .io-cell-input').forEach(el=>{rows[Number(el.dataset.row)][el.dataset.field]=el.value.trim()});
 r.io[visibleType]=rows;
}
function saveIOTable(){
 const r=robot();if(!r)return;ensureData(r);
 const visibleType=document.querySelector('#ioTable .io-cell-input')?.dataset.iotype;
 if(!visibleType)return;
 persistVisibleIOTable();save();
 // Keep the current I/O section open after saving.
 const btn=document.querySelector(`.tab[data-iotype="${visibleType}"]`);if(btn)ioTab(visibleType,btn);
}
function ethernet(){
 const r=robot();if(!r)return needRobot();const e=r.ethernet;
 app.innerHTML=`<div class="card"><div class="section-title"><h2>Ethernet / Network Configuration</h2><button class="btn primary" onclick="saveModule('ethernet')">Save</button></div>
 <div class="form-grid">${[['robotIP','Robot IP Address'],['controller','Controller / Network Name'],['subnet','Subnet Mask'],['gateway','Gateway'],['dns','DNS'],['mac','MAC Address']].map(([k,l])=>`<div class="form-group"><label>${l}</label><input data-field="${k}" data-module="ethernet" value="${e[k]||''}"></div>`).join('')}<div class="form-group full"><label>Ethernet Ports / Services</label><textarea data-field="ports" data-module="ethernet">${(e.ports||[]).map(x=>typeof x==='string'?x:JSON.stringify(x)).join('\\n')}</textarea></div><div class="form-group full"><label>Network Notes</label><textarea data-field="notes" data-module="ethernet">${e.notes||''}</textarea></div></div></div>`;
}
function overhang(){
 const r=robot();if(!r)return needRobot();ensureData(r);
 app.innerHTML=`<div class="card overhang-matrix-card">
   <div class="section-title"><div><h2>Overhang Matrix</h2><p class="muted">Old Fanuc and New Fanuc overhang generator</p></div></div>
   <div class="sub-tab-container">
     <button id="sub-tab-old" class="sub-tab active" onclick="switchOverhangGen('old')">Old Fanuc</button>
     <button id="sub-tab-new" class="sub-tab" onclick="switchOverhangGen('new')">New Fanuc</button>
   </div>
   <div id="overhang-old-content" class="sub-content active">
     <div class="card inner-card">
       <h2>Old Fanuc Overhang Configuration</h2>
       <div class="form-grid">
         <div class="form-group"><label>X Coordinate</label><input type="number" id="old-x" value="0" step="0.001"></div>
         <div class="form-group"><label>Y Coordinate</label><input type="number" id="old-y" value="0" step="0.001"></div>
         <div class="form-group"><label>Z Coordinate</label><input type="number" id="old-z" value="0" step="0.001"></div>
         <div class="form-group"><label>O (Overhang Base)</label><input type="number" id="old-o" value="0" step="0.001"></div>
       </div>
       <button class="btn primary full-btn" onclick="runOldOverhang()">SUBMIT (Calculate Old)</button>
     </div>
     <div class="card inner-card">
       <h2>Output Parameters</h2>
       <div class="form-grid three-cols">
         <div class="form-group"><label>Output X</label><input type="text" id="old-ox" readonly></div>
         <div class="form-group"><label>Output Y</label><input type="text" id="old-oy" readonly></div>
         <div class="form-group"><label>Output Z</label><input type="text" id="old-oz" readonly></div>
       </div>
     </div>
   </div>
   <div id="overhang-new-content" class="sub-content">
     <div class="card inner-card">
       <h2>New Fanuc Offset Configuration</h2>
       <div class="form-grid">
         <div class="form-group"><label>X Coordinate</label><input type="number" id="new-x" value="0" step="0.001"></div>
         <div class="form-group"><label>Y Coordinate</label><input type="number" id="new-y" value="0" step="0.001"></div>
         <div class="form-group"><label>Z Coordinate</label><input type="number" id="new-z" value="0" step="0.001"></div>
         <div class="form-group"><label>O (Overhang Base)</label><input type="number" id="new-o" value="0" step="0.001"></div>
       </div>
       <button class="btn primary full-btn" onclick="runNewOverhang()">SUBMIT (Calculate New)</button>
     </div>
     <div class="card inner-card">
       <h2>Output Parameters</h2>
       <div class="form-grid three-cols">
         <div class="form-group"><label>Output OX</label><input type="text" id="new-ox" readonly></div>
         <div class="form-group"><label>Output OY</label><input type="text" id="new-oy" readonly></div>
         <div class="form-group"><label>Output OZ</label><input type="text" id="new-oz" readonly></div>
       </div>
     </div>
   </div>
 </div>`;
}
function switchOverhangGen(mode){
 document.querySelectorAll('.sub-tab').forEach(el=>el.classList.remove('active'));
 document.querySelectorAll('.sub-content').forEach(el=>el.classList.remove('active'));
 const isOld=mode==='old';
 document.getElementById(isOld?'sub-tab-old':'sub-tab-new').classList.add('active');
 document.getElementById(isOld?'overhang-old-content':'overhang-new-content').classList.add('active');
}
function runOldOverhang(){
 let zx=parseFloat(document.getElementById('old-x').value)||0;
 let zy=parseFloat(document.getElementById('old-y').value)||0;
 let zz=parseFloat(document.getElementById('old-z').value)||0;
 let zo=parseFloat(document.getElementById('old-o').value)||0;
 let zxm=Math.abs(zx),zzm=Math.abs(zz),zcc;
 if(zx<0){zcc=-((0.707*zo)+zxm).toFixed(3)}else{zcc=(zxm-(0.707*zo)).toFixed(3)}
 let zvv=zy,zb=0.707*zo,zbv=zb+zzm,zbb;
 if(zz<0){zbb=-(zbv).toFixed(3)}else{zbb=zbv.toFixed(3)}
 document.getElementById('old-ox').value=zcc;
 document.getElementById('old-oy').value=zvv;
 document.getElementById('old-oz').value=zbb;
}
function runNewOverhang(){
 let zx=parseFloat(document.getElementById('new-x').value)||0;
 let zy=parseFloat(document.getElementById('new-y').value)||0;
 let zz=parseFloat(document.getElementById('new-z').value)||0;
 let zo=parseFloat(document.getElementById('new-o').value)||0;
 let zxm=Math.abs(zx),zzm=Math.abs(zz),zcc;
 let zc=0.574*zo,zcv=zc+zxm;
 if(zx<0){zcc=-(zcv).toFixed(3)}else{zcc=zcv.toFixed(3)}
 let zvv=zy,zb=0.819*zo,zbv=zb+zzm,zbb;
 if(zz<0){zbb=-(zbv).toFixed(3)}else{zbb=zbv.toFixed(3)}
 document.getElementById('new-ox').value=zcc;
 document.getElementById('new-oy').value=zvv;
 document.getElementById('new-oz').value=zbb;
}
function panel(){
 const r=robot();if(!r)return needRobot();ensureData(r);
 app.innerHTML=`<div class="card panel-generator-card">
   <div class="section-title"><div><h2>Aluminium Panel Diagram</h2><p class="muted">Panel stiffener layout generator</p></div></div>
   <div class="form-group"><label>Customer Selection</label><select id="customer" onchange="resetPanel()">
     <option value="STDREV_DECK">STDREV_DECK</option><option value="KALPATARU_DECK">KALPATARU_DECK</option>
     <option value="RAGHAVAN">RAGHAVAN</option><option value="KALPATARU">KALPATARU</option>
     <option value="STDREV">STDREV</option><option value="WT">WT</option><option value="WX">WX</option>
   </select></div>
   <div class="form-grid">
     <div class="form-group"><label>Width</label><input type="number" id="width" value="600"></div>
     <div class="form-group"><label>Length</label><input type="number" id="length" value="2400"></div>
   </div>
   <button class="btn primary full-btn" onclick="generate()">Submit</button>
   <div class="panel-note">NOTE : The gap is from center of stiffner to reference</div>
   <div class="panel-scroll"><div id="panel" class="generated-panel"></div></div>
   <div class="panel-summary" id="summary"></div>
   <div class="gauge-box"><b>Gauge :</b><div id="gauge"></div></div>
 </div>`;
 resetPanel();
}
function generate(){
 let customer=document.getElementById('customer').value;
 let length=parseInt(document.getElementById('length').value);
 if(length>2500){alert('Panel length cannot exceed 2500 mm.');return}
 if(length<=0||isNaN(length)){alert('Please enter a valid panel length.');return}
 let panelEl=document.getElementById('panel'),summary=document.getElementById('summary');
 panelEl.innerHTML='';summary.innerHTML='';
 let ratio=Math.min(0.3,700/length);panelEl.style.width=(length*ratio)+'px';
 let positions=[],gapPattern=[],typePattern=[];
 if(customer==='WT'){
   let typeCount={u:0,ulip:0,i:0};
   if(length>=250&&length<=365)positions.push(length/2);else if(length<=565)positions.push(250);else{let pos=250;positions.push(pos);while(true){pos+=200;if(pos>=length)break;positions.push(pos)}}
   if(positions.length>0&&length-positions[positions.length-1]<116)positions.pop();
   drawStiffeners(positions,['u'],ratio,panelEl,summary,typeCount);return;
 }
 if(customer==='WX'){
   let typeCount={u:0,ulip:0,i:0};
   if(length>=250&&length<=599)positions.push(length/2);else if(length>=600&&length<=799){positions.push(200);positions.push(length-200)}else if(length>=800){let pos=0;while(true){pos+=200;if(pos>=length)break;positions.push(pos)}}
   if(positions.length>0&&length-positions[positions.length-1]<116)positions.pop();
   drawStiffeners(positions,['u'],ratio,panelEl,summary,typeCount);return;
 }
 if(customer==='STDREV_DECK'){gapPattern=[300];typePattern=['i']}
 if(customer==='KALPATARU_DECK'){gapPattern=[250,300,300,300,300,300,300,300];typePattern=['i','i','i','i','i','i','i','i']}
 if(customer==='RAGHAVAN'){gapPattern=[225,250,275,275,275,300,275,300,225];typePattern=['u','ulip','u','ulip','u','ulip','u','u']}
 if(customer==='KALPATARU'){gapPattern=[225,225,275,275,300,300,300,300,200];typePattern=['u','ulip','u','ulip','u','ulip','u','u']}
 if(customer==='STDREV'){gapPattern=[225,225,275,275,300,300,300,350,150];typePattern=['u','ulip','u','ulip','u','ulip','u','u']}
 let center=0,gapIndex=0;
 while(gapPattern.length){let nextGap=gapPattern[gapIndex%gapPattern.length];center+=nextGap;if(center>=length)break;positions.push(center);gapIndex++}
 if(positions.length>0&&length-positions[positions.length-1]<116)positions.pop();
 drawStiffeners(positions,typePattern,ratio,panelEl,summary);
}
function drawStiffeners(positions,typePattern,ratio,panelEl,summary,typeCountInput){
 let typeCount=typeCountInput||{u:0,ulip:0,i:0};let gauges=[];
 positions.forEach((pos,i)=>{
   let type=typePattern[i%typePattern.length],stiff=document.createElement('div');
   stiff.classList.add('stiffener',type);stiff.style.left=(pos*ratio)+'px';panelEl.appendChild(stiff);typeCount[type]++;
   let gapValue=(i===0)?pos:pos-positions[i-1],gapLabel=document.createElement('div');
   gapLabel.className='label';gapLabel.innerText='Gap: '+gapValue+'MM';gapLabel.style.left=(pos*ratio-20)+'px';panelEl.appendChild(gapLabel);
   let stiffWidth=(type==='u')?25:(type==='ulip')?35:10;gauges.push(pos-stiffWidth);
   let typeLabel=document.createElement('div');typeLabel.className='panel-type-label';typeLabel.style.left=(pos*ratio-25)+'px';
   typeLabel.innerText=type==='u'?'Stiff-U':type==='ulip'?'Stiff-U Lip':'Stiff-I';panelEl.appendChild(typeLabel);
 });
 document.getElementById('gauge').innerText=gauges.join(' , ');
 summary.innerHTML=`Total Stiffeners: ${positions.length}<br>Stiff-U Count: ${typeCount.u}<br>Stiff-U Lip Count: ${typeCount.ulip}<br>Stiff-I Count: ${typeCount.i}`;
}
function resetPanel(){
 const p=document.getElementById('panel'),s=document.getElementById('summary'),g=document.getElementById('gauge');
 if(p)p.innerHTML='';if(s)s.innerHTML='';if(g)g.innerHTML='';
}
function details(){
 const r=robot();if(!r)return needRobot();const d=r.details;
 app.innerHTML=`<div class="card"><div class="section-title"><h2>Other Robot / Cell Details</h2><button class="btn primary" onclick="saveModule('details')">Save</button></div><div class="form-grid">${[['manufacturer','Manufacturer'],['model','Robot Model'],['controller','Controller'],['software','Robot Software Version'],['welding','Welding Machine / Process'],['cell','Robot Cell / Line'],['programPath','Program Backup Path'],['backupPath','Full Backup Location']].map(([k,l])=>`<div class="form-group"><label>${l}</label><input data-field="${k}" data-module="details" value="${d[k]||''}"></div>`).join('')}<div class="form-group full"><label>Other Details / Notes</label><textarea data-field="notes" data-module="details">${d.notes||''}</textarea></div></div></div>`;
}
const FILE_DB_NAME='robotProgrammerLocalFiles';
const FILE_STORE='robotFiles';
function openRobotFilesDB(){
 return new Promise((resolve,reject)=>{
  if(!('indexedDB' in window)){reject(new Error('This browser does not support local file storage.'));return;}
  const req=indexedDB.open(FILE_DB_NAME,1);
  req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains(FILE_STORE)){const st=d.createObjectStore(FILE_STORE,{keyPath:'id',autoIncrement:true});st.createIndex('addedAt','addedAt');}};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Could not open local file storage.'));
 });
}
async function listRobotFiles(){const d=await openRobotFilesDB();return new Promise((resolve,reject)=>{const tx=d.transaction(FILE_STORE,'readonly');const req=tx.objectStore(FILE_STORE).getAll();req.onsuccess=()=>resolve(req.result.sort((a,b)=>b.addedAt-a.addedAt));req.onerror=()=>reject(req.error);});}
async function addRobotFiles(){
 const picker=$('#robotFilesInput');if(!picker.files.length){alert('Select one or more files first.');return;}
 try{const d=await openRobotFilesDB();for(const f of picker.files){const bytes=await f.arrayBuffer();const storedBlob=new Blob([bytes],{type:f.type||'application/octet-stream'});const record={name:f.name,type:f.type||'application/octet-stream',size:bytes.byteLength,addedAt:Date.now(),blob:storedBlob};await new Promise((resolve,reject)=>{const tx=d.transaction(FILE_STORE,'readwrite');tx.objectStore(FILE_STORE).add(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}picker.value='';await renderRobotFiles();toast('Files saved locally in this browser');}
 catch(e){alert('Could not save files locally: '+e.message);}
}
async function downloadRobotFile(id){try{const d=await openRobotFilesDB();const f=await new Promise((resolve,reject)=>{const req=d.transaction(FILE_STORE,'readonly').objectStore(FILE_STORE).get(Number(id));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});if(!f)throw new Error('Stored file was not found.');let blob=f.blob;if(blob instanceof ArrayBuffer)blob=new Blob([blob],{type:f.type||'application/octet-stream'});else if(blob&&!(blob instanceof Blob)&&blob.buffer)blob=new Blob([blob.buffer],{type:f.type||'application/octet-stream'});if(!(blob instanceof Blob)||blob.size===0){alert('This saved entry contains 0 bytes. Please delete it, select the original file again, and click Save Selected Files Locally.');return;}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=f.name||'robot-file';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(e){alert('Could not download file: '+e.message);}}
async function deleteRobotFile(id){if(!confirm('Delete this stored file?'))return;try{const d=await openRobotFilesDB();await new Promise((resolve,reject)=>{const tx=d.transaction(FILE_STORE,'readwrite');tx.objectStore(FILE_STORE).delete(Number(id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});await renderRobotFiles();}catch(e){alert('Could not delete file: '+e.message);}}
async function renderRobotFiles(){
 let files=[];try{files=await listRobotFiles();}catch(e){app.innerHTML=`<div class="card"><h2>Files</h2><p>Local file storage is unavailable in this browser. Try the latest Chrome or Edge.</p></div>`;return;}
 const fmt=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';
 app.innerHTML=`<div class="card"><div class="section-title"><h2>Robot Files Library</h2></div><p class="muted">Store important robot files such as TP/LS programs, backups, manuals, calibration documents, wiring diagrams and PDFs. Files are saved locally in this browser on this device, not uploaded to GitHub or a cloud service.</p><div class="form-group"><label>Select files to store</label><input id="robotFilesInput" type="file" multiple></div><div class="actions" style="margin-top:12px"><button class="btn primary" onclick="addRobotFiles()">Save Selected Files Locally</button><button class="btn secondary" onclick="exportAllRobotFiles()">Export All Files</button></div></div><div class="card" style="margin-top:16px"><div class="section-title"><h2>Stored Files (${files.length})</h2></div>${files.length?`<div class="table-wrap"><table class="data-table" style="min-width:0;width:100%"><thead><tr><th>File Name</th><th>Size</th><th>Added</th><th>Actions</th></tr></thead><tbody>${files.map(f=>`<tr><td style="overflow-wrap:anywhere;font-weight:700">${escapeFileText(f.name)}</td><td>${fmt(f.size)}</td><td>${new Date(f.addedAt).toLocaleDateString()}</td><td><div class="actions"><button class="btn secondary" onclick="downloadRobotFile(${f.id})">Download</button><button class="btn danger" onclick="deleteRobotFile(${f.id})">Delete</button></div></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty">No files stored yet. Choose files above and click Save Selected Files Locally.</div>`}<p class="muted" style="margin-top:12px">For use on another PC, click Export All Files, then import the exported archive using the same Files menu. Files are separate from robots.json.</p><div class="form-group" style="margin-top:10px"><label>Import file archive (JSON)</label><input id="robotFilesImport" type="file" accept=".json,application/json"></div><button class="btn secondary" style="margin-top:10px" onclick="importAllRobotFiles()">Import Files Archive</button></div>`;
}
function escapeFileText(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function files(){await renderRobotFiles();}
async function exportAllRobotFiles(){try{const files=await listRobotFiles();const records=[];for(const f of files){const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f.blob);});records.push({name:f.name,type:f.type,size:f.size,addedAt:f.addedAt,dataUrl});}const blob=new Blob([JSON.stringify({format:'robot-programmer-files-v1',files:records},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ROBOT_PROGRAMMER_FILES_ARCHIVE.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}catch(e){alert('Could not export files: '+e.message);}}
async function importAllRobotFiles(){const input=$('#robotFilesImport');const f=input.files[0];if(!f){alert('Select a files archive JSON first.');return;}try{const data=JSON.parse(await f.text());if(data.format!=='robot-programmer-files-v1'||!Array.isArray(data.files))throw new Error('This is not a valid Robot Programmer Files archive.');const d=await openRobotFilesDB();for(const item of data.files){const response=await fetch(item.dataUrl);const rawBlob=await response.blob();const blob=new Blob([await rawBlob.arrayBuffer()],{type:item.type||rawBlob.type||'application/octet-stream'});if((item.size||0)>0&&blob.size===0)throw new Error('Imported file data is empty: '+item.name);await new Promise((resolve,reject)=>{const tx=d.transaction(FILE_STORE,'readwrite');tx.objectStore(FILE_STORE).add({name:item.name,type:item.type,size:blob.size,addedAt:item.addedAt||Date.now(),blob});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}await renderRobotFiles();toast('Files archive imported');}catch(e){alert('Import failed: '+e.message);}}
window.addRobotFiles=addRobotFiles;window.downloadRobotFile=downloadRobotFile;window.deleteRobotFile=deleteRobotFile;window.exportAllRobotFiles=exportAllRobotFiles;window.importAllRobotFiles=importAllRobotFiles;

function backup(){
 app.innerHTML=`<div class="grid-2"><div class="card"><h2>Local Data File</h2><p class="muted">On Chrome or Edge desktop, create or select a JSON file on your PC. After you connect it, the app will write saved robot data into that file when you press Save.</p><button class="btn primary" onclick="connectLocalFile()">Create / Connect Data File</button><p id="fileStatus" class="muted" style="margin-top:10px">${localDbFileHandle?'Local file connected for this session.':'No file connected. Data is still saved in this browser.'}</p><p class="muted">Keep this JSON file as your local database and use Import on another browser/device when needed.</p></div><div class="card"><h2>Export Database</h2><p class="muted">Download all robot records as a JSON backup.</p><button class="btn primary" onclick="exportDB()">Download Backup</button></div><div class="card"><h2>Import Database</h2><p class="muted">Load a previously saved JSON file into the app.</p><input type="file" accept=".json,application/json" id="importFile"><button class="btn success" style="margin-top:10px" onclick="importDB()">Restore Backup</button></div><div class="card"><h2>How local saving works</h2><p class="muted"><b>To carry robots with your GitHub project:</b> click Download Project Database, replace the project's <code>robots.json</code> with the downloaded file, then commit/push that file to GitHub. A fresh browser loads robots.json automatically. GitHub Pages cannot write changes into the repository by itself.</p></div></div>`;
}
async function connectLocalFile(){
 if(!('showSaveFilePicker' in window)){
   alert('Direct local-file saving requires Chrome or Edge on a desktop. You can still use Download Backup and Restore Backup.');return;
 }
 try{
   localDbFileHandle=await window.showSaveFilePicker({suggestedName:'ROBOT_PROGRAMMER_DATABASE.json',types:[{description:'Robot database JSON',accept:{'application/json':['.json']}}]});
   const writable=await localDbFileHandle.createWritable();await writable.write(JSON.stringify(db,null,2));await writable.close();
   render();toast('Local data file connected');
 }catch(e){if(e.name!=='AbortError')alert('Could not connect to the file: '+e.message);}
}
window.connectLocalFile=connectLocalFile;
function exportDB(){let blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='robots.json';a.click();URL.revokeObjectURL(a.href)}
function importDB(){let f=$('#importFile').files[0];if(!f)return alert('Select a backup file first.');let rd=new FileReader();rd.onload=()=>{try{let x=JSON.parse(rd.result);if(!x.robots)throw Error();db=x;save();alert('Backup restored.')}catch(e){alert('Invalid backup file.')}};rd.readAsText(f)}
function saveModule(module){
 const r=robot();if(!r)return;
 document.querySelectorAll(`[data-module="${module}"]`).forEach(el=>{let v=el.value;if(module==='ethernet'&&el.dataset.field==='ports')v=v.split('\\n').filter(Boolean);r[module][el.dataset.field]=v});
 save();
}
function needRobot(){app.innerHTML=`<div class="card"><div class="empty">Please add a robot first.<br><button class="btn primary" style="margin-top:12px" onclick="openRobotModal()">+ Add Robot</button></div></div>`}
function closeModal(){$('#modal').classList.add('hidden')}
$('#modalClose').onclick=closeModal;
$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
// Automatically capitalize all user-entered text while typing. Numeric input is unchanged; all fields remain bold via CSS.
document.addEventListener('input', event => {
 const el=event.target;
 if(el && (el.matches('input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea'))) {
   const start=el.selectionStart, end=el.selectionEnd;
   const upper=el.value.toLocaleUpperCase();
   if(el.value!==upper) { el.value=upper; try { el.setSelectionRange(start,end); } catch(_) {} }
 }
});
window.addEventListener('hashchange',render);
async function bootProjectDatabase(){
 if(!hasLocalData){
  try{const response=await fetch('./robots.json',{cache:'no-store'});if(response.ok){const projectDb=await response.json();if(projectDb&&Array.isArray(projectDb.robots)){db=projectDb;localStorage.setItem(KEY,JSON.stringify(db));}}}
  catch(e){console.info('Project database file not available; starting with an empty local database.');}
 }
 render();
}
bootProjectDatabase();
