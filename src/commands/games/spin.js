const { SlashCommandBuilder } = require('discord.js');
const { runSpin } = require('../../modules/games/engine');
const { guildLang, pick } = require('../../services/i18n');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spin')
    .setDescription('Play Corgi Spin with 12 zodiac animals')
    .setDescriptionLocalizations({ vi: 'Chơi Spin 12 Con Giáp bằng 🌟Cstar' })
    .addIntegerOption(o => o
      .setName('bet')
      .setDescription('🌟Cstar bet')
      .setDescriptionLocalizations({ vi: 'Số 🌟Cstar muốn cược' })
      .setMinValue(10)
      .setMaxValue(1000000)
      .setRequired(true)),
  prefix: ['spin'],
  async execute(i) {
    const r = await runSpin({ guildId:i.guildId, userId:i.user.id, bet:i.options.getInteger('bet') });
    return i.reply(r.error ? { content:r.error, flags:64 } : { embeds:[r.embed], components:r.components });
  },
  async executePrefix(m,args) {
    const lang = await guildLang(m.guildId);
    const bet = Number(args[0]);
    if(!Number.isInteger(bet)) return m.reply(pick(lang,'Usage: `?spin <amount>`','Cách dùng: `?spin <số 🌟Cstar>`'));
    const r = await runSpin({ guildId:m.guildId, userId:m.author.id, bet });
    return m.reply(r.error ? r.error : { embeds:[r.embed], components:r.components });
  },
};
