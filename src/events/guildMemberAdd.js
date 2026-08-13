const {
  Events,
  PermissionFlagsBits
} = require("discord.js");

const {
  getGuildSettings
} = require("../services/guildSettingsService");

module.exports = {
  name: Events.GuildMemberAdd,

  async execute(member) {
    try {
      // Không xử lý tài khoản bot
      if (member.user.bot) {
        return;
      }

      console.log(
        `👤 Thành viên mới: ${member.user.tag} → ${member.guild.name}`
      );

      // ==============================
      // LẤY CẤU HÌNH SERVER
      // ==============================
      const settings = await getGuildSettings(
        member.guild.id
      );

      // ==============================
      // 1. AUTO ROLE
      // ==============================
      try {
        if (
          settings.autoRole?.enabled &&
          settings.autoRole?.roleId
        ) {
          const role = member.guild.roles.cache.get(
            settings.autoRole.roleId
          );

          if (!role) {
            console.warn(
              `⚠️ Auto Role không tồn tại tại ${member.guild.name}.`
            );
          } else if (role.managed) {
            console.warn(
              `⚠️ Không thể cấp Role ${role.name}: Role được Discord/bot quản lý.`
            );
          } else {
            const botMember =
              member.guild.members.me;

            if (!botMember) {
              console.warn(
                "⚠️ Không tìm thấy Corgi-Bot trong guild."
              );
            } else if (
              !botMember.permissions.has(
                PermissionFlagsBits.ManageRoles
              )
            ) {
              console.warn(
                `⚠️ Corgi-Bot thiếu quyền Manage Roles tại ${member.guild.name}.`
              );
            } else if (
              role.position >=
              botMember.roles.highest.position
            ) {
              console.warn(
                `⚠️ Không thể cấp @${role.name}: Role của Corgi-Bot phải nằm cao hơn.`
              );
            } else {
              await member.roles.add(
                role,
                "Corgi Studio Auto Role"
              );

              console.log(
                `🎭 Đã cấp @${role.name} cho ${member.user.tag}`
              );
            }
          }
        }
      } catch (autoRoleError) {
        console.error(
          `❌ Auto Role Error (${member.user.tag}):`,
          autoRoleError
        );
      }

      // ==============================
      // 2. WELCOME SYSTEM
      // ==============================
      try {
        if (
          settings.welcome?.enabled &&
          settings.welcome?.channelId
        ) {
          const channel =
            member.guild.channels.cache.get(
              settings.welcome.channelId
            );

          if (!channel) {
            console.warn(
              `⚠️ Không tìm thấy Welcome Channel tại ${member.guild.name}.`
            );
            return;
          }

          if (!channel.isTextBased()) {
            console.warn(
              "⚠️ Welcome Channel không phải Text Channel."
            );
            return;
          }

          const template =
            settings.welcome.message ||
            "🎉 Chào mừng {user} đến với **{server}**!";

          const welcomeMessage = template
            .replaceAll(
              "{user}",
              `<@${member.user.id}>`
            )
            .replaceAll(
              "{username}",
              member.user.username
            )
            .replaceAll(
              "{server}",
              member.guild.name
            )
            .replaceAll(
              "{memberCount}",
              String(member.guild.memberCount)
            );

          await channel.send({
            content: welcomeMessage,

            allowedMentions: {
              users: [member.user.id]
            }
          });

          console.log(
            `👋 Đã Welcome ${member.user.tag} tại #${channel.name}`
          );
        }
      } catch (welcomeError) {
        console.error(
          `❌ Welcome Error (${member.user.tag}):`,
          welcomeError
        );
      }
    } catch (error) {
      console.error(
        "❌ GuildMemberAdd Error:",
        error
      );
    }
  }
};