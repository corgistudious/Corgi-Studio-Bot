const EventDraft = require('../models/EventDraft');

const giveawayDefaults = () => ({
  prize: '', description: '', duration: '1h', winnerCount: 1,
  channelId: '', requiredRoleId: '', minAccountAgeDays: 0, minServerAgeDays: 0,
  minCstar: 0, joinEmoji: '🔥', imageUrl: '', imageShape: '16:9'
});
const contestDefaults = () => ({
  title: '', description: '', submissionTime: '1d', votingTime: '1d',
  eventChannelId: '', galleryChannelId: '', resultChannelId: '', requiredRoleId: '',
  maxEntriesPerUser: 1, votesPerUser: 1, allowSelfVote: false, reviewRequired: true,
  hideVoteCount: false, minAccountAgeDays: 0, minServerAgeDays: 0, topCount: 3,
  bannerUrl: '', bannerShape: '16:9'
});
async function getDraft(guildId) {
  let d = await EventDraft.findOne({ guildId });
  if (!d) d = await EventDraft.create({ guildId, giveaway: giveawayDefaults(), contest: contestDefaults() });
  d.giveaway = { ...giveawayDefaults(), ...(d.giveaway || {}) };
  d.contest = { ...contestDefaults(), ...(d.contest || {}) };
  return d;
}
async function patchDraft(guildId, kind, patch) {
  const set = {};
  for (const [k, v] of Object.entries(patch)) set[`${kind}.${k}`] = v;
  await EventDraft.updateOne({ guildId }, { $setOnInsert: { guildId }, $set: set }, { upsert: true });
  return getDraft(guildId);
}
async function resetDraft(guildId, kind) {
  const value = kind === 'giveaway' ? giveawayDefaults() : contestDefaults();
  await EventDraft.updateOne({ guildId }, { $setOnInsert: { guildId }, $set: { [kind]: value } }, { upsert: true });
  return getDraft(guildId);
}
module.exports = { getDraft, patchDraft, resetDraft, giveawayDefaults, contestDefaults };
