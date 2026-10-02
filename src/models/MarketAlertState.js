const {Schema,model}=require('mongoose');
const schema=new Schema({guildId:{type:String,index:true},symbol:{type:String,index:true},lastSentAt:Date},{timestamps:true});schema.index({guildId:1,symbol:1},{unique:true});module.exports=model('MarketAlertState',schema);
