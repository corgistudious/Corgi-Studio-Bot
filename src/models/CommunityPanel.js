const {Schema,model}=require('mongoose');
const typeSchema=new Schema({key:String,name:String,emoji:String,description:String,staffRoleId:String,categoryId:String,logChannelId:String,prefix:String,enabled:{type:Boolean,default:true}},{_id:false});
const schema=new Schema({guildId:{type:String,unique:true,index:true,required:true},welcome:{enabled:{type:Boolean,default:true},channelId:String,title:String,description:String,thumbnailMode:{type:String,enum:['server','member','custom','none'],default:'server'},thumbnailUrl:String,imageUrl:String,footer:String,color:{type:String,default:'#F59E0B'}},leave:{enabled:{type:Boolean,default:true},channelId:String,title:String,description:String,thumbnailMode:{type:String,enum:['server','member','custom','none'],default:'server'},thumbnailUrl:String,imageUrl:String,footer:String,color:{type:String,default:'#F59E0B'}},ticket:{panelChannelId:String,title:String,description:String,thumbnailUrl:String,imageUrl:String,footer:String,types:{type:[typeSchema],default:()=>[
{key:'support',name:'General Support',emoji:'🛟',description:'General help and questions',prefix:'SUP'},
{key:'bug',name:'Bug Report',emoji:'🐛',description:'Report a bot/server issue',prefix:'BUG'},
{key:'member',name:'Member Report',emoji:'👤',description:'Report a member',prefix:'REP'},
{key:'appeal',name:'Punishment Appeal',emoji:'🛡️',description:'Appeal moderation action',prefix:'APL'},
{key:'payment',name:'Payment / Premium',emoji:'💳',description:'Premium and payment support',prefix:'PAY'},
{key:'cdkey',name:'CD Key',emoji:'🔑',description:'CD Key support',prefix:'KEY'},
{key:'partner',name:'Partnership',emoji:'🤝',description:'Partnership requests',prefix:'PAR'},
{key:'event',name:'Giveaway / Event',emoji:'🎁',description:'Event support',prefix:'EVT'},
{key:'suggest',name:'Suggestion',emoji:'💡',description:'Suggestions and feedback',prefix:'IDEA'},
{key:'other',name:'Other',emoji:'📋',description:'Anything else',prefix:'OTH'}]}},reaction:{panelChannelId:String,title:String,description:String,thumbnailUrl:String,imageUrl:String,footer:String}}, {timestamps:true,minimize:false});
module.exports=model('CommunityPanel',schema);
