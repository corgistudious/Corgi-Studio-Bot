const {Schema,model}=require('mongoose');
const schema=new Schema({guildId:{type:String,index:true},messageId:{type:String,index:true},channelId:String,emoji:String,roleId:String},{timestamps:true});
schema.index({messageId:1,emoji:1},{unique:true});
module.exports=model('ReactionRole',schema);
