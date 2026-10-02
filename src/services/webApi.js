const http=require('http');const crypto=require('crypto');let discordClient=null;const {URL}=require('url');const Bank=require('./bankService');const Cosmetic=require('../models/GlobalCosmetic');const Listing=require('../models/MarketplaceListing');const Ad=require('../models/AdCampaign');const Dev=require('../models/DeveloperSettings');const Social=require('../models/SocialProfile');const AdMetric=require('../models/AdMetric');const CToken=require('./cTokenService');const adDedupe=new Map();const {parseMoney}=require('./numberFormat');
function cors(req,res){const allowed=String(process.env.WEB_ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean),origin=req.headers.origin;if(origin&&allowed.includes(origin))res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));}
async function body(req){let raw='';for await(const c of req){raw+=c;if(raw.length>100000)throw new Error('BODY_TOO_LARGE')}return raw?JSON.parse(raw):{};}
async function auth(req){const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!token)throw new Error('UNAUTHORIZED');const base=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');const key=process.env.SUPABASE_PUBLISHABLE_KEY;if(!base||!key)throw new Error('AUTH_NOT_CONFIGURED');const r=await fetch(`${base}/auth/v1/user`,{headers:{Authorization:`Bearer ${token}`,apikey:key},signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('UNAUTHORIZED');const u=await r.json();const discordId=u?.user_metadata?.provider_id||u?.identities?.[0]?.identity_data?.provider_id;if(!discordId)throw new Error('DISCORD_ID_MISSING');return {supabaseId:u.id,discordId:String(discordId),token};}
async function staff(user,need='reviewer'){return require('./webRoleService').has(user.discordId,need);}
function adKey(req,id,kind){const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'').split(',')[0].trim();const ua=String(req.headers['user-agent']||'').slice(0,200);const fingerprint=crypto.createHash('sha256').update(`${ip}\n${ua}`).digest('hex').slice(0,32);return `${kind}:${id}:${fingerprint}`;}
function allowAdEvent(req,id,kind,ttl){const k=adKey(req,id,kind),now=Date.now(),old=adDedupe.get(k)||0;if(now-old<ttl)return false;adDedupe.set(k,now);if(adDedupe.size>20000){for(const [x,t] of adDedupe){if(now-t>86400000)adDedupe.delete(x);}while(adDedupe.size>20000){const oldest=adDedupe.keys().next().value;if(oldest===undefined)break;adDedupe.delete(oldest);}}return true;}
async function addAdMetric(id,kind){
 const campaign=await Ad.findById(id).select('placement').lean();
 if(!campaign)return;
 const now=new Date(),day=now.toISOString().slice(0,10),hour=now.getUTCHours(),field=kind==='clicks'?'clicks':'impressions';
 await Promise.all([
  Ad.updateOne({_id:id},{$inc:{[field]:1}}),
  AdMetric.updateOne(
   {campaignId:id,placement:campaign.placement,day,hour},
   {$inc:{[field]:1}},
   {upsert:true}
  )
 ]);
}
async function handler(req,res){cors(req,res);if(req.method==='OPTIONS'){res.writeHead(204);return res.end()}const u=new URL(req.url,'http://localhost');try{
 if(req.method==='GET'&&u.pathname==='/health')return json(res,200,{ok:true,service:'corgi-web-api'});
 if(req.method==='GET'&&u.pathname==='/v1/shop'){const items=await Cosmetic.find({enabled:true,$or:[{source:{$ne:'MEMBER'}},{reviewStatus:'APPROVED'}]}).sort({price:1}).select('key type name price rarity value').lean();return json(res,200,{items});}
 if(req.method==='GET'&&u.pathname==='/v1/marketplace'){const items=await Listing.find({status:'APPROVED'}).sort({createdAt:-1}).limit(100).lean();const keys=[...new Set(items.map(x=>x.cosmeticKey))],cosmetics=await Cosmetic.find({key:{$in:keys},enabled:true,$or:[{source:{$ne:'MEMBER'}},{reviewStatus:'APPROVED'}]}).select('key type name rarity value creatorId creatorName collectionName source').lean(),map=new Map(cosmetics.map(x=>[x.key,x]));return json(res,200,{items:items.filter(x=>map.has(x.cosmeticKey)).map(x=>({...x,cosmetic:map.get(x.cosmeticKey)}))});}
 if(req.method==='GET'&&u.pathname==='/v1/ads'){
 const now=new Date();
 await Ad.updateMany({status:'ACTIVE',endsAt:{$lte:now}},{$set:{status:'ENDED'}});
 const placement=String(u.searchParams.get('placement')||'').toUpperCase();
 const placements=['HOME','TRENDING','VOTE','GAME_HUB','MARKETPLACE','LEADERBOARD','PROFILE','NEWS_FORUM','NETWORK'];
 const q={status:'ACTIVE',startsAt:{$lte:now},endsAt:{$gt:now}};
 if(placement){
  if(!placements.includes(placement))return json(res,400,{error:'INVALID_PLACEMENT'});
  q.placement=placement;
 }
 const pool=await Ad.find(q)
  .select('title description imageUrl placement targetUrl startsAt endsAt')
  .lean();
 for(let i=pool.length-1;i>0;i--){
  const j=Math.floor(Math.random()*(i+1));
  [pool[i],pool[j]]=[pool[j],pool[i]];
 }
 return json(res,200,{items:pool.slice(0,placement?5:30)});
}
 const imp=u.pathname.match(/^\/v1\/ads\/([a-f0-9]{24})\/impression$/i);if(req.method==='POST'&&imp){const row=await Ad.findOne({_id:imp[1],status:'ACTIVE',startsAt:{$lte:new Date()},endsAt:{$gt:new Date()}}).select('_id').lean();if(!row)return json(res,404,{error:'AD_NOT_ACTIVE'});if(allowAdEvent(req,imp[1],'i',30*60*1000))await addAdMetric(imp[1],'impressions');return json(res,204,{});}
 const clk=u.pathname.match(/^\/v1\/ads\/([a-f0-9]{24})\/click$/i);if(req.method==='GET'&&clk){const row=await Ad.findOne({_id:clk[1],status:'ACTIVE',startsAt:{$lte:new Date()},endsAt:{$gt:new Date()}}).select('targetUrl').lean();if(!row)return json(res,404,{error:'AD_NOT_ACTIVE'});if(!row.targetUrl)return json(res,404,{error:'AD_HAS_NO_LINK'});if(allowAdEvent(req,clk[1],'c',10*60*1000))await addAdMetric(clk[1],'clicks');res.writeHead(302,{Location:row.targetUrl,'Cache-Control':'no-store'});return res.end();}
 const user=await auth(req);
 // V10 additive contracts. Existing V1 endpoints above/below remain unchanged.
 if(req.method==='GET'&&u.pathname==='/v1/gifts'){const G=require('./giftService'),w=await G.ensure(user.discordId);return json(res,200,{contribution:w.points,stars:w.stars,gifts:Object.fromEntries(w.gifts||[]),catalog:G.CATALOG});}
 if(req.method==='POST'&&u.pathname==='/v1/gifts/buy'){const G=require('./giftService'),b=await body(req);const r=await G.buy(user.discordId,String(b.gift||'').toLowerCase(),b.quantity||1);return json(res,200,{ok:true,contribution:r.wallet.points,gift:b.gift,quantity:r.qty});}
 if(req.method==='POST'&&u.pathname==='/v1/gifts/send'){const G=require('./giftService'),b=await body(req);const r=await G.send(user.discordId,String(b.toUserId||''),String(b.gift||'').toLowerCase(),b.quantity||1);return json(res,200,{ok:true,stars:r.stars,toUserId:String(b.toUserId),gift:b.gift,quantity:r.qty});}
 if(req.method==='GET'&&u.pathname==='/v1/inventory'){const Inv=require('./v10Inventory'),row=await Inv.ensure(user.discordId);return json(res,200,{items:row.items||[]});}
 if(req.method==='GET'&&u.pathname==='/v1/events'){const Inv=require('./v10Inventory');const [eventTickets,redFragments,prismaticFragments]=await Promise.all([Inv.quantity(user.discordId,Inv.IDS.EVENT_TICKET),Inv.quantity(user.discordId,Inv.IDS.RED_FRAGMENT),Inv.quantity(user.discordId,Inv.IDS.PRISM_FRAGMENT)]);return json(res,200,{events:[],shop:[],wallet:{eventTickets,redFragments,prismaticFragments}});}
 if(req.method==='POST'&&u.pathname==='/v1/events/spin')return json(res,409,{error:'NO_ACTIVE_EVENT'});
 const eventBuy=u.pathname.match(/^\/v1\/events\/shop\/([^/]+)\/buy$/);if(req.method==='POST'&&eventBuy)return json(res,409,{error:'EVENT_ITEM_NOT_ACTIVE'});
 if(req.method==='GET'&&u.pathname==='/v1/mail'){const Mail=require('../models/V10Mail');const items=await Mail.find({userId:user.discordId,$or:[{expiresAt:null},{expiresAt:{$gt:new Date()}}]}).sort({createdAt:-1}).limit(100).lean();return json(res,200,{items});}
 const mailClaim=u.pathname.match(/^\/v1\/mail\/([a-f0-9]{24})\/claim$/i);if(req.method==='POST'&&mailClaim){const Mail=require('../models/V10Mail'),row=await Mail.findOneAndUpdate({_id:mailClaim[1],userId:user.discordId,claimed:false},{$set:{claimed:true,read:true}},{returnDocument:'after'});if(!row)return json(res,409,{error:'MAIL_ALREADY_CLAIMED_OR_MISSING'});return json(res,200,{ok:true,mail:row});}
 const diamond=u.pathname.match(/^\/v1\/profile\/(\d{15,25})\/diamond$/);if(req.method==='POST'&&diamond){const b=await body(req);await require('./v10Social').donate(user.discordId,diamond[1],b.amount);return json(res,200,{ok:true});}
 if(req.method==='GET'&&u.pathname==='/v1/me'){const role=await require('./webRoleService').get(user.discordId);return json(res,200,{discordId:user.discordId,role});}
 if(req.method==='GET'&&u.pathname==='/v1/ads/mine'){await Ad.updateMany({ownerId:user.discordId,status:'ACTIVE',endsAt:{$lte:new Date()}},{$set:{status:'ENDED'}});const items=await Ad.find({ownerId:user.discordId}).sort({createdAt:-1}).limit(100).lean();return json(res,200,{items});}
 const cancelAd=u.pathname.match(/^\/v1\/ads\/([a-f0-9]{24})\/cancel$/i);
 if(req.method==='POST'&&cancelAd){
  const row=await Ad.findOneAndUpdate(
   {_id:cancelAd[1],ownerId:user.discordId,status:'ACTIVE'},
   {$set:{status:'CANCELLED',endsAt:new Date()}},
   {returnDocument:'after'}
  );
  if(!row)return json(res,409,{error:'CAMPAIGN_NOT_ACTIVE'});
  return json(res,200,{ok:true,campaign:row});
 }

 const analytics=u.pathname.match(/^\/v1\/ads\/([a-f0-9]{24})\/analytics$/i);if(req.method==='GET'&&analytics){
 const campaign=await Ad.findOne({_id:analytics[1],ownerId:user.discordId}).lean();
 if(!campaign)return json(res,404,{error:'CAMPAIGN_NOT_FOUND'});

 const metrics=await AdMetric.find({campaignId:campaign._id})
  .sort({day:1,hour:1,placement:1})
  .select('day hour placement impressions clicks -_id')
  .lean();

 const dailyMap=new Map(),placementMap=new Map();

 for(const m of metrics){
  const d=dailyMap.get(m.day)||{day:m.day,impressions:0,clicks:0};
  d.impressions+=m.impressions||0;
  d.clicks+=m.clicks||0;
  dailyMap.set(m.day,d);

  const p=placementMap.get(m.placement)||{placement:m.placement,impressions:0,clicks:0};
  p.impressions+=m.impressions||0;
  p.clicks+=m.clicks||0;
  placementMap.set(m.placement,p);
 }

 const withCtr=x=>({
  ...x,
  ctr:x.impressions?Number(((x.clicks/x.impressions)*100).toFixed(2)):0
 });

 const now=Date.now();
 const endsAt=campaign.endsAt?new Date(campaign.endsAt).getTime():0;
 const remainingMs=campaign.status==='ACTIVE'&&endsAt>now?endsAt-now:0;
 const ctr=campaign.impressions
  ?Number(((campaign.clicks/campaign.impressions)*100).toFixed(2))
  :0;

 return json(res,200,{
  campaign,
  summary:{
   impressions:campaign.impressions||0,
   clicks:campaign.clicks||0,
   ctr,
   chargedCToken:campaign.chargedCToken||0,
   remainingMs
  },
  daily:[...dailyMap.values()].map(withCtr),
  hourly:metrics.map(withCtr),
  placements:[...placementMap.values()].map(withCtr)
 });
}
 if(req.method==='GET'&&u.pathname==='/v1/bank'){const [a,c,w]=await Promise.all([Bank.settle(user.discordId),Bank.config(),require('./economyWallet').ensureWallet(user.discordId)]);return json(res,200,{bankBalance:a.balance,walletBalance:w.cstar,lifetimeInterest:a.lifetimeInterest,annualRatePercent:c.annualRatePercent,compoundHours:c.compoundHours,minDeposit:c.minDeposit,maxBalance:c.maxBalance});}
 if(req.method==='POST'&&u.pathname==='/v1/bank/deposit'){const b=await body(req),r=await Bank.deposit(user.discordId,b.amount);return json(res,200,{ok:true,bankBalance:r.account.balance,walletBalance:r.wallet.cstar});}
 if(req.method==='POST'&&u.pathname==='/v1/bank/withdraw'){const b=await body(req),r=await Bank.withdraw(user.discordId,b.amount);return json(res,200,{ok:true,bankBalance:r.account.balance,walletBalance:r.wallet.cstar});}
 const buyMatch=u.pathname.match(/^\/v1\/marketplace\/([a-f0-9]{24})\/buy$/i);if(req.method==='POST'&&buyMatch){const row=await Listing.findOne({_id:buyMatch[1],status:'APPROVED'});if(!row)return json(res,404,{error:'LISTING_NOT_AVAILABLE'});if(row.sellerId===user.discordId)return json(res,400,{error:'CANNOT_BUY_OWN_LISTING'});const [seller,buyer,bw,sw,item]=await Promise.all([Social.findOne({userId:row.sellerId}),Social.findOneAndUpdate({userId:user.discordId},{$setOnInsert:{userId:user.discordId}},{upsert:true,returnDocument:'after',setDefaultsOnInsert:true}),require('./economyWallet').ensureWallet(user.discordId),require('./economyWallet').ensureWallet(row.sellerId),Cosmetic.findOne({key:row.cosmeticKey,enabled:true,$or:[{source:{$ne:'MEMBER'}},{reviewStatus:'APPROVED'}]}).lean()]);if(!item)return json(res,409,{error:'COSMETIC_NOT_AVAILABLE'});if(row.listingType!=='CREATOR'&&!seller?.ownedCosmetics?.includes(row.cosmeticKey))return json(res,409,{error:'SELLER_NO_LONGER_OWNS_ITEM'});if(buyer.ownedCosmetics.includes(row.cosmeticKey))return json(res,409,{error:'ALREADY_OWNED'});if(bw.cstar<row.price)return json(res,400,{error:'INSUFFICIENT_CXU'});bw.cstar-=row.price;sw.cstar+=row.price;if(row.listingType!=='CREATOR')seller.ownedCosmetics=seller.ownedCosmetics.filter(x=>x!==row.cosmeticKey);buyer.ownedCosmetics.push(row.cosmeticKey);await bw.save();try{await Promise.all([sw.save(),...(row.listingType!=='CREATOR'?[seller.save()]:[]),buyer.save()]);if(row.listingType!=='CREATOR'){row.status='SOLD';row.buyerId=user.discordId;row.soldAt=new Date();await row.save();}}catch(e){bw.cstar+=row.price;await bw.save().catch(()=>{});throw e;}return json(res,200,{ok:true,listing:row});}
 if(req.method==='POST'&&u.pathname==='/v1/marketplace/submit'){const b=await body(req),p=await Social.findOne({userId:user.discordId}).lean();if(!p?.ownedCosmetics?.includes(String(b.cosmeticKey)))return json(res,400,{error:'NOT_OWNED'});const item=await Cosmetic.findOne({key:String(b.cosmeticKey)}).lean();if(!item)return json(res,400,{error:'UNKNOWN_COSMETIC'});const price=parseMoney(b.price,{min:1,max:1000000000000});if(!Number.isFinite(price)||price<1)return json(res,400,{error:'INVALID_PRICE'});const row=await Listing.create({sellerId:user.discordId,listingType:'RESALE',cosmeticKey:item.key,price,status:'PENDING'});await pendingReviewNotify('Product',row,{name:item.name||item.key,type:item.type||'',price});return json(res,201,{listing:row});}

 if(req.method==='GET'&&u.pathname==='/v1/marketplace/creator/mine'){const items=await Cosmetic.find({creatorId:user.discordId,source:'MEMBER'}).sort({createdAt:-1}).limit(100).lean();const listings=await Listing.find({sellerId:user.discordId,listingType:'CREATOR'}).sort({createdAt:-1}).limit(100).lean();return json(res,200,{items,listings});}
 if(req.method==='POST'&&u.pathname==='/v1/marketplace/creator/submit'){const b=await body(req),type=String(b.type||'').trim().toUpperCase(),name=String(b.name||'').trim(),collectionName=String(b.collectionName||'').trim(),value=String(b.value||'').trim(),creatorName=String(b.creatorName||'').trim(),price=parseMoney(b.price,{min:1,max:1000000000000});const types=['FRAME','BACKGROUND','ACCENT','NAMEPLATE','TITLE','EFFECT'];if(!types.includes(type))return json(res,400,{error:'INVALID_COSMETIC_TYPE'});if(!name||name.length>80||collectionName.length>80||creatorName.length>80||value.length>1000||!Number.isFinite(price))return json(res,400,{error:'INVALID_CREATOR_COSMETIC'});if(['FRAME','BACKGROUND','NAMEPLATE','EFFECT'].includes(type)){try{const x=new URL(value);if(x.protocol!=='https:')throw 0;}catch{return json(res,400,{error:'HTTPS_ASSET_REQUIRED'});}}const key=`creator:${user.discordId}:${crypto.randomBytes(6).toString('hex')}`;const item=await Cosmetic.create({key,type,name,price,rarity:'COMMON',value,creatorId:user.discordId,creatorName,collectionName,source:'MEMBER',reviewStatus:'PENDING',enabled:false});const listing=await Listing.create({sellerId:user.discordId,listingType:'CREATOR',cosmeticKey:key,price,status:'PENDING'});await pendingReviewNotify('Creator Cosmetic',listing,{name:item.name||name,type:item.type||type,price});return json(res,201,{item,listing});}
 if(req.method==='POST'&&u.pathname==='/v1/ads/submit'){const b=await body(req),d=await Dev.findOneAndUpdate({key:'global'},{$setOnInsert:{key:'global'}},{upsert:true,returnDocument:'after',setDefaultsOnInsert:true});if(!d.ads.enabled)return json(res,409,{error:'ADS_DISABLED'});const budget=Math.floor(Number(b.budget));if(!Number.isFinite(budget)||budget<d.ads.minBudget)return json(res,400,{error:`MIN_BUDGET_${d.ads.minBudget}`});const placement=String(b.placement||'').toUpperCase();const placements=['HOME','TRENDING','VOTE','GAME_HUB','MARKETPLACE','LEADERBOARD','PROFILE','NEWS_FORUM','NETWORK'];if(!placements.includes(placement))return json(res,400,{error:'INVALID_PLACEMENT'});const multiplier=Math.max(0.1,Number(d.ads?.placementMultipliers?.[placement])||1);const charged=Math.ceil(budget*multiplier);const title=String(b.title||'').trim();
 const description=String(b.description||'').trim();
 const targetUrl=String(b.targetUrl||'').trim();
 const imageUrl=String(b.imageUrl||'').trim();
 const safeHttps=v=>{
  try{
   const x=new URL(v);
   return x.protocol==='https:'&&!['localhost','127.0.0.1','::1'].includes(x.hostname.toLowerCase());
  }catch{return false;}
 };
 if(!title||title.length>80||description.length>240||(targetUrl&&!safeHttps(targetUrl)))
  return json(res,400,{error:'INVALID_AD'});
 if(imageUrl&&(!safeHttps(imageUrl)||imageUrl.length>1000))
  return json(res,400,{error:'INVALID_IMAGE_URL'});
 const startsAt=new Date(),endsAt=new Date(Date.now()+(d.ads.defaultDays||7)*86400000);try{await CToken.spend(user.discordId,charged);}catch(e){if(e?.message==='INSUFFICIENT_CTOKEN')return json(res,400,{error:'INSUFFICIENT_CTOKEN'});throw e;}let row;try{row=await Ad.create({ownerId:user.discordId,title,description,targetUrl,imageUrl,placement,budget,placementMultiplier:multiplier,chargedCToken:charged,status:'ACTIVE',startsAt,endsAt});}catch(e){await CToken.refundSpend(user.discordId,charged).catch(()=>{});throw e;}return json(res,201,{campaign:row,minBudget:d.ads.minBudget,multiplier,chargedCToken:charged});}
 if(req.method==='GET'&&u.pathname==='/v1/review/marketplace'){if(!(await staff(user)))return json(res,403,{error:'FORBIDDEN'});const items=await Listing.find({status:'PENDING'}).sort({createdAt:1}).limit(100).lean(),keys=[...new Set(items.map(x=>x.cosmeticKey))],cosmetics=await Cosmetic.find({key:{$in:keys}}).select('key type name rarity value creatorId creatorName collectionName source reviewStatus').lean(),map=new Map(cosmetics.map(x=>[x.key,x]));return json(res,200,{items:items.map(x=>({...x,cosmetic:map.get(x.cosmeticKey)||null}))});}
 const m=u.pathname.match(/^\/v1\/review\/marketplace\/([a-f0-9]{24})$/i);if(req.method==='POST'&&m){if(!(await staff(user)))return json(res,403,{error:'FORBIDDEN'});const b=await body(req),decision=String(b.decision||'').toUpperCase();if(!['APPROVED','DECLINED'].includes(decision))return json(res,400,{error:'INVALID_DECISION'});if(decision==='DECLINED'&&!String(b.reason||'').trim())return json(res,400,{error:'DECLINE_REASON_REQUIRED'});const reason=String(b.reason||'').trim(),row=await Listing.findOneAndUpdate({_id:m[1],status:'PENDING'},{$set:{status:decision,reviewerId:user.discordId,reviewReason:reason,reviewedAt:new Date()}},{returnDocument:'after'});if(!row)return json(res,409,{error:'ALREADY_REVIEWED'});if(row.listingType==='CREATOR'){await Cosmetic.updateOne({key:row.cosmeticKey,creatorId:row.sellerId,reviewStatus:'PENDING'},{$set:{reviewStatus:decision,enabled:decision==='APPROVED',reviewerId:user.discordId,reviewReason:reason,reviewedAt:new Date()}});}await reviewNotify(row.listingType==='CREATOR'?'Creator Cosmetic':'Product',row,decision,row.reviewReason);return json(res,200,{listing:row});}
 // Shared Discord/Web server setup
 const serverListPath=u.pathname==='/v1/servers';
 if(req.method==='GET'&&serverListPath){const out=[];for(const g of discordClient?.guilds?.cache?.values?.()||[]){const m=await g.members.fetch(user.discordId).catch(()=>null);if(!m)continue;const can=m.id===g.ownerId||m.permissions.has('Administrator')||m.permissions.has('ManageGuild');if(can)out.push({id:g.id,name:g.name,icon:g.iconURL({extension:'png',size:128})||'',memberCount:g.memberCount});}return json(res,200,{items:out});}
 const ctx=u.pathname.match(/^\/v1\/servers\/(\d+)\/context$/);if(req.method==='GET'&&ctx){const g=discordClient?.guilds?.cache?.get(ctx[1]);if(!g)return json(res,404,{error:'GUILD_NOT_FOUND'});const m=await g.members.fetch(user.discordId).catch(()=>null);if(!m||!(m.id===g.ownerId||m.permissions.has('Administrator')||m.permissions.has('ManageGuild')))return json(res,403,{error:'FORBIDDEN'});return json(res,200,{channels:g.channels.cache.filter(x=>x.isTextBased?.()||x.type===4).map(x=>({id:x.id,name:x.name,type:x.type})),roles:g.roles.cache.filter(x=>x.id!==g.id).map(x=>({id:x.id,name:x.name,color:x.hexColor}))});}
 const cfg=u.pathname.match(/^\/v1\/servers\/(\d+)\/config$/);if(cfg){const g=discordClient?.guilds?.cache?.get(cfg[1]);if(!g)return json(res,404,{error:'GUILD_NOT_FOUND'});const m=await g.members.fetch(user.discordId).catch(()=>null);if(!m||!(m.id===g.ownerId||m.permissions.has('Administrator')||m.permissions.has('ManageGuild')))return json(res,403,{error:'FORBIDDEN'});const Settings=require('../models/GuildSettings');if(req.method==='GET'){const row=await require('./guildSettings').getGuildSettings(g.id);return json(res,200,{config:row});}if(req.method==='PATCH'){const b=await body(req),allowed=['language','channels','modules','webSetup'];const set={};for(const k of allowed)if(b[k]!==undefined)set[k]=b[k];const row=await Settings.findOneAndUpdate({guildId:g.id},{$set:set,$setOnInsert:{guildId:g.id}},{upsert:true,returnDocument:'after',setDefaultsOnInsert:true}).lean();return json(res,200,{ok:true,config:row,audit:{actorId:user.discordId,source:'WEB',updatedAt:new Date()}});}}
 const clanPath=u.pathname.match(/^\/v1\/servers\/(\d+)\/clan$/);if(clanPath){const g=discordClient?.guilds?.cache?.get(clanPath[1]);if(!g)return json(res,404,{error:'GUILD_NOT_FOUND'});const m=await g.members.fetch(user.discordId).catch(()=>null);if(!m)return json(res,403,{error:'FORBIDDEN'});const Clan=require('../models/Clan'),Member=require('../models/ClanMember'),CS=require('./clanSystem');let clan=await Clan.findOne({ownerGuildId:g.id}).lean();if(req.method==='GET'){if(!clan)return json(res,200,{clan:null,members:[]});const members=await Member.find({clanId:clan._id}).sort({contribution:-1}).limit(500).lean();return json(res,200,{clan,members});}if(req.method==='POST'){if(!(m.id===g.ownerId||m.permissions.has('Administrator')||m.permissions.has('ManageGuild')))return json(res,403,{error:'FORBIDDEN'});if(clan)return json(res,409,{error:'CLAN_EXISTS'});const b=await body(req);clan=await CS.create({ownerGuildId:g.id,ownerId:user.discordId,name:b.name,tag:b.tag||''});return json(res,201,{clan});}if(req.method==='PATCH'){if(!clan||!(await CS.can(user.discordId,clan,'settings')))return json(res,403,{error:'FORBIDDEN'});const b=await body(req),set={};for(const k of ['name','tag','description','privacy','memberCap','logoAsset','bannerAsset'])if(b[k]!==undefined)set[k]=b[k];const row=await Clan.findByIdAndUpdate(clan._id,{$set:set},{returnDocument:'after',runValidators:true}).lean();await CS.audit(clan._id,user.discordId,'CLAN_SETTINGS_UPDATED','',{fields:Object.keys(set)});return json(res,200,{ok:true,clan:row});}}

 // Clan Community management resources (shared by Discord + Website)
 const clanResource=u.pathname.match(/^\/v1\/servers\/(\d+)\/clan\/(members|applications)$/);
 if(clanResource){const [,gid,resource]=clanResource;const g=discordClient?.guilds?.cache?.get(gid);if(!g)return json(res,404,{error:'GUILD_NOT_FOUND'});const gm=await g.members.fetch(user.discordId).catch(()=>null);if(!gm)return json(res,403,{error:'FORBIDDEN'});const Clan=require('../models/Clan'),CM=require('../models/ClanMember'),CA=require('../models/ClanApplication'),CS=require('./clanSystem');const clan=await Clan.findOne({ownerGuildId:gid});if(!clan)return json(res,404,{error:'CLAN_NOT_FOUND'});if(req.method==='GET'){if(resource==='applications'&&!(await CS.can(user.discordId,clan,'applications')))return json(res,403,{error:'FORBIDDEN'});const model=resource==='members'?CM:CA;const q=resource==='applications'?{clanId:clan._id,status:'PENDING'}:{clanId:clan._id};const rows=await model.find(q).sort(resource==='members'?{contribution:-1}:{createdAt:1}).limit(500).lean();return json(res,200,{items:rows});}return json(res,405,{error:'METHOD_NOT_ALLOWED'});}
 const clanContribute=u.pathname.match(/^\/v1\/servers\/(\d+)\/clan\/contribute$/);if(clanContribute&&req.method==='POST'){const g=discordClient?.guilds?.cache?.get(clanContribute[1]);if(!g)return json(res,404,{error:'GUILD_NOT_FOUND'});const gm=await g.members.fetch(user.discordId).catch(()=>null);if(!gm)return json(res,403,{error:'FORBIDDEN'});const CS=require('./clanSystem'),b=await body(req);const r=await CS.contributeCXU(user.discordId,Number(b.amount));return json(res,200,{ok:true,amount:r.amount,rankUp:r.rankUp,clan:r.clan,member:r.member});}
 const clanAction=u.pathname.match(/^\/v1\/servers\/(\d+)\/clan\/(applications|members)\/([a-f0-9]{24}|\d{15,25})$/i);
 if(clanAction&&req.method==='PATCH'){const [,gid,resource,id]=clanAction;const g=discordClient?.guilds?.cache?.get(gid);if(!g)return json(res,404,{error:'GUILD_NOT_FOUND'});const gm=await g.members.fetch(user.discordId).catch(()=>null);if(!gm)return json(res,403,{error:'FORBIDDEN'});const Clan=require('../models/Clan'),CS=require('./clanSystem');const clan=await Clan.findOne({ownerGuildId:gid});if(!clan)return json(res,404,{error:'CLAN_NOT_FOUND'});const b=await body(req);if(resource==='applications'){const decision=String(b.decision||'').toUpperCase();if(!['APPROVED','DECLINED'].includes(decision))return json(res,400,{error:'INVALID_DECISION'});const row=await CS.reviewApplication(clan,id,user.discordId,decision);return json(res,200,{item:row});}if(resource==='members'){if(b.rank){const row=await CS.setRank(clan,id,String(b.rank).toUpperCase(),user.discordId);return json(res,200,{item:row});}if(b.remove===true){const row=await CS.removeMember(clan,id,user.discordId,String(b.reason||''));return json(res,200,{item:row});}return json(res,400,{error:'UNSUPPORTED_CLAN_MEMBER_ACTION'});}}
 // Server event builders exposed on web while Discord setup remains available.
 const eventPath=u.pathname.match(/^\/v1\/servers\/(\d+)\/(giveaways|contests)$/);
 if(eventPath){const [,gid,kind]=eventPath;const g=discordClient?.guilds?.cache?.get(gid);if(!g)return json(res,404,{error:'GUILD_NOT_FOUND'});const gm=await g.members.fetch(user.discordId).catch(()=>null);if(!gm||!(gm.id===g.ownerId||gm.permissions.has('Administrator')||gm.permissions.has('ManageGuild')))return json(res,403,{error:'FORBIDDEN'});const Model=kind==='giveaways'?require('../models/Giveaway'):require('../models/Contest');if(req.method==='GET'){return json(res,200,{items:await Model.find({guildId:gid}).sort({createdAt:-1}).limit(100).lean()});}if(req.method==='POST'){const b=await body(req);if(kind==='giveaways'){const row=await Model.create({guildId:gid,channelId:String(b.channelId||''),prize:String(b.prize||'').trim(),description:String(b.description||''),winnerCount:Number(b.winnerCount)||1,endsAt:new Date(b.endsAt),hostId:user.discordId,requiredRoleId:String(b.requiredRoleId||''),imageUrl:String(b.imageAsset||''),status:'active'});return json(res,201,{item:row});}const row=await Model.create({guildId:gid,eventChannelId:String(b.eventChannelId||b.channelId||''),galleryChannelId:String(b.galleryChannelId||''),resultChannelId:String(b.resultChannelId||''),title:String(b.title||'').trim(),description:String(b.description||''),bannerUrl:String(b.bannerAsset||''),submissionEndsAt:b.submissionEndsAt?new Date(b.submissionEndsAt):null,votingEndsAt:b.votingEndsAt?new Date(b.votingEndsAt):null,createdBy:user.discordId,status:'SUBMISSION'});return json(res,201,{item:row});}}
 return json(res,404,{error:'NOT_FOUND'});
 }catch(e){const map={UNAUTHORIZED:401,AUTH_NOT_CONFIGURED:503,DISCORD_ID_MISSING:400,DISABLED:409,MIN_DEPOSIT:400,INSUFFICIENT:400,MAX_BALANCE:400,INSUFFICIENT_BANK:400,INVALID_AMOUNT:400};return json(res,map[e.message]||500,{error:e.message||'INTERNAL_ERROR'});}}
async function pendingReviewNotify(kind,row,meta={}){
 if(!discordClient)return;
 const channelId=process.env.GLOBAL_REVIEW_LOG_CHANNEL_ID;
 if(!channelId)return;

 const ch=await discordClient.channels.fetch(channelId).catch(()=>null);
 if(!ch)return;

 const sellerId=row.sellerId||row.ownerId;
 const lines=[
  '🟡 **Global Market • Pending Review**',
  `Type: **${kind}**`,
  `Listing ID: \`${row._id}\``,
  `Seller: <@${sellerId}> (${sellerId})`,
  `Item: **${meta.name||row.cosmeticKey||'Unknown'}**`,
  meta.type?`Category: **${meta.type}**`:null,
  `Price: **${Number(meta.price??row.price??0).toLocaleString('en-US')} CXu**`,
  '',
  '⏳ Waiting for Admin review on the Corgi-Bot website.'
 ].filter(Boolean);

 await ch.send(lines.join('\n')).catch(()=>{});
}

async function reviewNotify(kind,row,decision,reason=''){if(!discordClient)return;const sellerId=row.sellerId||row.ownerId;const title=`${kind} ${decision==='APPROVED'?'Approved':'Declined'}`;const text=`${title}\nID: ${row._id}\nUser: <@${sellerId}>\nReviewer: <@${row.reviewerId}>${reason?`\nReason: ${reason}`:''}`;const channelId=process.env.GLOBAL_REVIEW_LOG_CHANNEL_ID;if(channelId){const ch=await discordClient.channels.fetch(channelId).catch(()=>null);await ch?.send(text).catch(()=>{});}const user=await discordClient.users.fetch(sellerId).catch(()=>null);await user?.send(decision==='APPROVED'?`✅ **${title}**\nYour submission has been approved.`:`❌ **${title}**\nReason: ${reason}`).catch(()=>{});}
function start(client){discordClient=client||discordClient;if(String(process.env.WEB_API_ENABLED||'false').toLowerCase()!=='true')return null;const port=Number(process.env.WEB_API_PORT||3001);const server=http.createServer((q,s)=>handler(q,s));server.listen(port,'127.0.0.1',()=>console.log(`🌐 Corgi Web API listening • 127.0.0.1:${port}`));return server;}module.exports={start};
