const MarketEvent=require('../models/MarketEvent');

const SYMBOLS=['CRGI','NOVA','BYTE','ORBT','LUNA','NEXUS'];

const TEMPLATES=[
  {key:'product_breakthrough',direction:'up',scope:'asset',min:.006,max:.014},
  {key:'major_contract',direction:'up',scope:'asset',min:.005,max:.012},
  {key:'strong_demand',direction:'up',scope:'asset',min:.004,max:.010},
  {key:'product_failure',direction:'down',scope:'asset',min:.006,max:.014},
  {key:'supply_disruption',direction:'down',scope:'asset',min:.005,max:.012},
  {key:'weak_demand',direction:'down',scope:'asset',min:.004,max:.010},
  {key:'market_rally',direction:'up',scope:'market',min:.002,max:.006},
  {key:'market_selloff',direction:'down',scope:'market',min:.002,max:.006}
];

function between(min,max){
  return min+Math.random()*(max-min);
}

function randomChoice(arr){
  return arr[Math.floor(Math.random()*arr.length)];
}

async function expire(now=new Date()){
  const ending=await MarketEvent.find({
    status:'active',
    endsAt:{$lte:now}
  }).lean();

  if(ending.length){
    await MarketEvent.updateMany(
      {_id:{$in:ending.map(x=>x._id)}},
      {$set:{status:'ended'}}
    );
  }

  return ending;
}

async function active(now=new Date()){
  await expire(now);
  return MarketEvent.find({
    status:'active',
    startsAt:{$lte:now},
    endsAt:{$gt:now}
  }).lean();
}

async function maybeCreate(now=new Date()){
  await expire(now);

  const existing=await MarketEvent.findOne({
    status:'active',
    endsAt:{$gt:now}
  }).lean();

  if(existing)return null;

  // Called every 5 minutes. ~3% chance means events remain uncommon.
  if(Math.random()>=0.03)return null;

  const template=randomChoice(TEMPLATES);
  const durationMinutes=30+Math.floor(Math.random()*7)*15;
  const magnitude=between(template.min,template.max);
  const impactPerTick=template.direction==='down'?-magnitude:magnitude;

  const symbols=template.scope==='market'
    ? [...SYMBOLS]
    : [randomChoice(SYMBOLS)];

  return MarketEvent.create({
    eventKey:template.key,
    scope:template.scope,
    symbols,
    direction:template.direction,
    impactPerTick,
    startsAt:now,
    endsAt:new Date(now.getTime()+durationMinutes*60000),
    status:'active'
  });
}

function modifierFor(symbol,events){
  let total=0;

  for(const event of events||[]){
    if(event.scope==='market'||event.symbols?.includes(symbol)){
      total+=Number(event.impactPerTick||0);
    }
  }

  // Hard safety cap: event pressure cannot exceed ±1.5% per tick.
  return Math.max(-0.015,Math.min(0.015,total));
}

async function cycle(now=new Date()){
  const ended=await expire(now);
  const created=await maybeCreate(now);

  const events=await MarketEvent.find({
    status:'active',
    startsAt:{$lte:now},
    endsAt:{$gt:now}
  }).lean();

  return {created,events,ended};
}

module.exports={
  SYMBOLS,
  active,
  expire,
  maybeCreate,
  modifierFor,
  cycle
};
