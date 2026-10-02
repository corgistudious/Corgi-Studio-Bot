const {Schema,model}=require('mongoose');
const schema=new Schema({
 key:{type:String,default:'global',unique:true,index:true},enabled:{type:Boolean,default:true},cooldownMs:{type:Number,default:8000,min:0},starterBait:{type:Number,default:20,min:0},maxBag:{type:Number,default:250,min:10},sellAllEnabled:{type:Boolean,default:true},rankingEnabled:{type:Boolean,default:true},
 rarityChances:{type:Map,of:Number,default:{}},rarityScores:{type:Map,of:Number,default:{}},baitOverrides:{type:Map,of:Schema.Types.Mixed,default:{}},rodOverrides:{type:Map,of:Schema.Types.Mixed,default:{}},scoreWeights:{type:Schema.Types.Mixed,default:()=>({catch:2,weight:.4,dex:250,bestWeight:2})},updatedBy:String
},{timestamps:true});
module.exports=model('FishingSettings',schema);
