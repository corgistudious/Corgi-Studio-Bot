const { Events } = require('discord.js');
const { syncCorgiPremiumEmojis } = require('../services/corgiPremiumEmoji');
module.exports={name:Events.ClientReady,once:true,async execute(client){
  console.log('====================================');
  console.log('✅ CORGI-BOT NEW ONLINE');
  console.log(`🤖 ${client.user.tag}`);
  console.log(`🌐 Servers: ${client.guilds.cache.size}`);
  console.log('====================================');
  await syncCorgiPremiumEmojis(client).catch(e=>console.warn('Corgi Premium emoji sync:',e.message));
}};
