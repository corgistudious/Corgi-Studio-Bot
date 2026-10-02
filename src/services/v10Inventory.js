const Inventory=require('../models/V10Inventory');
const IDS=Object.freeze({CD_TICKET:'ticket:cooldown-clear',EVENT_TICKET:'ticket:event',DIAMOND:'social:diamond',RED_FRAGMENT:'fragment:red',PRISM_FRAGMENT:'fragment:prismatic'});
async function ensure(userId){return Inventory.findOneAndUpdate({userId},{$setOnInsert:{userId,items:[]}},{upsert:true,returnDocument:'after',setDefaultsOnInsert:true})}
async function quantity(userId,itemId){const x=await Inventory.findOne({userId,'items.itemId':itemId},{'items.$':1}).lean();return x?.items?.[0]?.quantity||0}
async function add(userId,itemId,amount=1){amount=Math.floor(Number(amount));if(!Number.isFinite(amount)||amount<=0)throw new Error('INVALID_AMOUNT');await ensure(userId);let r=await Inventory.updateOne({userId,'items.itemId':itemId},{$inc:{'items.$.quantity':amount}});if(!r.matchedCount)await Inventory.updateOne({userId},{$push:{items:{itemId,quantity:amount}}});return quantity(userId,itemId)}
async function consume(userId,itemId,amount=1){amount=Math.floor(Number(amount));const r=await Inventory.updateOne({userId,items:{$elemMatch:{itemId,quantity:{$gte:amount},locked:false}}},{$inc:{'items.$.quantity':-amount}});if(!r.modifiedCount)throw new Error('ITEM_NOT_ENOUGH');return quantity(userId,itemId)}
module.exports={IDS,ensure,quantity,add,consume};
