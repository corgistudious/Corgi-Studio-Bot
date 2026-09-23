const GuildSettings=require('../models/GuildSettings');
const Alert=require('../models/MarketAlertState');
const MarketEvent=require('../models/MarketEvent');
const M=require('./marketService');
const {t}=require('./i18n');

function discordTime(date){
  return `<t:${Math.floor(new Date(date).getTime()/1000)}:R>`;
}

function eventReason(lang,event){
  return t(lang,`v6.marketEvent.${event.eventKey}`);
}

function affected(lang,event){
  return event.scope==='market'
    ? t(lang,'v6.marketEvent.marketWide')
    : (event.symbols||[]).map(x=>`**${x}**`).join(', ');
}

function startMessage(lang,event){
  const direction=event.direction==='up'
    ? `🟢 ${t(lang,'v6.marketEvent.up')}`
    : `🔴 ${t(lang,'v6.marketEvent.down')}`;

  return [
    `**${t(lang,'v6.marketEvent.title')}**`,
    '',
    `📰 ${eventReason(lang,event)}`,
    `🎯 **${t(lang,'v6.marketEvent.affected')}:** ${affected(lang,event)}`,
    `📊 ${direction}`,
    `📈 ${t(lang,'v6.marketEvent.impact',{
      impact:(Number(event.impactPerTick||0)*100).toFixed(2).replace(/^([0-9])/,'+$1')
    })}`,
    `🕒 **${t(lang,'v6.marketEvent.until')}:** ${discordTime(event.endsAt)}`,
    '',
    `⚠️ ${t(lang,'v6.marketEvent.sim')}`
  ].join('\n');
}

function endMessage(lang,event){
  return [
    `**${t(lang,'v6.marketEvent.end')}**`,
    '',
    `🎯 **${t(lang,'v6.marketEvent.affected')}:** ${affected(lang,event)}`,
    `✅ ${t(lang,'v6.marketEvent.ended')}`,
    '',
    `⚠️ ${t(lang,'v6.marketEvent.sim')}`
  ].join('\n');
}

async function sendEventNews(guilds,event,kind){
  if(!event)return false;

  let delivered=false;

  for(const g of guilds){
    const lang=g.language||'en';
    const ch=await global.__marketClient.channels
      .fetch(g.channels.marketAnnouncements)
      .catch(()=>null);

    if(!ch?.isTextBased())continue;

    const body=kind==='start'
      ? startMessage(lang,event)
      : endMessage(lang,event);

    const sent=await ch.send(body).then(()=>true).catch(()=>false);
    if(sent)delivered=true;
  }

  return delivered;
}

async function run(client){
  global.__marketClient=client;

  const assets=await M.tick();

  const guilds=await GuildSettings.find({
    'marketNotifications.enabled':true,
    'channels.marketAnnouncements':{$exists:true,$ne:null}
  }).lean();

  const pendingStarts=await MarketEvent.find({
    status:'active',
    announcedAt:null,
    endsAt:{$gt:new Date()}
  }).lean();

  for(const event of pendingStarts){
    const delivered=await sendEventNews(guilds,event,'start');

    if(delivered){
      await MarketEvent.updateOne(
        {_id:event._id,announcedAt:null},
        {$set:{announcedAt:new Date()}}
      );
    }
  }

  const pendingEnds=await MarketEvent.find({
    status:'ended',
    endedAnnouncedAt:null
  }).lean();

  for(const event of pendingEnds){
    const delivered=await sendEventNews(guilds,event,'end');

    if(delivered){
      await MarketEvent.updateOne(
        {_id:event._id,endedAnnouncedAt:null},
        {$set:{endedAnnouncedAt:new Date()}}
      );
    }
  }

  for(const g of guilds){
    const lang=g.language||'en';
    const threshold=Math.max(
      0.1,
      Number(g.marketNotifications?.thresholdPercent||5)
    );
    const cooldown=Math.max(
      1,
      Number(g.marketNotifications?.cooldownMinutes||60)
    )*60000;
    const dir=g.marketNotifications?.direction||'both';

    const ch=await client.channels
      .fetch(g.channels.marketAnnouncements)
      .catch(()=>null);

    if(!ch?.isTextBased())continue;

    for(const a of assets){
      const pct=a.previousPrice
        ? ((a.price-a.previousPrice)/a.previousPrice*100)
        : 0;

      if(
        Math.abs(pct)<threshold||
        (dir==='up'&&pct<0)||
        (dir==='down'&&pct>0)
      )continue;

      const state=await Alert.findOne({
        guildId:g.guildId,
        symbol:a.symbol
      }).lean();

      if(
        state?.lastSentAt&&
        Date.now()-new Date(state.lastSentAt).getTime()<cooldown
      )continue;

      await ch.send(
        `📈 **Corgi Market • Virtual Market**\n`+
        `${pct>=0?'🟢':'🔴'} **${a.symbol}** • `+
        `${a.previousPrice.toFixed(2)} → **${a.price.toFixed(2)} CXu** • `+
        `${pct>=0?'▲':'▼'} ${Math.abs(pct).toFixed(2)}%\n`+
        `⚠️ ${t(lang,'v6.marketEvent.sim')}`
      ).catch(()=>{});

      await Alert.updateOne(
        {guildId:g.guildId,symbol:a.symbol},
        {$set:{lastSentAt:new Date()}},
        {upsert:true}
      );
    }
  }
}

function start(client){
  const timer=setInterval(
    ()=>run(client).catch(e=>console.warn('Market notifier:',e.message)),
    5*60*1000
  );
  timer.unref?.();
}

module.exports={run,start};
