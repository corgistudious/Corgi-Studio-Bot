const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { mtx } = require('./i18n');

function panel(uid, lang) {
  const e = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🎮 Corgi Game Hub')
    .setDescription(mtx(lang,
      'Choose your game. Every mode is available by slash, prefix, and button panel.',
      'Chọn trò chơi của bạn. Mọi chế độ đều có sẵn qua slash, prefix và panel nút.'
    ))
    .addFields(
      { name: '💎 Treasure Rush', value: 'Fast action • combo loop • instant reward', inline: true },
      { name: '📜 Daily Quest', value: 'Daily tasks • XP • rewards • retention', inline: true },
      { name: '🎁 Lootbox', value: 'Mystery drops • rarity • cosmetics', inline: true },
      { name: '🏆 Achievements', value: 'Milestones • titles • profile rewards', inline: true },
      { name: '📊 Leaderboard', value: 'Top player rankings • weekly competition', inline: true }
    );

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`gh:treasure:${uid}`).setLabel('Treasure Rush').setEmoji('💎').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`gh:quest:${uid}`).setLabel('Daily Quest').setEmoji('📜').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`gh:lootbox:${uid}`).setLabel('Lootbox').setEmoji('🎁').setStyle(ButtonStyle.Secondary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`gh:achievement:${uid}`).setLabel('Achievements').setEmoji('🏆').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`gh:leaderboard:${uid}`).setLabel('Leaderboard').setEmoji('📊').setStyle(ButtonStyle.Primary)
  );

  return { embeds: [e], components: [row1, row2] };
}

async function treasure(uid, lang) {
  return {
    embeds: [new EmbedBuilder()
      .setColor(0xFFD166)
      .setTitle('💎 Treasure Rush')
      .setDescription(mtx(lang,
        'A fast and polished treasure session with rhythm, streaks, and instant rewards.',
        'Một phiên săn kho báu nhanh chóng, mượt mà, có combo và phần thưởng tức thì.'
      ))
      .addFields(
        { name: '⚡ Play style', value: 'Short rounds • fast feedback • reward loop', inline: true },
        { name: '🎯 Reward', value: 'CXu • XP • lootbox tickets • cosmetics shards', inline: true },
        { name: '📱 Access', value: 'Slash / Prefix / Button panel', inline: true }
      )],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`gh:home:${uid}`).setLabel('Back to Hub').setEmoji('🏠').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`gh:quest:${uid}`).setLabel('Daily Quest').setEmoji('📜').setStyle(ButtonStyle.Primary)
      )
    ]
  };
}

async function quest(uid, lang) {
  return {
    embeds: [new EmbedBuilder()
      .setColor(0x4ADE80)
      .setTitle('📜 Daily Quest')
      .setDescription(mtx(lang,
        'Complete daily tasks to stay active, earn XP, and unlock premium-style rewards.',
        'Hoàn thành nhiệm vụ hằng ngày để duy trì hoạt động, nhận XP và mở khóa phần thưởng chất lượng.'
      ))
      .addFields(
        { name: '✅ Task types', value: 'Hunt • fish • profile • event • collection', inline: true },
        { name: '🎁 Rewards', value: 'XP • CXu • lootbox • badges', inline: true },
        { name: '⏱️ Retention', value: 'Daily loop to keep players returning', inline: true }
      )],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`gh:home:${uid}`).setLabel('Back to Hub').setEmoji('🏠').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`gh:lootbox:${uid}`).setLabel('Lootbox').setEmoji('🎁').setStyle(ButtonStyle.Success)
      )
    ]
  };
}

async function lootbox(uid, lang) {
  return {
    embeds: [new EmbedBuilder()
      .setColor(0xA78BFA)
      .setTitle('🎁 Lootbox')
      .setDescription(mtx(lang,
        'Open mystery chests to get cosmetics, pet upgrades, and rare drops.',
        'Mở rương bí ẩn để nhận vật phẩm trang trí, nâng cấp pet và vật phẩm hiếm.'
      ))
      .addFields(
        { name: '🧩 Rarity', value: 'Common • Rare • Epic • Mythic', inline: true },
        { name: '🎟️ Source', value: 'Quest rewards • event rewards • purchase', inline: true },
        { name: '❤️ Value', value: 'Maximizes collection and retention', inline: true }
      )],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`gh:home:${uid}`).setLabel('Back to Hub').setEmoji('🏠').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`gh:achievement:${uid}`).setLabel('Achievements').setEmoji('🏆').setStyle(ButtonStyle.Primary)
      )
    ]
  };
}

async function achievement(uid, lang) {
  return {
    embeds: [new EmbedBuilder()
      .setColor(0xF59E0B)
      .setTitle('🏆 Achievements')
      .setDescription(mtx(lang,
        'Track major milestones and unlock profile visibility, cosmetic rewards, and bragging rights.',
        'Theo dõi cột mốc lớn và mở khóa phần thưởng hồ sơ, đồ trang trí và danh dự.'
      ))
      .addFields(
        { name: '🌟 Examples', value: 'First Hunt • Collector • Quest Runner • Top Weekly', inline: true },
        { name: '🎖️ Reward', value: 'Title • badge • profile highlight', inline: true },
        { name: '📈 Retention', value: 'Encourages long-term daily play', inline: true }
      )],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`gh:home:${uid}`).setLabel('Back to Hub').setEmoji('🏠').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`gh:leaderboard:${uid}`).setLabel('Leaderboard').setEmoji('📊').setStyle(ButtonStyle.Success)
      )
    ]
  };
}

async function leaderboard(uid, lang) {
  return {
    embeds: [new EmbedBuilder()
      .setColor(0x38BDF8)
      .setTitle('📊 Leaderboard')
      .setDescription(mtx(lang,
        'Compete weekly with a clean ranking board based on XP, rewards, and completion.',
        'Thi đấu theo tuần trên bảng xếp hạng rõ ràng dựa trên XP, phần thưởng và tiến độ.'
      ))
      .addFields(
        { name: '🏅 Rank model', value: 'Top overall • weekly highlights • competition', inline: true },
        { name: '🎯 Goals', value: 'Progress • reward chase • replay loop', inline: true },
        { name: '💬 Persistence', value: 'Creates long-term engagement and social proof', inline: true }
      )],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`gh:home:${uid}`).setLabel('Back to Hub').setEmoji('🏠').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`gh:treasure:${uid}`).setLabel('Treasure Rush').setEmoji('💎').setStyle(ButtonStyle.Primary)
      )
    ]
  };
}

module.exports = { home: panel, treasure, quest, lootbox, achievement, leaderboard };
