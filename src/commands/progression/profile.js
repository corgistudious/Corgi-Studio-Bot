const path=require('path');
const {SlashCommandBuilder,EmbedBuilder,AttachmentBuilder}=require('discord.js');
const P=require('../../services/progression');
const {ensureWallet}=require('../../services/economyWallet');
const {guildLang,mtx}=require('../../services/i18n');
const Verification=require('../../services/profileVerification');
const {isPremiumGuild}=require('../../services/premium');

const VERIFICATION_EMOJI={
  BLUE:'<a:codingbots_verified:1547027224866332772>',
  RED:'<a:verified_red:1547027228305395792>',
  YELLOW:'<a:Tick:1547027222962118747>',
  PURPLE:'<a:tick_purple:1547027226795704400>',
};

const BRANDING={
  FREE:{path:path.join(__dirname,'../../../assets/branding/corgi-global.png'),name:'corgi-global.png'},
  PREMIUM:{path:path.join(__dirname,'../../../assets/branding/corgi-premium.png'),name:'corgi-premium.png'},
};

function verificationEmoji(row){
  if(!row||row.status!=='APPROVED')return '';
  return VERIFICATION_EMOJI[row.badgeType]||'';
}

async function build(user,lang,guildId){
  let p=await P.activeVip(user.id);
  p=await P.clearExpiredTitle(p);
  const r=await P.ranks(user.id),dev=await P.settings(),wallet=await ensureWallet(user.id),verification=await Verification.get(user.id),need=P.xpNeeded(p.level,dev.progression);
  const pct=need?Math.min(100,Math.floor(p.xp/need*100)):100,filled=Math.round(pct/10),bar='▰'.repeat(filled)+'▱'.repeat(10-filled);
  const vip=p.vipTier&&p.vipExpiresAt?`💎 **${p.vipTier}** • <t:${Math.floor(p.vipExpiresAt.getTime()/1000)}:R>`:mtx(lang,'No active VIP','Chưa có VIP');
  const custom=await require('../../services/customTitles').resolveActive(p);
  const title=custom?`${custom.title.emoji||'🏷️'} **${custom.title.name}**${custom.grant.expiresAt?` • <t:${Math.floor(new Date(custom.grant.expiresAt).getTime()/1000)}:R>`:''}`:p.activeTitle?`👑 **${p.activeTitle}**${p.activeTitleExpiresAt?` • <t:${Math.floor(p.activeTitleExpiresAt.getTime()/1000)}:R>`:''}`:mtx(lang,'No active title','Chưa có danh hiệu');
  const colors={'VIP':0x3498DB,'VIP+':0x9B59B6,'VVIP':0xE91E63,'SVIP':0xE67E22,'SSVIP':0x2ECC71,'SSSVIP':0xF1C40F};
  const verified=verificationEmoji(verification);
  const premium=Boolean(guildId&&await isPremiumGuild(guildId));
  const logo=premium?BRANDING.PREMIUM:BRANDING.FREE;
  const displayName=user.globalName||user.username;
  const profileTitle=`🎮 ${displayName}${verified?` ${verified}`:''}`;

  const embed=new EmbedBuilder()
    .setColor(colors[p.vipTier]||0xF59E0B)
    .setAuthor({name:mtx(lang,'CORGI GAMING PROFILE','HỒ SƠ GAMING CORGI'),iconURL:user.displayAvatarURL()})
    .setTitle(profileTitle)
    .setThumbnail(`attachment://${logo.name}`)
    .setDescription(`${title}\n${vip}`)
    .addFields(
      {name:mtx(lang,'⚔️ Level & EXP','⚔️ Cấp độ & EXP'),value:`**Lv.${p.level.toLocaleString()}** / ${dev.progression.maxLevel.toLocaleString()}\n${bar} **${pct}%**\n${p.xp.toLocaleString()} / ${need.toLocaleString()} EXP`,inline:false},
      {name:mtx(lang,'🌐 Global Rank','🌐 Hạng liên server'),value:`**#${r.globalRank.toLocaleString()}**\n${p.totalXp.toLocaleString()} ${mtx(lang,'Total EXP','Tổng EXP')}`,inline:true},
      {name:mtx(lang,'🏆 Weekly Race','🏆 Đua Top tuần'),value:`${r.weeklyRank?`**#${r.weeklyRank.toLocaleString()}**`:'—'}\n${r.weeklyXp.toLocaleString()} EXP`,inline:true},
      {name:mtx(lang,'💰 Wealth Rank','💰 Hạng Tài Phú'),value:`**#${r.wealthRank.toLocaleString()}**\n${wallet.cstar.toLocaleString()} 🪙 CXu`,inline:true},
      {name:mtx(lang,'🏅 Achievements','🏅 Thành tích'),value:mtx(lang,`Weekly rewards: **${p.weeklyWins}**\nBest weekly rank: **${p.bestWeeklyRank?`#${p.bestWeeklyRank}`:'—'}**`,`Số lần nhận thưởng Top: **${p.weeklyWins}**\nHạng tuần cao nhất: **${p.bestWeeklyRank?`#${p.bestWeeklyRank}`:'—'}**`),inline:true},
      {name:mtx(lang,'📨 Activity','📨 Hoạt động'),value:mtx(lang,`Qualified messages: **${p.totalMessages.toLocaleString()}**\nJoined: <t:${Math.floor(new Date(p.joinedAt).getTime()/1000)}:D>`,`Tin nhắn được tính: **${p.totalMessages.toLocaleString()}**\nTham gia: <t:${Math.floor(new Date(p.joinedAt).getTime()/1000)}:D>`),inline:true}
    )
    .setFooter({text:mtx(lang,`Weekly reset: Monday 00:00 UTC • ${r.week.key}`,`Reset tuần: Thứ Hai 00:00 UTC • ${r.week.key}`)})
    .setTimestamp();
  return {embed,logo};
}

module.exports={
  data:new SlashCommandBuilder().setName('profile').setDescription('View a professional global gaming profile').setDescriptionLocalizations({vi:'Xem hồ sơ gaming liên server'}).addUserOption(o=>o.setName('user').setDescription('Member to view').setDescriptionLocalizations({vi:'Thành viên muốn xem'})),
  prefix:['profile','pf'],
  async execute(i){
    const lang=await guildLang(i.guildId),u=i.options.getUser('user')||i.user;
    const {embed,logo}=await build(u,lang,i.guildId);
    return i.reply({embeds:[embed],files:[new AttachmentBuilder(logo.path,{name:logo.name})]});
  },
  async executePrefix(m){
    const lang=await guildLang(m.guildId),u=m.mentions.users.first()||m.author;
    const {embed,logo}=await build(u,lang,m.guildId);
    return m.reply({embeds:[embed],files:[new AttachmentBuilder(logo.path,{name:logo.name})]});
  }
};
