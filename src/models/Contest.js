const {Schema,model}=require('mongoose');
const schema=new Schema({guildId:{type:String,index:true,required:true},channelId:String,messageId:String,title:String,description:String,endsAt:Date,status:{type:String,default:'open'},entries:{type:[String],default:[]},winnerId:String,createdBy:String},{timestamps:true});
module.exports=model('Contest',schema);