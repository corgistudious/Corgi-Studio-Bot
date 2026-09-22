const {SlashCommandBuilder,EmbedBuilder}=require('discord.js');
const UserEconomy=require('../../models/UserEconomy');
const {GLOBAL_WALLET_SCOPE}=require('../../services/economyWallet');
const {guildLang,mtx}=require('../../services/i18n');
async function build(lang){const rows=await UserEconomy.find({guildId:GLOBAL_WALLET_SCOPE}).sort({cstar:-1}).limit(10).lean();return new EmbedBuilder().setTitle(mtx(lang,'🌐 Global 🪙 CXu Leaderboard','🌐 Bảng xếp hạng 🪙 CXu liên server')).setDescription(rows.length?rows.map((x,n)=>`**${n+1}.** <@${x.userId}> — **${x.cstar.toLocaleString()} 🪙 CXu**`).join('\n'):mtx(lang,'No global economy data yet.','Chưa có dữ liệu ví liên server.')).setTimestamp();}
module.exports={data:new SlashCommandBuilder().setName('leaderboard').setDescription('View the global 🪙 CXu leaderboard').setDescriptionLocalizations({vi:'Xem bảng xếp hạng 🪙 CXu liên server'}),prefix:['leaderboard','lb'],async execute(i){const lang=await guildLang(i.guildId);return i.reply({embeds:[await build(lang)]});},async executePrefix(m){const lang=await guildLang(m.guildId);return m.reply({embeds:[await build(lang)]});}};
