const INDEX_KEY="minc_world_index_v2",SETTINGS_KEY="minc_settings_v2";
const key=id=>"minc_world_v2_"+id;
export const defaultSettings=()=>({music:20,sfx:65,dayNight:true,autosave:true,tileSize:32,zoom:1});
export function loadSettings(){try{return {...defaultSettings(),...JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}")}}catch{return defaultSettings()}}
export function saveSettings(s){localStorage.setItem(SETTINGS_KEY,JSON.stringify(s))}
export function worldIndex(){try{return JSON.parse(localStorage.getItem(INDEX_KEY)||"[]")}catch{return[]}}
function writeIndex(v){localStorage.setItem(INDEX_KEY,JSON.stringify(v))}
export function saveWorld(w){w.updatedAt=Date.now();localStorage.setItem(key(w.id),JSON.stringify(w));let idx=worldIndex().filter(x=>x.id!==w.id);idx.unshift({id:w.id,name:w.name,seed:w.seed,mode:w.mode,preset:w.preset,updatedAt:w.updatedAt,createdAt:w.createdAt,stats:w.stats});writeIndex(idx.slice(0,30))}
export function loadWorld(id){try{return JSON.parse(localStorage.getItem(key(id))||"null")}catch{return null}}
export function deleteWorld(id){localStorage.removeItem(key(id));writeIndex(worldIndex().filter(x=>x.id!==id))}
export function duplicateWorld(id){const w=loadWorld(id);if(!w)return null;w.id=crypto.randomUUID();w.name=w.name+" - copy";w.createdAt=Date.now();w.updatedAt=Date.now();saveWorld(w);return w}
export function exportWorld(id){const w=loadWorld(id);if(!w)return;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(w,null,2)],{type:"application/json"}));a.download=(w.name||"world").replace(/[^\w\-א-ת ]/g,"_")+".minc.json";a.click();URL.revokeObjectURL(a.href)}
export async function importWorld(file){const w=JSON.parse(await file.text());if(!w.world||!w.seed)throw new Error("Invalid world file");w.id=crypto.randomUUID();w.name=(w.name||"Imported")+" (import)";w.createdAt=Date.now();w.updatedAt=Date.now();saveWorld(w);return w}