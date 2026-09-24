const http=require('http');const crypto=require('crypto');let discordClient=null;const {URL}=require('url');const Bank=require('./bankService');const Cosmetic=require('../models/GlobalCosmetic');const Listing=require('../models/MarketplaceListing');const Ad=require('../models/AdCampaign');const Dev=require('../models/DeveloperSettings');const Social=require('../models/SocialProfile');const AdMetric=require('../models/AdMetric');const CToken=require('./cTokenService');const adDedupe=new Map();
function cors(req,res){const allowed=String(process.env.WEB_ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean),origin=req.headers.origin;if(origin&&allowed.includes(origin))res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));}
async function body(req){let raw='';for await(const c of req){raw+=c;if(raw.length>100000)throw new Error('BODY_TOO_LARGE')}return raw?JSON.parse(raw):{};}
async function auth(req){const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!token)throw new Error('UNAUTHORIZED');const base=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');const key=process.env.SUPABASE_PUBLISHABLE_KEY;if(!base||!key)throw new Error('AUTH_NOT_CONFIGURED');const r=await fetch(`${base}/auth/v1/user`,{headers:{Authorization:`Bearer ${token}`,apikey:key},signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('UNAUTHORIZED');const u=await r.json();const discordId=u?.user_metadata?.provider_id||u?.identities?.[0]?.identity_data?.provider_id;if(!discordId)throw new Error('DISCORD_ID_MISSING');return {supabaseId:u.id,discordId:String(discordId),token};}
async function staff(user,need='moderator'){const service=process.env.SUPABASE_SECRET_KEY,base=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');if(!service||!base)return false;const r=await fetch(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(user.supabaseId)}&select=role`,{headers:{apikey:service,Authorization:`Bearer ${service}`}});const rows=await r.json().catch(()=>[]);const rank={member:0,moderator:1,admin:2,developer:3};return (rank[rows?.[0]?.role]||0)>=(rank[need]||1);}
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
 if(req.method==='GET'&&u.pathname==='/v1/shop'){const items=await Cosmetic.find({enabled:true}).sort({price:1}).select('key type name price rarity value').lean();return json(res,200,{items});}
 if(req.method==='GET'&&u.pathname==='/v1/marketplace'){const items=await Listing.find({status:'APPROVED'}).sort({createdAt:-1}).limit(100).lean();return json(res,200,{items});}
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
 const clk=u.pathname.match(/^\/v1\/ads\/([a-f0-9]{24})\/click$/i);if(req.method==='GET'&&clk){const row=await Ad.findOne({_id:clk[1],status:'ACTIVE',startsAt:{$lte:new Date()},endsAt:{$gt:new Date()}}).select('targetUrl').lean();if(!row)return json(res,404,{error:'AD_NOT_ACTIVE'});if(allowAdEvent(req,clk[1],'c',10*60*1000))await addAdMetric(clk[1],'clicks');res.writeHead(302,{Location:row.targetUrl,'Cache-Control':'no-store'});return res.end();}
 const user=await auth(req);
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
 const buyMatch=u.pathname.match(/^\/v1\/marketplace\/([a-f0-9]{24})\/buy$/i);if(req.method==='POST'&&buyMatch){const row=await Listing.findOne({_id:buyMatch[1],status:'APPROVED'});if(!row)return json(res,404,{error:'LISTING_NOT_AVAILABLE'});if(row.sellerId===user.discordId)return json(res,400,{error:'CANNOT_BUY_OWN_LISTING'});const [seller,buyer,bw,sw]=await Promise.all([Social.findOne({userId:row.sellerId}),Social.findOneAndUpdate({userId:user.discordId},{$setOnInsert:{userId:user.discordId}},{upsert:true,returnDocument:'after',setDefaultsOnInsert:true}),require('./economyWallet').ensureWallet(user.discordId),require('./economyWallet').ensureWallet(row.sellerId)]);if(!seller?.ownedCosmetics?.includes(row.cosmeticKey))return json(res,409,{error:'SELLER_NO_LONGER_OWNS_ITEM'});if(buyer.ownedCosmetics.includes(row.cosmeticKey))return json(res,409,{error:'ALREADY_OWNED'});if(bw.cstar<row.price)return json(res,400,{error:'INSUFFICIENT_CXU'});bw.cstar-=row.price;sw.cstar+=row.price;seller.ownedCosmetics=seller.ownedCosmetics.filter(x=>x!==row.cosmeticKey);buyer.ownedCosmetics.push(row.cosmeticKey);await bw.save();try{await Promise.all([sw.save(),seller.save(),buyer.save()]);row.status='SOLD';row.buyerId=user.discordId;row.soldAt=new Date();await row.save();}catch(e){bw.cstar+=row.price;await bw.save().catch(()=>{});throw e;}return json(res,200,{ok:true,listing:row});}
 if(req.method==='POST'&&u.pathname==='/v1/marketplace/submit'){const b=await body(req),p=await Social.findOne({userId:user.discordId}).lean();if(!p?.ownedCosmetics?.includes(String(b.cosmeticKey)))return json(res,400,{error:'NOT_OWNED'});const item=await Cosmetic.findOne({key:String(b.cosmeticKey)}).lean();if(!item)return json(res,400,{error:'UNKNOWN_COSMETIC'});const price=Math.floor(Number(b.price));if(!Number.isFinite(price)||price<1)return json(res,400,{error:'INVALID_PRICE'});const row=await Listing.create({sellerId:user.discordId,cosmeticKey:item.key,price,status:'PENDING'});return json(res,201,{listing:row});}
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
 if(!title||title.length>80||description.length>240||!safeHttps(targetUrl))
  return json(res,400,{error:'INVALID_AD'});
 if(imageUrl&&(!safeHttps(imageUrl)||imageUrl.length>1000))
  return json(res,400,{error:'INVALID_IMAGE_URL'});
 const startsAt=new Date(),endsAt=new Date(Date.now()+(d.ads.defaultDays||7)*86400000);try{await CToken.spend(user.discordId,charged);}catch(e){if(e?.message==='INSUFFICIENT_CTOKEN')return json(res,400,{error:'INSUFFICIENT_CTOKEN'});throw e;}let row;try{row=await Ad.create({ownerId:user.discordId,title,description,targetUrl,imageUrl,placement,budget,placementMultiplier:multiplier,chargedCToken:charged,status:'ACTIVE',startsAt,endsAt});}catch(e){await CToken.refundSpend(user.discordId,charged).catch(()=>{});throw e;}return json(res,201,{campaign:row,minBudget:d.ads.minBudget,multiplier,chargedCToken:charged});}
 if(req.method==='GET'&&u.pathname==='/v1/review/marketplace'){if(!(await staff(user)))return json(res,403,{error:'FORBIDDEN'});const items=await Listing.find({status:'PENDING'}).sort({createdAt:1}).limit(100).lean();return json(res,200,{items});}
 const m=u.pathname.match(/^\/v1\/review\/marketplace\/([a-f0-9]{24})$/i);if(req.method==='POST'&&m){if(!(await staff(user)))return json(res,403,{error:'FORBIDDEN'});const b=await body(req),decision=String(b.decision||'').toUpperCase();if(!['APPROVED','DECLINED'].includes(decision))return json(res,400,{error:'INVALID_DECISION'});if(decision==='DECLINED'&&!String(b.reason||'').trim())return json(res,400,{error:'DECLINE_REASON_REQUIRED'});const row=await Listing.findOneAndUpdate({_id:m[1],status:'PENDING'},{$set:{status:decision,reviewerId:user.discordId,reviewReason:String(b.reason||'').trim(),reviewedAt:new Date()}},{returnDocument:'after'});if(!row)return json(res,409,{error:'ALREADY_REVIEWED'});await reviewNotify('Product',row,decision,row.reviewReason);return json(res,200,{listing:row});}
 return json(res,404,{error:'NOT_FOUND'});
 }catch(e){const map={UNAUTHORIZED:401,AUTH_NOT_CONFIGURED:503,DISCORD_ID_MISSING:400,DISABLED:409,MIN_DEPOSIT:400,INSUFFICIENT:400,MAX_BALANCE:400,INSUFFICIENT_BANK:400,INVALID_AMOUNT:400};return json(res,map[e.message]||500,{error:e.message||'INTERNAL_ERROR'});}}
async function reviewNotify(kind,row,decision,reason=''){if(!discordClient)return;const sellerId=row.sellerId||row.ownerId;const title=`${kind} ${decision==='APPROVED'?'Approved':'Declined'}`;const text=`${title}\nID: ${row._id}\nUser: <@${sellerId}>\nReviewer: <@${row.reviewerId}>${reason?`\nReason: ${reason}`:''}`;const channelId=process.env.GLOBAL_REVIEW_LOG_CHANNEL_ID;if(channelId){const ch=await discordClient.channels.fetch(channelId).catch(()=>null);await ch?.send(text).catch(()=>{});}const user=await discordClient.users.fetch(sellerId).catch(()=>null);await user?.send(decision==='APPROVED'?`✅ **${title}**\nYour submission has been approved.`:`❌ **${title}**\nReason: ${reason}`).catch(()=>{});}
function start(client){discordClient=client||discordClient;if(String(process.env.WEB_API_ENABLED||'false').toLowerCase()!=='true')return null;const port=Number(process.env.WEB_API_PORT||3001);const server=http.createServer((q,s)=>handler(q,s));server.listen(port,'127.0.0.1',()=>console.log(`🌐 Corgi Web API listening • 127.0.0.1:${port}`));return server;}module.exports={start};
