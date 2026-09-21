const {Schema,model}=require('mongoose');
const schema=new Schema({userId:{type:String,required:true,unique:true,index:true},gamesPlayed:{type:Number,default:0},bestScores:{type:Map,of:Number,default:{}},currentGame:{type:String,default:''},turn:{type:Number,default:0},energy:{type:Number,default:100},score:{type:Number,default:0},combo:{type:Number,default:0},sessionStartedAt:Date},{timestamps:true,minimize:false});
module.exports=model('GameHubProfile',schema);
