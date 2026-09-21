require('dotenv').config();
const mongoose=require('mongoose');
(async()=>{await mongoose.connect(process.env.MONGODB_URI);const db=mongoose.connection.db;await db.collection('premiums').updateMany({tier:{$ne:'STANDARD'}},{$set:{tier:'STANDARD'},$unset:{supportChannelId:'',supportLockedAt:''}});await db.collection('redeemkeys').updateMany({type:'PREMIUM'},{$set:{premiumTier:'STANDARD'}});console.log('🛡️ V5.0 migration • Premium normalized to STANDARD • legacy support fields removed • player progression preserved');await mongoose.disconnect();})().catch(e=>{console.error(e);process.exit(1)});
