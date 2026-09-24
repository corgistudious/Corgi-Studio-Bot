const { Events } = require('discord.js');
const { syncCorgiPremiumEmojis } = require('../services/corgiPremiumEmoji');
const { syncCurrencyEmoji } = require('../services/currencyEmoji');
module.exports={name:Events.ClientReady,once:true,async execute(client){
  console.log('====================================');
  console.log('✅ CORGI-BOT NEW ONLINE');
  console.log(`🤖 ${client.user.tag}`);
  console.log(`🌐 Servers: ${client.guilds.cache.size}`);
  console.log('====================================');
  await syncCorgiPremiumEmojis(client).catch(e=>console.warn('Corgi Premium emoji sync:',e.message));
  await syncCurrencyEmoji(client).catch(e=>console.warn('CXu emoji sync:',e.message));
  require('../services/webApi').start(client);
  require('../services/topggStats').startTopggStats(client);
  require('../services/marketNotifier').start(client);
  require('../services/seasonalNotifier').start(client);
  await require('../services/seasonalService').seed().catch(e=>console.warn('Seasonal seed:',e.message));
  require('../services/guildScheduler').start(client);
}};
