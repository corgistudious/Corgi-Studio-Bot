const Cooldown=require('../models/V10Cooldown'); const Inv=require('./v10Inventory');
const DEFAULT_MS={FISHING:45_000,PET_HUNT:60_000,STARTUP:120_000};
async function state(userId,game,action='MAIN'){const row=await Cooldown.findOne({userId,game,action}).lean();const readyAt=row?.readyAt?new Date(row.readyAt).getTime():0;return {ready:Date.now()>=readyAt,readyAt,remainingMs:Math.max(0,readyAt-Date.now())}}
async function start(userId,game,action='MAIN',ms=DEFAULT_MS[game]){const readyAt=new Date(Date.now()+Math.max(0,Number(ms)||0));await Cooldown.findOneAndUpdate({userId,game,action},{$set:{readyAt}},{upsert:true});return readyAt}
async function clearWithTicket(userId,game,action='MAIN'){await Inv.consume(userId,Inv.IDS.CD_TICKET,1);await Cooldown.findOneAndUpdate({userId,game,action},{$set:{readyAt:new Date()}},{upsert:true});return state(userId,game,action)}
module.exports={DEFAULT_MS,state,start,clearWithTicket};
