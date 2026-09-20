require('dotenv').config();
const mongoose=require('mongoose');
const FishingProfile=require('../src/models/FishingProfile');
(async()=>{try{
 if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI missing');
 await mongoose.connect(process.env.MONGODB_URI);
 const r=await FishingProfile.updateMany({starterBaitGranted:{$ne:true}},{$inc:{'bait.basic':20},$set:{starterBaitGranted:true}});
 await FishingProfile.syncIndexes();
 console.log(`🎣 Fishing V4.21.2 migration • starter bait granted to ${r.modifiedCount||0} existing profile(s) • indexes ready`);
}catch(e){console.error(e);process.exitCode=1;}finally{await mongoose.disconnect().catch(()=>{});}})();
