const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");

const Ticket = require("../../models/Ticket");

const {
  getGuildSettings
} = require("../../services/guildSettingsService");

module.exports = {
  customId: "ticket_open",

  async execute(interaction) {
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral
    });

    try {
      const settings = await getGuildSettings(
        interaction.guildId
      );

      // ==============================
      // TICKET SYSTEM
      // ==============================
      if (!settings.ticket?.enabled) {
        await interaction.editReply({
          content:
            "❌ Ticket System hiện đang tắt."
        });

        return;
      }

      // ==============================
      // KIỂM TRA CẤU HÌNH
      // ==============================
      const categoryId =
        settings.ticket?.categoryId;

      const staffRoleId =
        settings.ticket?.staffRoleId;

      if (!categoryId) {
        await interaction.editReply({
          content:
            "❌ Ticket chưa được thiết lập Category."
        });

        return;
      }

      if (!staffRoleId) {
        await interaction.editReply({
          content:
            "❌ Ticket chưa được thiết lập Staff Role."
        });

        return;
      }

      const category =
        interaction.guild.channels.cache.get(
          categoryId
        );

      const staffRole =
        interaction.guild.roles.cache.get(
          staffRoleId
        );

      if (
        !category ||
        category.type !== ChannelType.GuildCategory
      ) {
        await interaction.editReply({
          content:
            "❌ Category Ticket không còn tồn tại."
        });

        return;
      }

      if (!staffRole) {
        await interaction.editReply({
          content:
            "❌ Staff Role không còn tồn tại."
        });

        return;
      }

      // ==============================
      // KIỂM TRA TICKET CŨ
      // ==============================
      const existingTicket =
        await Ticket.findOne({
          guildId: interaction.guildId,
          userId: interaction.user.id,
          status: "open"
        });

      if (existingTicket) {
        const existingChannel =
          interaction.guild.channels.cache.get(
            existingTicket.channelId
          );

        if (existingChannel) {
          await interaction.editReply({
            content:
              `❌ Bạn đã có một Ticket đang mở: ${existingChannel}`
          });

          return;
        }

        // Database còn record nhưng channel đã bị xóa.
        existingTicket.status = "closed";
        existingTicket.closedAt = new Date();

        await existingTicket.save();
      }

      // ==============================
      // KIỂM TRA QUYỀN BOT
      // ==============================
      const botMember =
        interaction.guild.members.me;

      if (
        !botMember.permissions.has(
          PermissionFlagsBits.ManageChannels
        )
      ) {
        await interaction.editReply({
          content:
            "❌ Corgi-Bot thiếu quyền **Manage Channels**."
        });

        return;
      }

      // ==============================
      // TÊN CHANNEL
      // ==============================
      const safeUsername =
        interaction.user.username
          .toLowerCase()
          .replace(/[^a-z0-9-_]/g, "")
          .slice(0, 20) || "member";

      // ==============================
      // TẠO CHANNEL
      // ==============================
      const ticketChannel =
        await interaction.guild.channels.create({
          name: `ticket-${safeUsername}`,

          type: ChannelType.GuildText,

          parent: category.id,

          topic:
            `Ticket của ${interaction.user.tag} | User ID: ${interaction.user.id}`,

          permissionOverwrites: [
            {
              id: interaction.guild.id,

              deny: [
                PermissionFlagsBits.ViewChannel
              ]
            },

            {
              id: interaction.user.id,

              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks
              ]
            },

            {
              id: staffRole.id,

              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks
              ]
            },

            {
              id: botMember.id,

              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.ManageMessages
              ]
            }
          ]
        });

      // ==============================
      // LƯU MONGODB
      // ==============================
      try {
        await Ticket.create({
          guildId: interaction.guildId,
          userId: interaction.user.id,
          channelId: ticketChannel.id,
          status: "open"
        });
      } catch (databaseError) {
        // Không để channel rác nếu DB lưu thất bại.
        await ticketChannel.delete(
          "Không thể lưu Ticket vào database"
        ).catch(() => {});

        throw databaseError;
      }

      // ==============================
      // EMBED TRONG TICKET
      // ==============================
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎫 Ticket Hỗ Trợ")
        .setDescription(
          `Xin chào ${interaction.user}!\n\n` +
          "Ticket của bạn đã được tạo thành công.\n" +
          "Hãy mô tả vấn đề cần hỗ trợ và Staff sẽ phản hồi sớm nhất có thể."
        )
        .addFields(
          {
            name: "👤 Người mở",
            value: `${interaction.user}`,
            inline: true
          },
          {
            name: "🛡️ Staff",
            value: `${staffRole}`,
            inline: true
          },
          {
            name: "📌 Trạng thái",
            value: "🟢 Đang mở",
            inline: true
          }
        )
        .setFooter({
          text:
            "Corgi Studio • Ticket Support System"
        })
        .setTimestamp();

      const closeButton =
        new ButtonBuilder()
          .setCustomId("ticket_close")
          .setLabel("Đóng Ticket")
          .setEmoji("🔒")
          .setStyle(ButtonStyle.Danger);
      const claimButton =
  new ButtonBuilder()
    .setCustomId("ticket_claim")
    .setLabel("Claim Ticket")
    .setEmoji("🙋")
    .setStyle(ButtonStyle.Success);   

      const row =
  new ActionRowBuilder()
    .addComponents(
      claimButton,
      closeButton
    );

      await ticketChannel.send({
        content:
          `${interaction.user} ${staffRole}`,
        embeds: [embed],
        components: [row],

        allowedMentions: {
          users: [interaction.user.id],
          roles: [staffRole.id]
        }
      });

      // ==============================
      // PHẢN HỒI USER
      // ==============================
      await interaction.editReply({
        content:
          `✅ Ticket của bạn đã được tạo: ${ticketChannel}`
      });

      console.log(
        `🎫 ${interaction.user.tag} đã mở ${ticketChannel.name}`
      );
    } catch (error) {
      console.error(
        "❌ Ticket Open Error:",
        error
      );

      await interaction.editReply({
        content:
          "❌ Không thể tạo Ticket. Hãy kiểm tra quyền của bot và thử lại."
      }).catch(() => {});
    }
  }
};