const {
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  executeClear
} = require(
  "../../services/moderation/clearService"
);

module.exports = {
  name: "clear",

  aliases: [
    "purge"
  ],

  async execute({
    message,
    args
  }) {
    try {
      // =====================================
      // GUILD ONLY
      // =====================================

      if (!message.guild) {
        return;
      }

      // =====================================
      // PERMISSION
      // =====================================

      const hasPermission =
        message.member.permissions.has(
          PermissionFlagsBits.ManageMessages
        ) ||
        message.member.permissions.has(
          PermissionFlagsBits.Administrator
        );

      if (!hasPermission) {
        return message.reply({
          content:
            "🔒 Bạn cần quyền **Manage Messages** để sử dụng `?clear`.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // AMOUNT
      // =====================================

      const amount =
        Number(
          args[0]
        );

      if (
        !Number.isInteger(amount) ||
        amount < 1 ||
        amount > 100
      ) {
        return message.reply({
          content:
            "❌ Cách dùng:\n" +
            "`?clear 20`\n\n" +
            "Số lượng phải từ **1 đến 100**.",

          allowedMentions: {
            repliedUser: false
          }
        });
      }

      // =====================================
      // SHARED CLEAR SERVICE
      //
      // Prefix message bản thân cũng nằm
      // trong channel. Xóa command trước để
      // kết quả gần với ?clear 20 = 20 message.
      // =====================================

      try {
        if (message.deletable) {
          await message.delete();
        }
      } catch {}

      // =====================================
      // EXECUTE
      // =====================================

      const result =
        await executeClear({
          guild:
            message.guild,

          channel:
            message.channel,

          moderator:
            message.author,

          amount,

          commandName:
            "?clear"
        });

      // =====================================
      // SUCCESS
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
                `${message.channel}`,

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
              "Corgi Studio • Prefix Moderation"
          })
          .setTimestamp();

      const reply =
        await message.channel.send({
          embeds: [
            successEmbed
          ],

          allowedMentions: {
            parse: []
          }
        });

      // =====================================
      // AUTO DELETE SUCCESS MESSAGE
      // =====================================

      setTimeout(
        async () => {
          try {
            if (reply.deletable) {
              await reply.delete();
            }
          } catch {}
        },
        5000
      );

      // =====================================
      // TERMINAL
      // =====================================

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        "🧹 PREFIX CLEAR"
      );

      console.log(
        `🌐 Guild: ${message.guild.name} (${message.guild.id})`
      );

      console.log(
        `📢 Channel: ${message.channel.name} (${message.channel.id})`
      );

      console.log(
        `🛡️ Moderator: ${message.author.tag} (${message.author.id})`
      );

      console.log(
        `🗑️ Deleted: ${result.deletedCount}`
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );
    } catch (error) {
      console.error(
        "❌ Prefix Clear Error:",
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
          "❌ Không thể sử dụng `?clear` trong channel này.";
      }

      if (
        error?.message ===
        "CLEAR_DELETE_FAILED"
      ) {
        errorMessage =
          "❌ Discord không thể xóa các tin nhắn này.";
      }

      try {
        const errorReply =
          await message.channel.send({
            content:
              errorMessage,

            allowedMentions: {
              parse: []
            }
          });

        setTimeout(
          async () => {
            try {
              if (
                errorReply.deletable
              ) {
                await errorReply.delete();
              }
            } catch {}
          },
          5000
        );
      } catch {}
    }
  }
};