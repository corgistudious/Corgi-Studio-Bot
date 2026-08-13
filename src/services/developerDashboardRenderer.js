const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

function buildDeveloperDashboard(client) {
  // =====================================
  // GUILD LIST
  // =====================================
  const guilds =
    [...client.guilds.cache.values()]
      .sort(
        (a, b) =>
          b.memberCount - a.memberCount
      );

  // =====================================
  // EMBED
  // =====================================
  const embed =
    new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(
        "🔐 Corgi Studio — Developer Remote Control"
      )
      .setDescription(
        "Quản lý hệ thống Corgi-Bot từ xa.\n\n" +
        "Bạn không cần có quyền Administrator trong server đích.\n\n" +
        "🌐 **Remote Guild Control**\n" +
        "Chọn server cần quản lý ở menu bên dưới.\n\n" +
        "📜 **Developer Audit Logs**\n" +
        "Xem lịch sử các thao tác XP/Level của Developer."
      )
      .addFields(
        {
          name: "📡 Bot đang hoạt động",
          value: `**${guilds.length} server**`,
          inline: true
        },
        {
          name: "🔐 Quyền truy cập",
          value: "**Developer Only**",
          inline: true
        }
      )
      .setFooter({
        text:
          "Corgi Studio • Developer Only"
      })
      .setTimestamp();

  const components = [];

  // =====================================
  // GUILD SELECT
  // =====================================
  if (guilds.length > 0) {
    const guildOptions =
      guilds
        .slice(0, 25)
        .map(
          (guild) => ({
            label:
              guild.name.slice(
                0,
                100
              ),

            description:
              `${guild.memberCount} thành viên • ${guild.id}`
                .slice(
                  0,
                  100
                ),

            value:
              guild.id,

            emoji:
              "🌐"
          })
        );

    const guildSelect =
      new StringSelectMenuBuilder()
        .setCustomId(
          "dev_guild_select"
        )
        .setPlaceholder(
          "🌐 Chọn server cần quản lý"
        )
        .addOptions(
          guildOptions
        );

    components.push(
      new ActionRowBuilder()
        .addComponents(
          guildSelect
        )
    );
  }

  // =====================================
  // DASHBOARD BUTTONS
  // =====================================
  const auditButton =
    new ButtonBuilder()
      .setCustomId(
        "dev_audit_logs"
      )
      .setLabel(
        "Audit Logs"
      )
      .setEmoji(
        "📜"
      )
      .setStyle(
        ButtonStyle.Secondary
      );

  const buttonRow =
    new ActionRowBuilder()
      .addComponents(
        auditButton
      );

  components.push(
    buttonRow
  );

  // =====================================
  // RESULT
  // =====================================
  return {
    embeds: [
      embed
    ],

    components
  };
}

module.exports = {
  buildDeveloperDashboard
};