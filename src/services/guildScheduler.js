const Event=require('../models/GuildEvent');
async function tick(client){const now=new Date();const starting=await Event.find({status:'SCHEDULED',startsAt:{$lte:now},endsAt:{$gt:now}});for(const e of starting){e.status='ACTIVE';await e.save();}const ending=await Event.find({status:{$in:['SCHEDULED','ACTIVE']},endsAt:{$lte:now}});for(const e of ending){e.status='ENDED';await e.save();}}
function start(client){tick(client).catch(()=>{});const t=setInterval(()=>tick(client).catch(e=>console.warn('Guild scheduler:',e.message)),60000);t.unref?.();}
module.exports={start,tick};
