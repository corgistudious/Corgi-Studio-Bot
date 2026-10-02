const {Schema,model}=require('mongoose');
const schema=new Schema({userId:{type:String,required:true,unique:true,index:true},points:{type:Number,default:0,min:0},stars:{type:Number,default:0,min:0},gifts:{type:Map,of:Number,default:{}}},{timestamps:true,minimize:false});
module.exports=model('ContributionWallet',schema);
