require('dotenv').config();
const mongoose=require('mongoose');
const CreatureProfile=require('../src/models/CreatureProfile');
(async()=>{try{await mongoose.connect(process.env.MONGODB_URI||process.env.MONGO_URI);const r=await CreatureProfile.updateMany({},{$set:{'pets.$[p].currentHp':null}},{arrayFilters:[{'p.currentHp':{$exists:false}}]});console.log(`🐾 Creature V5.1 migration • recovery fields ready • ${r.modifiedCount||0} profile(s) backfilled • pets/progression/economy preserved`);}finally{await mongoose.disconnect().catch(()=>{});}})().catch(e=>{console.error(e);process.exit(1)});
