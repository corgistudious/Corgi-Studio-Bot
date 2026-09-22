const {Schema,model}=require('mongoose');
const mat=new Schema({key:String,emoji:String,name:{type:Map,of:String},dropRate:Number,minQty:{type:Number,default:1},maxQty:{type:Number,default:1}},{_id:false});
const recipe=new Schema({key:String,emoji:String,name:{type:Map,of:String},needs:{type:Map,of:Number},boxKey:String},{_id:false});
const schema=new Schema({key:{type:String,unique:true,index:true},enabled:{type:Boolean,default:false},startAt:Date,endAt:Date,name:{type:Map,of:String},materials:{type:[mat],default:[]},recipes:{type:[recipe],default:[]},cstarMin:{type:Number,default:100},cstarMax:{type:Number,default:1000},eligibleGames:{type:[String],default:['*']},directRedEnvelopeRate:{type:Number,default:0}},{timestamps:true,minimize:false});
module.exports=model('SeasonalEvent',schema);
