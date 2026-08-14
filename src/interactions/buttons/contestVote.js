const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");

const Contest =
  require("../../models/Contest");

const ContestSubmission =
  require("../../models/ContestSubmission");

const ContestVote =
  require("../../models/ContestVote");

const ContestVoteAudit =
  require("../../models/ContestVoteAudit");

// =====================================
// LIGHTWEIGHT ANTI-SPAM MEMORY
// =====================================
//
// voteLocks:
// User đang được xử lý Vote.
//
// voteCooldowns:
// Thời điểm thao tác Vote gần nhất.
//
// Key:
// guildId:contestId:userId
//
// Không dùng timer chạy nền.
// RAM sử dụng rất nhỏ.
// =====================================

const voteLocks =
  new Set();

const voteCooldowns =
  new Map();

// =====================================
// GET SUBMISSION ID
// =====================================

function getSubmissionId(customId) {
  return customId.split(":")[1];
}

// =====================================
// VOTE KEY
// =====================================

function getVoteKey(
  guildId,
  contestId,
  userId
) {
  return (
    `${guildId}:` +
    `${contestId}:` +
    `${userId}`
  );
}

// =====================================
// COOLDOWN CHECK
// =====================================

function checkCooldown(
  key,
  cooldownSeconds
) {
  if (
    !cooldownSeconds ||
    cooldownSeconds <= 0
  ) {
    return {
      allowed: true,
      remainingMs: 0
    };
  }

  const lastAction =
    voteCooldowns.get(key);

  if (!lastAction) {
    return {
      allowed: true,
      remainingMs: 0
    };
  }

  const cooldownMs =
    cooldownSeconds * 1000;

  const elapsed =
    Date.now() -
    lastAction;

  if (
    elapsed >=
    cooldownMs
  ) {
    voteCooldowns.delete(
      key
    );

    return {
      allowed: true,
      remainingMs: 0
    };
  }

  return {
    allowed: false,

    remainingMs:
      cooldownMs -
      elapsed
  };
}

// =====================================
// SET COOLDOWN
// =====================================

function setCooldown(key) {
  voteCooldowns.set(
    key,
    Date.now()
  );
}

// =====================================
// SAFE AUDIT LOG
// =====================================
//
// QUAN TRỌNG:
//
// Nếu Audit MongoDB lỗi,
// Vote chính vẫn phải hoạt động.
//
// Vì vậy hàm này KHÔNG throw.
// =====================================

async function writeVoteAudit({
  guildId,
  contestId,
  submissionId = null,
  userId,
  action,
  reason = null
}) {
  try {
    await ContestVoteAudit.create({
      guildId:
        String(guildId),

      contestId,

      submissionId,

      userId:
        String(userId),

      action,

      reason:
        reason
          ? String(reason)
              .slice(0, 200)
          : null
    });
  } catch (error) {
    console.error(
      "⚠️ Contest Vote Audit Error:",
      error
    );
  }
}

// =====================================
// UPDATE GALLERY MESSAGE
// =====================================

async function updateGalleryMessage(
  interaction,
  contest,
  submission
) {
  try {
    if (
      !submission.galleryChannelId ||
      !submission.galleryMessageId
    ) {
      return;
    }

    const channel =
      await interaction.guild.channels
        .fetch(
          submission.galleryChannelId
        )
        .catch(
          () => null
        );

    if (
      !channel ||
      !channel.isTextBased()
    ) {
      return;
    }

    const message =
      await channel.messages
        .fetch(
          submission.galleryMessageId
        )
        .catch(
          () => null
        );

    if (!message) {
      return;
    }

    const embed =
      new EmbedBuilder()
        .setColor(
          0xf5a623
        )
        .setTitle(
          `🎨 ${submission.title}`
        )
        .setDescription(
          submission.description ||
          "Không có mô tả."
        )
        .addFields(
          {
            name:
              "👤 Tác giả",

            value:
              `<@${submission.userId}>`,

            inline:
              true
          },

          {
            name:
              "🏆 Event",

            value:
              contest.name,

            inline:
              true
          },

          {
            name:
              "❤️ Vote",

            value:
              String(
                submission.voteCount ||
                0
              ),

            inline:
              true
          },

          {
            name:
              "🔗 Tác phẩm",

            value:
              `[Xem tác phẩm](${submission.contentUrl})`,

            inline:
              false
          }
        )
        .setFooter({
          text:
            "Corgi Studio • Contest Gallery"
        })
        .setTimestamp(
          submission.createdAt
        );

    // =====================================
    // IMAGE PREVIEW
    // =====================================

    if (
      submission.contentUrl &&
      /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(
        submission.contentUrl
      )
    ) {
      embed.setImage(
        submission.contentUrl
      );
    }

    // =====================================
    // VOTE BUTTON
    // =====================================

    const row =
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(
              `contest_vote:${submission._id}`
            )
            .setLabel(
              `Vote • ${submission.voteCount || 0}`
            )
            .setEmoji(
              "❤️"
            )
            .setStyle(
              ButtonStyle.Danger
            )
            .setDisabled(
              contest.status !==
                "VOTING"
            )
        );

    await message.edit({
      embeds: [
        embed
      ],

      components: [
        row
      ]
    });
  } catch (error) {
    console.error(
      "⚠️ Không thể cập nhật Gallery:",
      error
    );
  }
}

// =====================================
// ANTI FRAUD CHECK
// =====================================

async function checkAntiFraud(
  interaction,
  contest
) {
  if (
    contest.antiFraud?.enabled ===
    false
  ) {
    return {
      allowed: true
    };
  }

  const minAccountAgeDays =
    Math.max(
      0,
      Number(
        contest.antiFraud
          ?.minAccountAgeDays
      ) || 0
    );

  const minGuildJoinHours =
    Math.max(
      0,
      Number(
        contest.antiFraud
          ?.minGuildJoinHours
      ) || 0
    );

  // =====================================
  // ACCOUNT AGE
  // =====================================

  const accountCreatedAt =
    interaction.user
      .createdTimestamp;

  if (
    typeof accountCreatedAt !==
    "number"
  ) {
    return {
      allowed: false,

      message:
        "❌ Không thể xác minh tuổi tài khoản Discord."
    };
  }

  const accountAgeMs =
    Date.now() -
    accountCreatedAt;

  const minAccountAgeMs =
    minAccountAgeDays *
    24 *
    60 *
    60 *
    1000;

  if (
    accountAgeMs <
    minAccountAgeMs
  ) {
    const accountAgeDays =
      Math.max(
        0,
        Math.floor(
          accountAgeMs /
            (
              24 *
              60 *
              60 *
              1000
            )
        )
      );

    return {
      allowed: false,

      auditAction:
        "BLOCKED_ACCOUNT_AGE",

      auditReason:
        `Account ${accountAgeDays}d < ${minAccountAgeDays}d`,

      message:
        `🛡️ **Anti-Fraud đã chặn Vote này.**\n\n` +
        `Tài khoản Discord phải có tuổi tối thiểu **${minAccountAgeDays} ngày**.\n` +
        `Tuổi tài khoản hiện tại: **${accountAgeDays} ngày**.`
    };
  }

  // =====================================
  // GET GUILD MEMBER
  // =====================================

  let member =
    interaction.member;

  if (
    !member ||
    typeof member.joinedTimestamp !==
      "number"
  ) {
    member =
      await interaction.guild.members
        .fetch(
          interaction.user.id
        )
        .catch(
          () => null
        );
  }

  if (!member) {
    return {
      allowed: false,

      message:
        "❌ Không thể xác minh Member trong Server."
    };
  }

  // =====================================
  // JOIN AGE
  // =====================================

  if (
    typeof member.joinedTimestamp !==
      "number"
  ) {
    return {
      allowed: false,

      message:
        "❌ Không thể xác minh thời gian bạn tham gia Server."
    };
  }

  const guildJoinAgeMs =
    Date.now() -
    member.joinedTimestamp;

  const minGuildJoinAgeMs =
    minGuildJoinHours *
    60 *
    60 *
    1000;

  if (
    guildJoinAgeMs <
    minGuildJoinAgeMs
  ) {
    const joinedHours =
      Math.max(
        0,
        Math.floor(
          guildJoinAgeMs /
            (
              60 *
              60 *
              1000
            )
        )
      );

    return {
      allowed: false,

      auditAction:
        "BLOCKED_JOIN_AGE",

      auditReason:
        `Join ${joinedHours}h < ${minGuildJoinHours}h`,

      message:
        `🛡️ **Anti-Fraud đã chặn Vote này.**\n\n` +
        `Bạn phải tham gia Server ít nhất **${minGuildJoinHours} giờ** trước khi được Vote.\n` +
        `Thời gian hiện tại trong Server: **${joinedHours} giờ**.`
    };
  }

  return {
    allowed: true
  };
}

// =====================================
// MODULE
// =====================================

module.exports = {
  customId:
    "contest_vote",

  async execute(interaction) {
    let voteKey =
      null;

    let lockAcquired =
      false;

    try {
      // =====================================
      // GUILD ONLY
      // =====================================

      if (!interaction.inGuild()) {
        return interaction.reply({
          content:
            "❌ Chỉ có thể Vote trong Server.",

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

      const userId =
        interaction.user.id;

      // =====================================
      // BLOCK BOT
      // =====================================

      if (
        interaction.user.bot
      ) {
        return interaction.editReply({
          content:
            "❌ Bot không thể tham gia bình chọn."
        });
      }

      // =====================================
      // SUBMISSION ID
      // =====================================

      const submissionId =
        getSubmissionId(
          interaction.customId
        );

      if (!submissionId) {
        return interaction.editReply({
          content:
            "❌ Submission ID không hợp lệ."
        });
      }

      // =====================================
      // FIND SUBMISSION
      // =====================================

      const submission =
        await ContestSubmission.findOne({
          _id:
            submissionId,

          guildId,

          status:
            "APPROVED"
        });

      if (!submission) {
        return interaction.editReply({
          content:
            "❌ Không tìm thấy bài dự thi hoặc bài chưa được duyệt."
        });
      }

      // =====================================
      // FIND CONTEST
      // =====================================

      const contest =
        await Contest.findOne({
          _id:
            submission.contestId,

          guildId
        });

      if (!contest) {
        return interaction.editReply({
          content:
            "❌ Event Contest không còn tồn tại."
        });
      }

      // =====================================
      // VOTING STATUS
      // =====================================

      if (
        contest.status !==
        "VOTING"
      ) {
        return interaction.editReply({
          content:
            "🔒 Event hiện không mở bình chọn."
        });
      }

      // =====================================
      // VOTING TIME
      // =====================================

      const now =
        new Date();

      if (
        contest.votingEndAt &&
        now >
          contest.votingEndAt
      ) {
        return interaction.editReply({
          content:
            "⏰ Thời gian bình chọn đã kết thúc."
        });
      }

      // =====================================
      // ANTI FRAUD
      // =====================================

      const antiFraudResult =
        await checkAntiFraud(
          interaction,
          contest
        );

      if (
        !antiFraudResult.allowed
      ) {
        if (
          antiFraudResult.auditAction
        ) {
          await writeVoteAudit({
            guildId,

            contestId:
              contest._id,

            submissionId:
              submission._id,

            userId,

            action:
              antiFraudResult
                .auditAction,

            reason:
              antiFraudResult
                .auditReason
          });
        }

        return interaction.editReply({
          content:
            antiFraudResult.message
        });
      }

      // =====================================
      // CREATE VOTE KEY
      // =====================================

      voteKey =
        getVoteKey(
          guildId,
          String(
            contest._id
          ),
          userId
        );

      // =====================================
      // VOTE LOCK
      // =====================================

      if (
        voteLocks.has(
          voteKey
        )
      ) {
        return interaction.editReply({
          content:
            "⏳ Vote của bạn đang được xử lý. Vui lòng không bấm liên tục."
        });
      }

      voteLocks.add(
        voteKey
      );

      lockAcquired =
        true;

      // =====================================
      // COOLDOWN
      // =====================================

      const cooldownSeconds =
        Math.max(
          0,
          Number(
            contest.antiFraud
              ?.voteCooldownSeconds
          ) || 0
        );

      const cooldown =
        checkCooldown(
          voteKey,
          cooldownSeconds
        );

      if (
        !cooldown.allowed
      ) {
        const remainingSeconds =
          Math.max(
            1,
            Math.ceil(
              cooldown.remainingMs /
              1000
            )
          );

        await writeVoteAudit({
          guildId,

          contestId:
            contest._id,

          submissionId:
            submission._id,

          userId,

          action:
            "BLOCKED_COOLDOWN",

          reason:
            `Cooldown ${remainingSeconds}s remaining`
        });

        return interaction.editReply({
          content:
            `⏱️ Bạn thao tác Vote quá nhanh.\n` +
            `Vui lòng chờ **${remainingSeconds} giây** rồi thử lại.`
        });
      }

      // =====================================
      // EXISTING VOTE
      // =====================================

      const existingVote =
        await ContestVote.findOne({
          guildId,

          contestId:
            contest._id,

          submissionId:
            submission._id,

          userId
        });

      // =====================================
      // REMOVE VOTE
      // =====================================

      if (existingVote) {
        if (
          !contest.allowVoteRemove
        ) {
          return interaction.editReply({
            content:
              "⚠️ Bạn đã Vote bài này rồi và Event không cho phép bỏ Vote."
          });
        }

        const deletedVote =
          await ContestVote
            .findOneAndDelete({
              _id:
                existingVote._id,

              guildId,

              contestId:
                contest._id,

              submissionId:
                submission._id,

              userId
            });

        if (!deletedVote) {
          return interaction.editReply({
            content:
              "⚠️ Vote này đã được xử lý trước đó."
          });
        }

        setCooldown(
          voteKey
        );

        // =====================================
        // AUDIT REMOVE
        // =====================================

        await writeVoteAudit({
          guildId,

          contestId:
            contest._id,

          submissionId:
            submission._id,

          userId,

          action:
            "VOTE_REMOVED",

          reason:
            "User removed vote"
        });

        // =====================================
        // REAL COUNT
        // =====================================

        const realVoteCount =
          await ContestVote
            .countDocuments({
              guildId,

              contestId:
                contest._id,

              submissionId:
                submission._id
            });

        submission.voteCount =
          realVoteCount;

        await submission.save();

        await updateGalleryMessage(
          interaction,
          contest,
          submission
        );

        return interaction.editReply({
          content:
            `💔 Bạn đã bỏ Vote cho **${submission.title}**.\n` +
            `❤️ Tổng Vote hiện tại: **${realVoteCount}**`
        });
      }

      // =====================================
      // USER TOTAL VOTES
      // =====================================

      const userVoteCount =
        await ContestVote
          .countDocuments({
            guildId,

            contestId:
              contest._id,

            userId
          });

      const maxVotesPerUser =
        Math.max(
          1,
          Number(
            contest.maxVotesPerUser
          ) || 1
        );

      if (
        userVoteCount >=
        maxVotesPerUser
      ) {
        await writeVoteAudit({
          guildId,

          contestId:
            contest._id,

          submissionId:
            submission._id,

          userId,

          action:
            "BLOCKED_MAX_VOTES",

          reason:
            `Used ${userVoteCount}/${maxVotesPerUser}`
        });

        return interaction.editReply({
          content:
            `⚠️ Bạn đã sử dụng hết **${maxVotesPerUser} lượt Vote** trong Event này.`
        });
      }

      // =====================================
      // CREATE VOTE
      // =====================================

      try {
        await ContestVote.create({
          guildId,

          contestId:
            contest._id,

          submissionId:
            submission._id,

          userId
        });
      } catch (error) {
        // =====================================
        // DUPLICATE
        // =====================================

        if (
          error?.code ===
          11000
        ) {
          await writeVoteAudit({
            guildId,

            contestId:
              contest._id,

            submissionId:
              submission._id,

            userId,

            action:
              "BLOCKED_DUPLICATE",

            reason:
              "MongoDB unique index blocked duplicate vote"
          });

          return interaction.editReply({
            content:
              "⚠️ Vote của bạn đã được ghi nhận rồi."
          });
        }

        throw error;
      }

      // =====================================
      // COOLDOWN
      // =====================================

      setCooldown(
        voteKey
      );

      // =====================================
      // AUDIT ADD
      // =====================================

      await writeVoteAudit({
        guildId,

        contestId:
          contest._id,

        submissionId:
          submission._id,

        userId,

        action:
          "VOTE_ADDED",

        reason:
          "Valid vote"
      });

      // =====================================
      // REAL COUNT
      // =====================================

      const realVoteCount =
        await ContestVote
          .countDocuments({
            guildId,

            contestId:
              contest._id,

            submissionId:
              submission._id
          });

      submission.voteCount =
        realVoteCount;

      await submission.save();

      // =====================================
      // UPDATE GALLERY
      // =====================================

      await updateGalleryMessage(
        interaction,
        contest,
        submission
      );

      // =====================================
      // SUCCESS
      // =====================================

      return interaction.editReply({
        content:
          `❤️ Bạn đã Vote cho **${submission.title}**!\n` +
          `❤️ Tổng Vote hiện tại: **${realVoteCount}**`
      });
    } catch (error) {
      console.error(
        "❌ Contest Vote Error:",
        error
      );

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          return await interaction.editReply({
            content:
              "❌ Không thể xử lý Vote."
          });
        }

        return await interaction.reply({
          content:
            "❌ Không thể xử lý Vote.",

          flags:
            MessageFlags.Ephemeral
        });
      } catch {}
    } finally {
      // =====================================
      // ALWAYS RELEASE LOCK
      // =====================================

      if (
        lockAcquired &&
        voteKey
      ) {
        voteLocks.delete(
          voteKey
        );
      }
    }
  }
};