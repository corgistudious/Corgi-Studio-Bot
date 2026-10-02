const {Schema,model}=require('mongoose');
const schema=new Schema({fromId:{type:String,required:true,index:true},toId:{type:String,required:true,index:true},amount:{type:Number,required:true,min:1},status:{type:String,enum:['COMPLETED','REJECTED'],default:'COMPLETED'},reason:String},{timestamps:true});
schema.index({fromId:1,createdAt:-1});schema.index({toId:1,createdAt:-1});
module.exports=model('TransferLedger',schema);
