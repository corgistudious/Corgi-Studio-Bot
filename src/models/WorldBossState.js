const {Schema,model}=require('mongoose');
const rewardSchema=new Schema({userId:String,rank:Number,damage:Number,cxu:{type:Number,default:0},bossToken:{type:Number,default:0},kind:String},{_id:false});
const schema=new Schema({
 spawnKey:{type:String,unique:true,index:true},bossId:String,name:String,quality:String,qualityLabel:String,
 maxHp:Number,hp:Number,atk:Number,def:Number,spd:Number,power:Number,
 startsAt:Date,endsAt:Date,status:{type:String,default:'ACTIVE'},killerId:String,settledAt:Date,
 contributions:{type:Map,of:Number,default:{}},attacks:{type:Map,of:Number,default:{}},rewards:{type:[rewardSchema],default:[]}
},{timestamps:true});
module.exports=model('WorldBossState',schema);
