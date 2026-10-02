const mongoose=require('mongoose');
const schema=new mongoose.Schema({userId:{type:String,required:true,index:true},game:{type:String,enum:['FISHING','PET_HUNT','STARTUP'],required:true},action:{type:String,default:'MAIN'},readyAt:{type:Date,default:Date.now}},{timestamps:true,collection:'v10cooldowns'});
schema.index({userId:1,game:1,action:1},{unique:true});
module.exports=mongoose.models.V10Cooldown||mongoose.model('V10Cooldown',schema);
