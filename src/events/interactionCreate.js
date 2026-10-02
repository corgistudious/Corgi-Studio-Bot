const { Events } = require('discord.js');
const { guildLang, mtx } = require('../services/i18n');
const Social = require('../services/socialProfile');
const GameHub = require('../modules/gameHub');

module.exports = {
  name: Events.InteractionCreate,
  async execute(i, client) {
    try {
      if (i.customId?.startsWith('gh:')) {
        if (!i.deferred && !i.replied && i.isMessageComponent()) {
          await i.deferUpdate();
        }
        const lang = await guildLang(i.guildId);
        return GameHub.handle(i, lang);
      }

      if (i.customId?.startsWith('social:') && i.isButton()) {
        const [, action, targetId, viewerId] = i.customId.split(':');
        const lang = await guildLang(i.guildId);

        if (action === 'collection') {
          const profile = await Social.ensure(targetId);
          return i.reply({
            content: mtx(lang, `🎨 Collection: **${(profile.cosmetics || []).length}** cosmetic(s)`, `🎨 Bộ sưu tập: **${(profile.cosmetics || []).length}** vật phẩm`),
            flags: 64
          });
        }

        if (!targetId || !viewerId) {
          return i.reply({ content: mtx(lang, '❌ Invalid social action target.', '❌ Mục tiêu hành động xã hội không hợp lệ.'), flags: 64 });
        }

        try {
          let result;
          if (action === 'like') result = await Social.toggleLike(i.user.id, targetId);
          else if (action === 'follow') result = await Social.toggleFollow(i.user.id, targetId);
          else if (action === 'star') result = await Social.toggleStar(i.user.id, targetId);
          else return;

          if (action === 'like') {
            return i.reply({
              content: result.liked ? mtx(lang, '❤️ Profile liked.', '❤️ Đã thích hồ sơ.') : mtx(lang, '💔 Like removed.', '💔 Đã bỏ thích.'),
              flags: 64
            });
          }

          if (action === 'follow') {
            return i.reply({
              content: result.following ? mtx(lang, '➕ Now following this profile.', '➕ Đã theo dõi hồ sơ.') : mtx(lang, '➖ Unfollowed.', '➖ Đã bỏ theo dõi.'),
              flags: 64
            });
          }

          return i.reply({
            content: result.starred ? mtx(lang, '⭐ Profile starred.', '⭐ Đã gắn sao cho hồ sơ.') : mtx(lang, '⭐ Star removed.', '⭐ Đã bỏ sao.'),
            flags: 64
          });
        } catch (err) {
          return i.reply({
            content: mtx(lang, '❌ You cannot use this action on your own profile.', '❌ Bạn không thể dùng thao tác này với hồ sơ của chính mình.'),
            flags: 64
          });
        }
      }

      return;
    } catch (error) {
      console.error(error);
      if (i.isRepliable()) {
        try {
          const lang = await guildLang(i.guildId);
          await i.reply({ content: mtx(lang, 'An unexpected error occurred.', 'Đã xảy ra lỗi không mong muốn.'), flags: 64 }).catch(() => {});
        } catch (_) {}
      }
    }
  }
};
