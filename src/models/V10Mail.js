const mongoose=require('mongoose');
const schema=new mongoose.Schema({userId:{type:String,required:true,index:true},title:{type:String,required:true},body:{type:String,default:''},rewards:{type:Array,default:[]},claimed:{type:Boolean,default:false},read:{type:Boolean,default:false},expiresAt:{type:Date,default:null}},{timestamps:true,collection:'v10mail'});
module.exports=mongoose.models.V10Mail||mongoose.model('V10Mail',schema);
