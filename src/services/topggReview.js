const DEFAULT_TOPGG_VERIFICATION_GUILD_ID = '333949691962195969';

function envEnabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function topggReviewModeEnabled() {
  return envEnabled(process.env.TOPGG_REVIEW_MODE);
}

function topggVerificationGuildId() {
  return String(process.env.TOPGG_VERIFICATION_GUILD_ID || DEFAULT_TOPGG_VERIFICATION_GUILD_ID).trim();
}

function isTopggReviewGuild(guildId) {
  if (!guildId || !topggReviewModeEnabled()) return false;
  return String(guildId) === topggVerificationGuildId();
}

function getTopggReviewPremium(guildId) {
  if (!isTopggReviewGuild(guildId)) return null;
  return {
    guildId: String(guildId),
    userId: null,
    tier: 'REVIEW',
    expiresAt: null,
    source: 'topgg_review',
    reviewAccess: true,
    featureBypassOnly: true
  };
}

module.exports = {
  DEFAULT_TOPGG_VERIFICATION_GUILD_ID,
  topggReviewModeEnabled,
  topggVerificationGuildId,
  isTopggReviewGuild,
  getTopggReviewPremium
};
