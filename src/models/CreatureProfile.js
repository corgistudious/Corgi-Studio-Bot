const {Schema,model}=require('mongoose');
const ownedSchema=new Schema({petId:{type:String,required:true},level:{type:Number,default:1,min:1,max:50},xp:{type:Number,default:0,min:0},copies:{type:Number,default:1,min:1},nickname:String,capturedAt:{type:Date,default:Date.now}},{_id:true});
const schema=new Schema({
 userId:{type:String,required:true,unique:true,index:true},
 pets:{type:[ownedSchema],default:[]},
 activePetId:String,
 team:{type:[String],default:[]},
 orbs:{basic:{type:Number,default:10,min:0},great:{type:Number,default:3,min:0},ultra:{type:Number,default:1,min:0},celestial:{type:Number,default:0,min:0},secret:{type:Number,default:0,min:0}},
 hunt:{lastAt:Date,total:{type:Number,default:0},captures:{type:Number,default:0},fails:{type:Number,default:0},encounterPetId:String,encounterExpiresAt:Date},
 pvp:{wins:{type:Number,default:0},losses:{type:Number,default:0},rating:{type:Number,default:1000},seasonWins:{type:Number,default:0},seasonLosses:{type:Number,default:0}}
},{timestamps:true});
module.exports=model('CreatureProfile',schema);
