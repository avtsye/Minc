const STORAGE_KEY = "minc_enhanced_save_v1";
const SETTINGS_KEY = "minc_enhanced_settings_v1";
const WORLD_W = 72;
const WORLD_H = 30;
const UPGRADE_ACTIONS = 10;
const MAX_TIER = 4;

const BLOCKS = {
  sky:{name:"Sky",tool:null,tier:0,hardness:0,color:"#6aa3d5"},
  grass:{name:"Grass",tool:"shovel",tier:1,hardness:420,color:"#6d9a42"},
  soil:{name:"Dirt",tool:"shovel",tier:1,hardness:360,color:"#795235"},
  sand:{name:"Sand",tool:"shovel",tier:1,hardness:300,color:"#d4bd72"},
  water:{name:"Water",tool:"vacuum",tier:1,hardness:260,color:"#4f93d5"},
  stone:{name:"Stone",tool:"pickaxe",tier:1,hardness:720,color:"#777"},
  coal:{name:"Coal",tool:"pickaxe",tier:1,hardness:820,color:"#333"},
  iron:{name:"Iron",tool:"pickaxe",tier:2,hardness:980,color:"#b6a998"},
  gold:{name:"Gold",tool:"pickaxe",tier:2,hardness:1150,color:"#e2bd36"},
  diamond:{name:"Diamond",tool:"pickaxe",tier:3,hardness:1450,color:"#45c7d7"},
  wood:{name:"Wood",tool:"axe",tier:1,hardness:650,color:"#7a4c27"},
  leaves:{name:"Leaves",tool:"axe",tier:1,hardness:260,color:"#2f7130"},
  wooder:{name:"Strong Wood",tool:"axe",tier:3,hardness:1300,color:"#5c351f"},
  leaveser:{name:"Strong Leaves",tool:"axe",tier:3,hardness:900,color:"#1b5424"},
  planks:{name:"Planks",tool:"axe",tier:1,hardness:460,color:"#a66e39"},
  glass:{name:"Glass",tool:"pickaxe",tier:1,hardness:240,color:"#c7eef5"},
  crafting:{name:"Crafting Table",tool:"axe",tier:1,hardness:520,color:"#8c572c"},
  cloud:{name:"Cloud",tool:"vacuum",tier:1,hardness:210,color:"#eee"},
  bedrock:{name:"Bedrock",tool:null,tier:99,hardness:999999,color:"#303030"}
};

const TOOLS = {
  shovel:{name:"Shovel",img:"./assets/images/woodenShovelTexture.png"},
  pickaxe:{name:"Pickaxe",img:"./assets/images/woodenPickaxeTexture.png"},
  axe:{name:"Axe",img:"./assets/images/woodenAxeTexture.png"},
  vacuum:{name:"Vacuum",img:"./assets/images/vacuu.png"}
};

const RECIPES = [
  {id:"planks",name:"Planks ×4",cost:{wood:1},out:{planks:4}},
  {id:"crafting",name:"Crafting Table",cost:{planks:4,stone:2},out:{crafting:1}},
  {id:"glass",name:"Glass ×2",cost:{sand:2},out:{glass:2}},
  {id:"iron",name:"Iron",cost:{stone:3,coal:1},out:{iron:1}}
];

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const els = {
  startScreen:$("#startScreen"), gameScreen:$("#gameScreen"), continueBtn:$("#continueBtn"),
  newGameBtn:$("#newGameBtn"), seedInput:$("#seedInput"), modeSelect:$("#modeSelect"),
  world:$("#world"), viewport:$("#worldViewport"), tools:$("#toolsPanel"), hotbar:$("#hotbar"),
  inventoryGrid:$("#inventoryGrid"), craftGrid:$("#craftGrid"), blockInfo:$("#blockInfo"),
  tier:$("#tierLabel"), xp:$("#xpLabel"), tool:$("#toolLabel"), mode:$("#modeLabel"),
  seed:$("#seedLabel"), saveStatus:$("#saveStatus"), upgradeBtn:$("#upgradeBtn"),
  upgradeProgress:$("#upgradeProgress"), upgradeProgressText:$("#upgradeProgressText"),
  minimap:$("#minimap"), dayOverlay:$("#dayOverlay"), toast:$("#toast"),
  miningHud:$("#miningHud"), miningProgress:$("#miningProgress"), miningLabel:$("#miningLabel"),
  backdrop:$("#modalBackdrop"), musicVolume:$("#musicVolume"), sfxVolume:$("#sfxVolume"),
  dayNightToggle:$("#dayNightToggle"), autosaveToggle:$("#autosaveToggle"), tileSizeSelect:$("#tileSizeSelect")
};

const gameMusic = new Audio("./assets/sounds/gameMusic.mp3");
const hitSound = new Audio("./assets/sounds/Minecrafthitsound.mp3");
const levelSound = new Audio("./assets/sounds/levelUp.mp3");
const openSound = new Audio("./assets/sounds/openInventory.mp3");
const closeSound = new Audio("./assets/sounds/closeInventory.mp3");
gameMusic.loop = true;

let state = null;
let undoStack = [];
let redoStack = [];
let mining = null;
let dayTimer = null;
let toastTimer = null;

function defaultSettings(){
  return {music:20,sfx:65,dayNight:true,autosave:true,tileSize:34};
}
function loadSettings(){
  try{return {...defaultSettings(),...JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}")};}
  catch{return defaultSettings();}
}
let settings = loadSettings();

function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashSeed(str){
  let h=2166136261;
  for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}
function randomSeed(){return Math.random().toString(36).slice(2,10).toUpperCase();}
function idx(x,y){return y*WORLD_W+x;}
function xy(i){return {x:i%WORLD_W,y:Math.floor(i/WORLD_W)};}

function freshState(seed,mode){
  return {
    version:1,seed,mode,width:WORLD_W,height:WORLD_H,
    world:generateWorld(seed),inventory:{},hotbar:["soil","stone","wood","sand",null,null,null,null,null],
    activeTool:"shovel",activeBlock:null,selectedHotbar:0,tier:1,xp:0,dayPhase:0.18,
    createdAt:Date.now(),updatedAt:Date.now()
  };
}

function generateWorld(seed){
  const rand=mulberry32(hashSeed(seed));
  const arr=Array(WORLD_W*WORLD_H).fill("sky");
  let surface=12;
  const heights=[];
  for(let x=0;x<WORLD_W;x++){
    surface += rand()<.32?(rand()<.5?-1:1):0;
    surface=Math.max(9,Math.min(15,surface));
    heights.push(surface);
    for(let y=surface;y<WORLD_H;y++){
      let type=y===WORLD_H-1?"bedrock":y===surface?"grass":y<surface+4?"soil":"stone";
      if(type==="soil"&&rand()<.08) type="sand";
      if(type==="stone"){
        const r=rand();
        if(r<.035) type="diamond";
        else if(r<.085) type="gold";
        else if(r<.15) type="iron";
        else if(r<.25) type="coal";
      }
      arr[idx(x,y)]=type;
    }
  }
  for(let c=0;c<12;c++){
    const cx=Math.floor(rand()*WORLD_W), cy=16+Math.floor(rand()*10), rad=1+Math.floor(rand()*3);
    for(let y=cy-rad;y<=cy+rad;y++)for(let x=cx-rad;x<=cx+rad;x++){
      if(x>=0&&x<WORLD_W&&y>=0&&y<WORLD_H-1&&Math.hypot(x-cx,y-cy)<=rad+.2) arr[idx(x,y)]="sky";
    }
  }
  for(let x=3;x<WORLD_W-3;x++){
    if(rand()<.11){
      const y=heights[x];
      const trunk=2+Math.floor(rand()*3);
      for(let t=1;t<=trunk;t++) if(y-t>=0) arr[idx(x,y-t)]="wood";
      const top=y-trunk;
      for(let oy=-2;oy<=1;oy++)for(let ox=-2;ox<=2;ox++){
        if(Math.abs(ox)+Math.abs(oy)<=3&&x+ox>=0&&x+ox<WORLD_W&&top+oy>=0&&arr[idx(x+ox,top+oy)]==="sky") arr[idx(x+ox,top+oy)]="leaves";
      }
    }
  }
  for(let c=0;c<5;c++){
    const start=5+Math.floor(rand()*(WORLD_W-12));
    const y=4+Math.floor(rand()*4);
    for(let x=start;x<start+3+Math.floor(rand()*4);x++) if(x<WORLD_W) arr[idx(x,y)]="cloud";
  }
  return arr;
}

function saveGame(show=true){
  if(!state)return;
  state.updatedAt=Date.now();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  els.saveStatus.textContent="נשמר עכשיו";
  if(show) toast("המשחק נשמר");
  updateContinue();
}
function loadGame(){
  try{
    const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(!data||!Array.isArray(data.world)||data.world.length!==WORLD_W*WORLD_H) return false;
    state=data; return true;
  }catch{return false;}
}
function updateContinue(){els.continueBtn.disabled=!localStorage.getItem(STORAGE_KEY);}

function startNew(){
  if(state && !confirm("ליצור עולם חדש? השמירה הקיימת תוחלף לאחר השמירה הבאה.")) return;
  const seed=els.seedInput.value.trim()||randomSeed();
  state=freshState(seed,els.modeSelect.value);
  if(state.mode==="creative"){
    Object.keys(BLOCKS).filter(b=>!["sky","bedrock"].includes(b)).forEach(b=>state.inventory[b]=999);
  }
  undoStack=[];redoStack=[];
  enterGame();
}
function continueGame(){
  if(loadGame()) enterGame();
  else toast("לא נמצאה שמירה תקינה");
}
function enterGame(){
  els.startScreen.classList.add("hidden");els.gameScreen.classList.remove("hidden");
  renderAll();applySettings();startDayCycle();
  gameMusic.play().catch(()=>{});
  els.viewport.focus();
}
function backToMenu(){
  saveGame(false);closeAllModals();
  els.gameScreen.classList.add("hidden");els.startScreen.classList.remove("hidden");
  gameMusic.pause();updateContinue();
}

function renderAll(){
  document.documentElement.style.setProperty("--world-w",WORLD_W);
  renderTools();renderWorld();renderHotbar();renderInventory();renderCrafting();renderHUD();drawMinimap();
}
function renderWorld(){
  els.world.innerHTML="";
  const frag=document.createDocumentFragment();
  state.world.forEach((type,i)=>{
    const cell=document.createElement("div");
    cell.className="cell";cell.dataset.type=type;cell.dataset.index=i;
    cell.tabIndex=-1;
    cell.addEventListener("mouseenter",()=>inspectBlock(i));
    cell.addEventListener("mousedown",(e)=>beginCellAction(e,i));
    cell.addEventListener("mouseup",cancelMining);
    cell.addEventListener("mouseleave",cancelMining);
    cell.addEventListener("contextmenu",(e)=>{e.preventDefault();selectTool("shovel");});
    frag.appendChild(cell);
  });
  els.world.appendChild(frag);
}
function updateCell(i){
  const cell=els.world.children[i]; if(cell) cell.dataset.type=state.world[i];
}
function renderTools(){
  els.tools.innerHTML="";
  Object.entries(TOOLS).forEach(([key,t])=>{
    const b=document.createElement("button");b.className="tool-card"+(state.activeTool===key?" active":"");
    b.innerHTML='<img src="'+t.img+'" alt=""><span>'+t.name+'</span>';
    b.onclick=()=>selectTool(key);els.tools.appendChild(b);
  });
}
function selectTool(tool){
  state.activeTool=tool;state.activeBlock=null;renderTools();renderHUD();renderHotbar();
}
function renderHotbar(){
  els.hotbar.innerHTML="";
  state.hotbar.forEach((type,i)=>{
    const slot=document.createElement("button");
    slot.className="hotbar-slot"+(state.selectedHotbar===i&&state.activeBlock?" active":"");
    slot.innerHTML='<span class="slot-key">'+(i+1)+'</span>'+(type?blockIcon(type):"");
    if(type){
      const count=state.mode==="creative"?"∞":(state.inventory[type]||0);
      slot.innerHTML+='<span class="slot-count">'+count+'</span>';
    }
    slot.onclick=()=>selectHotbar(i);
    els.hotbar.appendChild(slot);
  });
}
function selectHotbar(i){
  state.selectedHotbar=i;
  const type=state.hotbar[i];
  if(type && (state.mode==="creative"||(state.inventory[type]||0)>0)) state.activeBlock=type;
  else state.activeBlock=null;
  renderHotbar();renderHUD();
}
function blockIcon(type){return '<span class="block-icon block-'+type+'" title="'+(BLOCKS[type]?.name||type)+'"></span>';}

function renderInventory(){
  els.inventoryGrid.innerHTML="";
  const types=state.mode==="creative"?Object.keys(BLOCKS).filter(x=>!["sky","bedrock"].includes(x)):Object.keys(state.inventory).filter(x=>(state.inventory[x]||0)>0);
  types.forEach(type=>{
    const slot=document.createElement("button");slot.className="inventory-slot"+(state.activeBlock===type?" active":"");
    slot.innerHTML=blockIcon(type)+'<span class="slot-count">'+(state.mode==="creative"?"∞":state.inventory[type])+'</span><small>'+BLOCKS[type].name+'</small>';
    slot.onclick=()=>{chooseBlock(type);closeModal("inventoryModal");};els.inventoryGrid.appendChild(slot);
  });
  if(!types.length) els.inventoryGrid.innerHTML="<p>המלאי ריק. כרה בלוקים כדי לאסוף חומרים.</p>";
}
function chooseBlock(type){
  state.activeBlock=type;
  let i=state.hotbar.indexOf(type);
  if(i<0){
    i=state.hotbar.findIndex(x=>!x);
    if(i<0)i=state.selectedHotbar;
    state.hotbar[i]=type;
  }
  state.selectedHotbar=i;renderHotbar();renderInventory();renderHUD();
}
function renderCrafting(){
  els.craftGrid.innerHTML="";
  RECIPES.forEach(r=>{
    const div=document.createElement("div");div.className="recipe";
    const req=Object.entries(r.cost).map(([k,v])=>v+"× "+BLOCKS[k].name).join(" + ");
    const can=state.mode==="creative"||Object.entries(r.cost).every(([k,v])=>(state.inventory[k]||0)>=v);
    div.innerHTML='<div><h3>'+r.name+'</h3><small>דרוש: '+req+'</small></div><button class="mc-btn compact" '+(can?"":"disabled")+'>צור</button>';
    div.querySelector("button").onclick=()=>craft(r);els.craftGrid.appendChild(div);
  });
}
function craft(r){
  if(state.mode!=="creative"){
    if(!Object.entries(r.cost).every(([k,v])=>(state.inventory[k]||0)>=v)) return;
    Object.entries(r.cost).forEach(([k,v])=>state.inventory[k]-=v);
  }
  Object.entries(r.out).forEach(([k,v])=>state.inventory[k]=(state.inventory[k]||0)+v);
  toast("נוצר: "+r.name);renderInventory();renderCrafting();renderHotbar();autosave();
}
function renderHUD(){
  els.tier.textContent=state.tier;els.xp.textContent=state.xp+"/"+UPGRADE_ACTIONS;
  els.tool.textContent=state.activeBlock?"Place: "+BLOCKS[state.activeBlock].name:TOOLS[state.activeTool].name;
  els.mode.textContent=state.mode==="creative"?"Creative":"Survival";els.seed.textContent=state.seed;
  const pct=Math.min(100,state.xp/UPGRADE_ACTIONS*100);els.upgradeProgress.style.width=pct+"%";
  els.upgradeProgressText.textContent=state.xp+"/"+UPGRADE_ACTIONS;
  els.upgradeBtn.disabled=state.xp<UPGRADE_ACTIONS||state.tier>=MAX_TIER;
}
function inspectBlock(i){
  const type=state.world[i],b=BLOCKS[type],p=xy(i);
  if(!b)return;
  els.blockInfo.innerHTML='<b>'+b.name+'</b><br>מיקום: '+p.x+', '+p.y+'<br>כלי: '+(b.tool?TOOLS[b.tool].name:"—")+'<br>Tier דרוש: '+(b.tier>90?"בלתי שביר":b.tier)+'<br>קשיות: '+(b.hardness||0);
}

function beginCellAction(e,i){
  if(e.button!==0)return;
  const type=state.world[i];
  if(state.activeBlock){
    placeBlock(i);return;
  }
  if(type==="sky")return;
  mineBlock(i);
}
function mineBlock(i){
  const type=state.world[i],b=BLOCKS[type];
  if(type==="bedrock"){toast("Bedrock אינו ניתן לשבירה");return;}
  if(state.mode!=="creative"){
    if(b.tool && b.tool!==state.activeTool){toast("צריך "+TOOLS[b.tool].name);return;}
    if(b.tier>state.tier){toast("צריך Tier "+b.tier);return;}
  }
  cancelMining();
  const cell=els.world.children[i];cell.classList.add("mining");els.miningHud.classList.remove("hidden");
  const speed=state.mode==="creative"?90:Math.max(120,b.hardness/(1+(state.tier-1)*.45));
  const started=performance.now();
  els.miningLabel.textContent="כורה "+b.name;
  mining={i,raf:null};
  const tick=(now)=>{
    if(!mining||mining.i!==i)return;
    const pct=Math.min(100,(now-started)/speed*100);els.miningProgress.style.width=pct+"%";
    if(pct>=100){finishMine(i);return;}
    mining.raf=requestAnimationFrame(tick);
  };
  mining.raf=requestAnimationFrame(tick);
}
function cancelMining(){
  if(!mining)return;
  if(mining.raf)cancelAnimationFrame(mining.raf);
  const cell=els.world.children[mining.i];if(cell)cell.classList.remove("mining");
  mining=null;els.miningHud.classList.add("hidden");els.miningProgress.style.width="0";
}
function finishMine(i){
  const old=state.world[i];
  const beforeInventory={...state.inventory};
  const beforeXp=state.xp;
  cancelMining();
  state.world[i]="sky";updateCell(i);
  if(state.mode!=="creative"){
    state.inventory[old]=(state.inventory[old]||0)+1;
    state.xp=Math.min(UPGRADE_ACTIONS,state.xp+1);
    if(!state.hotbar.includes(old)){
      const empty=state.hotbar.findIndex(x=>!x);
      if(empty>=0) state.hotbar[empty]=old;
    }
  }
  pushUndo({
    kind:"cell",i,before:old,after:"sky",
    beforeInventory,afterInventory:{...state.inventory},
    beforeXp,afterXp:state.xp
  });
  play(hitSound,.15);renderHUD();renderInventory();renderHotbar();renderCrafting();drawMinimap();autosave();
}
function placeBlock(i){
  const type=state.activeBlock;
  if(!type||state.world[i]!=="sky")return;
  if(state.mode!=="creative"&&(state.inventory[type]||0)<=0){toast("אין מספיק "+BLOCKS[type].name);return;}
  const beforeInventory={...state.inventory};
  const beforeXp=state.xp;
  state.world[i]=type;
  if(state.mode!=="creative")state.inventory[type]--;
  pushUndo({
    kind:"cell",i,before:"sky",after:type,
    beforeInventory,afterInventory:{...state.inventory},
    beforeXp,afterXp:state.xp
  });
  updateCell(i);play(hitSound,.12);
  if(state.mode!=="creative"&&state.inventory[type]<=0) state.activeBlock=null;
  renderInventory();renderHotbar();renderCrafting();renderHUD();drawMinimap();autosave();
}
function pushUndo(action){undoStack.push(action);if(undoStack.length>100)undoStack.shift();redoStack=[];}
function undo(){
  const a=undoStack.pop();if(!a||!state)return;
  if(a.kind==="cell"){
    state.world[a.i]=a.before;updateCell(a.i);
    if(a.beforeInventory) state.inventory={...a.beforeInventory};
    if(Number.isFinite(a.beforeXp)) state.xp=a.beforeXp;
  }
  redoStack.push(a);
  renderHUD();renderInventory();renderHotbar();renderCrafting();drawMinimap();autosave();toast("Undo");
}
function redo(){
  const a=redoStack.pop();if(!a||!state)return;
  if(a.kind==="cell"){
    state.world[a.i]=a.after;updateCell(a.i);
    if(a.afterInventory) state.inventory={...a.afterInventory};
    if(Number.isFinite(a.afterXp)) state.xp=a.afterXp;
  }
  undoStack.push(a);
  renderHUD();renderInventory();renderHotbar();renderCrafting();drawMinimap();autosave();toast("Redo");
}

function upgrade(){
  if(state.xp<UPGRADE_ACTIONS||state.tier>=MAX_TIER)return;
  state.xp=0;state.tier++;play(levelSound,.1);toast("הכלים שודרגו ל-Tier "+state.tier);renderHUD();autosave();
}
function drawMinimap(){
  const c=els.minimap,ctx=c.getContext("2d"),sx=c.width/WORLD_W,sy=c.height/WORLD_H;
  ctx.clearRect(0,0,c.width,c.height);
  state.world.forEach((t,i)=>{const p=xy(i);ctx.fillStyle=BLOCKS[t]?.color||"#000";ctx.fillRect(p.x*sx,p.y*sy,Math.ceil(sx),Math.ceil(sy));});
}
function startDayCycle(){
  clearInterval(dayTimer);
  dayTimer=setInterval(()=>{
    if(!state||!settings.dayNight)return;
    state.dayPhase=(state.dayPhase+.0025)%1;applyDay();
  },250);
  applyDay();
}
function applyDay(){
  if(!settings.dayNight || !state){els.dayOverlay.style.opacity=0;return;}
  const night=(Math.cos(state.dayPhase*Math.PI*2)+1)/2;
  els.dayOverlay.style.opacity=(night*.48).toFixed(2);
}
function autosave(){if(settings.autosave)saveGame(false);}
function toast(msg){
  clearTimeout(toastTimer);els.toast.textContent=msg;els.toast.classList.remove("hidden");
  toastTimer=setTimeout(()=>els.toast.classList.add("hidden"),1900);
}
function play(audio,start=0){
  audio.pause();audio.currentTime=start;audio.volume=settings.sfx/100;audio.play().catch(()=>{});
}

function openModal(id){
  closeAllModals(false);$("#"+id).classList.remove("hidden");els.backdrop.classList.remove("hidden");play(openSound,.05);
}
function closeModal(id){
  const m=$("#"+id);if(m)m.classList.add("hidden");
  if($$(".modal:not(.hidden)").length===0)els.backdrop.classList.add("hidden");
  play(closeSound,.05);
}
function closeAllModals(sound=true){
  $$(".modal").forEach(m=>m.classList.add("hidden"));els.backdrop.classList.add("hidden");
  if(sound)play(closeSound,.05);
}
function togglePause(){
  if(!$("#pauseModal").classList.contains("hidden"))closeAllModals();
  else openModal("pauseModal");
}
function applySettings(){
  gameMusic.volume=settings.music/100;
  [hitSound,levelSound,openSound,closeSound].forEach(a=>a.volume=settings.sfx/100);
  els.musicVolume.value=settings.music;els.sfxVolume.value=settings.sfx;
  els.dayNightToggle.checked=settings.dayNight;els.autosaveToggle.checked=settings.autosave;
  els.tileSizeSelect.value=String(settings.tileSize);
  document.documentElement.style.setProperty("--tile",settings.tileSize+"px");applyDay();
}
function saveSettings(){
  settings.music=+els.musicVolume.value;settings.sfx=+els.sfxVolume.value;
  settings.dayNight=els.dayNightToggle.checked;settings.autosave=els.autosaveToggle.checked;
  settings.tileSize=+els.tileSizeSelect.value;localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));applySettings();
}

function bind(){
  updateContinue();
  els.newGameBtn.onclick=startNew;els.continueBtn.onclick=continueGame;
  $("#saveBtn").onclick=()=>saveGame();$("#pauseBtn").onclick=togglePause;$("#resumeBtn").onclick=()=>closeAllModals();
  $("#pauseSaveBtn").onclick=()=>saveGame();$("#backToMenuBtn").onclick=backToMenu;
  $("#upgradeBtn").onclick=upgrade;$("#undoBtn").onclick=undo;$("#redoBtn").onclick=redo;
  $("#inventoryBtn").onclick=()=>{renderInventory();openModal("inventoryModal");};
  $("#craftBtn").onclick=()=>{renderCrafting();openModal("craftModal");};
  $("#helpBtn").onclick=()=>openModal("helpModal");$("#helpBtnStart").onclick=()=>openModal("helpModal");
  $("#pauseHelpBtn").onclick=()=>openModal("helpModal");
  $("#settingsBtn").onclick=()=>openModal("settingsModal");$("#settingsBtnStart").onclick=()=>openModal("settingsModal");
  $$(".modal-close").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
  els.backdrop.onclick=()=>closeAllModals();
  [els.musicVolume,els.sfxVolume,els.dayNightToggle,els.autosaveToggle,els.tileSizeSelect].forEach(x=>x.addEventListener("input",saveSettings));
  document.addEventListener("keydown",(e)=>{
    if(e.ctrlKey&&e.key.toLowerCase()==="z"){e.preventDefault();undo();return;}
    if(e.ctrlKey&&e.key.toLowerCase()==="y"){e.preventDefault();redo();return;}
    if(e.key==="Escape"){if($$(".modal:not(.hidden)").length)closeAllModals();else if(state)togglePause();return;}
    if(!state||els.gameScreen.classList.contains("hidden"))return;
    if(/^[1-9]$/.test(e.key)){selectHotbar(+e.key-1);return;}
    const k=e.key.toLowerCase();
    if(k==="e"){renderInventory();openModal("inventoryModal");}
    else if(k==="c"){renderCrafting();openModal("craftModal");}
    else if(k==="h")openModal("helpModal");
    else if(k==="p")togglePause();
    else if(k==="s"){e.preventDefault();saveGame();}
  });
  window.addEventListener("beforeunload",()=>{if(state&&settings.autosave)saveGame(false);});
  applySettings();
}
bind();