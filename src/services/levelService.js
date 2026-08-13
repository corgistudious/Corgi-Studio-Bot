const Level = require("../models/Level");

// =====================================
// XP CẦN THIẾT CHO LEVEL HIỆN TẠI
// =====================================

function getRequiredXp(level) {
  return 100 + level * 50;
}

// =====================================
// LẤY PROFILE LEVEL
// =====================================

async function getLevelProfile(
  guildId,
  userId
) {
  let profile = await Level.findOne({
    guildId,
    userId
  });

  if (!profile) {
    profile = await Level.create({
      guildId,
      userId
    });
  }

  return profile;
}

// =====================================
// CỘNG XP KHI NHẮN TIN
// =====================================

async function addMessageXp({
  guildId,
  userId,
  xpAmount,
  cooldownSeconds
}) {
  const profile =
    await getLevelProfile(
      guildId,
      userId
    );

  const now = Date.now();

  // ===================================
  // COOLDOWN
  // ===================================

  if (profile.lastXpAt) {
    const elapsed =
      now -
      profile.lastXpAt.getTime();

    if (
      elapsed <
      cooldownSeconds * 1000
    ) {
      profile.totalMessages += 1;

      await profile.save();

      return {
        profile,
        gainedXp: 0,
        leveledUp: false
      };
    }
  }

  // ===================================
  // ADD XP
  // ===================================

  profile.xp += xpAmount;

  profile.totalMessages += 1;

  profile.lastXpAt =
    new Date();

  let leveledUp = false;

  // ===================================
  // LEVEL UP
  // ===================================

  while (
    profile.xp >=
    getRequiredXp(
      profile.level
    )
  ) {
    profile.xp -=
      getRequiredXp(
        profile.level
      );

    profile.level += 1;

    leveledUp = true;
  }

  await profile.save();

  return {
    profile,
    gainedXp: xpAmount,
    leveledUp
  };
}

// =====================================
// LEADERBOARD
// =====================================

async function getLeaderboard(
  guildId,
  limit = 10
) {
  const profiles =
    await Level.find({
      guildId
    })
      .sort({
        level: -1,
        xp: -1,
        totalMessages: -1
      })
      .limit(limit);

  return profiles;
}

// =====================================
// VỊ TRÍ XẾP HẠNG CỦA USER
// =====================================

async function getRankPosition(
  guildId,
  userId
) {
  const profiles =
    await Level.find({
      guildId
    })
      .sort({
        level: -1,
        xp: -1,
        totalMessages: -1
      })
      .select("userId");

  const index =
    profiles.findIndex(
      (profile) =>
        String(profile.userId) ===
        String(userId)
    );

  if (index === -1) {
    return null;
  }

  return index + 1;
}

// =====================================
// EXPORT
// =====================================

module.exports = {
  getRequiredXp,
  getLevelProfile,
  addMessageXp,
  getLeaderboard,
  getRankPosition
};