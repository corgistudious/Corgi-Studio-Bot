const { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Card = require('../../services/profileCard');
const Social = require('../../services/socialProfile');
const Verification = require('../../services/profileVerification');
const { guildLang, mtx } = require('../../services/i18n');

function rows(user, viewer, lang) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`social:like:${user.id}:${viewer.id}`).setLabel(mtx(lang, '❤️ Like', '❤️ Thích')).setEmoji('❤️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`social:follow:${user.id}:${viewer.id}`).setLabel(mtx(lang, '➕ Follow', '➕ Theo dõi')).setEmoji('➕').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`social:star:${user.id}:${viewer.id}`).setLabel(mtx(lang, '⭐ Star', '⭐ Star')).setEmoji('⭐').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`social:collection:${user.id}`).setLabel(mtx(lang, '🎨 Collection', '🎨 Bộ sưu tập')).setEmoji('🎨').setStyle(ButtonStyle.Secondary)
  );
}

async function payload(user, lang, viewerId = user.id) {
  const [social, verification, card] = await Promise.all([
    Social.ensure(user.id),
    Verification.get(user.id),
    Card.render(user, lang)
  ]);

  const starCount = (social.stars || []).length;
  const likeCount = (social.likes || []).length;
  const followerCount = (social.followers || []).length;

  const badges = Verification.approvedBadges(verification) || [];
  const badgeText = badges.length ? ` ${badges.map(b => b === 'BLUE' ? '🔵' : '🟣').join(' ')}` : '';

  const embed = {
    description: mtx(lang,
      `**${user.globalName || user.username}**${badgeText}\n❤️ Likes: **${likeCount}**\n👥 Followers: **${followerCount}**\n⭐ Stars: **${starCount}**`,
      `**${user.globalName || user.username}**${badgeText}\n❤️ Lượt thích: **${likeCount}**\n👥 Người theo dõi: **${followerCount}**\n⭐ Star: **${starCount}**`
    ),
    files: [new AttachmentBuilder(card, { name: 'profile-card.png' })]
  };

  return {
    embeds: [embed],
    components: [rows(user, { id: viewerId }, lang)],
    files: [new AttachmentBuilder(card, { name: 'profile-card.png' })]
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View a global Corgi profile')
    .setDescriptionLocalizations({
      vi: 'Xem hồ sơ Corgi toàn cầu',
      'pt-BR': 'Ver o perfil global da Corgi',
      'pt-PT': 'Ver o perfil global da Corgi',
      es: 'Ver tu perfil global de Corgi',
      fr: 'Voir le profil global Corgi',
      de: 'Globales Corgi-Profil anzeigen',
      ja: 'Corgiのグローバルプロフィールを表示',
      ko: 'Corgi 글로벌 프로필 보기',
      id: 'Lihat profil global Corgi',
      'zh-TW': '查看 Corgi 全域個人檔案',
      'zh-CN': '查看 Corgi 全局个人资料'
    })
    .addUserOption((option) => option.setName('user').setDescription('Profile owner').setDescriptionLocalizations({ vi: 'Chủ sở hữu hồ sơ' })),
  prefix: ['profile'],
  async execute(i) {
    const target = i.options?.getUser?.('user') || i.user;
    const lang = await guildLang(i.guildId);
    return i.reply(await payload(target, lang, i.user.id));
  }
};
