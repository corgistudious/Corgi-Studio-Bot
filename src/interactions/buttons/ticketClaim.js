const {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits
} = require("discord.js");

const Ticket = require("../../models/Ticket");

const {
  getGuildSettings
} = require("../../services/guildSettingsService");

module.exports = {
  customId: "ticket_claim",

  async execute(interaction) {
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral
    });

    try {
      const ticket = await Ticket.findOne({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        status: "open"
      });

      if (!ticket) {
        await interaction.editReply({
          content:
            "❌ Không tìm thấy Ticket đang mở."
        });

        return;
      }

      const settings =
        await getGuildSettings(
          interaction.guildId
        );

      const staffRoleId =
        settings.ticket?.staffRoleId;

      const isStaff =
        staffRoleId &&
        interaction.member.roles.cache.has(
          staffRoleId
        );

      const isAdmin =
        interaction.member.permissions.has(
          PermissionFlagsBits.Administrator
        );

      if (!isStaff && !isAdmin) {
        await interaction.editReply({
          content:
            "❌ Chỉ Staff mới có thể Claim Ticket."
        });

        return;
      }

      if (ticket.claimedBy) {
        if (
          ticket.claimedBy ===
          interaction.user.id
        ) {
          await interaction.editReply({
            content:
              "ℹ️ Bạn đã Claim Ticket này rồi."
          });

          return;
        }

        await interaction.editReply({
          content:
            `❌ Ticket này đã được <@${ticket.claimedBy}> Claim.`
        });

        return;
      }

      ticket.claimedBy =
        interaction.user.id;

      ticket.claimedAt =
        new Date();

      await ticket.save();

      const embed =
        new EmbedBuilder()
          .setColor(0x57f287)
          .setDescription(
            `🙋 ${interaction.user} đã **Claim Ticket** này.\n\n` +
            "Staff này sẽ phụ trách hỗ trợ Ticket."
          )
          .setTimestamp();

      await interaction.channel.send({
        embeds: [embed]
      });

      await interaction.editReply({
        content:
          "✅ Bạn đã Claim Ticket thành công."
      });

      console.log(
        `🙋 ${interaction.user.tag} đã Claim ${interaction.channel.name}`
      );
    } catch (error) {
      console.error(
        "❌ Ticket Claim Error:",
        error
      );

      await interaction.editReply({
        content:
          "❌ Không thể Claim Ticket."
      }).catch(() => {});
    }
  }
};