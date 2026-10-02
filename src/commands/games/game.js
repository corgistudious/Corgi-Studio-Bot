const { SlashCommandBuilder } = require('discord.js');
const { guildLang, mtx } = require('../../services/i18n');
const GameHub = require('../../modules/gameHub');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('game')
    .setDescription('Open the Corgi Game Hub')
    .setDescriptionLocalizations({
      vi: 'Mở trung tâm trò chơi Corgi',
      'pt-BR': 'Abrir o painel central de jogos da Corgi',
      'pt-PT': 'Abrir o painel central de jogos da Corgi',
      es: 'Abrir el centro de juegos de Corgi',
      fr: 'Ouvrir le hub de jeux Corgi',
      de: 'Corgi-Spielehub öffnen',
      ja: 'Corgiゲームハブを開く',
      ko: 'Corgi 게임 허브 열기',
      id: 'Buka hub game Corgi',
      'zh-TW': '開啟 Corgi 遊戲中心',
      'zh-CN': '打开 Corgi 游戏中心'
    }),
  prefix: ['game', 'games'],
  async execute(i) {
    const lang = await guildLang(i.guildId);
    const payload = GameHub.home(i.user.id, lang);
    if (i.deferred || i.replied) {
      return i.editReply(payload);
    }
    return i.reply({ ...payload, flags: 64 });
  }
};
