const {Schema,model}=require('mongoose');
const schema=new Schema({guildId:{type:String,index:true},userId:{type:String,index:true},moderatorId:String,reason:String},{timestamps:true});
module.exports=model('Warning',schema);