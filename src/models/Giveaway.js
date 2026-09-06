const {Schema,model}=require('mongoose');
const schema=new Schema({guildId:{type:String,index:true},channelId:String,messageId:{type:String,unique:true,index:true},prize:String,winnerCount:{type:Number,default:1},endsAt:Date,ended:{type:Boolean,default:false},hostId:String,participants:{type:[String],default:[]}},{timestamps:true});
module.exports=model('Giveaway',schema);
