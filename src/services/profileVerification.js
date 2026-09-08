const path = require('path');
const ProfileVerification = require('../models/ProfileVerification');

const BADGES = {
  BLUE: { icon: '🔵✓', en: 'Verified Identity', vi: 'Định danh tài khoản thật', asset: 'verified-blue.gif' },
  RED: { icon: '🔴✓', en: 'Developer', vi: 'Developer', asset: 'verified-red.gif' },
  YELLOW: { icon: '🟡✓', en: 'Administration', vi: 'Admin Quản Trị', asset: 'verified-yellow.gif' },
  PURPLE: { icon: '🟣✓', en: 'Corgi-Bot Partner', vi: 'Đối tác Corgi-Bot', asset: 'verified-purple.gif' },
};

const BADGE_DIR = path.join(__dirname, '../../assets/verification');

const ACTIONS = ['PENDING', 'REVIEW', 'APPROVE', 'REJECT', 'REVOKE'];
const TYPES = Object.keys(BADGES);

function normalizeType(v = '') {
  const type = String(v || '').trim().toUpperCase();
  if (!type) return '';
  if (!TYPES.includes(type)) throw new Error('Badge type must be BLUE, RED, YELLOW or PURPLE.');
  return type;
}

async function get(userId) {
  return ProfileVerification.findOne({ userId: String(userId) }).lean();
}

async function recent(limit = 10) {
  return ProfileVerification.find({}).sort({ updatedAt: -1 }).limit(limit).lean();
}

async function manage({ userId, action, badgeType = '', note = '', actorId }) {
  userId = String(userId || '').trim();
  if (!/^\d{15,25}$/.test(userId)) throw new Error('Invalid Discord User ID.');
  action = String(action || '').trim().toUpperCase();
  if (!ACTIONS.includes(action)) throw new Error('Action must be PENDING, REVIEW, APPROVE, REJECT or REVOKE.');
  const type = normalizeType(badgeType);
  const now = new Date();
  const current = await ProfileVerification.findOne({ userId });

  if (action === 'APPROVE' && !type && !current?.badgeType) {
    throw new Error('APPROVE requires a badge type: BLUE, RED, YELLOW or PURPLE.');
  }

  const statusMap = {
    PENDING: 'PENDING',
    REVIEW: 'REVIEW',
    APPROVE: 'APPROVED',
    REJECT: 'REJECTED',
    REVOKE: 'REVOKED',
  };

  const update = {
    status: statusMap[action],
    note: String(note || '').trim().slice(0, 1000),
    reviewedBy: String(actorId || ''),
    reviewedAt: now,
  };
  if (type) update.badgeType = type;
  if (action === 'PENDING' && !current) update.requestedAt = now;

  return ProfileVerification.findOneAndUpdate(
    { userId },
    { $set: update, $setOnInsert: { userId, requestedAt: now } },
    { upsert: true, returnDocument: 'after' }
  );
}


function badgeAttachment(row) {
  if (!row || row.status !== 'APPROVED') return null;
  const badge = BADGES[row.badgeType];
  if (!badge?.asset) return null;
  return {
    path: path.join(BADGE_DIR, badge.asset),
    name: `corgi-verified-${String(row.badgeType).toLowerCase()}.gif`,
  };
}

function publicLabel(row, lang = 'en') {
  if (!row) return lang === 'vi' ? 'Chưa xác minh' : 'Not verified';
  if (row.status === 'APPROVED' && BADGES[row.badgeType]) {
    const b = BADGES[row.badgeType];
    return `${b.icon} **${lang === 'vi' ? b.vi : b.en}**`;
  }
  if (row.status === 'PENDING') return lang === 'vi' ? '🕓 Đang chờ xem xét' : '🕓 Pending review';
  if (row.status === 'REVIEW') return lang === 'vi' ? '🔎 Đang được Developer xem xét' : '🔎 Under developer review';
  return lang === 'vi' ? 'Chưa xác minh' : 'Not verified';
}

module.exports = { BADGES, TYPES, ACTIONS, get, recent, manage, publicLabel, badgeAttachment };
