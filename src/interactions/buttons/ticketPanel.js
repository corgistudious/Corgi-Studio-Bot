const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

const {
  getGuildSettings
} = require("../../services/guildSettingsService");

module.exports = {
  customId: "ticket_panel",

  async execute(interaction) {
    const settings = await getGuildSettings(
      interaction.guildId
    );

    if (!settings.ticket?.enabled) {
      await interaction.reply({
        content:
          "❌ Ticket System đang tắt.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    const panelChannelId =
      settings.ticket?.panelChannelId;

    if (!panelChannelId) {
      await interaction.reply({
        content:
          "❌ Chưa thiết lập Kênh Panel.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    const channel =
      interaction.guild.channels.cache.get(
        panelChannelId
      );

    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        content:
          "❌ Kênh Panel không hợp lệ.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    const botMember =
      interaction.guild.members.me;

    const permissions =
      channel.permissionsFor(botMember);

    if (
      !permissions?.has(
        PermissionFlagsBits.ViewChannel
      ) ||
      !permissions?.has(
        PermissionFlagsBits.SendMessages
      ) ||
      !permissions?.has(
        PermissionFlagsBits.EmbedLinks
      )
    ) {
      await interaction.reply({
        content:
          "❌ Corgi-Bot thiếu quyền trong Kênh Panel.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    const panel =
      settings.ticket?.panel || {};

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(
        panel.title ||
          "🎫 Corgi Studio — Trung Tâm Hỗ Trợ"
      )
      .setDescription(
        panel.description ||
          "Bạn đang cần hỗ trợ từ đội ngũ Corgi Studio?"
      )
      .addFields(
        {
          name: "🔒 Riêng tư",
          value:
            panel.privateText ||
            "Ticket chỉ hiển thị cho bạn và đội ngũ hỗ trợ.",
          inline: true
        },
        {
          name: "🛡️ Staff",
          value:
            panel.staffText ||
            "Đội ngũ Staff sẽ hỗ trợ bạn trong Ticket.",
          inline: true
        },
        {
          name: "⚠️ Lưu ý",
          value:
            panel.warningText ||
            "Không tạo Ticket spam hoặc khi không cần thiết."
        }
      )
      .setFooter({
        text:
          "Corgi Studio • Ticket Support System"
      })
      .setTimestamp();

    const openButton = new ButtonBuilder()
      .setCustomId("ticket_open")
      .setLabel(
        panel.buttonLabel ||
          "Mở Ticket"
      )
      .setEmoji("🎫")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder()
      .addComponents(openButton);

    await channel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content:
        `✅ Đã đăng Ticket Panel tại ${channel}.`,
      flags: MessageFlags.Ephemeral
    });

    console.log(
      `📤 Ticket Panel đã đăng tại #${channel.name}`
    );
  }
};