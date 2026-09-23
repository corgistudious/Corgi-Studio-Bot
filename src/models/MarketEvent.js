const {Schema,model}=require('mongoose');

const schema=new Schema({
  eventKey:{type:String,required:true,index:true},
  scope:{type:String,enum:['asset','market'],default:'asset'},
  symbols:{type:[String],default:[]},
  direction:{type:String,enum:['up','down'],required:true},
  impactPerTick:{type:Number,required:true},
  startsAt:{type:Date,required:true,index:true},
  endsAt:{type:Date,required:true,index:true},
  status:{type:String,enum:['active','ended'],default:'active',index:true},
  announcedAt:{type:Date,default:null},
  endedAnnouncedAt:{type:Date,default:null}
},{timestamps:true});

schema.index({status:1,startsAt:1,endsAt:1});

module.exports=model('MarketEvent',schema);
