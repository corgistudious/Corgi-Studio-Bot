const {
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

const Ticket =
  require("../../models/Ticket");

const {
  getGuildSettings
} = require(
  "../../services/guildSettingsService"
);

const {
  createTicketTranscript
} = require(
  "../../services/ticketTranscriptService"
);

const {
  sendTicketCloseLog
} = require(
  "../../services/ticketLogService"
);

module.exports = {
  customId: "ticket_close_confirm",

  async execute(interaction) {
    await interaction.deferUpdate();

    try {
      // ============================
      // TÌM TICKET
      // ============================

      const ticket =
        await Ticket.findOne({
          guildId: interaction.guildId,
          channelId: interaction.channelId,
          status: "open"
        });

      if (!ticket) {
        await interaction.editReply({
          content:
            "❌ Ticket này đã được đóng.",
          components: []
        });

        return;
      }

      // ============================
      // SETTINGS
      // ============================

      const settings =
        await getGuildSettings(
          interaction.guildId
        );

      const staffRoleId =
        settings.ticket?.staffRoleId;

      // ============================
      // KIỂM TRA QUYỀN
      // ============================

      const isOwner =
        ticket.userId ===
        interaction.user.id;

      const isStaff =
        staffRoleId &&
        interaction.member.roles.cache.has(
          staffRoleId
        );

      const isAdmin =
        interaction.member.permissions.has(
          PermissionFlagsBits.Administrator
        );

      if (
        !isOwner &&
        !isStaff &&
        !isAdmin
      ) {
        await interaction.editReply({
          content:
            "❌ Bạn không có quyền đóng Ticket này.",
          components: []
        });

        return;
      }

      // ============================
      // LƯU CHANNEL TRƯỚC KHI XÓA
      // ============================

      const ticketChannel =
        interaction.channel;

      const ticketChannelName =
        interaction.channel?.name ||
        "unknown-ticket";

      const ticketChannelId =
        interaction.channelId;

      // ============================
      // TẠO TRANSCRIPT
      // ============================

      let transcript = null;

      try {
        transcript =
          await createTicketTranscript(
            ticketChannel,
            ticket
          );

        console.log(
          `📄 Đã tạo Transcript: ${ticketChannelName}`
        );
      } catch (error) {
        console.error(
          "❌ Transcript Error:",
          error
        );
      }

      // ============================
      // UPDATE DATABASE
      // ============================

      ticket.status = "closed";
      ticket.closedAt = new Date();
      ticket.closedBy =
        interaction.user.id;

      await ticket.save();

      // ============================
      // GỬI LOG + TRANSCRIPT
      // ============================

      if (transcript) {
        try {
          await sendTicketCloseLog({
            guild:
              interaction.guild,

            settings,

            ticket,

            closedBy:
              interaction.user,

            channel:
              ticketChannel,

            transcript
          });

          console.log(
            `📜 Đã gửi Ticket Log: ${ticketChannelName}`
          );
        } catch (error) {
          console.error(
            "❌ Ticket Log Error:",
            error
          );
        }
      }

      // ============================
      // PHẢN HỒI
      // ============================

      await interaction.editReply({
        content:
          "🔒 **Ticket đã được đóng.**\n\n" +
          "📄 Transcript đã được tạo.\n" +
          "📜 Transcript đã được gửi tới Ticket Log.\n\n" +
          "Kênh sẽ bị xóa sau **5 giây**.",
        components: []
      });

      console.log(
        `🔒 ${interaction.user.tag} đã đóng ${ticketChannelName}`
      );

      // ============================
      // XÓA CHANNEL SAU 5 GIÂY
      // ============================

      setTimeout(
        async () => {
          try {
            if (!ticketChannel) {
              console.warn(
                `⚠️ Không tìm thấy Ticket Channel: ${ticketChannelId}`
              );

              return;
            }

            await ticketChannel.delete(
              `Ticket đóng bởi ${interaction.user.tag}`
            );

            // Không đọc interaction.channel.name
            // sau khi channel đã bị xóa.
            console.log(
              `🗑️ Đã xóa Ticket Channel: ${ticketChannelName}`
            );
          } catch (error) {
            console.error(
              `❌ Không thể xóa Ticket Channel ${ticketChannelName}:`,
              error
            );
          }
        },
        5000
      );

    } catch (error) {
      console.error(
        "❌ Ticket Close Confirm Error:",
        error
      );

      try {
        await interaction.followUp({
          content:
            "❌ Có lỗi xảy ra khi đóng Ticket.",
          flags:
            MessageFlags.Ephemeral
        });
      } catch (replyError) {
        console.error(
          "❌ Không thể gửi thông báo lỗi:",
          replyError
        );
      }
    }
  }
};