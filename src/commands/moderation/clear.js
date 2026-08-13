const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

const {
  executeClear
} = require(
  "../../services/moderation/clearService"
);

module.exports = {
  data:
    new SlashCommandBuilder()

      .setName("clear")

      .setDescription(
        "Xóa nhiều tin nhắn trong channel."
      )

      .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageMessages
      )

      .addIntegerOption(
        (option) =>
          option
            .setName("amount")
            .setDescription(
              "Số lượng tin nhắn cần xóa (1-100)"
            )
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
      ),

  async execute(interaction) {
    try {
      // =====================================
      // GUILD ONLY
      // =====================================

      if (!interaction.inGuild()) {
        return interaction.reply({
          content:
            "❌ Lệnh này chỉ có thể sử dụng trong server.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      // =====================================
      // DEFER NGAY
      // =====================================

      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      // =====================================
      // MODERATOR PERMISSION
      // =====================================

      const hasPermission =
        interaction.member.permissions.has(
          PermissionFlagsBits.ManageMessages
        ) ||
        interaction.member.permissions.has(
          PermissionFlagsBits.Administrator
        );

      if (!hasPermission) {
        return interaction.editReply({
          content:
            "🔒 Bạn cần quyền **Manage Messages** để sử dụng `/clear`."
        });
      }

      // =====================================
      // AMOUNT
      // =====================================

      const amount =
        interaction.options.getInteger(
          "amount",
          true
        );

      if (
        !Number.isInteger(amount) ||
        amount < 1 ||
        amount > 100
      ) {
        return interaction.editReply({
          content:
            "❌ Số lượng tin nhắn phải từ **1 đến 100**."
        });
      }

      // =====================================
      // SHARED CLEAR SERVICE
      // =====================================

      const result =
        await executeClear({
          guild:
            interaction.guild,

          channel:
            interaction.channel,

          moderator:
            interaction.user,

          amount,

          commandName:
            "/clear"
        });

      // =====================================
      // SUCCESS EMBED
      // =====================================

      const successEmbed =
        new EmbedBuilder()

          .setColor(
            0x57f287
          )

          .setTitle(
            "🧹 Clear thành công"
          )

          .setDescription(
            `Đã xóa **${result.deletedCount}** tin nhắn.`
          )

          .addFields(
            {
              name:
                "📢 Channel",

              value:
                `${interaction.channel}`,

              inline:
                true
            },

            {
              name:
                "🗑️ Đã xóa",

              value:
                `**${result.deletedCount}**`,

              inline:
                true
            },

            {
              name:
                "📜 Mod Log",

              value:
                result.logSent
                  ? "✅ Đã ghi"
                  : (
                      result.logChannelId
                        ? "⚠️ Không gửi được"
                        : "⚪ Chưa cấu hình"
                    ),

              inline:
                true
            }
          )

          .setFooter({
            text:
              "Corgi Studio • Moderation System"
          })

          .setTimestamp();

      // =====================================
      // RESPONSE
      // =====================================

      await interaction.editReply({
        embeds: [
          successEmbed
        ]
      });

      // =====================================
      // TERMINAL
      // =====================================

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        "🧹 CLEAR COMMAND"
      );

      console.log(
        `🌐 Guild: ${interaction.guild.name} (${interaction.guild.id})`
      );

      console.log(
        `📢 Channel: ${interaction.channel.name} (${interaction.channel.id})`
      );

      console.log(
        `🛡️ Moderator: ${interaction.user.tag} (${interaction.user.id})`
      );

      console.log(
        `🗑️ Deleted: ${result.deletedCount}`
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );
    } catch (error) {
      console.error(
        "❌ Clear Command Error:",
        error
      );

      let errorMessage =
        "❌ Không thể xóa tin nhắn.";

      if (
        error?.message ===
        "CLEAR_AMOUNT_INVALID"
      ) {
        errorMessage =
          "❌ Số lượng tin nhắn phải từ **1 đến 100**.";
      }

      if (
        error?.message ===
        "CLEAR_BOT_MEMBER_NOT_FOUND"
      ) {
        errorMessage =
          "❌ Không thể xác định quyền của Corgi-Bot.";
      }

      if (
        error?.message ===
        "CLEAR_BOT_MISSING_MANAGE_MESSAGES"
      ) {
        errorMessage =
          "❌ Corgi-Bot chưa có quyền **Manage Messages**.";
      }

      if (
        error?.message ===
        "CLEAR_CHANNEL_NOT_SUPPORTED"
      ) {
        errorMessage =
          "❌ Không thể sử dụng `/clear` trong channel này.";
      }

      if (
        error?.message ===
        "CLEAR_DELETE_FAILED"
      ) {
        errorMessage =
          "❌ Discord không thể xóa các tin nhắn này.";
      }

      if (
        error?.code === 10062
      ) {
        return;
      }

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          await interaction.editReply({
            content:
              errorMessage,

            embeds: []
          });
        } else {
          await interaction.reply({
            content:
              errorMessage,

            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch (
        replyError
      ) {
        console.error(
          "❌ Clear Error Response:",
          replyError
        );
      }
    }
  }
};