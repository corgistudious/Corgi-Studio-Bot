const en=require('../locales/en');
const vi=require('../locales/vi');
const {getGuildSettings}=require('./guildSettings');
const SUPPORTED=['en','vi'];
const locales={en,vi};
function format(s,vars={}){return String(s??'').replace(/\{(\w+)\}/g,(_,k)=>vars[k]??`{${k}}`)}
function t(lang,key,vars={}){const dict=locales[SUPPORTED.includes(lang)?lang:'en'];return format(dict[key]||en[key]||key,vars)}
function tx(lang,enText,viText){return lang==='vi'?(viText||enText):enText}
function mtx(lang,map={},viText){
  if(typeof map==='string'){
    const enText=map;
    return String(lang==='vi'?(viText||enText):enText||viText||'');
  }
  if(map&&typeof map==='object'){
    return String(map[lang]||map.en||map.vi||'');
  }
  return '';
}
async function guildLang(guildId){if(!guildId)return'en';const s=await getGuildSettings(guildId);return SUPPORTED.includes(s?.language)?s.language:'en'}
module.exports={t,tx,mtx,guildLang,SUPPORTED};
