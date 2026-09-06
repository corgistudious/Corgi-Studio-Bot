require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { connectDatabase } = require('./services/database');
const { loadCommands } = require('./handlers/loadCommands');
const { loadEvents } = require('./handlers/loadEvents');
const { startStatsService } = require('./modules/stats');
const { startGiveawayService } = require('./modules/giveaway');
const { startContestService } = require('./modules/contest');
const { startPremiumService } = require('./services/premium');

const client = new Client({
  intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,GatewayIntentBits.GuildModeration,GatewayIntentBits.GuildMessageReactions],
  partials:[Partials.Message,Partials.Channel,Partials.Reaction]
});
loadCommands(client); loadEvents(client);
async function main(){ await connectDatabase(); startStatsService(client); startGiveawayService(client); startContestService(client); startPremiumService(client); await client.login(process.env.DISCORD_TOKEN); }
main().catch(e=>{console.error('❌ Startup failed:',e);process.exit(1);});
process.on('unhandledRejection',e=>console.error('Unhandled rejection:',e));
process.on('uncaughtException',e=>console.error('Uncaught exception:',e));
