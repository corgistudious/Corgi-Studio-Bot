const ContestVoteAudit =
  require("../models/ContestVoteAudit");

// =====================================
// SUSPICION SCORE
// =====================================

function calculateScore(stats) {
  let score = 0;

  // Tài khoản chưa đủ tuổi từng cố Vote
  score +=
    stats.blockedAccountAge * 5;

  // Member chưa đủ thời gian trong Server
  score +=
    stats.blockedJoinAge * 4;

  // Spam cooldown
  score +=
    stats.blockedCooldown * 2;

  // Duplicate attempts
  score +=
    stats.blockedDuplicate * 4;

  // Cố vượt giới hạn Vote
  score +=
    stats.blockedMaxVotes * 3;

  // Vote rồi bỏ liên tục
  if (
    stats.voteRemoved >= 3
  ) {
    score += 3;
  }

  // Rất nhiều thao tác Vote
  if (
    stats.totalActions >= 10
  ) {
    score += 2;
  }

  return score;
}

// =====================================
// RISK LEVEL
// =====================================

function getRiskLevel(score) {
  if (score >= 15) {
    return "HIGH";
  }

  if (score >= 7) {
    return "MEDIUM";
  }

  if (score >= 3) {
    return "LOW";
  }

  return "NORMAL";
}

// =====================================
// SCAN CONTEST
// =====================================

async function scanContestFraud({
  guildId,
  contestId
}) {
  const audits =
    await ContestVoteAudit
      .find({
        guildId:
          String(guildId),

        contestId
      })
      .sort({
        createdAt: 1
      })
      .lean();

  const users =
    new Map();

  for (const audit of audits) {
    const userId =
      String(
        audit.userId
      );

    if (
      !users.has(userId)
    ) {
      users.set(
        userId,
        {
          userId,

          voteAdded: 0,
          voteRemoved: 0,

          blockedAccountAge: 0,
          blockedJoinAge: 0,
          blockedCooldown: 0,
          blockedMaxVotes: 0,
          blockedDuplicate: 0,

          totalActions: 0,

          firstActionAt: null,
          lastActionAt: null
        }
      );
    }

    const stats =
      users.get(userId);

    stats.totalActions += 1;

    if (
      !stats.firstActionAt
    ) {
      stats.firstActionAt =
        audit.createdAt;
    }

    stats.lastActionAt =
      audit.createdAt;

    switch (audit.action) {
      case "VOTE_ADDED":
        stats.voteAdded += 1;
        break;

      case "VOTE_REMOVED":
        stats.voteRemoved += 1;
        break;

      case "BLOCKED_ACCOUNT_AGE":
        stats.blockedAccountAge += 1;
        break;

      case "BLOCKED_JOIN_AGE":
        stats.blockedJoinAge += 1;
        break;

      case "BLOCKED_COOLDOWN":
        stats.blockedCooldown += 1;
        break;

      case "BLOCKED_MAX_VOTES":
        stats.blockedMaxVotes += 1;
        break;

      case "BLOCKED_DUPLICATE":
        stats.blockedDuplicate += 1;
        break;
    }
  }

  const results =
    [];

  for (
    const stats
    of users.values()
  ) {
    const score =
      calculateScore(
        stats
      );

    results.push({
      ...stats,

      score,

      risk:
        getRiskLevel(
          score
        )
    });
  }

  results.sort(
    (a, b) =>
      b.score -
      a.score
  );

  return {
    totalAuditEvents:
      audits.length,

    totalUsers:
      results.length,

    suspiciousUsers:
      results.filter(
        (item) =>
          item.score >= 3
      ),

    allUsers:
      results
  };
}

// =====================================
// EXPORT
// =====================================

module.exports = {
  scanContestFraud,
  getRiskLevel
};