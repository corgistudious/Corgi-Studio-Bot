const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

const {
  scanContestFraud
} =
  require("../../services/contestFraudService");

// =====================================
// RISK TEXT
// =====================================

function getRiskText(risk) {
  switch (risk) {
    case "HIGH":
      return "🔴 Cao";

    case "MEDIUM":
      return "🟠 Trung bình";

    case "LOW":
      return "🟡 Thấp";

    default:
      return "🟢 Bình thường";
  }
}

// =====================================
// RISK EMOJI
// =====================================

function getRiskEmoji(risk) {
  switch (risk) {
    case "HIGH":
      return "🔴";

    case "MEDIUM":
      return "🟠";

    case "LOW":
      return "🟡";

    default:
      return "🟢";
  }
}

// =====================================
// BUILD REASONS
// =====================================

function buildReasons(item) {
  const reasons = [];

  if (
    item.blockedAccountAge
  ) {
    reasons.push(
      `AccountAge:${item.blockedAccountAge}`
    );
  }

  if (
    item.blockedJoinAge
  ) {
    reasons.push(
      `JoinAge:${item.blockedJoinAge}`
    );
  }

  if (
    item.blockedCooldown
  ) {
    reasons.push(
      `Cooldown:${item.blockedCooldown}`
    );
  }

  if (
    item.blockedDuplicate
  ) {
    reasons.push(
      `Duplicate:${item.blockedDuplicate}`
    );
  }

  if (
    item.blockedMaxVotes
  ) {
    reasons.push(
      `MaxVote:${item.blockedMaxVotes}`
    );
  }

  return (
    reasons.join(" • ") ||
    "Hành vi bất thường"
  );
}

// =====================================
// MODULE
// =====================================

module.exports = {
  customId:
    "contest_fraud_review",

  async execute(interaction) {
    try {
      // =====================================
      // GUILD ONLY
      // =====================================

      if (
        !interaction.inGuild()
      ) {
        return interaction.reply({
          content:
            "❌ Chức năng này chỉ sử dụng trong Server.",

          flags:
            MessageFlags.Ephemeral
        });
      }

      await interaction.deferReply({
        flags:
          MessageFlags.Ephemeral
      });

      const guildId =
        interaction.guildId;

      // =====================================
      // FIND CONTEST
      // =====================================

      const contest =
        await Contest.findOne({
          guildId,

          status: {
            $in: [
              "DRAFT",
              "SUBMISSION",
              "VOTING",
              "ENDED"
            ]
          }
        })
          .sort({
            createdAt: -1
          });

      if (!contest) {
        return interaction.editReply({
          content:
            "⚠️ Server hiện không có Contest để kiểm tra.",

          embeds: [],
          components: []
        });
      }

      // =====================================
      // SCAN
      // =====================================

      const scan =
        await scanContestFraud({
          guildId,

          contestId:
            contest._id
        });

      // =====================================
      // NO AUDIT
      // =====================================

      if (
        scan.totalAuditEvents ===
        0
      ) {
        const embed =
          new EmbedBuilder()
            .setColor(
              0x57f287
            )
            .setTitle(
              "🛡️ Contest Anti-Fraud Review"
            )
            .setDescription(
              `Event **${contest.name}** chưa có dữ liệu Audit để phân tích.`
            )
            .addFields({
              name:
                "📋 Trạng thái",

              value:
                "Chưa có hoạt động Vote được ghi vào Audit Log.",

              inline:
                false
            })
            .setFooter({
              text:
                "Corgi Studio • Anti-Fraud"
            })
            .setTimestamp();

        return interaction.editReply({
          embeds: [
            embed
          ],

          components: []
        });
      }

      // =====================================
      // NO SUSPICIOUS USERS
      // =====================================

      if (
        scan.suspiciousUsers
          .length === 0
      ) {
        const embed =
          new EmbedBuilder()
            .setColor(
              0x57f287
            )
            .setTitle(
              "🛡️ Contest Anti-Fraud Review"
            )
            .setDescription(
              `✅ Chưa phát hiện hành vi Vote đáng ngờ trong **${contest.name}**.`
            )
            .addFields(
              {
                name:
                  "📋 Audit Events",

                value:
                  String(
                    scan.totalAuditEvents
                  ),

                inline:
                  true
              },

              {
                name:
                  "👥 Users",

                value:
                  String(
                    scan.totalUsers
                  ),

                inline:
                  true
              },

              {
                name:
                  "🛡️ Anti-Fraud",

                value:
                  "✅ Bình thường",

                inline:
                  true
              }
            )
            .setFooter({
              text:
                "Corgi Studio • Anti-Fraud"
            })
            .setTimestamp();

        return interaction.editReply({
          embeds: [
            embed
          ],

          components: []
        });
      }

      // =====================================
      // TOP SUSPICIOUS
      // =====================================

      const top =
        scan.suspiciousUsers
          .slice(
            0,
            10
          );

      const suspiciousText =
        top
          .map(
            (
              item,
              index
            ) => {
              return (
                `**${index + 1}. <@${item.userId}>**\n` +
                `${getRiskText(
                  item.risk
                )} • Score **${item.score}**\n` +
                `❤️ +${item.voteAdded} • 💔 -${item.voteRemoved}\n` +
                `⚠️ ${buildReasons(item)}`
              );
            }
          )
          .join(
            "\n\n"
          );

      // =====================================
      // EMBED
      // =====================================

      const embed =
        new EmbedBuilder()
          .setColor(
            0xed4245
          )
          .setTitle(
            "⚠️ Contest — Vote đáng ngờ"
          )
          .setDescription(
            `### 🏆 ${contest.name}\n\n` +
            "Bot chỉ **đánh dấu để Admin review**.\n" +
            "Không tự Ban và không tự xóa Vote."
          )
          .addFields(
            {
              name:
                "🔎 Phát hiện",

              value:
                suspiciousText,

              inline:
                false
            },

            {
              name:
                "📋 Audit Events",

              value:
                String(
                  scan.totalAuditEvents
                ),

              inline:
                true
            },

            {
              name:
                "👥 Users đã phân tích",

              value:
                String(
                  scan.totalUsers
                ),

              inline:
                true
            },

            {
              name:
                "⚠️ Users đáng ngờ",

              value:
                String(
                  scan.suspiciousUsers
                    .length
                ),

              inline:
                true
            },

            {
              name:
                "👤 Admin Review",

              value:
                "Chọn một User bên dưới để xem chi tiết lịch sử Vote và Anti-Fraud.",

              inline:
                false
            }
          )
          .setFooter({
            text:
              "Corgi Studio • Anti-Fraud Review"
          })
          .setTimestamp();

      // =====================================
      // USER SELECT MENU
      // =====================================
      //
      // Discord Select Menu tối đa 25 options.
      //
      // value:
      // contestId:userId
      //
      // Không cần Dynamic Select Handler vì
      // customId của menu là STATIC.
      // =====================================

      const reviewUsers =
        scan.suspiciousUsers
          .slice(
            0,
            25
          );

      const select =
        new StringSelectMenuBuilder()
          .setCustomId(
            "contest_fraud_user_select"
          )
          .setPlaceholder(
            "👤 Chọn User đáng ngờ để Review"
          )
          .setMinValues(1)
          .setMaxValues(1);

      for (
        const item
        of reviewUsers
      ) {
        let description =
          `Risk ${item.risk} • Score ${item.score}`;

        description =
          description.slice(
            0,
            100
          );

        select.addOptions({
          label:
            `User ${item.userId}`.slice(
              0,
              100
            ),

          description,

          value:
            `${contest._id}:${item.userId}`,

          emoji:
            getRiskEmoji(
              item.risk
            )
        });
      }

      const row =
        new ActionRowBuilder()
          .addComponents(
            select
          );

      // =====================================
      // RESPONSE
      // =====================================

      return interaction.editReply({
        embeds: [
          embed
        ],

        components: [
          row
        ]
      });
    } catch (error) {
      console.error(
        "❌ Contest Fraud Review Error:",
        error
      );

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          return await interaction.editReply({
            content:
              "❌ Không thể phân tích Anti-Fraud.",

            embeds: [],
            components: []
          });
        }

        return await interaction.reply({
          content:
            "❌ Không thể phân tích Anti-Fraud.",

          flags:
            MessageFlags.Ephemeral
        });
      } catch {}
    }
  }
};