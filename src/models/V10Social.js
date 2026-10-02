const mongoose=require('mongoose');
const schema=new mongoose.Schema({userId:{type:String,required:true,unique:true,index:true},diamonds:{type:Number,default:0,min:0},diamondsReceived:{type:Number,default:0,min:0},starScore:{type:Number,default:0,min:0},likes:{type:[String],default:[]},followers:{type:[String],default:[]},following:{type:[String],default:[]}},{timestamps:true,collection:'v10social'});
module.exports=mongoose.models.V10Social||mongoose.model('V10Social',schema);
