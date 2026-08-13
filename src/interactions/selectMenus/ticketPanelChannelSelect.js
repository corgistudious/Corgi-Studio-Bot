const {
  ChannelType,
  MessageFlags
} = require("discord.js");

const {
  updateGuildSettings
} = require("../../services/guildSettingsService");

const {
  renderTicketSettings
} = require("../../services/setup/ticketRenderer");

module.exports = {
  customId: "ticket_panel_channel_select",

  async execute(interaction) {
    const channelId =
      interaction.values[0];

    const channel =
      interaction.guild.channels.cache.get(
        channelId
      );

    if (
      !channel ||
      channel.type !== ChannelType.GuildText
    ) {
      await interaction.reply({
        content:
          "❌ Kênh Panel không hợp lệ.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    await updateGuildSettings(
      interaction.guildId,
      {
        $set: {
          "ticket.panelChannelId": channelId
        }
      }
    );

    console.log(
      `📢 Ticket Panel Channel: #${channel.name}`
    );

    await renderTicketSettings(
      interaction
    );
  }
};