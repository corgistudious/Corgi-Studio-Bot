const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Contest = require('../../models/Contest');
const ContestSubmission = require('../../models/ContestSubmission');
const ContestVote = require('../../models/ContestVote');
const { guildLang, mtx } = require('../../services/i18n');
const { getGuildSettings } = require('../../services/guildSettings');
const EventUI = require('../../ui/events');
const {
  makeContestId, findContest, buildContestMessage, checkEligibility, mediaType,
  postOrRefreshSubmission, refreshContestMessage, refreshGallery, ranking,
  buildResultsEmbed, endVoting
} = require('../../modules/contest');

function parseDuration(v) {
  const m = /^(\d+)(m|h|d|w)$/i.exec(String(v || '').trim()); if (!m) return null;
  return Number(m[1]) * ({ m: 60000, h: 3600000, d: 86400000, w: 604800000 }[m[2].toLowerCase()]);
}
function admin(i) { return i.member?.permissions?.has(PermissionFlagsBits.ManageGuild) || i.member?.permissions?.has(PermissionFlagsBits.Administrator); }
function idOpt(s) { return s.addStringOption(o => o.setName('contest_id').setDescription('Contest ID, e.g. CT-ABC123').setDescriptionLocalizations({ vi: 'ID cuộc thi, ví dụ CT-ABC123' }).setRequired(true)); }
function imageOk(att) { const t = att?.contentType || ''; return !att || t.startsWith('image/'); }
function validShape(att, shape) { if (!att?.width || !att?.height) return true; const ratio = att.width / att.height, target = shape === '1:1' ? 1 : 16 / 9; return Math.abs(ratio - target) <= 0.12; }

const data = new SlashCommandBuilder().setName('contest').setDescription('Professional Contest / Event system').setDescriptionLocalizations({ vi: 'Hệ thống Cuộc thi / Sự kiện chuyên nghiệp' })
.addSubcommand(s => s.setName('panel').setDescription('Open Contest Builder').setDescriptionLocalizations({ vi: 'Mở bảng cấu hình Contest' }))
.addSubcommand(s => idOpt(s.setName('submit').setDescription('Submit an image/video/file entry').setDescriptionLocalizations({ vi: 'Gửi bài dự thi bằng ảnh/video/file' }))
  .addAttachmentOption(o => o.setName('file').setDescription('Upload your contest file directly').setDescriptionLocalizations({ vi: 'Upload file dự thi trực tiếp' }).setRequired(true))
  .addStringOption(o => o.setName('caption').setDescription('Entry caption / description').setDescriptionLocalizations({ vi: 'Mô tả bài dự thi' }).setMaxLength(1000)))
.addSubcommand(s => idOpt(s.setName('approve').setDescription('Approve one pending entry').setDescriptionLocalizations({ vi: 'Duyệt một bài đang chờ' }))
  .addStringOption(o => o.setName('entry_id').setDescription('Entry ID').setDescriptionLocalizations({ vi: 'ID bài dự thi' }).setRequired(true)))
.addSubcommand(s => idOpt(s.setName('reject').setDescription('Reject one pending entry').setDescriptionLocalizations({ vi: 'Từ chối một bài đang chờ' }))
  .addStringOption(o => o.setName('entry_id').setDescription('Entry ID').setDescriptionLocalizations({ vi: 'ID bài dự thi' }).setRequired(true))
  .addStringOption(o => o.setName('reason').setDescription('Optional rejection reason').setDescriptionLocalizations({ vi: 'Lý do từ chối (tùy chọn)' }).setMaxLength(500)))
.addSubcommand(s => idOpt(s.setName('approve_all').setDescription('Approve all pending entries').setDescriptionLocalizations({ vi: 'Duyệt toàn bộ bài đang chờ' })))
.addSubcommand(s => idOpt(s.setName('close_submissions').setDescription('Close submissions and enter review').setDescriptionLocalizations({ vi: 'Đóng nhận bài và chuyển sang duyệt' })))
.addSubcommand(s => idOpt(s.setName('open_vote').setDescription('Open voting after review').setDescriptionLocalizations({ vi: 'Mở bình chọn sau khi duyệt' })))
.addSubcommand(s => idOpt(s.setName('end_vote').setDescription('Close voting and calculate ranking').setDescriptionLocalizations({ vi: 'Khóa bình chọn và tính xếp hạng' })))
.addSubcommand(s => idOpt(s.setName('results').setDescription('Show current/final ranking').setDescriptionLocalizations({ vi: 'Xem bảng xếp hạng hiện tại/kết quả' })))
.addSubcommand(s => idOpt(s.setName('publish').setDescription('Publish final results').setDescriptionLocalizations({ vi: 'Công bố kết quả chính thức' })))
.addSubcommand(s => idOpt(s.setName('cancel').setDescription('Cancel this contest').setDescriptionLocalizations({ vi: 'Hủy cuộc thi' })));

module.exports = {
  data, prefix: ['contest'],
  async execute(i, client) {
    const lang = await guildLang(i.guildId), sub = i.options.getSubcommand();
    const adminSubs = new Set(['panel', 'approve', 'reject', 'approve_all', 'close_submissions', 'open_vote', 'end_vote', 'publish', 'cancel']);
    if (adminSubs.has(sub) && !admin(i)) return i.reply({ content: mtx(lang, 'You need Manage Server or Administrator for this action.', 'Bạn cần quyền Quản lý Server hoặc Administrator để thực hiện thao tác này.'), flags: 64 });

    if (sub === 'panel') { const settings = await getGuildSettings(i.guildId); return i.reply({ ...(await EventUI.buildContestBuilder(i.guildId, settings.language)), flags: 64 }); }

    const c = await findContest(i.guildId, i.options.getString('contest_id'));
    if (!c) return i.reply({ content: mtx(lang, 'Contest not found.', 'Không tìm thấy cuộc thi.'), flags: 64 });

    if (sub === 'submit') {
      if (c.status !== 'SUBMISSION' || (c.submissionEndsAt && c.submissionEndsAt <= new Date())) return i.reply({ content: mtx(lang, 'Submissions are closed for this contest.', 'Cuộc thi này đã đóng nhận bài.'), flags: 64 });
      const check = await checkEligibility(c, i.member, lang); if (!check.ok) return i.reply({ content: `❌ ${check.reason}`, flags: 64 });
      const used = await ContestSubmission.countDocuments({ contestId: c.contestId, userId: i.user.id, status: { $ne: 'REJECTED' } });
      if (used >= c.maxEntriesPerUser) return i.reply({ content: mtx(lang, `You reached the limit of ${c.maxEntriesPerUser} entry/entries.`, `Bạn đã đạt giới hạn ${c.maxEntriesPerUser} bài dự thi.`), flags: 64 });
      const att = i.options.getAttachment('file'); if (!att) return i.reply({ content: mtx(lang, 'Please upload a file.', 'Hãy upload một file.'), flags: 64 });
      await i.deferReply({ flags: 64 });
      const entryNo = (await ContestSubmission.countDocuments({ contestId: c.contestId })) + 1, entryId = `${c.contestId}-E${String(entryNo).padStart(3, '0')}`;
      const row = await ContestSubmission.create({ guildId: i.guildId, contestId: c.contestId, userId: i.user.id, entryNo, entryId, caption: i.options.getString('caption') || '', mediaUrl: att.url, mediaType: mediaType(att), fileName: att.name, status: c.reviewRequired ? 'PENDING' : 'APPROVED' });
      if (row.status === 'APPROVED') await postOrRefreshSubmission(client, c, row, lang); await refreshContestMessage(client, c, lang);
      return i.editReply(mtx(lang, row.status === 'PENDING' ? `✅ Entry \`${entryId}\` submitted and is waiting for admin review.` : `✅ Entry \`${entryId}\` approved automatically and posted to the Gallery.`, row.status === 'PENDING' ? `✅ Bài \`${entryId}\` đã gửi và đang chờ Admin duyệt.` : `✅ Bài \`${entryId}\` đã được duyệt tự động và đăng lên Gallery.`));
    }

    if (sub === 'approve' || sub === 'reject') {
      const entryId = i.options.getString('entry_id'); const row = await ContestSubmission.findOne({ contestId: c.contestId, entryId });
      if (!row) return i.reply({ content: mtx(lang, 'Entry not found.', 'Không tìm thấy bài dự thi.'), flags: 64 });
      if (sub === 'approve') { row.status = 'APPROVED'; row.reviewReason = ''; row.reviewedBy = i.user.id; row.reviewedAt = new Date(); await row.save(); await postOrRefreshSubmission(client, c, row, lang); await refreshContestMessage(client, c, lang); return i.reply({ content: mtx(lang, `✅ Approved \`${entryId}\` and posted/refreshed in Gallery.`, `✅ Đã duyệt \`${entryId}\` và đăng/cập nhật trên Gallery.`), flags: 64 }); }
      row.status = 'REJECTED'; row.reviewReason = i.options.getString('reason') || ''; row.reviewedBy = i.user.id; row.reviewedAt = new Date(); await row.save(); await refreshContestMessage(client, c, lang); return i.reply({ content: mtx(lang, `❌ Rejected \`${entryId}\`.`, `❌ Đã từ chối \`${entryId}\`.`), flags: 64 });
    }

    if (sub === 'approve_all') {
      const rows = await ContestSubmission.find({ contestId: c.contestId, status: 'PENDING' }); for (const row of rows) { row.status = 'APPROVED'; row.reviewedBy = i.user.id; row.reviewedAt = new Date(); await row.save(); await postOrRefreshSubmission(client, c, row, lang); } await refreshContestMessage(client, c, lang);
      return i.reply({ content: mtx(lang, `✅ Approved ${rows.length} pending entry/entries.`, `✅ Đã duyệt ${rows.length} bài đang chờ.`), flags: 64 });
    }

    if (sub === 'close_submissions') { if (c.status !== 'SUBMISSION') return i.reply({ content: mtx(lang, 'Contest is not accepting submissions.', 'Cuộc thi hiện không ở giai đoạn nhận bài.'), flags: 64 }); c.status = 'REVIEW'; await c.save(); await refreshContestMessage(client, c, lang); return i.reply({ content: mtx(lang, '🔒 Submissions closed. Contest is now in review.', '🔒 Đã đóng nhận bài. Cuộc thi chuyển sang giai đoạn duyệt.'), flags: 64 }); }

    if (sub === 'open_vote') {
      if (!['REVIEW', 'SUBMISSION'].includes(c.status)) return i.reply({ content: mtx(lang, 'Voting cannot be opened from the current stage.', 'Không thể mở bình chọn từ giai đoạn hiện tại.'), flags: 64 });
      const pending = await ContestSubmission.countDocuments({ contestId: c.contestId, status: 'PENDING' }); if (pending) return i.reply({ content: mtx(lang, `There are still ${pending} pending entries. Approve or reject them first.`, `Vẫn còn ${pending} bài đang chờ duyệt. Hãy duyệt hoặc từ chối trước.`), flags: 64 });
      const approved = await ContestSubmission.countDocuments({ contestId: c.contestId, status: 'APPROVED' }); if (!approved) return i.reply({ content: mtx(lang, 'No approved entries are available for voting.', 'Không có bài đã duyệt để mở bình chọn.'), flags: 64 });
      c.status = 'VOTING'; c.votingEndsAt = new Date(Date.now() + (c.votingDurationMs || 86400000)); await c.save(); await refreshContestMessage(client, c, lang); await refreshGallery(client, c, lang);
      return i.reply({ content: mtx(lang, `❤️ Voting is open until <t:${Math.floor(c.votingEndsAt.getTime() / 1000)}:F>.`, `❤️ Đã mở bình chọn đến <t:${Math.floor(c.votingEndsAt.getTime() / 1000)}:F>.`), flags: 64 });
    }

    if (sub === 'end_vote') { if (c.status !== 'VOTING') return i.reply({ content: mtx(lang, 'Voting is not currently open.', 'Bình chọn hiện không mở.'), flags: 64 }); await i.deferReply({ flags: 64 }); const rows = await endVoting(client, c); return i.editReply(mtx(lang, `🏁 Voting closed. ${rows.length} approved entries ranked.`, `🏁 Đã khóa bình chọn. ${rows.length} bài đã được xếp hạng.`)); }

    if (sub === 'results') { const rows = await ranking(c, 10); return i.reply({ embeds: [buildResultsEmbed(c, rows, lang)], flags: 64 }); }

    if (sub === 'publish') {
      if (!['ENDED', 'PUBLISHED'].includes(c.status)) return i.reply({ content: mtx(lang, 'End voting before publishing results.', 'Hãy kết thúc bình chọn trước khi công bố kết quả.'), flags: 64 });
      const rows = await ranking(c, c.topCount || 3); const ch = await client.channels.fetch(c.resultChannelId || c.eventChannelId || c.channelId).catch(() => null); if (!ch?.isTextBased()) return i.reply({ content: mtx(lang, 'Result channel is unavailable.', 'Kênh kết quả không khả dụng.'), flags: 64 });
      await ch.send({ embeds: [buildResultsEmbed(c, rows, lang)] }); c.status = 'PUBLISHED'; c.publishedAt = new Date(); await c.save(); await refreshContestMessage(client, c, lang); return i.reply({ content: mtx(lang, `🏆 Results published in ${ch}.`, `🏆 Đã công bố kết quả tại ${ch}.`), flags: 64 });
    }

    if (sub === 'cancel') { c.status = 'CANCELLED'; await c.save(); await refreshContestMessage(client, c, lang); await refreshGallery(client, c, lang); return i.reply({ content: mtx(lang, '❌ Contest cancelled.', '❌ Đã hủy cuộc thi.'), flags: 64 }); }
  },
  async executePrefix(m) { const lang = await guildLang(m.guildId); return m.reply(mtx(lang, '🏆 Use `/setup` → **Events** → **Contest Builder** to configure a Contest. Members still submit with `/contest submit`.', '🏆 Dùng `/setup` → **Sự kiện** → **Tạo Contest** để cấu hình. Thành viên vẫn gửi bài bằng `/contest submit`.')); }
};
