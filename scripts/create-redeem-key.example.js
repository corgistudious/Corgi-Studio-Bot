require('dotenv').config();
const mongoose=require('mongoose'); const RedeemKey=require('../src/models/RedeemKey');
(async()=>{await mongoose.connect(process.env.MONGODB_URI); await RedeemKey.create({code:'CORGI-7D-DEMO',type:'PREMIUM',premiumDuration:'7d',maxUses:10}); console.log('created'); await mongoose.disconnect();})();
