const {Schema,model}=require('mongoose');
const plotSchema=new Schema({slot:Number,crop:{type:String,default:null},plantedAt:Date,readyAt:Date},{_id:false});
const animalSchema=new Schema({type:String,count:{type:Number,default:0},lastCollectedAt:Date},{_id:false});
const schema=new Schema({
 userId:{type:String,required:true,unique:true,index:true},level:{type:Number,default:1},xp:{type:Number,default:0},coins:{type:Number,default:250},
 barnLevel:{type:Number,default:1},siloLevel:{type:Number,default:1},landLevel:{type:Number,default:1},
 seeds:{type:Map,of:Number,default:()=>({wheat:12,corn:4})},crops:{type:Map,of:Number,default:{}},goods:{type:Map,of:Number,default:{}},feed:{type:Number,default:3},
 plots:{type:[plotSchema],default:()=>Array.from({length:6},(_,i)=>({slot:i+1,crop:null}))},animals:{type:[animalSchema],default:()=>[{type:'chicken',count:2,lastCollectedAt:new Date()}]},
 machines:{type:Map,of:Number,default:()=>({mill:1,bakery:0,dairy:0})},ordersCompleted:{type:Number,default:0},harvested:{type:Number,default:0},tutorialStep:{type:Number,default:0},lastActionAt:Date
},{timestamps:true,minimize:false});
module.exports=model('FarmProfile',schema);
