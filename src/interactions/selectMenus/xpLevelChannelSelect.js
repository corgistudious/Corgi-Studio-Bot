const {
  MessageFlags,
  PermissionsBitField,
  ChannelType
} = require("discord.js");

const {
  updateGuildSettings
} = require("../../services/guildSettingsService");

const {
  canManageLevelSettings
} = require("../../utils/setupPermissions");

module.exports = {
  customId: "xp_level_channel_select",

  async execute(interaction) {
    try {
      // =====================================
      // PERMISSION
      // =====================================
      if (
        !canManageLevelSettings(
          interaction
        )
      ) {
        await interaction.reply({
          content:
            "🔒 Bạn không có quyền cấu hình **Kênh Level Up**.",
          flags:
            MessageFlags.Ephemeral
        });

        return;
      }

      // =====================================
      // CHANNEL ID
      // =====================================
      const channelId =
        interaction.values[0];

      if (!channelId) {
        await interaction.update({
          content:
            "❌ Không lấy được kênh đã chọn.",
          components: []
        });

        return;
      }

      // =====================================
      // FETCH CHANNEL
      // =====================================
      let channel =
        interaction.guild.channels.cache.get(
          channelId
        );

      if (!channel) {
        try {
          channel =
            await interaction.guild.channels.fetch(
              channelId
            );
        } catch {
          channel = null;
        }
      }

      // =====================================
      // CHANNEL KHÔNG TỒN TẠI
      // =====================================
      if (!channel) {
        await interaction.update({
          content:
            "❌ Không tìm thấy kênh này trong server.",
          components: []
        });

        return;
      }

      // =====================================
      // CHỈ CHO TEXT CHANNEL
      // =====================================
      if (
        channel.type !==
        ChannelType.GuildText
      ) {
        await interaction.update({
          content:
            "❌ Kênh Level Up phải là **Text Channel**.",
          components: []
        });

        return;
      }

      // =====================================
      // BOT MEMBER
      // =====================================
      let botMember =
        interaction.guild.members.me;

      if (!botMember) {
        try {
          botMember =
            await interaction.guild.members.fetchMe();
        } catch {
          botMember = null;
        }
      }

      if (!botMember) {
        await interaction.update({
          content:
            "❌ Không thể kiểm tra quyền của Corgi-Bot.",
          components: []
        });

        return;
      }

      // =====================================
      // CHANNEL PERMISSIONS
      // =====================================
      const permissions =
        channel.permissionsFor(
          botMember
        );

      if (!permissions) {
        await interaction.update({
          content:
            "❌ Không thể kiểm tra quyền của bot trong kênh này.",
          components: []
        });

        return;
      }

      // =====================================
      // VIEW CHANNEL
      // =====================================
      if (
        !permissions.has(
          PermissionsBitField.Flags.ViewChannel
        )
      ) {
        await interaction.update({
          content:
            `❌ Corgi-Bot không thể xem ${channel}.\n\n` +
            "Hãy cấp quyền **View Channel** cho bot.",
          components: []
        });

        return;
      }

      // =====================================
      // SEND MESSAGES
      // =====================================
      if (
        !permissions.has(
          PermissionsBitField.Flags.SendMessages
        )
      ) {
        await interaction.update({
          content:
            `❌ Corgi-Bot không thể gửi tin nhắn vào ${channel}.\n\n` +
            "Hãy cấp quyền **Send Messages** cho bot.",
          components: []
        });

        return;
      }

      // =====================================
      // EMBED LINKS
      // Level Up đang sử dụng Embed
      // =====================================
      if (
        !permissions.has(
          PermissionsBitField.Flags.EmbedLinks
        )
      ) {
        await interaction.update({
          content:
            `❌ Corgi-Bot thiếu quyền **Embed Links** trong ${channel}.\n\n` +
            "Level Up Card của bạn sử dụng Discord Embed.",
          components: []
        });

        return;
      }

      // =====================================
      // ATTACH FILES
      // Level Card là PNG attachment
      // =====================================
      if (
        !permissions.has(
          PermissionsBitField.Flags.AttachFiles
        )
      ) {
        await interaction.update({
          content:
            `❌ Corgi-Bot thiếu quyền **Attach Files** trong ${channel}.\n\n` +
            "Quyền này cần thiết để gửi ảnh Level Card.",
          components: []
        });

        return;
      }

      // =====================================
      // SAVE MONGODB
      // =====================================
      await updateGuildSettings(
        interaction.guildId,
        {
          $set: {
            "leveling.levelUpChannelId":
              channel.id
          }
        }
      );

      // =====================================
      // SUCCESS
      // =====================================
      await interaction.update({
        content:
          "✅ **Đã cập nhật Kênh Level Up!**\n\n" +
          `📢 Kênh: ${channel}\n` +
          "🎨 Level Card sẽ được gửi vào kênh này khi thành viên lên cấp.",
        components: []
      });

      console.log(
        `📢 ${interaction.user.tag} đặt ` +
        `Level Up Channel → #${channel.name} ` +
        `tại ${interaction.guild.name}`
      );
    } catch (error) {
      console.error(
        "❌ XP Level Channel Select Error:",
        error
      );

      try {
        if (
          interaction.replied ||
          interaction.deferred
        ) {
          await interaction.followUp({
            content:
              "❌ Không thể lưu Kênh Level Up.",
            flags:
              MessageFlags.Ephemeral
          });
        } else {
          await interaction.reply({
            content:
              "❌ Không thể lưu Kênh Level Up.",
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
};