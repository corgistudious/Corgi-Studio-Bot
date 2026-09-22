const Giveaway = require('../../models/Giveaway');
const Contest = require('../../models/Contest');
const { getGuildSettings } = require('../../services/guildSettings');
const { getDraft, patchDraft, resetDraft } = require('../../services/eventDraft');
const { isPremiumGuild } = require('../../services/premium');
const { mtx } = require('../../services/i18n');
const { buildGiveawayMessage } = require('../giveaway');
const { makeContestId, buildContestMessage } = require('../contest');
const UI = require('../../ui/events');

function parseDuration(v) {
  const m = /^(\d+)(m|h|d|w)$/i.exec(String(v || '').trim());
  if (!m) return null;
  return Number(m[1]) * ({ m: 60000, h: 3600000, d: 86400000, w: 604800000 }[m[2].toLowerCase()]);
}
function int(v, min, max) {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}
function validEmoji(v) { return /^\p{Extended_Pictographic}$/u.test(v) || /^<a?:\w{2,32}:\d{15,22}>$/.test(v); }
function ratioOk(att, shape) {
  if (!att?.width || !att?.height) return true;
  const ratio = att.width / att.height, target = shape === '1:1' ? 1 : 16 / 9;
  return Math.abs(ratio - target) <= 0.12;
}
async function refreshModal(i, payload, fallback) {
  if (typeof i.isFromMessage === 'function' && i.isFromMessage()) return i.update(payload);
  return i.reply({ content: fallback, flags: 64 });
}
async function saveUploadedImage(i, kind, lang) {
  const draft = await getDraft(i.guildId);
  const shape = kind === 'giveaway' ? draft.giveaway.imageShape : draft.contest.bannerShape;
  const att = i.fields.getUploadedFiles('imageFile', true)?.first();
  if (!att || !(att.contentType || '').startsWith('image/')) return i.reply({ content: mtx(lang, '❌ The uploaded file is not an image.', '❌ Tệp đã tải lên không phải ảnh.'), flags: 64 });
  if (!ratioOk(att, shape)) return i.reply({ content: mtx(lang, `❌ Image is ${att.width}×${att.height}. Please use an image close to ${shape}.`, `❌ Ảnh là ${att.width}×${att.height}. Hãy dùng ảnh gần tỷ lệ ${shape}.`), flags: 64 });
  if (kind === 'giveaway') await patchDraft(i.guildId, 'giveaway', { imageUrl: att.url });
  else await patchDraft(i.guildId, 'contest', { bannerUrl: att.url });
  return i.reply({ content: mtx(lang, '✅ Image attached directly to the draft.', '✅ Đã đính kèm ảnh trực tiếp vào bản nháp.'), flags: 64 });
}
async function publishGiveaway(i, lang) {
  const s = await getGuildSettings(i.guildId), d = (await getDraft(i.guildId)).giveaway;
  if (!s.modules.giveaway) return i.reply({ content: mtx(lang, '🎁 Giveaway module is disabled in Setup.', '🎁 Tính năng Giveaway đang tắt trong Setup.'), flags: 64 });
  const ms = parseDuration(d.duration); if (!d.prize || !d.channelId || !ms || ms < 60000) return i.reply({ content: mtx(lang, '❌ Complete Prize, Channel and a valid Duration (minimum 1m) before publishing.', '❌ Hãy điền Phần thưởng, Kênh và Thời gian hợp lệ (tối thiểu 1m) trước khi phát hành.'), flags: 64 });
  const ch = await i.guild.channels.fetch(d.channelId).catch(() => null); if (!ch?.isTextBased()) return i.reply({ content: mtx(lang, 'Selected Giveaway channel is unavailable.', 'Kênh Giveaway đã chọn không khả dụng.'), flags: 64 });
  await i.deferReply({ flags: 64 });
  const g = new Giveaway({ guildId: i.guildId, channelId: ch.id, prize: d.prize, description: d.description || '', winnerCount: d.winnerCount || 1, endsAt: new Date(Date.now() + ms), hostId: i.user.id, requiredRoleId: d.requiredRoleId || undefined, minAccountAgeDays: d.minAccountAgeDays || 0, minServerAgeDays: d.minServerAgeDays || 0, minCstar: d.minCstar || 0, joinEmoji: d.joinEmoji || '🔥', imageUrl: d.imageUrl || undefined, imageShape: d.imageShape || '16:9' });
  const msg = await ch.send(buildGiveawayMessage(g, lang)); g.messageId = msg.id; await g.save(); await msg.edit(buildGiveawayMessage(g, lang)); await resetDraft(i.guildId, 'giveaway');
  await i.editReply(mtx(lang, `🚀 Giveaway published in ${ch}. Message ID: \`${msg.id}\``, `🚀 Đã phát hành Giveaway tại ${ch}. Message ID: \`${msg.id}\``));
  await i.message.edit(await UI.buildGiveawayBuilder(i.guildId, lang)).catch(() => {});
}
async function publishContest(i, client, lang) {
  const s = await getGuildSettings(i.guildId), d = (await getDraft(i.guildId)).contest;
  if (!s.modules.contest) return i.reply({ content: mtx(lang, '🏆 Contest module is disabled in Setup.', '🏆 Tính năng Contest đang tắt trong Setup.'), flags: 64 });
  const subMs = parseDuration(d.submissionTime), voteMs = parseDuration(d.votingTime);
  if (!d.title || !d.description || !d.eventChannelId || !d.galleryChannelId || !d.resultChannelId || !subMs || subMs < 60000 || !voteMs || voteMs < 60000) return i.reply({ content: mtx(lang, '❌ Complete Title, Description, all 3 channels and valid times before publishing.', '❌ Hãy điền Tiêu đề, Mô tả, đủ 3 kênh và thời gian hợp lệ trước khi phát hành.'), flags: 64 });
  const eventCh = await i.guild.channels.fetch(d.eventChannelId).catch(() => null); if (!eventCh?.isTextBased()) return i.reply({ content: mtx(lang, 'Event channel is unavailable.', 'Kênh Sự kiện không khả dụng.'), flags: 64 });
  await i.deferReply({ flags: 64 });
  let contestId = makeContestId(); while (await Contest.exists({ contestId })) contestId = makeContestId();
  const c = await Contest.create({ contestId, guildId: i.guildId, eventChannelId: d.eventChannelId, channelId: d.eventChannelId, galleryChannelId: d.galleryChannelId, resultChannelId: d.resultChannelId, title: d.title, description: d.description, bannerUrl: d.bannerUrl || undefined, bannerShape: d.bannerShape || '16:9', status: 'SUBMISSION', submissionEndsAt: new Date(Date.now() + subMs), votingDurationMs: voteMs, createdBy: i.user.id, requiredRoleId: d.requiredRoleId || undefined, maxEntriesPerUser: d.maxEntriesPerUser || 1, votesPerUser: d.votesPerUser || 1, allowSelfVote: !!d.allowSelfVote, reviewRequired: d.reviewRequired !== false, hideVoteCount: !!d.hideVoteCount, minAccountAgeDays: d.minAccountAgeDays || 0, minServerAgeDays: d.minServerAgeDays || 0, topCount: d.topCount || 3 });
  const msg = await eventCh.send(await buildContestMessage(c, lang)); c.messageId = msg.id; await c.save(); await msg.edit(await buildContestMessage(c, lang)); await resetDraft(i.guildId, 'contest');
  await i.editReply(mtx(lang, `🚀 Contest published in ${eventCh}. ID: \`${contestId}\``, `🚀 Đã phát hành Contest tại ${eventCh}. ID: \`${contestId}\``));
  await i.message.edit(await UI.buildContestBuilder(i.guildId, lang)).catch(() => {});
}
async function handle(i, client) {
  const s = await getGuildSettings(i.guildId), lang = s.language === 'vi' ? 'vi' : 'en';
  const id = i.customId;
  if (i.isButton()) {
    if (id === 'eventcfg:home') return i.update(await UI.buildEventCenter(i.guild, s));
    if (id === 'eventcfg:giveaway') return i.update(await UI.buildGiveawayBuilder(i.guildId, lang));
    if (id === 'eventcfg:contest') return i.update(await UI.buildContestBuilder(i.guildId, lang));
    if (id === 'eventcfg:active') return i.update(await UI.buildActiveEvents(i.guildId, lang));
    if (id === 'eventcfg:gw:general') return i.showModal(await UI.giveawayGeneralModal(i.guildId, lang));
    if (id === 'eventcfg:gw:req') return i.showModal(await UI.giveawayReqModal(i.guildId, lang));
    if (id === 'eventcfg:gw:image') return i.showModal(UI.imageUploadModal('giveaway', lang));
    if (id === 'eventcfg:gw:shape') { const d = (await getDraft(i.guildId)).giveaway; await patchDraft(i.guildId, 'giveaway', { imageShape: d.imageShape === '1:1' ? '16:9' : '1:1' }); return i.update(await UI.buildGiveawayBuilder(i.guildId, lang)); }
    if (id === 'eventcfg:gw:preview') { const d = (await getDraft(i.guildId)).giveaway; return i.reply({ embeds: [UI.giveawayPreview(d, lang)], flags: 64 }); }
    if (id === 'eventcfg:gw:publish') return publishGiveaway(i, lang);
    if (id === 'eventcfg:gw:reset') { await resetDraft(i.guildId, 'giveaway'); return i.update(await UI.buildGiveawayBuilder(i.guildId, lang)); }
    if (id === 'eventcfg:ct:general') return i.showModal(await UI.contestGeneralModal(i.guildId, lang));
    if (id === 'eventcfg:ct:rules') return i.showModal(await UI.contestRulesModal(i.guildId, lang));
    if (id === 'eventcfg:ct:channels') return i.update(await UI.buildContestChannels(i.guildId, lang));
    if (id === 'eventcfg:ct:visual') return i.update(await UI.buildContestVisual(i.guildId, lang));
    if (id === 'eventcfg:ct:image') return i.showModal(UI.imageUploadModal('contest', lang));
    if (id === 'eventcfg:ct:shape') { const d = (await getDraft(i.guildId)).contest; await patchDraft(i.guildId, 'contest', { bannerShape: d.bannerShape === '1:1' ? '16:9' : '1:1' }); return i.update(await UI.buildContestVisual(i.guildId, lang)); }
    if (id === 'eventcfg:ct:selfvote' || id === 'eventcfg:ct:review' || id === 'eventcfg:ct:hidevotes') { const d = (await getDraft(i.guildId)).contest; const key = id.endsWith('selfvote') ? 'allowSelfVote' : id.endsWith('review') ? 'reviewRequired' : 'hideVoteCount'; await patchDraft(i.guildId, 'contest', { [key]: !d[key] }); return i.update(await UI.buildContestBuilder(i.guildId, lang)); }
    if (id === 'eventcfg:ct:preview') { const d = (await getDraft(i.guildId)).contest; return i.reply({ embeds: [UI.contestPreview(d, lang)], flags: 64 }); }
    if (id === 'eventcfg:ct:publish') return publishContest(i, client, lang);
    if (id === 'eventcfg:ct:reset') { await resetDraft(i.guildId, 'contest'); return i.update(await UI.buildContestBuilder(i.guildId, lang)); }
  }
  if (i.isChannelSelectMenu()) {
    if (id === 'eventcfg:gw:channel') { await patchDraft(i.guildId, 'giveaway', { channelId: i.values[0] }); return i.update(await UI.buildGiveawayBuilder(i.guildId, lang)); }
    const map = { 'eventcfg:ct:eventchannel': 'eventChannelId', 'eventcfg:ct:gallerychannel': 'galleryChannelId', 'eventcfg:ct:resultchannel': 'resultChannelId' };
    if (map[id]) { await patchDraft(i.guildId, 'contest', { [map[id]]: i.values[0] }); return i.update(await UI.buildContestChannels(i.guildId, lang)); }
  }
  if (i.isRoleSelectMenu()) {
    if (id === 'eventcfg:gw:role') { await patchDraft(i.guildId, 'giveaway', { requiredRoleId: i.values[0] || '' }); return i.update(await UI.buildGiveawayBuilder(i.guildId, lang)); }
    if (id === 'eventcfg:ct:role') { await patchDraft(i.guildId, 'contest', { requiredRoleId: i.values[0] || '' }); return i.update(await UI.buildContestChannels(i.guildId, lang)); }
  }
  if (i.isModalSubmit()) {
    if (id === 'eventcfg:gwmodal:image') return saveUploadedImage(i, 'giveaway', lang);
    if (id === 'eventcfg:ctmodal:image') return saveUploadedImage(i, 'contest', lang);
    if (id === 'eventcfg:gwmodal:general') {
      const duration = i.fields.getTextInputValue('duration').trim(), winners = int(i.fields.getTextInputValue('winners'), 1, 20);
      if (!parseDuration(duration) || !winners) return i.reply({ content: mtx(lang, '❌ Invalid duration or winner count.', '❌ Thời gian hoặc số người thắng không hợp lệ.'), flags: 64 });
      await patchDraft(i.guildId, 'giveaway', { prize: i.fields.getTextInputValue('prize').trim(), description: i.fields.getTextInputValue('description').trim(), duration, winnerCount: winners });
      return refreshModal(i, await UI.buildGiveawayBuilder(i.guildId, lang), mtx(lang, '✅ Giveaway draft saved.', '✅ Đã lưu bản nháp Giveaway.'));
    }
    if (id === 'eventcfg:gwmodal:req') {
      const account = int(i.fields.getTextInputValue('accountAge'), 0, 3650), server = int(i.fields.getTextInputValue('serverAge'), 0, 3650), cstar = int(i.fields.getTextInputValue('minCstar'), 0, 1000000000), emoji = i.fields.getTextInputValue('joinEmoji').trim() || '🔥';
      if (account === null || server === null || cstar === null || !validEmoji(emoji)) return i.reply({ content: mtx(lang, '❌ One or more requirement values are invalid.', '❌ Một hoặc nhiều giá trị điều kiện không hợp lệ.'), flags: 64 });
      if (emoji !== '🔥' && !(await isPremiumGuild(i.guildId))) return i.reply({ content: mtx(lang, '💎 Custom Join emoji requires active Corgi Premium.', '💎 Emoji Join tùy chỉnh yêu cầu Corgi Premium đang hoạt động.'), flags: 64 });
      await patchDraft(i.guildId, 'giveaway', { minAccountAgeDays: account, minServerAgeDays: server, minCstar: cstar, joinEmoji: emoji });
      return refreshModal(i, await UI.buildGiveawayBuilder(i.guildId, lang), mtx(lang, '✅ Giveaway requirements saved.', '✅ Đã lưu điều kiện Giveaway.'));
    }
    if (id === 'eventcfg:ctmodal:general') {
      const submissionTime = i.fields.getTextInputValue('submissionTime').trim(), votingTime = i.fields.getTextInputValue('votingTime').trim();
      if (!parseDuration(submissionTime) || !parseDuration(votingTime)) return i.reply({ content: mtx(lang, '❌ Invalid submission or voting duration.', '❌ Thời gian nhận bài hoặc bình chọn không hợp lệ.'), flags: 64 });
      await patchDraft(i.guildId, 'contest', { title: i.fields.getTextInputValue('title').trim(), description: i.fields.getTextInputValue('description').trim(), submissionTime, votingTime });
      return refreshModal(i, await UI.buildContestBuilder(i.guildId, lang), mtx(lang, '✅ Contest draft saved.', '✅ Đã lưu bản nháp Contest.'));
    }
    if (id === 'eventcfg:ctmodal:rules') {
      const entries = int(i.fields.getTextInputValue('entries'), 1, 10), votes = int(i.fields.getTextInputValue('votes'), 1, 20), account = int(i.fields.getTextInputValue('accountAge'), 0, 3650), server = int(i.fields.getTextInputValue('serverAge'), 0, 3650), top = int(i.fields.getTextInputValue('topCount'), 1, 10);
      if ([entries, votes, account, server, top].some(x => x === null)) return i.reply({ content: mtx(lang, '❌ One or more Contest rule values are invalid.', '❌ Một hoặc nhiều giá trị thể lệ Contest không hợp lệ.'), flags: 64 });
      await patchDraft(i.guildId, 'contest', { maxEntriesPerUser: entries, votesPerUser: votes, minAccountAgeDays: account, minServerAgeDays: server, topCount: top });
      return refreshModal(i, await UI.buildContestBuilder(i.guildId, lang), mtx(lang, '✅ Contest rules saved.', '✅ Đã lưu thể lệ Contest.'));
    }
  }
}
module.exports = { handle, parseDuration };
