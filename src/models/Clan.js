const {Schema,model}=require('mongoose');
const memberRole=new Schema({key:String,name:String,order:Number,permissions:[String]},{_id:false});
const schema=new Schema({
 ownerGuildId:{type:String,index:true,required:true},name:{type:String,required:true,maxlength:60},tag:{type:String,default:'',maxlength:8},description:{type:String,default:'',maxlength:500},ownerId:{type:String,index:true,required:true},privacy:{type:String,enum:['PUBLIC','PRIVATE','APPLICATION'],default:'APPLICATION'},
 clanRank:{type:String,enum:['D','C','B','A','S','SS','SSS'],default:'D',index:true},clanPoints:{type:Number,default:0,min:0},
 // Legacy fields remain readable so existing Clan documents migrate without data loss.
 level:{type:Number,default:1,min:1},xp:{type:Number,default:0,min:0},trust:{type:Number,default:0},memberCap:{type:Number,default:30,min:2,max:500},currency:{name:{type:String,default:'CXu'},symbol:{type:String,default:'CXu'}},treasury:{type:Number,default:0,min:0},
 logoAsset:{type:String,default:''},bannerAsset:{type:String,default:''},
 ranks:{type:[memberRole],default:()=>[{key:'LEADER',name:'Hội Trưởng',order:100,permissions:['*']},{key:'DEPUTY',name:'Phó Hội',order:80,permissions:['members','applications','settings']},{key:'STRATEGIST',name:'Quân Sư',order:60,permissions:['members','applications']},{key:'ELITE',name:'Tinh Anh',order:40,permissions:[]},{key:'MEMBER',name:'Thành Viên',order:10,permissions:[]}]},
 settings:{joinMinLevel:{type:Number,default:0},joinMinTrust:{type:Number,default:0},allowMemberInvites:{type:Boolean,default:false},showTreasury:{type:Boolean,default:false}}
},{timestamps:true});
schema.index({ownerGuildId:1,name:1},{unique:true});schema.index({clanRank:1,clanPoints:-1});
module.exports=model('Clan',schema);
