const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType,
  ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');
const { AMBER } = require('./theme');
const { pick } = require('../services/i18n');
const { getDraft } = require('../services/eventDraft');
const Giveaway = require('../models/Giveaway');
const Contest = require('../models/Contest');
const { premiumPanelVisual } = require('../services/premiumVisual');
async function panelPayload(guildId,e,components=[]){const x=await premiumPanelVisual(guildId,e);return {embeds:[x.embed],components,files:x.files};}

function L(lang, en, vi) { return pick(lang, en, vi); }
function v(x, fallback = '—') { return x === undefined || x === null || x === '' ? fallback : String(x); }
function yn(lang, x) { return x ? L(lang, 'ON', 'BẬT') : L(lang, 'OFF', 'TẮT'); }
function backEvents(lang) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('eventcfg:home').setEmoji('⬅️').setLabel(L(lang, 'Back to Event Center', 'Quay lại Trung tâm Sự kiện')).setStyle(ButtonStyle.Secondary)
  );
}
function backSetup(lang) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('setup:home').setEmoji('⬅️').setLabel(L(lang, 'Back to Control Center', 'Quay lại Trung tâm điều khiển')).setStyle(ButtonStyle.Secondary)
  );
}
async function buildEventCenter(guild, s) {
  const lang = s.language;
  const [ga, ca] = await Promise.all([
    Giveaway.countDocuments({ guildId: guild.id, status: { $in: ['active', 'paused'] } }),
    Contest.countDocuments({ guildId: guild.id, status: { $in: ['SUBMISSION', 'REVIEW', 'VOTING', 'ENDED'] } })
  ]);
  const e = new EmbedBuilder().setColor(AMBER)
    .setTitle(L(lang, '🟠 CORGI-BOT • EVENT CONTROL CENTER', '🟠 CORGI-BOT • TRUNG TÂM SỰ KIỆN'))
    .setDescription(L(lang,
      'Create and manage professional Giveaway and Contest events from buttons, menus and forms — no long command syntax required.',
      'Tạo và quản lý Giveaway / Contest chuyên nghiệp bằng nút, menu và biểu mẫu — không cần nhập cú pháp lệnh dài.'))
    .addFields(
      { name: '🎁 Giveaway', value: L(lang, `Active: **${ga}**\nOpen the Builder to configure and preview before publishing.`, `Đang hoạt động: **${ga}**\nMở Builder để cấu hình và xem trước trước khi phát hành.`), inline: true },
      { name: '🏆 Contest', value: L(lang, `Active: **${ca}**\nConfigure submissions, voting, eligibility and channels.`, `Đang hoạt động: **${ca}**\nCấu hình nhận bài, bình chọn, điều kiện và kênh.`), inline: true },
      { name: L(lang, '⚡ Quick commands', '⚡ Lệnh nhanh'), value: L(lang, '`/giveaway` and `/contest` remain for quick actions only.', '`/giveaway` và `/contest` vẫn giữ cho thao tác nhanh.') }
    )
    .setFooter({ text: 'Corgi Studio • Amber Event Control Center' }).setTimestamp();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('eventcfg:giveaway').setEmoji('🎁').setLabel(L(lang, 'Giveaway Builder', 'Tạo Giveaway')).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('eventcfg:contest').setEmoji('🏆').setLabel(L(lang, 'Contest Builder', 'Tạo Contest')).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('eventcfg:active').setEmoji('📋').setLabel(L(lang, 'Active Events', 'Sự kiện đang chạy')).setStyle(ButtonStyle.Secondary)
  );
  return panelPayload(guild.id,e,[row, backSetup(lang)]);
}

async function buildGiveawayBuilder(guildId, lang) {
  const d = (await getDraft(guildId)).giveaway;
  const e = new EmbedBuilder().setColor(AMBER)
    .setTitle(L(lang, '🎁 Giveaway Builder • Amber', '🎁 Trình tạo Giveaway • Amber'))
    .setDescription(L(lang, 'Configure each section, preview it, then publish.', 'Cấu hình từng mục, xem trước rồi phát hành.'))
    .addFields(
      { name: L(lang, '🎁 Prize', '🎁 Phần thưởng'), value: `**${v(d.prize, L(lang, 'Not set', 'Chưa đặt'))}**`, inline: false },
      { name: L(lang, '⏱️ Duration / Winners', '⏱️ Thời gian / Người thắng'), value: `**${v(d.duration)}** • **${v(d.winnerCount, 1)}**`, inline: true },
      { name: L(lang, '📡 Channel', '📡 Kênh'), value: d.channelId ? `<#${d.channelId}>` : L(lang, 'Not set', 'Chưa đặt'), inline: true },
      { name: L(lang, '🎭 Required role', '🎭 Role bắt buộc'), value: d.requiredRoleId ? `<@&${d.requiredRoleId}>` : L(lang, 'None', 'Không'), inline: true },
      { name: L(lang, '🛡️ Requirements', '🛡️ Điều kiện'), value: `${L(lang, 'Account age', 'Tuổi tài khoản')}: **${d.minAccountAgeDays || 0}d**\n${L(lang, 'Server age', 'Thời gian server')}: **${d.minServerAgeDays || 0}d**\n🌟Cstar: **${Number(d.minCstar || 0).toLocaleString()}**`, inline: true },
      { name: L(lang, '🖼️ Visual', '🖼️ Hình ảnh'), value: `${d.imageUrl ? '✅' : '⚫'} ${L(lang, 'Image', 'Ảnh')} • **${d.imageShape || '16:9'}**\n${L(lang, 'Join emoji', 'Emoji tham gia')}: ${d.joinEmoji || '🔥'}`, inline: true }
    ).setFooter({ text: L(lang, 'Amber Builder • changes are saved as draft', 'Amber Builder • thay đổi được lưu dạng bản nháp') });
  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('eventcfg:gw:general').setEmoji('✏️').setLabel(L(lang, 'General', 'Cơ bản')).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('eventcfg:gw:req').setEmoji('🛡️').setLabel(L(lang, 'Requirements', 'Điều kiện')).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('eventcfg:gw:image').setEmoji('🖼️').setLabel(L(lang, 'Upload Image', 'Tải ảnh')).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('eventcfg:gw:shape').setEmoji('📐').setLabel(d.imageShape === '1:1' ? '1:1' : '16:9').setStyle(ButtonStyle.Secondary)
  );
  const channel = new ChannelSelectMenuBuilder().setCustomId('eventcfg:gw:channel').setPlaceholder(L(lang, 'Select Giveaway channel', 'Chọn kênh Giveaway')).setMinValues(1).setMaxValues(1).setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);
  const role = new RoleSelectMenuBuilder().setCustomId('eventcfg:gw:role').setPlaceholder(L(lang, 'Select required role (optional)', 'Chọn role bắt buộc (tùy chọn)')).setMinValues(0).setMaxValues(1);
  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('eventcfg:gw:preview').setEmoji('👁️').setLabel(L(lang, 'Preview', 'Xem trước')).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('eventcfg:gw:publish').setEmoji('🚀').setLabel(L(lang, 'Publish', 'Phát hành')).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('eventcfg:gw:reset').setEmoji('🗑️').setLabel(L(lang, 'Reset Draft', 'Xóa bản nháp')).setStyle(ButtonStyle.Danger)
  );
  return panelPayload(guildId,e,[controls, new ActionRowBuilder().addComponents(channel), new ActionRowBuilder().addComponents(role), actions, backEvents(lang)]);
}

function text(id, label, value = '', style = TextInputStyle.Short, required = true, max = 100) {
  const t = new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(style).setRequired(required).setMaxLength(max);
  if (value !== undefined && value !== null && String(value).length) t.setValue(String(value).slice(0, max));
  return new ActionRowBuilder().addComponents(t);
}
async function giveawayGeneralModal(guildId, lang) {
  const d = (await getDraft(guildId)).giveaway;
  return new ModalBuilder().setCustomId('eventcfg:gwmodal:general').setTitle(L(lang, 'Giveaway • General', 'Giveaway • Cơ bản')).addComponents(
    text('prize', L(lang, 'Prize', 'Phần thưởng'), d.prize, TextInputStyle.Short, true, 200),
    text('description', L(lang, 'Description', 'Mô tả'), d.description, TextInputStyle.Paragraph, false, 1000),
    text('duration', L(lang, 'Duration (30m, 2h, 3d, 1w)', 'Thời gian (30m, 2h, 3d, 1w)'), d.duration, TextInputStyle.Short, true, 20),
    text('winners', L(lang, 'Winner count (1-20)', 'Số người thắng (1-20)'), d.winnerCount, TextInputStyle.Short, true, 2)
  );
}
async function giveawayReqModal(guildId, lang) {
  const d = (await getDraft(guildId)).giveaway;
  return new ModalBuilder().setCustomId('eventcfg:gwmodal:req').setTitle(L(lang, 'Giveaway • Requirements', 'Giveaway • Điều kiện')).addComponents(
    text('accountAge', L(lang, 'Minimum account age (days)', 'Tuổi tài khoản tối thiểu (ngày)'), d.minAccountAgeDays, TextInputStyle.Short, true, 4),
    text('serverAge', L(lang, 'Minimum server age (days)', 'Thời gian trong server tối thiểu (ngày)'), d.minServerAgeDays, TextInputStyle.Short, true, 4),
    text('minCstar', L(lang, 'Minimum Cstar (not charged)', 'Cstar tối thiểu (không trừ)'), d.minCstar, TextInputStyle.Short, true, 12),
    text('joinEmoji', L(lang, 'Join emoji', 'Emoji tham gia'), d.joinEmoji || '🔥', TextInputStyle.Short, true, 100)
  );
}

async function buildContestBuilder(guildId, lang) {
  const d = (await getDraft(guildId)).contest;
  const e = new EmbedBuilder().setColor(AMBER)
    .setTitle(L(lang, '🏆 Contest Builder • Amber', '🏆 Trình tạo Contest • Amber'))
    .setDescription(L(lang, 'Use the sections below. The builder stores a persistent draft until you publish or reset it.', 'Dùng các mục bên dưới. Builder lưu bản nháp cho đến khi bạn phát hành hoặc xóa.'))
    .addFields(
      { name: L(lang, '🏆 Title', '🏆 Tiêu đề'), value: `**${v(d.title, L(lang, 'Not set', 'Chưa đặt'))}**` },
      { name: L(lang, '⏱️ Timing', '⏱️ Thời gian'), value: `${L(lang, 'Submissions', 'Nhận bài')}: **${d.submissionTime || '1d'}**\n${L(lang, 'Voting', 'Bình chọn')}: **${d.votingTime || '1d'}**`, inline: true },
      { name: L(lang, '📡 Channels', '📡 Kênh'), value: `${L(lang, 'Event', 'Sự kiện')}: ${d.eventChannelId ? `<#${d.eventChannelId}>` : '—'}\nGallery: ${d.galleryChannelId ? `<#${d.galleryChannelId}>` : '—'}\n${L(lang, 'Results', 'Kết quả')}: ${d.resultChannelId ? `<#${d.resultChannelId}>` : '—'}`, inline: true },
      { name: L(lang, '⚙️ Rules', '⚙️ Thể lệ'), value: `${L(lang, 'Entries/member', 'Bài/người')}: **${d.maxEntriesPerUser || 1}**\n${L(lang, 'Votes/voter', 'Phiếu/người')}: **${d.votesPerUser || 1}**\nTop: **${d.topCount || 3}**`, inline: true },
      { name: L(lang, '🧩 Options', '🧩 Tùy chọn'), value: `${L(lang, 'Self vote', 'Tự vote')}: **${yn(lang, d.allowSelfVote)}**\n${L(lang, 'Review required', 'Cần duyệt')}: **${yn(lang, d.reviewRequired)}**\n${L(lang, 'Hide vote count', 'Ẩn số vote')}: **${yn(lang, d.hideVoteCount)}**`, inline: true },
      { name: L(lang, '🖼️ Visual', '🖼️ Hình ảnh'), value: `${d.bannerUrl ? '✅' : '⚫'} Banner • **${d.bannerShape || '16:9'}**`, inline: true }
    ).setFooter({ text: 'Corgi Studio • Amber Contest Builder' });
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('eventcfg:ct:general').setEmoji('✏️').setLabel(L(lang, 'General', 'Cơ bản')).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('eventcfg:ct:channels').setEmoji('📡').setLabel(L(lang, 'Channels', 'Kênh')).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('eventcfg:ct:rules').setEmoji('⚙️').setLabel(L(lang, 'Rules', 'Thể lệ')).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('eventcfg:ct:visual').setEmoji('🖼️').setLabel(L(lang, 'Visual', 'Hình ảnh')).setStyle(ButtonStyle.Secondary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('eventcfg:ct:selfvote').setEmoji('🙋').setLabel(L(lang, `Self Vote ${yn(lang, d.allowSelfVote)}`, `Tự vote ${yn(lang, d.allowSelfVote)}`)).setStyle(d.allowSelfVote ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('eventcfg:ct:review').setEmoji('✅').setLabel(L(lang, `Review ${yn(lang, d.reviewRequired)}`, `Duyệt ${yn(lang, d.reviewRequired)}`)).setStyle(d.reviewRequired ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('eventcfg:ct:hidevotes').setEmoji('🙈').setLabel(L(lang, `Hide Votes ${yn(lang, d.hideVoteCount)}`, `Ẩn vote ${yn(lang, d.hideVoteCount)}`)).setStyle(d.hideVoteCount ? ButtonStyle.Success : ButtonStyle.Secondary)
  );
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('eventcfg:ct:preview').setEmoji('👁️').setLabel(L(lang, 'Preview', 'Xem trước')).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('eventcfg:ct:publish').setEmoji('🚀').setLabel(L(lang, 'Publish', 'Phát hành')).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('eventcfg:ct:reset').setEmoji('🗑️').setLabel(L(lang, 'Reset Draft', 'Xóa bản nháp')).setStyle(ButtonStyle.Danger)
  );
  return panelPayload(guildId,e,[row1, row2, row3, backEvents(lang)]);
}
async function contestGeneralModal(guildId, lang) {
  const d = (await getDraft(guildId)).contest;
  return new ModalBuilder().setCustomId('eventcfg:ctmodal:general').setTitle(L(lang, 'Contest • General', 'Contest • Cơ bản')).addComponents(
    text('title', L(lang, 'Contest title', 'Tiêu đề cuộc thi'), d.title, TextInputStyle.Short, true, 200),
    text('description', L(lang, 'Description / rules', 'Mô tả / thể lệ'), d.description, TextInputStyle.Paragraph, true, 1500),
    text('submissionTime', L(lang, 'Submission time (30m, 2h, 3d)', 'Thời gian nhận bài (30m, 2h, 3d)'), d.submissionTime, TextInputStyle.Short, true, 20),
    text('votingTime', L(lang, 'Voting time (30m, 2h, 3d)', 'Thời gian bình chọn (30m, 2h, 3d)'), d.votingTime, TextInputStyle.Short, true, 20)
  );
}
async function contestRulesModal(guildId, lang) {
  const d = (await getDraft(guildId)).contest;
  return new ModalBuilder().setCustomId('eventcfg:ctmodal:rules').setTitle(L(lang, 'Contest • Rules', 'Contest • Thể lệ')).addComponents(
    text('entries', L(lang, 'Entries per member (1-10)', 'Bài mỗi thành viên (1-10)'), d.maxEntriesPerUser, TextInputStyle.Short, true, 2),
    text('votes', L(lang, 'Votes per voter (1-20)', 'Phiếu mỗi người (1-20)'), d.votesPerUser, TextInputStyle.Short, true, 2),
    text('accountAge', L(lang, 'Minimum account age (days)', 'Tuổi tài khoản tối thiểu (ngày)'), d.minAccountAgeDays, TextInputStyle.Short, true, 4),
    text('serverAge', L(lang, 'Minimum server age (days)', 'Thời gian server tối thiểu (ngày)'), d.minServerAgeDays, TextInputStyle.Short, true, 4),
    text('topCount', L(lang, 'Top ranking count (1-10)', 'Số hạng công bố (1-10)'), d.topCount, TextInputStyle.Short, true, 2)
  );
}
async function buildContestChannels(guildId, lang) {
  const d = (await getDraft(guildId)).contest;
  const e = new EmbedBuilder().setColor(AMBER).setTitle(L(lang, '📡 Contest Channels & Eligibility', '📡 Kênh & Điều kiện Contest'))
    .setDescription(L(lang, 'Select Event, Gallery and Result channels. Required Role is optional.', 'Chọn kênh Sự kiện, Gallery và Kết quả. Role bắt buộc là tùy chọn.'))
    .addFields({ name: 'Event', value: d.eventChannelId ? `<#${d.eventChannelId}>` : '—', inline: true }, { name: 'Gallery', value: d.galleryChannelId ? `<#${d.galleryChannelId}>` : '—', inline: true }, { name: L(lang, 'Results', 'Kết quả'), value: d.resultChannelId ? `<#${d.resultChannelId}>` : '—', inline: true }, { name: L(lang, 'Required role', 'Role bắt buộc'), value: d.requiredRoleId ? `<@&${d.requiredRoleId}>` : L(lang, 'None', 'Không') });
  const picker = (id, ph) => new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId(id).setPlaceholder(ph).setMinValues(1).setMaxValues(1).setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement));
  const role = new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId('eventcfg:ct:role').setPlaceholder(L(lang, 'Required role (optional)', 'Role bắt buộc (tùy chọn)')).setMinValues(0).setMaxValues(1));
  return panelPayload(guildId,e,[picker('eventcfg:ct:eventchannel', L(lang, 'Select Event channel', 'Chọn kênh Sự kiện')), picker('eventcfg:ct:gallerychannel', L(lang, 'Select Gallery channel', 'Chọn kênh Gallery')), picker('eventcfg:ct:resultchannel', L(lang, 'Select Result channel', 'Chọn kênh Kết quả')), role, new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('eventcfg:contest').setEmoji('⬅️').setLabel(L(lang, 'Back to Contest Builder', 'Quay lại Contest Builder')).setStyle(ButtonStyle.Secondary))]);
}
async function buildContestVisual(guildId, lang) {
  const d = (await getDraft(guildId)).contest;
  const e = new EmbedBuilder().setColor(AMBER).setTitle(L(lang, '🖼️ Contest Visual', '🖼️ Hình ảnh Contest')).setDescription(L(lang, 'Upload a banner directly from Discord. The bot captures the next image you send in this channel.', 'Tải banner trực tiếp từ Discord. Bot sẽ lấy ảnh tiếp theo bạn gửi trong kênh này.')).addFields({ name: 'Banner', value: d.bannerUrl ? '✅ ' + L(lang, 'Uploaded', 'Đã tải') : '⚫ ' + L(lang, 'Not set', 'Chưa đặt'), inline: true }, { name: L(lang, 'Ratio', 'Tỷ lệ'), value: `**${d.bannerShape || '16:9'}**`, inline: true });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('eventcfg:ct:image').setEmoji('📤').setLabel(L(lang, 'Upload Banner', 'Tải Banner')).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('eventcfg:ct:shape').setEmoji('📐').setLabel(d.bannerShape === '1:1' ? '1:1' : '16:9').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('eventcfg:contest').setEmoji('⬅️').setLabel(L(lang, 'Back', 'Quay lại')).setStyle(ButtonStyle.Secondary)
  );
  return panelPayload(guildId,e,[row]);
}
async function buildActiveEvents(guildId, lang) {
  const [gs, cs] = await Promise.all([
    Giveaway.find({ guildId, status: { $in: ['active', 'paused'] } }).sort({ createdAt: -1 }).limit(8),
    Contest.find({ guildId, status: { $in: ['SUBMISSION', 'REVIEW', 'VOTING', 'ENDED'] } }).sort({ createdAt: -1 }).limit(8)
  ]);
  const gl = gs.length ? gs.map(g => '• **' + g.prize + '** • ' + g.status.toUpperCase() + ' • <#' + g.channelId + '> • `' + (g.messageId || '—') + '`').join('\n') : L(lang, 'No active Giveaway.', 'Không có Giveaway đang chạy.');
  const cl = cs.length ? cs.map(c => '• **' + c.title + '** • ' + c.status + ' • `' + (c.contestId || c.id) + '`').join('\n') : L(lang, 'No active Contest.', 'Không có Contest đang chạy.');
  const e = new EmbedBuilder().setColor(AMBER).setTitle(L(lang, '📋 Active Events', '📋 Sự kiện đang hoạt động')).addFields({ name: '🎁 Giveaway', value: gl.slice(0, 1024) }, { name: '🏆 Contest', value: cl.slice(0, 1024) }).setFooter({ text: 'Corgi Studio • Amber Event Center' });
  return panelPayload(guildId,e,[backEvents(lang)]);
}

function giveawayPreview(d, lang) {
  const e = new EmbedBuilder().setColor(AMBER).setTitle('🎁 CORGI GIVEAWAY • PREVIEW').setDescription(d.description || L(lang, 'Join for a chance to win!', 'Tham gia để có cơ hội nhận thưởng!')).addFields(
    { name: L(lang, '🎁 Prize', '🎁 Phần thưởng'), value: `**${d.prize || '—'}**` },
    { name: L(lang, '👑 Winners', '👑 Người thắng'), value: `**${d.winnerCount || 1}**`, inline: true },
    { name: L(lang, '⏱️ Duration', '⏱️ Thời gian'), value: `**${d.duration || '—'}**`, inline: true },
    { name: L(lang, '📋 Requirements', '📋 Điều kiện'), value: `${d.requiredRoleId ? `<@&${d.requiredRoleId}>\n` : ''}${L(lang, 'Account', 'Tài khoản')} ≥ ${d.minAccountAgeDays || 0}d\n${L(lang, 'Server', 'Server')} ≥ ${d.minServerAgeDays || 0}d\n🌟Cstar ≥ ${Number(d.minCstar || 0).toLocaleString()}` }
  ).setFooter({ text: 'Amber Preview • not published' });
  if (d.imageUrl) e.setImage(d.imageUrl);
  return e;
}
function contestPreview(d, lang) {
  const e = new EmbedBuilder().setColor(AMBER).setTitle(`🏆 ${d.title || L(lang, 'Contest Preview', 'Xem trước Contest')}`).setDescription(d.description || '—').addFields(
    { name: L(lang, '📥 Submission time', '📥 Thời gian nhận bài'), value: `**${d.submissionTime || '—'}**`, inline: true },
    { name: L(lang, '❤️ Voting time', '❤️ Thời gian bình chọn'), value: `**${d.votingTime || '—'}**`, inline: true },
    { name: L(lang, '⚙️ Rules', '⚙️ Thể lệ'), value: `${L(lang, 'Entries/member', 'Bài/người')}: ${d.maxEntriesPerUser || 1}\n${L(lang, 'Votes/voter', 'Phiếu/người')}: ${d.votesPerUser || 1}\n${L(lang, 'Self vote', 'Tự vote')}: ${yn(lang, d.allowSelfVote)}\n${L(lang, 'Review', 'Duyệt')}: ${yn(lang, d.reviewRequired)}` }
  ).setFooter({ text: 'Amber Preview • not published' });
  if (d.bannerUrl) e.setImage(d.bannerUrl);
  return e;
}

module.exports = {
  buildEventCenter, buildGiveawayBuilder, giveawayGeneralModal, giveawayReqModal,
  buildContestBuilder, contestGeneralModal, contestRulesModal, buildContestChannels,
  buildContestVisual, buildActiveEvents, giveawayPreview, contestPreview
};
