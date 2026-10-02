const {Schema,model}=require('mongoose');
const pos=new Schema({symbol:String,quantity:Number,avgCost:Number},{_id:false});
const schema=new Schema({userId:{type:String,unique:true,index:true},positions:{type:[pos],default:[]},realizedPnl:{type:Number,default:0},trades:{type:Number,default:0}},{timestamps:true});
module.exports=model('MarketPortfolio',schema);
