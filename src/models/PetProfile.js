const {Schema,model}=require('mongoose');
const petSchema=new Schema({species:String,rarity:String,level:{type:Number,default:1},xp:{type:Number,default:0},nickname:String},{_id:true});
const schema=new Schema({guildId:{type:String,index:true,required:true},userId:{type:String,index:true,required:true},pets:{type:[petSchema],default:[]},activePetId:String},{timestamps:true});
schema.index({guildId:1,userId:1},{unique:true});
module.exports=model('PetProfile',schema);