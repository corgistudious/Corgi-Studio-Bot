const S=require('./creatureService');
const UserEconomy=require('../models/UserEconomy');
const {walletFilter}=require('./economyWallet');
const SHOP={
 food:{name:'Pet Food',emoji:'🍖',price:250,field:'petFood',qty:5},
 recovery:{name:'Recovery Kit',emoji:'🩹',price:500,field:'recoveryKit',qty:1},
 refine:{name:'Refine Stone',emoji:'💠',price:1800,field:'refineStone',qty:1},
 skill:{name:'Skill Crystal',emoji:'✨',price:2400,field:'skillCrystal',qty:1},
 enhance:{name:'Enhancement Core',emoji:'🛡️',price:3000,field:'enhancementCore',qty:1},
 permit:{name:'Hunt Permit',emoji:'🎫',price:1200,field:'huntPermit',qty:1}
};
async function buy(uid,key){const item=SHOP[key];if(!item)throw Error('INVALID_ITEM');const w=await UserEconomy.findOneAndUpdate({...walletFilter(uid),cstar:{$gte:item.price}},{$inc:{cstar:-item.price}},{new:true});if(!w)throw Error('NO_CXU');try{const p=await S.profile(uid);p.materials=p.materials||{};p.materials[item.field]=(p.materials[item.field]||0)+item.qty;await p.save();return{item,w};}catch(e){await UserEconomy.updateOne(walletFilter(uid),{$inc:{cstar:item.price}}).catch(()=>{});throw e}}
async function inventory(uid){const p=await S.profile(uid);return p.materials||{}}
module.exports={SHOP,buy,inventory};
