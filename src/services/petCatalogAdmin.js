const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const C=require('./creatureCatalog');

const ROOT=path.join(__dirname,'../../assets/creature-hunt/pets/dynamic');
const DATA=path.join(__dirname,'../../data/pet-catalog-overrides.json');
const FALLBACK=path.join(__dirname,'../../assets/creature-hunt/ui-v2/hunt-zone.png');
fs.mkdirSync(ROOT,{recursive:true});fs.mkdirSync(path.dirname(DATA),{recursive:true});
let state={custom:[],overrides:{}};
function load(){try{state=JSON.parse(fs.readFileSync(DATA,'utf8'));}catch{} state.custom||=[];state.overrides||={};apply();return state;}
function save(){fs.writeFileSync(DATA,JSON.stringify(state,null,2));apply();}
function apply(){
  for(const p of C.pets){const o=state.overrides[p.id];if(o)Object.assign(p,o);}
  for(const d of state.custom){let p=C.pets.find(x=>x.id===d.id);if(p)Object.assign(p,d);else C.pets.push({...d});}
}
function cleanId(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,40)}
async function download(url,id){const r=await fetch(url);if(!r.ok)throw Error(`ASSET_DOWNLOAD_${r.status}`);const type=(r.headers.get('content-type')||'').toLowerCase();if(!/^image\/(png|webp|jpeg)/.test(type))throw Error('ASSET_MUST_BE_IMAGE');const b=Buffer.from(await r.arrayBuffer());if(b.length>8*1024*1024)throw Error('ASSET_TOO_LARGE_MAX_8MB');const ext=type.includes('webp')?'webp':type.includes('jpeg')?'jpg':'png';const out=path.join(ROOT,`${id}.${ext}`);fs.writeFileSync(out,b);return out;}
function removeAsset(p){if(!p?.asset)return false;const full=path.resolve(p.asset);if(full.startsWith(path.resolve(ROOT)+path.sep)||full.includes(`${path.sep}assets${path.sep}creature-hunt${path.sep}pets${path.sep}`)){try{if(fs.existsSync(full))fs.unlinkSync(full);return true;}catch{}}return false;}
async function add({id,name,rarity,element,hp,atk,def,spd,aptitude=80,group='HUNT',huntable=true,assetUrl}){
 id=cleanId(id)||`pet-${crypto.randomBytes(4).toString('hex')}`;if(C.byId(id))throw Error('PET_ID_EXISTS');if(!C.RARITIES.includes(rarity))throw Error('INVALID_RARITY');if(!C.ELEMENTS.includes(element))throw Error('INVALID_ELEMENT');
 const asset=await download(assetUrl,id);const p={id,name:String(name).trim().slice(0,60),rarity,element,hp:+hp,atk:+atk,def:+def,spd:+spd,aptitude:+aptitude,group,huntable:!!huntable,eventOnly:group==='EVENT_RAINBOW',acquisition:huntable?'HUNT':'DEV',asset,retired:false};
 if([p.hp,p.atk,p.def,p.spd,p.aptitude].some(x=>!Number.isFinite(x)||x<0)){removeAsset(p);throw Error('INVALID_STATS');}state.custom.push(p);save();return p;
}
async function replaceAsset(id,url){const p=C.byId(id);if(!p)throw Error('PET_NOT_FOUND');const old=p.asset;const asset=await download(url,id);if(old!==asset)removeAsset({asset:old});const c=state.custom.find(x=>x.id===id);if(c)c.asset=asset;else(state.overrides[id]||={}).asset=asset;save();return C.byId(id);}
function setEnabled(id,enabled){const p=C.byId(id);if(!p)throw Error('PET_NOT_FOUND');const c=state.custom.find(x=>x.id===id);const patch={huntable:!!enabled,retired:false};if(c)Object.assign(c,patch);else Object.assign(state.overrides[id]||={},patch);save();return C.byId(id);}
function retire(id,{deleteAsset=true}={}){const p=C.byId(id);if(!p)throw Error('PET_NOT_FOUND');if(deleteAsset)removeAsset(p);const patch={huntable:false,retired:true,asset:FALLBACK};const c=state.custom.find(x=>x.id===id);if(c)Object.assign(c,patch);else Object.assign(state.overrides[id]||={},patch);save();return C.byId(id);}
function list(){return C.pets.map(p=>({id:p.id,name:p.name,rarity:p.rarity,element:p.element,group:p.group,huntable:!!p.huntable,retired:!!p.retired,asset:p.asset}));}
load();
module.exports={load,list,add,replaceAsset,setEnabled,retire};
