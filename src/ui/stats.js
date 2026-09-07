const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,StringSelectMenuBuilder}=require('discord.js');
const {AMBER}=require('./theme');
const {getActivePremium}=require('../services/premium');
const {PREMIUM_STAT_KEYS,DEF_BY_KEY}=require('../modules/stats');

function L(s,en,vi){return s?.language==='vi'?vi:en;}

async function buildStatsPage(guild,s){
  const premium=Boolean(await getActivePremium(guild.id));
  const enabled=Array.isArray(s?.statsConfig?.premiumEnabled)?s.statsConfig.premiumEnabled:[];
  const e=new EmbedBuilder()
    .setColor(AMBER)
    .setTitle(L(s,'📊 Server Stats','📊 Thống kê Server'))
    .setDescription(L(s,
      'Free stats are always available. Active Premium unlocks advanced stats that can be toggled individually. Values are checked every **3 seconds** and channels are renamed only when the value changes.',
      'Stats miễn phí luôn khả dụng. Premium đang hoạt động sẽ mở Stats nâng cao để bật/tắt từng mục. Dữ liệu được kiểm tra mỗi **3 giây** và chỉ đổi tên kênh khi số liệu thay đổi.'
    ))
    .addFields(
      {name:L(s,'🆓 Free Stats','🆓 Stats Miễn phí'),value:L(s,'👥 Members\n👤 Humans\n🤖 Bots\n🎭 Roles','👥 Thành viên\n👤 Người dùng\n🤖 Bot\n🎭 Vai trò'),inline:true},
      {name:'💎 Premium',value:premium?L(s,'ACTIVE • Advanced customization unlocked','ĐANG HOẠT ĐỘNG • Đã mở tùy chỉnh nâng cao'):L(s,'FREE • Advanced stats locked','MIỄN PHÍ • Stats nâng cao đang khóa'),inline:true},
      {name:L(s,'⚙️ Premium Stats Enabled','⚙️ Premium Stats đang bật'),value:enabled.length?enabled.filter(k=>PREMIUM_STAT_KEYS.includes(k)).map(k=>{const d=DEF_BY_KEY.get(k);return d?`${d.emoji} ${L(s,d.en,d.vi)}`:k;}).join('\n'):L(s,'None','Chưa bật mục nào')}
    );

  const menu=new StringSelectMenuBuilder()
    .setCustomId('statscfg:toggle')
    .setPlaceholder(L(s,'Toggle a Premium stat','Bật/tắt một Premium Stat'))
    .setMinValues(1).setMaxValues(1).setDisabled(!premium)
    .addOptions(PREMIUM_STAT_KEYS.map(k=>{const d=DEF_BY_KEY.get(k);const on=enabled.includes(k);return {label:`${on?'ON':'OFF'} • ${L(s,d.en,d.vi)}`.slice(0,100),value:k,emoji:d.emoji,description:L(s,on?'Currently enabled — select to disable':'Currently disabled — select to enable',on?'Đang bật — chọn để tắt':'Đang tắt — chọn để bật')};}));

  const row1=new ActionRowBuilder().addComponents(menu);
  const row2=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('statscfg:ensure').setLabel(L(s,'Create / Repair Board','Tạo / Sửa Stats Board')).setEmoji('🛠️').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('statscfg:all').setLabel(L(s,'Enable All Premium','Bật tất cả Premium')).setEmoji('💎').setStyle(ButtonStyle.Primary).setDisabled(!premium),
    new ButtonBuilder().setCustomId('statscfg:none').setLabel(L(s,'Disable Premium Stats','Tắt Premium Stats')).setStyle(ButtonStyle.Secondary).setDisabled(!premium)
  );
  const row3=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('statscfg:refresh').setLabel(L(s,'Refresh','Làm mới')).setEmoji('🔄').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('statscfg:back').setLabel(L(s,'Back','Quay lại')).setEmoji('⬅️').setStyle(ButtonStyle.Secondary)
  );
  return {embeds:[e],components:[row1,row2,row3]};
}

module.exports={buildStatsPage};
