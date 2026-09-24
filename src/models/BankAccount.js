const {Schema,model}=require('mongoose');
const schema=new Schema({userId:{type:String,unique:true,index:true,required:true},balance:{type:Number,default:0,min:0},accruedInterest:{type:Number,default:0,min:0},lastInterestAt:{type:Date,default:Date.now},lifetimeInterest:{type:Number,default:0,min:0}},{timestamps:true});
module.exports=model('BankAccount',schema);
