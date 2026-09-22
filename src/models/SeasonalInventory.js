const {Schema,model}=require('mongoose');
const schema=new Schema({userId:{type:String,unique:true,index:true},materials:{type:Map,of:Number,default:{}},crafted:{type:Map,of:Number,default:{}},boxes:{type:Map,of:Number,default:{}}},{timestamps:true,minimize:false});
module.exports=model('SeasonalInventory',schema);
