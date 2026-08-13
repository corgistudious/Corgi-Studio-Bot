const ModerationCase =
  require("../models/ModerationCase");

// =====================================
// CONFIG
// =====================================

const MAX_CASE_CREATE_RETRIES = 5;

// =====================================
// GET NEXT CASE ID
// =====================================

async function getNextCaseId(
  guildId
) {
  const latest =
    await ModerationCase
      .findOne({
        guildId:
          String(guildId)
      })
      .sort({
        caseId: -1
      })
      .lean();

  return latest
    ? Number(latest.caseId) + 1
    : 1;
}

// =====================================
// CREATE MODERATION CASE
// =====================================

async function createModerationCase({
  guildId,
  targetUserId,
  moderatorUserId,
  type,
  reason,
  duration = null,
  active = true
}) {
  const safeGuildId =
    String(guildId);

  const safeTargetUserId =
    String(targetUserId);

  const safeModeratorUserId =
    String(moderatorUserId);

  const safeType =
    String(type)
      .trim()
      .toUpperCase();

  const safeReason =
    reason?.trim() ||
    "Không có lý do.";

  const safeDuration =
    duration === null
      ? null
      : Number(duration);

  const safeActive =
    Boolean(active);

  // =====================================
  // RETRY LOOP
  //
  // Trường hợp 2 moderation action chạy
  // cùng lúc và cùng lấy một Case ID:
  //
  // MongoDB unique index sẽ chặn duplicate,
  // sau đó service tự lấy Case ID mới.
  // =====================================

  for (
    let attempt = 1;
    attempt <= MAX_CASE_CREATE_RETRIES;
    attempt++
  ) {
    const caseId =
      await getNextCaseId(
        safeGuildId
      );

    try {
      const moderationCase =
        await ModerationCase.create({
          guildId:
            safeGuildId,

          caseId,

          targetUserId:
            safeTargetUserId,

          moderatorUserId:
            safeModeratorUserId,

          type:
            safeType,

          reason:
            safeReason,

          duration:
            safeDuration,

          active:
            safeActive
        });

      console.log(
        `📋 Moderation Case #${moderationCase.caseId} | ` +
        `${moderationCase.type} | ` +
        `${safeGuildId}/${safeTargetUserId}`
      );

      return moderationCase;
    } catch (error) {
      // =====================================
      // DUPLICATE CASE ID
      // =====================================

      const isDuplicateCaseId =
        error?.code === 11000;

      if (
        isDuplicateCaseId &&
        attempt <
          MAX_CASE_CREATE_RETRIES
      ) {
        console.warn(
          `⚠️ Case ID collision tại Guild ${safeGuildId}. ` +
          `Đang thử lại (${attempt}/${MAX_CASE_CREATE_RETRIES})...`
        );

        continue;
      }

      // =====================================
      // RETRIES EXHAUSTED
      // =====================================

      if (
        isDuplicateCaseId &&
        attempt ===
          MAX_CASE_CREATE_RETRIES
      ) {
        console.error(
          `❌ Không thể cấp Case ID sau ${MAX_CASE_CREATE_RETRIES} lần thử | ` +
          `Guild: ${safeGuildId}`
        );
      }

      throw error;
    }
  }

  // Về lý thuyết không chạy tới đây.
  throw new Error(
    "MODERATION_CASE_CREATE_FAILED"
  );
}

// =====================================
// GET USER CASES
// =====================================

async function getUserCases(
  guildId,
  userId,
  limit = 50
) {
  const safeLimit =
    Math.max(
      1,
      Math.min(
        Number(limit) || 50,
        100
      )
    );

  return ModerationCase
    .find({
      guildId:
        String(guildId),

      targetUserId:
        String(userId)
    })
    .sort({
      createdAt: -1
    })
    .limit(
      safeLimit
    );
}

// =====================================
// GET CASE BY ID
// =====================================

async function getModerationCase(
  guildId,
  caseId
) {
  return ModerationCase.findOne({
    guildId:
      String(guildId),

    caseId:
      Number(caseId)
  });
}

// =====================================
// GET RECENT GUILD CASES
// =====================================

async function getRecentCases(
  guildId,
  limit = 20
) {
  const safeLimit =
    Math.max(
      1,
      Math.min(
        Number(limit) || 20,
        100
      )
    );

  return ModerationCase
    .find({
      guildId:
        String(guildId)
    })
    .sort({
      createdAt: -1
    })
    .limit(
      safeLimit
    );
}

// =====================================
// UPDATE CASE ACTIVE STATUS
// =====================================

async function setCaseActive(
  guildId,
  caseId,
  active
) {
  return ModerationCase.findOneAndUpdate(
    {
      guildId:
        String(guildId),

      caseId:
        Number(caseId)
    },

    {
      $set: {
        active:
          Boolean(active)
      }
    },

    {
      new: true
    }
  );
}

// =====================================
// EXPORT
// =====================================

module.exports = {
  getNextCaseId,
  createModerationCase,
  getUserCases,
  getModerationCase,
  getRecentCases,
  setCaseActive
};