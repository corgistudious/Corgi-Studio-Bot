const {Schema,model}=require('mongoose');
const creatureSchema=new Schema({species:String,rarity:String,level:{type:Number,default:1},xp:{type:Number,default:0},bond:{type:Number,default:0},potential:{type:Number,default:50},trait:String,variant:{type:String,default:'normal'},evolution:{type:Number,default:0},caughtAt:{type:Date,default:Date.now}},{_id:false});
const buildingSchema=new Schema({id:String,level:{type:Number,default:1}},{_id:false});
const expeditionSchema=new Schema({region:String,startedAt:Date,endsAt:Date,risk:String,status:{type:String,default:'active'}},{_id:false});
const schema=new Schema({
 userId:{type:String,required:true,unique:true,index:true},
 explorerRank:{type:Number,default:1},explorerXp:{type:Number,default:0},prestige:{type:Number,default:0},
 energy:{type:Number,default:100},supplies:{type:Number,default:20},currentRegion:{type:String,default:'origin-plains'},
 expeditions:{type:Number,default:0},distance:{type:Number,default:0},lastActionAt:Date,
 discoveries:{type:[String],default:[]},secrets:{type:[String],default:[]},artifacts:{type:[String],default:[]},lore:{type:[String],default:[]},fish:{type:[String],default:[]},
 creatures:{type:[creatureSchema],default:[]},resources:{type:Map,of:Number,default:{}},crafted:{type:Map,of:Number,default:{}},
 baseLevel:{type:Number,default:1},baseXp:{type:Number,default:0},buildings:{type:[buildingSchema],default:()=>[{id:'hall',level:1},{id:'workshop',level:1},{id:'habitat',level:1},{id:'museum',level:1},{id:'research',level:1}]},
 mastery:{exploration:{type:Number,default:1},gathering:{type:Number,default:1},crafting:{type:Number,default:1},fishing:{type:Number,default:1},creatures:{type:Number,default:1}},
 regionProgress:{type:Map,of:Number,default:{}},achievements:{type:[String],default:[]},legacy:{type:[String],default:[]},
 activeExpedition:{type:expeditionSchema,default:null},worldContributions:{type:Number,default:0},frontierMarks:{type:Number,default:0}
},{timestamps:true,minimize:false});
module.exports=model('FrontierProfile',schema);
