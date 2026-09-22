const {Schema,model}=require('mongoose');
const schema=new Schema({symbol:{type:String,unique:true,index:true},name:{type:String,required:true},price:{type:Number,required:true},previousPrice:{type:Number,required:true},open:{type:Number,required:true},high:{type:Number,required:true},low:{type:Number,required:true},volume:{type:Number,default:0},volatility:{type:Number,default:.025},enabled:{type:Boolean,default:true},lastTickAt:Date},{timestamps:true});
module.exports=model('MarketAsset',schema);
