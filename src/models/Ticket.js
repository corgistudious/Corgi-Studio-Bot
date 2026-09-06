const {Schema,model}=require('mongoose');
const schema=new Schema({guildId:{type:String,index:true},channelId:{type:String,unique:true,index:true},ownerId:String,status:{type:String,enum:['open','closed'],default:'open'},closedBy:String,closedAt:Date},{timestamps:true});
module.exports=model('Ticket',schema);
