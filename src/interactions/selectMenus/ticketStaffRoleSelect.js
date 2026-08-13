const {
  MessageFlags
} = require("discord.js");

const {
  updateGuildSettings
} = require("../../services/guildSettingsService");

const {
  renderTicketSettings
} = require("../../services/setup/ticketRenderer");

module.exports = {
  customId: "ticket_staff_role_select",

  async execute(interaction) {
    const roleId =
      interaction.values[0];

    const role =
      interaction.guild.roles.cache.get(
        roleId
      );

    if (!role) {
      await interaction.reply({
        content:
          "❌ Không tìm thấy Staff Role.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    if (role.id === interaction.guild.id) {
      await interaction.reply({
        content:
          "❌ Không thể dùng @everyone làm Staff Role.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    await updateGuildSettings(
      interaction.guildId,
      {
        $set: {
          "ticket.staffRoleId": roleId
        }
      }
    );

    console.log(
      `🛡️ Ticket Staff Role: ${role.name}`
    );

    await renderTicketSettings(
      interaction
    );
  }
};