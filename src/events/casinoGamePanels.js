const {Events}=require('discord.js');
const {guildLang,mtx}=require('../services/i18n');
const UI=require('../ui/casinoGames');
const E=require('../modules/games/engine');
function owned(i,owner,lang){if(i.user.id===owner)return true;i.reply({content:mtx(lang,'This betting table belongs to another player.','Bàn cược này thuộc về người chơi khác.'),flags:64}).catch(()=>{});return false;}
function decodeSelection(raw){const p=String(raw).split('~');return {type:p[0],pick:p.slice(1).join('~')};}
module.exports={name:Events.InteractionCreate,async execute(i){
 if(!i.guildId)return;
 const lang=await guildLang(i.guildId);
 if(i.isButton()&&i.customId.startsWith('casino:')){const [,game,action,raw,owner]=i.customId.split(':');if(!owned(i,owner,lang))return;
   if(game==='sicbo'&&action==='home')return i.update(UI.sicboHome(owner,lang));
   if(game==='sicbo'&&action==='bet')return i.showModal(UI.wagerModal('sicbo',raw,owner,lang));
   if(game==='roulette'&&action==='bet')return i.showModal(UI.wagerModal('roulette',raw,owner,lang));
 }
 if(i.isStringSelectMenu()&&i.customId.startsWith('casino:')){const [,game,action,owner]=i.customId.split(':');if(!owned(i,owner,lang))return;const v=i.values[0];
   if(game==='sicbo'&&action==='category')return i.update(UI.sicboChoices(owner,lang,v));
   if(game==='sicbo'&&action==='pick')return i.showModal(UI.wagerModal('sicbo',v,owner,lang));
   if(game==='roulette'&&action==='common')return i.showModal(UI.wagerModal('roulette',v,owner,lang));
   if(game==='roulette'&&action==='advanced')return i.showModal(UI.rouletteAdvancedModal(v,owner,lang));
 }
 if(i.isModalSubmit()&&i.customId.startsWith('casinoAdvanced:roulette:')){const [,game,type,owner]=i.customId.split(':');if(!owned(i,owner,lang))return;const selection=i.fields.getTextInputValue('pick').trim(),bet=Number(i.fields.getTextInputValue('amount').replace(/[,._\s]/g,''));if(!E.validateBet(bet))return i.reply({content:mtx(lang,'Bet must be a whole number from 10 to 1,000,000 <:cxu_coin:1551759873241251912> CXu.','Tiền cược phải là số nguyên từ 10 đến 1.000.000 <:cxu_coin:1551759873241251912> CXu.'),flags:64});const r=await E.runRoulette({guildId:i.guildId,userId:owner,bet,betType:type,pickValue:selection});if(r.error)return i.reply({content:r.error,flags:64});return i.reply({embeds:[r.embed],components:UI.rouletteHome(owner,lang).components});}
 if(i.isModalSubmit()&&i.customId.startsWith('casinoModal:')){const [,game,raw,owner]=i.customId.split(':');if(!owned(i,owner,lang))return;const bet=Number(i.fields.getTextInputValue('amount').replace(/[,._\s]/g,''));if(!E.validateBet(bet))return i.reply({content:mtx(lang,'Bet must be a whole number from 10 to 1,000,000 <:cxu_coin:1551759873241251912> CXu.','Tiền cược phải là số nguyên từ 10 đến 1.000.000 <:cxu_coin:1551759873241251912> CXu.'),flags:64});
   if(game==='sicbo'){const r=await E.runTaixiu({guildId:i.guildId,userId:owner,bet,pickValue:raw});if(r.error)return i.reply({content:r.error,flags:64});return i.reply({embeds:[r.embed],components:UI.sicboHome(owner,lang).components});}
   if(game==='roulette'){const s=decodeSelection(raw),r=await E.runRoulette({guildId:i.guildId,userId:owner,bet,betType:s.type,pickValue:s.pick});if(r.error)return i.reply({content:r.error,flags:64});return i.reply({embeds:[r.embed],components:UI.rouletteHome(owner,lang).components});}
 }
}};
