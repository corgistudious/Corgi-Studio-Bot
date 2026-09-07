const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');
const Contest = require('../../models/Contest');
const ContestSubmission = require('../../models/ContestSubmission');
const ContestVote = require('../../models/ContestVote');
const { isGuildOperational } = require('../../services/accessControl');
const { getGuildSettings } = require('../../services/guildSettings');
const { pick } = require('../../services/i18n');

function makeContestId() {
  return `CT-${Date.now().toString(36).slice(-5).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}
function statusLabel(status, lang) {
  const map = {
    DRAFT: ['⚪ DRAFT', '⚪ BẢN NHÁP'], SUBMISSION: ['🟢 SUBMISSIONS OPEN', '🟢 ĐANG NHẬN BÀI'], REVIEW: ['🟡 REVIEW', '🟡 ĐANG DUYỆT'],
    VOTING: ['❤️ VOTING OPEN', '❤️ ĐANG BÌNH CHỌN'], ENDED: ['🏁 ENDED', '🏁 ĐÃ KẾT THÚC'], PUBLISHED: ['🏆 PUBLISHED', '🏆 ĐÃ CÔNG BỐ'],
    CANCELLED: ['❌ CANCELLED', '❌ ĐÃ HỦY'], open: ['🟢 SUBMISSIONS OPEN', '🟢 ĐANG NHẬN BÀI'], ended: ['🏁 ENDED', '🏁 ĐÃ KẾT THÚC']
  };
  const v = map[status] || [status, status]; return pick(lang, v[0], v[1]);
}
async function findContest(guildId, raw) {
  const id = String(raw || '').trim();
  if (!id) return null;
  let c = await Contest.findOne({ guildId, contestId: id }).catch(() => null);
  if (!c) c = await Contest.findOne({ guildId, messageId: id }).catch(() => null);
  if (!c && mongoose.isValidObjectId(id)) c = await Contest.findOne({ _id: id, guildId }).catch(() => null);
  return c;
}
function eligibilityLines(c, lang) {
  const a = [];
  if (c.requiredRoleId) a.push(`• ${pick(lang, 'Required role', 'Role bắt buộc')}: <@&${c.requiredRoleId}>`);
  if (c.minAccountAgeDays > 0) a.push(`• ${pick(lang, 'Discord account age', 'Tuổi tài khoản Discord')} ≥ **${c.minAccountAgeDays} ${pick(lang, 'days', 'ngày')}**`);
  if (c.minServerAgeDays > 0) a.push(`• ${pick(lang, 'Server membership', 'Thời gian trong server')} ≥ **${c.minServerAgeDays} ${pick(lang, 'days', 'ngày')}**`);
  return a.length ? a : [`• ${pick(lang, 'No extra eligibility requirements', 'Không có điều kiện bổ sung')}`];
}
async function counts(c) {
  const [pending, approved, rejected] = await Promise.all([
    ContestSubmission.countDocuments({ contestId: c.contestId, status: 'PENDING' }),
    ContestSubmission.countDocuments({ contestId: c.contestId, status: 'APPROVED' }),
    ContestSubmission.countDocuments({ contestId: c.contestId, status: { $in: ['REJECTED', 'DISQUALIFIED'] } })
  ]);
  return { pending, approved, rejected, total: pending + approved + rejected };
}
async function buildContestMessage(c, lang = 'en') {
  const n = await counts(c);
  let timing = statusLabel(c.status, lang);
  if (c.status === 'SUBMISSION' && c.submissionEndsAt) timing = `<t:${Math.floor(c.submissionEndsAt.getTime() / 1000)}:R> • <t:${Math.floor(c.submissionEndsAt.getTime() / 1000)}:F>`;
  if (c.status === 'VOTING' && c.votingEndsAt) timing = `<t:${Math.floor(c.votingEndsAt.getTime() / 1000)}:R> • <t:${Math.floor(c.votingEndsAt.getTime() / 1000)}:F>`;
  const e = new EmbedBuilder().setTitle(`🏆 ${c.title}`).setDescription(c.description || pick(lang, 'Submit your best entry and compete for the top ranking.', 'Gửi tác phẩm tốt nhất và cạnh tranh vị trí xếp hạng cao nhất.')).addFields(
    { name: `📌 ${pick(lang, 'Status', 'Trạng thái')}`, value: `**${statusLabel(c.status, lang)}**`, inline: true },
    { name: `📥 ${pick(lang, 'Approved entries', 'Bài đã duyệt')}`, value: `**${n.approved}**`, inline: true },
    { name: `🕒 ${pick(lang, c.status === 'VOTING' ? 'Voting ends' : 'Stage ends', c.status === 'VOTING' ? 'Kết thúc bình chọn' : 'Kết thúc giai đoạn')}`, value: timing, inline: false },
    { name: `📋 ${pick(lang, 'Eligibility', 'Điều kiện')}`, value: eligibilityLines(c, lang).join('\n'), inline: false },
    { name: `⚙️ ${pick(lang, 'Rules', 'Thể lệ')}`, value: `${pick(lang, 'Entries per member', 'Bài mỗi thành viên')}: **${c.maxEntriesPerUser}**\n${pick(lang, 'Votes per voter', 'Phiếu mỗi người')}: **${c.votesPerUser}**\n${pick(lang, 'Self vote', 'Tự bình chọn')}: **${c.allowSelfVote ? pick(lang, 'Allowed', 'Cho phép') : pick(lang, 'Disabled', 'Không cho phép')}**`, inline: false }
  );
  if (c.bannerUrl) e.setImage(c.bannerUrl);
  e.setFooter({ text: `Corgi Studio • Contest ${c.contestId || c.id}` }).setTimestamp();
  const canSubmit = c.status === 'SUBMISSION';
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`contest:submit:${c.contestId || c.id}`).setEmoji('📥').setLabel(pick(lang, 'Submit Entry', 'Gửi bài')).setStyle(ButtonStyle.Primary).setDisabled(!canSubmit),
    new ButtonBuilder().setCustomId(`contest:info:${c.contestId || c.id}`).setEmoji('ℹ️').setLabel(pick(lang, 'How to Submit', 'Cách gửi bài')).setStyle(ButtonStyle.Secondary)
  );
  return { embeds: [e], components: [row] };
}
async function checkEligibility(c, member, lang) {
  if (!member) return { ok: false, reason: pick(lang, 'You are no longer in this server.', 'Bạn không còn ở trong server.') };
  if (member.user.bot) return { ok: false, reason: pick(lang, 'Bots cannot participate.', 'Bot không thể tham gia.') };
  if (c.requiredRoleId && !member.roles.cache.has(c.requiredRoleId)) return { ok: false, reason: pick(lang, `Required role: <@&${c.requiredRoleId}>.`, `Bạn cần role <@&${c.requiredRoleId}>.`) };
  const now = Date.now();
  if (c.minAccountAgeDays > 0 && now - member.user.createdTimestamp < c.minAccountAgeDays * 86400000) return { ok: false, reason: pick(lang, `Your Discord account must be at least ${c.minAccountAgeDays} days old.`, `Tài khoản Discord phải đủ ít nhất ${c.minAccountAgeDays} ngày.`) };
  if (c.minServerAgeDays > 0 && (!member.joinedTimestamp || now - member.joinedTimestamp < c.minServerAgeDays * 86400000)) return { ok: false, reason: pick(lang, `You must be in this server for at least ${c.minServerAgeDays} days.`, `Bạn phải ở server ít nhất ${c.minServerAgeDays} ngày.`) };
  return { ok: true };
}
function mediaType(att) { const t = att?.contentType || ''; if (t.startsWith('image/')) return 'image'; if (t.startsWith('video/')) return 'video'; return 'file'; }
async function buildSubmissionMessage(c, s, lang = 'en') {
  const voteLabel = pick(lang, 'Vote', 'Bình chọn');
  const e = new EmbedBuilder().setTitle(`🎨 ${pick(lang, 'Contest Entry', 'Bài dự thi')} #${String(s.entryNo).padStart(3, '0')}`).setDescription(s.caption || pick(lang, 'No caption provided.', 'Không có mô tả.')).addFields(
    { name: `👤 ${pick(lang, 'Author', 'Tác giả')}`, value: `<@${s.userId}>`, inline: true },
    { name: '🆔 Entry ID', value: `\`${s.entryId}\``, inline: true },
    { name: `❤️ ${pick(lang, 'Votes', 'Bình chọn')}`, value: c.hideVoteCount && c.status === 'VOTING' ? `**${pick(lang, 'Hidden', 'Đang ẩn')}**` : `**${s.voteCount || 0}**`, inline: true }
  ).setFooter({ text: `Corgi Studio • ${c.contestId}` }).setTimestamp();
  if (s.mediaType === 'image') e.setImage(s.mediaUrl); else e.addFields({ name: `📎 ${pick(lang, 'Media', 'Tệp dự thi')}`, value: `[${s.fileName || pick(lang, 'Open file', 'Mở tệp')}](${s.mediaUrl})` });
  const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`contest:vote:${s._id}`).setEmoji('❤️').setLabel(voteLabel).setStyle(ButtonStyle.Danger).setDisabled(c.status !== 'VOTING' || s.status !== 'APPROVED'));
  return { embeds: [e], components: [row] };
}
async function postOrRefreshSubmission(client, c, s, lang) {
  const ch = await client.channels.fetch(c.galleryChannelId || c.eventChannelId || c.channelId).catch(() => null); if (!ch?.isTextBased()) return null;
  const payload = await buildSubmissionMessage(c, s, lang);
  let msg = s.galleryMessageId ? await ch.messages.fetch(s.galleryMessageId).catch(() => null) : null;
  if (msg) await msg.edit(payload).catch(() => {}); else { msg = await ch.send(payload); s.galleryMessageId = msg.id; await s.save(); }
  return msg;
}
async function refreshContestMessage(client, c, lang) {
  const ch = await client.channels.fetch(c.eventChannelId || c.channelId).catch(() => null); if (!ch?.isTextBased() || !c.messageId) return;
  const msg = await ch.messages.fetch(c.messageId).catch(() => null); if (msg) await msg.edit(await buildContestMessage(c, lang)).catch(() => {});
}
async function refreshGallery(client, c, lang) {
  const rows = await ContestSubmission.find({ contestId: c.contestId, status: 'APPROVED' });
  for (const s of rows) await postOrRefreshSubmission(client, c, s, lang).catch(() => {});
}
async function ranking(c, limit) { return ContestSubmission.find({ contestId: c.contestId, status: 'APPROVED' }).sort({ voteCount: -1, createdAt: 1 }).limit(limit || c.topCount || 10); }
function buildResultsEmbed(c, rows, lang = 'en') {
  const medals = ['🥇', '🥈', '🥉'];
  let prev = null, rank = 0, shown = 0;
  const lines = rows.map((s, idx) => { if (prev === null || s.voteCount < prev) rank = idx + 1; prev = s.voteCount; shown++; return `${medals[rank - 1] || `**#${rank}**`} <@${s.userId}> • **${s.voteCount}** ❤️ • \`${s.entryId}\``; });
  const e = new EmbedBuilder().setTitle(`🏆 ${pick(lang, 'Contest Results', 'Kết quả Cuộc thi')} • ${c.title}`).setDescription(lines.length ? lines.join('\n') : pick(lang, 'No approved entries were available for ranking.', 'Không có bài đã duyệt để xếp hạng.')).addFields({ name: `📊 ${pick(lang, 'Ranking', 'Xếp hạng')}`, value: pick(lang, `Top ${shown} by verified votes`, `Top ${shown} theo số phiếu hợp lệ`) }).setFooter({ text: `Corgi Studio • ${c.contestId}` }).setTimestamp();
  if (c.bannerUrl) e.setThumbnail(c.bannerUrl); return e;
}
async function endVoting(client, c, { publish = false } = {}) {
  if (!['VOTING', 'ENDED'].includes(c.status)) return [];
  if (c.status === 'VOTING') { c.status = 'ENDED'; c.endedAt = new Date(); await c.save(); }
  const s = await getGuildSettings(c.guildId); const lang = s?.language === 'vi' ? 'vi' : 'en';
  await refreshContestMessage(client, c, lang); await refreshGallery(client, c, lang);
  const rows = await ranking(c, Math.max(c.topCount || 3, 10));
  if (publish) {
    const ch = await client.channels.fetch(c.resultChannelId || c.eventChannelId || c.channelId).catch(() => null);
    if (ch?.isTextBased()) await ch.send({ embeds: [buildResultsEmbed(c, rows.slice(0, c.topCount || 3), lang)] }).catch(() => {});
    c.status = 'PUBLISHED'; c.publishedAt = new Date(); await c.save(); await refreshContestMessage(client, c, lang);
  }
  return rows;
}
function startContestService(client) {
  setInterval(async () => {
    try {
      const now = new Date();
      const submissions = await Contest.find({ status: 'SUBMISSION', submissionEndsAt: { $lte: now } });
      for (const c of submissions) { if (!(await isGuildOperational(c.guildId))) continue; c.status = 'REVIEW'; await c.save(); const s = await getGuildSettings(c.guildId); await refreshContestMessage(client, c, s?.language === 'vi' ? 'vi' : 'en'); }
      const voting = await Contest.find({ status: 'VOTING', votingEndsAt: { $lte: now } });
      for (const c of voting) if (await isGuildOperational(c.guildId)) await endVoting(client, c, { publish: true });
    } catch (e) { console.error('Contest service:', e); }
  }, 10000).unref();
}
module.exports = { makeContestId, findContest, buildContestMessage, buildSubmissionMessage, checkEligibility, mediaType, postOrRefreshSubmission, refreshContestMessage, refreshGallery, ranking, buildResultsEmbed, endVoting, startContestService };
