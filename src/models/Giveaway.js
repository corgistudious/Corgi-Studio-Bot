const {Schema,model}=require('mongoose');
const schema=new Schema({
  guildId:{type:String,index:true,required:true},channelId:{type:String,required:true},messageId:{type:String,unique:true,index:true,sparse:true},
  prize:{type:String,required:true},description:{type:String,default:''},winnerCount:{type:Number,default:1,min:1,max:20},endsAt:{type:Date,required:true},
  status:{type:String,enum:['active','paused','ended','cancelled'],default:'active',index:true},pausedAt:Date,remainingMs:Number,hostId:{type:String,required:true},
  participants:{type:[String],default:[]},winners:{type:[String],default:[]},
  requiredRoleId:String,minAccountAgeDays:{type:Number,default:0},minServerAgeDays:{type:Number,default:0},minCstar:{type:Number,default:0},
  joinEmoji:{type:String,default:'🔥'},imageUrl:String,imageShape:{type:String,enum:['16:9','1:1'],default:'16:9'},
  endedAt:Date
},{timestamps:true,minimize:false});
module.exports=model('Giveaway',schema);
