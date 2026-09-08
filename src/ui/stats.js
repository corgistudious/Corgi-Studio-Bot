const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,StringSelectMenuBuilder}=require('discord.js');
const {AMBER}=require('./theme');
const {getActivePremium}=require('../services/premium');
const {FREE_STAT_KEYS,PREMIUM_STAT_KEYS,DEF_BY_KEY,freeConfiguredKeys,premiumConfiguredKeys}=require('../modules/stats');
const {premiumPanelVisual}=require('../services/premiumVisual');

function L(s,en,vi){return s?.language==='vi'?vi:en;}
function list(keys,s){return keys.length?keys.map(k=>{const d=DEF_BY_KEY.get(k);return d?`${d.emoji} ${L(s,d.en,d.vi)}`:k;}).join('\n'):L(s,'None','Không có');}

async function buildStatsPage(guild,s){
  const premium=Boolean(await getActivePremium(guild.id));
  const freeEnabled=freeConfiguredKeys(s);
  const premiumEnabled=premiumConfiguredKeys(s);

  const e=new EmbedBuilder()
    .setColor(AMBER)
    .setTitle(L(s,'📊 Server Stats','📊 Thống kê Server'))
    .setDescription(L(s,
      'Choose exactly which Stats channels your server needs. Free Stats can be toggled individually on every server. Active Premium unlocks the advanced Stats list. Values are checked every **3 seconds** and channels are renamed only when the value changes.',
      'Chọn chính xác những kênh Stats server cần dùng. Tất cả Stats miễn phí đều có thể bật/tắt từng mục. Premium đang hoạt động mở thêm danh sách Stats nâng cao. Dữ liệu được kiểm tra mỗi **3 giây** và chỉ đổi tên kênh khi số liệu thay đổi.'
    ))
    .addFields(
      {name:L(s,'🆓 Free Stats Enabled','🆓 Stats Miễn phí đang bật'),value:list(freeEnabled,s),inline:true},
      {name:'💎 Premium',value:premium?L(s,'ACTIVE • Advanced Stats unlocked','ĐANG HOẠT ĐỘNG • Đã mở Stats nâng cao'):L(s,'FREE • Advanced Stats locked','MIỄN PHÍ • Stats nâng cao đang khóa'),inline:true},
      {name:L(s,'💎 Premium Stats Enabled','💎 Premium Stats đang bật'),value:list(premiumEnabled,s),inline:true}
    );

  const freeMenu=new StringSelectMenuBuilder()
    .setCustomId('statscfg:freeToggle')
    .setPlaceholder(L(s,'Toggle a Free stat','Bật/tắt một Stats miễn phí'))
    .setMinValues(1).setMaxValues(1)
    .addOptions(FREE_STAT_KEYS.map(k=>{const d=DEF_BY_KEY.get(k),on=freeEnabled.includes(k);return {label:`${on?'ON':'OFF'} • ${L(s,d.en,d.vi)}`.slice(0,100),value:k,emoji:d.emoji,description:L(s,on?'Currently enabled — select to disable':'Currently disabled — select to enable',on?'Đang bật — chọn để tắt':'Đang tắt — chọn để bật')};}));

  const premiumMenu=new StringSelectMenuBuilder()
    .setCustomId('statscfg:premiumToggle')
    .setPlaceholder(L(s,'Toggle a Premium stat','Bật/tắt một Premium Stat'))
    .setMinValues(1).setMaxValues(1).setDisabled(!premium)
    .addOptions(PREMIUM_STAT_KEYS.map(k=>{const d=DEF_BY_KEY.get(k),on=premiumEnabled.includes(k);return {label:`${on?'ON':'OFF'} • ${L(s,d.en,d.vi)}`.slice(0,100),value:k,emoji:d.emoji,description:L(s,on?'Currently enabled — select to disable':'Currently disabled — select to enable',on?'Đang bật — chọn để tắt':'Đang tắt — chọn để bật')};}));

  const row3=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('statscfg:ensure').setLabel(L(s,'Create / Repair Board','Tạo / Sửa Stats Board')).setEmoji('🛠️').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('statscfg:freeAll').setLabel(L(s,'Enable All Free','Bật tất cả Free')).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('statscfg:freeNone').setLabel(L(s,'Disable All Free','Tắt tất cả Free')).setStyle(ButtonStyle.Secondary)
  );
  const row4=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('statscfg:premiumAll').setLabel(L(s,'Enable All Premium','Bật tất cả Premium')).setEmoji('💎').setStyle(ButtonStyle.Primary).setDisabled(!premium),
    new ButtonBuilder().setCustomId('statscfg:premiumNone').setLabel(L(s,'Disable Premium Stats','Tắt Premium Stats')).setStyle(ButtonStyle.Secondary).setDisabled(!premium)
  );
  const row5=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('statscfg:refresh').setLabel(L(s,'Refresh','Làm mới')).setEmoji('🔄').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('statscfg:back').setLabel(L(s,'Back','Quay lại')).setEmoji('⬅️').setStyle(ButtonStyle.Secondary)
  );
  const v=await premiumPanelVisual(guild.id,e);
  return {embeds:[v.embed],components:[new ActionRowBuilder().addComponents(freeMenu),new ActionRowBuilder().addComponents(premiumMenu),row3,row4,row5],files:v.files};
}

module.exports={buildStatsPage};
