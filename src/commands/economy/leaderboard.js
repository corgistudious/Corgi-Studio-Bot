const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserEconomy = require('../../models/UserEconomy');
const { GLOBAL_WALLET_SCOPE } = require('../../services/economyWallet');
const { guildLang, mtx } = require('../../services/i18n');
const { compactNumber } = require('../../services/numberFormat');

const CXU = '<:cxu_coin:1551759873241251912>';

async function resolveGlobalName(client, userId) {
  try {
    const user =
      client.users.cache.get(userId) ||
      await client.users.fetch(userId);

    return user.globalName || user.username || userId;
  } catch {
    return userId;
  }
}

async function build(client, lang) {
  const rows = await UserEconomy.find({
    guildId: GLOBAL_WALLET_SCOPE
  })
    .sort({ cstar: -1 })
    .limit(10)
    .lean();

  const names = await Promise.all(
    rows.map(x => resolveGlobalName(client, x.userId))
  );

  const medals = ['🥇', '🥈', '🥉'];

  const lines = rows.map((x, n) => {
    const rank = medals[n] || `**${n + 1}.**`;
    const name = names[n];

    return `${rank} **${name}** — **${compactNumber(x.cstar)} ${CXU} CXu**`;
  });

  return new EmbedBuilder()
    .setTitle(
      mtx(
        lang,
        `🌐 Global CXu Leaderboard • Cross-server`,
        `🌐 Bảng xếp hạng CXu Global • Liên server`
      )
    )
    .setDescription(
      lines.length
        ? lines.join('\n')
        : mtx(
            lang,
            'No global economy data yet.',
            'Chưa có dữ liệu ví CXu Global.'
          )
    )
    .setFooter({
      text: mtx(
        lang,
        'Global ranking across every server using Corgi-Bot',
        'Xếp hạng Global trên toàn bộ server sử dụng Corgi-Bot'
      )
    })
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the global cross-server CXu leaderboard')
    .setDescriptionLocalizations({
      vi: 'Xem bảng xếp hạng CXu Global liên server'
    }),

  prefix: ['leaderboard', 'lb'],

  async execute(i) {
    const lang = await guildLang(i.guildId);
    return i.reply({
      embeds: [await build(i.client, lang)]
    });
  },

  async executePrefix(m) {
    const lang = await guildLang(m.guildId);
    return m.reply({
      embeds: [await build(m.client, lang)]
    });
  }
};
