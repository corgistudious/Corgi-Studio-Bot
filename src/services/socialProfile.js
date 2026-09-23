const Social=require('../models/SocialProfile');
async function ensure(userId){return Social.findOneAndUpdate({userId},{$setOnInsert:{userId}},{upsert:true,returnDocument:'after',setDefaultsOnInsert:true});}
async function toggleLike(actorId,targetId){if(actorId===targetId)throw new Error('SELF_LIKE');const p=await ensure(targetId),has=p.likes.includes(actorId);p.likes=has?p.likes.filter(x=>x!==actorId):[...p.likes,actorId];await p.save();return{liked:!has,count:p.likes.length};}
async function toggleFollow(actorId,targetId){if(actorId===targetId)throw new Error('SELF_FOLLOW');const [a,t]=await Promise.all([ensure(actorId),ensure(targetId)]),has=a.following.includes(targetId);a.following=has?a.following.filter(x=>x!==targetId):[...a.following,targetId];t.followers=has?t.followers.filter(x=>x!==actorId):[...t.followers,actorId];await Promise.all([a.save(),t.save()]);return{following:!has,count:t.followers.length};}
module.exports={ensure,toggleLike,toggleFollow};
