const { SlashCommandBuilder, PermissionFlagsBits }=require('discord.js');
const {canSetup}=require('../../services/permissions');
const {getGuildSettings}=require('../../services/guildSettings');
const {buildSetupHome}=require('../../ui/setup');
module.exports={
 data:new SlashCommandBuilder().setName('setup').setDescription('Open Corgi-Bot Server Configuration').setDescriptionLocalizations({vi:'Mở trung tâm cấu hình Corgi-Bot'}).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
 prefix:['setup'],
 async execute(i){const s=await getGuildSettings(i.guildId);if(!canSetup(i.member))return i.reply({content:s.language==='vi'?'Bạn cần quyền Quản lý Server hoặc Administrator.':'You need Manage Server or Administrator.',flags:64});return i.reply({...await buildSetupHome(i.guild,s),flags:64});},
 async executePrefix(m){const s=await getGuildSettings(m.guildId);if(!canSetup(m.member))return m.reply(s.language==='vi'?'Bạn cần quyền Quản lý Server hoặc Administrator.':'You need Manage Server or Administrator.');return m.reply(s.language==='vi'?'🎮 **Trung tâm điều khiển Corgi-Bot**\nDùng `/setup` để mở giao diện cấu hình tương tác.':'🎮 **Corgi-Bot Control Center**\nUse `/setup` to open the interactive configuration UI.');}
};
