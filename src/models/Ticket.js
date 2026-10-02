const {Schema,model}=require('mongoose');
const schema=new Schema({guildId:{type:String,index:true},channelId:{type:String,unique:true,index:true},ownerId:String,ticketNo:Number,typeKey:{type:String,default:'support'},typeName:String,claimedBy:String,addedMembers:[String],status:{type:String,enum:['open','closed','reopened'],default:'open'},closedBy:String,closedAt:Date,reopenedBy:String,reopenedAt:Date,pendingCloseBy:String,pendingCloseAt:Date,transcriptDeliveredAt:Date},{timestamps:true});
schema.index({guildId:1,ticketNo:1},{unique:true,sparse:true});
module.exports=model('Ticket',schema);
