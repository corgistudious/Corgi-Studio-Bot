const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const categories = {
  all: {
    title: '🐶 Corgi-Bot • Command Center',
    body: [
      '**Getting started**',
      '• `/setup` — server configuration (Manage Server / Administrator)',
      '• `/help category:<name>` — detailed command help',
      '• Prefix default: `?`',
      '',
      '**Member / Economy**',
      '`/balance` • `/daily` • `/inventory` • `/leaderboard` • `/transfer` • `/game` • `/redeem` • `/premium` • `/ai`',
      '🐾 `Pet Game` — **Coming Soon**',
      '',
      '**Community / Admin**',
      '`/giveaway` • `/contest` • `/poll` • `/reactionrole` • `/ticket` • `/stats`',
      '',
      '**Moderation**',
      '`/warn` • `/kick` • `/mute` • `/unmute` • `/ban` • `/unban` • `/warnings` • `/moderation`',
      '',
      '**Developer**',
      '`/dev` — Developer Control Center (Developer IDs only)',
      '',
      'Use `/help category:moderation`, `economy`, `games`, `community`, `premium`, `ai`, `setup`, `pet`, or `developer` for syntax.'
    ].join('\n'),
  },
  setup: {
    title: '⚙️ Setup & Server Configuration',
    body: [
      '`/setup` — open interactive setup UI.',
      '`?setup` — points you to the interactive `/setup` UI.',
      '',
      '**Permission:** Manage Server or Administrator.',
      '**Pages:** Modules • Channels • Premium & Branding • Language.',
      '**Stats:** `/stats` creates/repairs the locked voice-channel stats board.',
      '**AI:** FREE; it can be enabled without Premium.',
      '**Premium Corgi Emoji:** requires active Premium and must be enabled in Premium & Branding.'
    ].join('\n'),
  },
  moderation: {
    title: '🛡️ Moderation Commands',
    body: [
      '`/warn user:@member reason:text` • `?warn @member [reason]`',
      '`/kick user:@member reason:text` • `?kick @member [reason]` • `?kich @member [reason]`',
      '`/mute user:@member minutes:10 reason:text` • `?mute @member 10 [reason]`',
      '`/unmute user:@member reason:text` • `?unmute @member [reason]`',
      '`/ban user:@member reason:text` • `?ban @member [reason]`',
      '`/unban user_id:ID reason:text` • `?unban USER_ID [reason]`',
      '`/warnings user:@member` • `?warnings @member`',
      '',
      '`/moderation` also contains the older full suite: warn, warnings, timeout, kick, ban, clear.',
      'Required Discord permissions depend on the action (Moderate Members / Kick Members / Ban Members / Manage Messages).'
    ].join('\n'),
  },
  economy: {
    title: '⭐ Cstar Economy',
    body: [
      '`/balance` • `?balance` / `?bal` — view Cstar.',
      '`/daily` • `?daily` — +250 Cstar every 24 hours.',
      '`/inventory` • `?inventory` / `?inv` — view inventory.',
      '`/leaderboard` • `?leaderboard` / `?lb` — top 10 Cstar.',
      '`/transfer user:@member amount:100` • `?transfer @member 100` / `?pay @member 100` — transfer Cstar.',
      '`/redeem key:CODE` • `?redeem CODE` — redeem Cstar/Premium CD Key.'
    ].join('\n'),
  },
  games: {
    title: '🎮 Economy Games',
    body: [
      '`/game taixiu pick:tai|xiu bet:amount`',
      '`/game lottery number:1-20 bet:amount`',
      '`/game spin bet:amount`',
      '`/game poker bet:amount`',
      '',
      'Prefix `?game` currently displays the slash-command choices.',
      'Cstar is virtual in-bot currency only; games have no real-money value.'
    ].join('\n'),
  },
  community: {
    title: '🎉 Community & Server Tools',
    body: [
      '`/giveaway create prize:text duration:30m winners:1` — create giveaway.',
      '`/giveaway end message_id:ID` — end giveaway.',
      '`/contest create title:text description:text minutes:60` — create contest.',
      '`/contest end id:DATABASE_ID` — end contest.',
      '`/poll question:text option1:text option2:text [option3] [option4]` — poll.',
      '`?poll question` — quick Yes/No poll.',
      '`/reactionrole add message_id:ID emoji:😀 role:@role` — bind role.',
      '`/reactionrole remove message_id:ID emoji:😀` — remove binding.',
      '`/ticket panel` — post ticket creation panel.',
      '`/stats` — create/repair locked voice stats board (checks values every 3 seconds).'
    ].join('\n'),
  },
  premium: {
    title: '💎 Premium & CD Key',
    body: [
      '`/premium status` — Premium status and expiry.',
      '`/premium benefits` — Premium benefits.',
      '`/premium history` — recent Premium activity.',
      '`?premium` — quick status.',
      '`/redeem key:CODE` • `?redeem CODE` — redeem a key.',
      '',
      '**Premium durations:** 7d • 14d • 21d • 30d • 1y • 2y • 5y • 10y. No lifetime.',
      '**Premium features in this build:** Corgi Studio application emojis, branding controls and Premium configuration.',
      '**AI is FREE and does not require Premium.**'
    ].join('\n'),
  },
  ai: {
    title: '🤖 Corgi AI • FREE',
    body: [
      '`/ai question:your question`',
      '`?ai your question`',
      '',
      'AI uses Groq and does **not** require Premium.',
      'Required environment values: `GROQ_API_KEY` and optional `GROQ_MODEL` (default `openai/gpt-oss-120b`).',
      'Blacklist and Maintenance still apply to AI.'
    ].join('\n'),
  },
  pet: {
    title: '🐾 Pet Game • Coming Soon',
    body: [
      'Pet Game is temporarily locked and will be added in a future update.',
      '`/pet` • `?pet` — displays the Coming Soon notice.',
      'No Pet gameplay, adoption, Cstar charge, or Pet data changes are active in this build.'
    ].join('\n'),
  },
  developer: {
    title: '🔐 Developer Control',
    body: [
      '`/dev` • `?dev` — Developer Control Center.',
      'Developer access is independent from `/setup` permission.',
      '',
      '**Control areas:** system status/maintenance • servers • Premium grant/revoke • CD Keys • Cstar adjustment • guild/user blacklist.',
      'Developer-only buttons/modals are guarded again when interacted with.'
    ].join('\n'),
  },
};

function embedFor(category = 'all') {
  const entry = categories[category] || categories.all;
  return new EmbedBuilder()
    .setTitle(entry.title)
    .setDescription(entry.body)
    .setFooter({ text: 'Corgi Studio • Default prefix: ?' })
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Corgi-Bot command guide')
    .addStringOption((o) =>
      o.setName('category')
        .setDescription('Help category')
        .addChoices(
          { name: 'All commands', value: 'all' },
          { name: 'Setup', value: 'setup' },
          { name: 'Moderation', value: 'moderation' },
          { name: 'Economy', value: 'economy' },
          { name: 'Games', value: 'games' },
          { name: 'Community', value: 'community' },
          { name: 'Premium', value: 'premium' },
          { name: 'AI', value: 'ai' },
          { name: 'Pet • Coming Soon', value: 'pet' },
          { name: 'Developer', value: 'developer' },
        ),
    ),
  prefix: ['help'],
  async execute(i) {
    const category = i.options.getString('category') || 'all';
    return i.reply({ embeds: [embedFor(category)], flags: 64 });
  },
  async executePrefix(m, args) {
    const category = String(args[0] || 'all').toLowerCase();
    return m.reply({ embeds: [embedFor(category)] });
  },
};
