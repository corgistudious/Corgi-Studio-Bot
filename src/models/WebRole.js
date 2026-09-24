const {Schema,model}=require('mongoose');
const schema=new Schema({
  discordId:{type:String,required:true,unique:true,index:true,match:/^\d{15,25}$/},
  role:{type:String,enum:['member','reviewer','admin','developer'],default:'member',index:true},
  grantedBy:{type:String,default:''},
  grantedAt:{type:Date,default:Date.now}
},{timestamps:true});
module.exports=model('WebRole',schema);
