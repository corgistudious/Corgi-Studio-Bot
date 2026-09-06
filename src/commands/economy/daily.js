const { SlashCommandBuilder } = require('discord.js');
const UserEconomy = require('../../models/UserEconomy');
const COOLDOWN = 24*60*60*1000;
async function claim(guildId,userId){
  const row = await UserEconomy.findOneAndUpdate({guildId,userId},{$setOnInsert:{guildId,userId}},{upsert:true,returnDocument:'after'});
  if (row.lastDailyAt && Date.now()-row.lastDailyAt.getTime()<COOLDOWN) return {ok:false};
  row.cstar += 250; row.lastDailyAt = new Date(); await row.save(); return {ok:true,amount:250,balance:row.cstar};
}
module.exports = {
  data:new SlashCommandBuilder().setName('daily').setDescription('Claim daily Cstar reward'), prefix:['daily'],
  async execute(i){ const r=await claim(i.guildId,i.user.id); return i.reply(r.ok?`⭐ Daily reward: **+${r.amount} Cstar**. Balance: **${r.balance}**.`:'⏳ Daily reward already claimed.'); },
  async executePrefix(m){ const r=await claim(m.guildId,m.author.id); return m.reply(r.ok?`⭐ Daily reward: **+${r.amount} Cstar**. Balance: **${r.balance}**.`:'⏳ Daily reward already claimed.'); }
};
