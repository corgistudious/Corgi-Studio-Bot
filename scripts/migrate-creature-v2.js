require('dotenv').config();
const mongoose=require('mongoose');
const CreatureProfile=require('../src/models/CreatureProfile');
(async()=>{const uri=process.env.MONGODB_URI||process.env.MONGO_URI;if(!uri)throw new Error('Missing MONGODB_URI/MONGO_URI');await mongoose.connect(uri);
 const ops=[
  CreatureProfile.updateMany({essence:{$exists:false}},{$set:{essence:0}}),
  CreatureProfile.updateMany({'dex.claimedMilestones':{$exists:false}},{$set:{'dex.claimedMilestones':[]}}),
  CreatureProfile.updateMany({'hunt.zone':{$exists:false}},{$set:{'hunt.zone':'meadow'}}),
  CreatureProfile.updateMany({'pvp.streak':{$exists:false}},{$set:{'pvp.streak':0,'pvp.bestStreak':0}}),
  CreatureProfile.updateMany({'pets.skillLevel':{$exists:false}},{$set:{'pets.$[].skillLevel':1,'pets.$[].favorite':false,'pets.$[].locked':false,'pets.$[].essence':0}})
 ];const r=await Promise.all(ops);console.log(`🐾 Creature V2 migration complete • existing Creature profiles/pets preserved • ${r.reduce((n,x)=>n+(x.modifiedCount||0),0)} profile updates`);await mongoose.disconnect();})().catch(e=>{console.error(e);process.exit(1)});
