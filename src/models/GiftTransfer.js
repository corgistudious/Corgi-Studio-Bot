const {Schema,model}=require('mongoose');
const schema=new Schema({fromUserId:{type:String,required:true,index:true},toUserId:{type:String,required:true,index:true},giftKey:{type:String,required:true},giftName:{type:String,required:true},stars:{type:Number,required:true,min:0},cost:{type:Number,required:true,min:0}},{timestamps:true});
module.exports=model('GiftTransfer',schema);
