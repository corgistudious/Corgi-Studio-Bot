const {SlashCommandBuilder,PermissionFlagsBits}=require('discord.js');
const {getGuildSettings}=require('../../services/guildSettings');
const {ensureStatsBoard}=require('../../modules/stats');
const {mtx}=require('../../services/i18n');

module.exports={
  data:new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Create or repair the server stats board')
    .setDescriptionLocalizations({vi:'Tạo hoặc sửa bảng thống kê server'})
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(i){
    await i.deferReply({flags:64});
    const s=await getGuildSettings(i.guildId),lang=s.language;
    const me=i.guild.members.me;
    if(!me?.permissions.has(PermissionFlagsBits.ManageChannels))return i.editReply(mtx(lang,'❌ I need **Manage Channels** permission to create the Stats Board.','❌ Bot cần quyền **Quản lý kênh** để tạo Stats Board.'));
    s.modules.stats=true;await s.save();
    const r=await ensureStatsBoard(i.guild,s);
    return i.editReply(mtx(lang,
      `✅ Stats Board is ready in **${r.category.name}**.\n🆓 Free: Members, Humans, Bots, Roles.\n💎 Premium: advanced Stats can be customized in **/setup → Server Stats**.\n⚡ Data is checked every 3 seconds and channel names change only when the value changes.`,
      `✅ Stats Board đã sẵn sàng tại **${r.category.name}**.\n🆓 Miễn phí: Thành viên, Người dùng, Bot, Vai trò.\n💎 Premium: có thể tùy chỉnh Stats nâng cao trong **/setup → Thống kê Server**.\n⚡ Dữ liệu được kiểm tra mỗi 3 giây và chỉ đổi tên kênh khi số liệu thay đổi.`
    ));
  }
};
