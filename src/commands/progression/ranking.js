const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const P = require('../../services/progression');
const { guildLang, mtx } = require('../../services/i18n');

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

async function build(client, kind, lang) {
  const rows = await P.leaderboard(kind, 100);
  const w = P.weekInfo();
  const top = rows.slice(0, 20);

  const names = await Promise.all(
    top.map(x => resolveGlobalName(client, x.userId))
  );

  const lines = top.map((x, i) => {
    const rank =
      i === 0 ? '🥇' :
      i === 1 ? '🥈' :
      i === 2 ? '🥉' :
      `**${i + 1}.**`;

    const xp = Number(
      kind === 'global' ? x.totalXp : x.xp
    ).toLocaleString();

    return `${rank} **${names[i]}** — **${xp} EXP**`;
  });

  const e = new EmbedBuilder()
    .setColor(0xF59E0B)
    .setTitle(
      kind === 'global'
        ? mtx(
            lang,
            '🌐 Global EXP Ranking • Cross-server',
            '🌐 Xếp hạng EXP Global • Liên server'
          )
        : mtx(
            lang,
            '🏆 Weekly Global EXP Race • Cross-server',
            '🏆 Đua Top EXP tuần Global • Liên server'
          )
    )
    .setDescription(
      lines.join('\n') ||
      mtx(
        lang,
        'No global ranking data yet.',
        'Chưa có dữ liệu xếp hạng Global.'
      )
    )
    .setFooter({
      text: mtx(
        lang,
        'Players are ranked globally regardless of server',
        'Người chơi được xếp hạng Global, không phụ thuộc server'
      )
    })
    .setTimestamp();

  if (kind === 'weekly') {
    e.addFields({
      name: mtx(lang, '⏳ Countdown', '⏳ Đếm ngược'),
      value:
        `<t:${Math.floor(w.end.getTime() / 1000)}:R>\n` +
        mtx(
          lang,
          'Resets every Monday 00:00 UTC. Rewards are sent only when Developer presses Approve Reward.',
          'Reset mỗi Thứ Hai 00:00 UTC. Phần thưởng chỉ được gửi khi Developer bấm Approve Reward.'
        )
    });
  }

  return e;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('View global cross-server EXP rankings')
    .setDescriptionLocalizations({
      vi: 'Xem bảng xếp hạng EXP Global liên server'
    })
    .addStringOption(o =>
      o
        .setName('type')
        .setDescription('Global ranking type')
        .setDescriptionLocalizations({
          vi: 'Loại bảng xếp hạng Global'
        })
        .addChoices(
          { name: 'Weekly Global', value: 'weekly' },
          { name: 'Global All-Time', value: 'global' }
        )
    ),

  prefix: ['ranking', 'rank'],

  async execute(i) {
    const lang = await guildLang(i.guildId);
    const kind = i.options.getString('type') || 'weekly';

    return i.reply({
      embeds: [await build(i.client, kind, lang)]
    });
  },

  async executePrefix(m, args) {
    const lang = await guildLang(m.guildId);
    const kind =
      (args[0] || 'weekly').toLowerCase() === 'global'
        ? 'global'
        : 'weekly';

    return m.reply({
      embeds: [await build(m.client, kind, lang)]
    });
  }
};
