const {Schema,model}=require('mongoose');
const schema=new Schema({userId:{type:String,unique:true,index:true,required:true},companyIds:{type:[Schema.Types.ObjectId],default:[]},createdCompanies:{type:Number,default:0},lifetimeDividends:{type:Number,default:0}},{timestamps:true});
module.exports=model('StartupProfile',schema);
