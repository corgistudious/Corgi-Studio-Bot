const {SlashCommandBuilder,EmbedBuilder}=require('discord.js');
const P=require('../../services/progression');
const {ensureWallet}=require('../../services/economyWallet');
const {guildLang,pick}=require('../../services/i18n');
async function build(user,lang){
  let p=await P.activeVip(user.id);p=await P.clearExpiredTitle(p);const r=await P.ranks(user.id),dev=await P.settings(),wallet=await ensureWallet(user.id),need=P.xpNeeded(p.level,dev.progression);
  const pct=need?Math.min(100,Math.floor(p.xp/need*100)):100,filled=Math.round(pct/10),bar='▰'.repeat(filled)+'▱'.repeat(10-filled);
  const vip=p.vipTier&&p.vipExpiresAt?`💎 **${p.vipTier}** • <t:${Math.floor(p.vipExpiresAt.getTime()/1000)}:R>`:pick(lang,'No active VIP','Chưa có VIP');
  const title=p.activeTitle?`👑 **${p.activeTitle}**${p.activeTitleExpiresAt?` • <t:${Math.floor(p.activeTitleExpiresAt.getTime()/1000)}:R>`:''}`:pick(lang,'No active title','Chưa có danh hiệu');
  const colors={'VIP':0x3498DB,'VIP+':0x9B59B6,'VVIP':0xE91E63,'SVIP':0xE67E22,'SSVIP':0x2ECC71,'SSSVIP':0xF1C40F};return new EmbedBuilder().setColor(colors[p.vipTier]||0xF59E0B).setAuthor({name:pick(lang,'CORGI GAMING PROFILE','HỒ SƠ GAMING CORGI'),iconURL:user.displayAvatarURL()}).setTitle(`🎮 ${user.globalName||user.username}`).setThumbnail(user.displayAvatarURL({size:256})).setDescription(`${title}\n${vip}`).addFields(
    {name:pick(lang,'⚔️ Level & EXP','⚔️ Cấp độ & EXP'),value:`**Lv.${p.level.toLocaleString()}** / ${dev.progression.maxLevel.toLocaleString()}\n${bar} **${pct}%**\n${p.xp.toLocaleString()} / ${need.toLocaleString()} EXP`,inline:false},
    {name:pick(lang,'🌐 Global Rank','🌐 Hạng liên server'),value:`**#${r.globalRank.toLocaleString()}**\n${p.totalXp.toLocaleString()} Total EXP`,inline:true},
    {name:pick(lang,'🏆 Weekly Race','🏆 Đua Top tuần'),value:`${r.weeklyRank?`**#${r.weeklyRank.toLocaleString()}**`:'—'}\n${r.weeklyXp.toLocaleString()} EXP`,inline:true},
    {name:pick(lang,'💰 Wealth Rank','💰 Hạng Tài Phú'),value:`**#${r.wealthRank.toLocaleString()}**\n${wallet.cstar.toLocaleString()} 🌟Cstar`,inline:true},
    {name:pick(lang,'🏅 Achievements','🏅 Thành tích'),value:pick(lang,`Weekly rewards: **${p.weeklyWins}**\nBest weekly rank: **${p.bestWeeklyRank?`#${p.bestWeeklyRank}`:'—'}**`,`Số lần nhận thưởng Top: **${p.weeklyWins}**\nHạng tuần cao nhất: **${p.bestWeeklyRank?`#${p.bestWeeklyRank}`:'—'}**`),inline:true},
    {name:pick(lang,'📨 Activity','📨 Hoạt động'),value:pick(lang,`Qualified messages: **${p.totalMessages.toLocaleString()}**\nJoined: <t:${Math.floor(new Date(p.joinedAt).getTime()/1000)}:D>`,`Tin nhắn được tính: **${p.totalMessages.toLocaleString()}**\nTham gia: <t:${Math.floor(new Date(p.joinedAt).getTime()/1000)}:D>`),inline:true}
  ).setFooter({text:pick(lang,`Weekly reset: Monday 00:00 UTC • ${r.week.key}`,`Reset tuần: Thứ Hai 00:00 UTC • ${r.week.key}`)}).setTimestamp();
}
module.exports={data:new SlashCommandBuilder().setName('profile').setDescription('View a professional global gaming profile').setDescriptionLocalizations({vi:'Xem hồ sơ gaming liên server'}).addUserOption(o=>o.setName('user').setDescription('Member to view').setDescriptionLocalizations({vi:'Thành viên muốn xem'})),prefix:['profile','pf'],async execute(i){const lang=await guildLang(i.guildId),u=i.options.getUser('user')||i.user;return i.reply({embeds:[await build(u,lang)]});},async executePrefix(m){const lang=await guildLang(m.guildId),u=m.mentions.users.first()||m.author;return m.reply({embeds:[await build(u,lang)]});}};
