const {Schema,model}=require('mongoose');
const CatchSchema=new Schema({catchId:String,speciesId:String,nameEn:String,nameVi:String,rarity:String,weight:Number,value:Number,locked:{type:Boolean,default:false},caughtAt:{type:Date,default:Date.now}},{_id:false});
const schema=new Schema({
 userId:{type:String,required:true,unique:true,index:true},
 totalCaught:{type:Number,default:0,min:0},totalWeight:{type:Number,default:0,min:0},totalSold:{type:Number,default:0,min:0},totalEarned:{type:Number,default:0,min:0},
 bestWeight:{type:Number,default:0,min:0},bestRarity:{type:String,default:'N'},bestSpeciesId:String,
 fishdex:{type:[String],default:[]},rarityCaught:{type:Map,of:Number,default:{}},
 rodLevel:{type:Number,default:0,min:0},bait:{type:Map,of:Number,default:{}},selectedBait:{type:String,default:'basic'},
 bag:{type:[CatchSchema],default:[]},lastFishedAt:Date
},{timestamps:true});
schema.index({totalCaught:-1});schema.index({totalWeight:-1});
module.exports=model('FishingProfile',schema);
