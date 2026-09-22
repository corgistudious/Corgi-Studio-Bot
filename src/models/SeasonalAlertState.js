const {Schema,model}=require('mongoose');
const schema=new Schema({guildId:{type:String,index:true},eventKey:{type:String,index:true},lastState:{type:String,enum:['upcoming','active','ended'],default:'upcoming'},lastSentAt:Date},{timestamps:true});
schema.index({guildId:1,eventKey:1},{unique:true});
module.exports=model('SeasonalAlertState',schema);
