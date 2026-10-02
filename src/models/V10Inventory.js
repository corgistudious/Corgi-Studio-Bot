const mongoose=require('mongoose');
const Item=new mongoose.Schema({itemId:{type:String,required:true},quantity:{type:Number,default:0,min:0},locked:{type:Boolean,default:false}},{_id:false});
const schema=new mongoose.Schema({userId:{type:String,required:true,unique:true,index:true},items:{type:[Item],default:[]}},{timestamps:true,collection:'v10inventories'});
module.exports=mongoose.models.V10Inventory||mongoose.model('V10Inventory',schema);
