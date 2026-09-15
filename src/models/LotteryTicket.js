const {Schema,model}=require('mongoose');
const schema=new Schema({
 guildId:{type:String,required:true,index:true},userId:{type:String,required:true,index:true},bet:{type:Number,required:true},
 mainNumbers:{type:[Number],required:true},powerNumber:{type:Number,required:true},drawAt:{type:Date,required:true,index:true},
 status:{type:String,enum:['pending','drawn'],default:'pending',index:true},winningMain:{type:[Number],default:[]},winningPower:Number,payout:{type:Number,default:0},settledAt:Date
},{timestamps:true});
module.exports=model('LotteryTicket',schema);
