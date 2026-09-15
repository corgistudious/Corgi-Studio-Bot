const {Schema,model}=require('mongoose');
const schema=new Schema({
  game:{type:String,required:true,index:true},guildId:{type:String,required:true,index:true},userId:{type:String,required:true,index:true},
  status:{type:String,default:'active',index:true},stage:{type:String,default:'start'},bet:{type:Number,required:true},totalBet:{type:Number,required:true},
  deck:{type:[Schema.Types.Mixed],default:[]},playerCards:{type:[Schema.Types.Mixed],default:[]},dealerCards:{type:[Schema.Types.Mixed],default:[]},community:{type:[Schema.Types.Mixed],default:[]},
  result:{type:Schema.Types.Mixed,default:null},expiresAt:{type:Date,index:true}
},{timestamps:true,minimize:false});
schema.index({game:1,guildId:1,userId:1,status:1});
module.exports=model('GameSession',schema);
