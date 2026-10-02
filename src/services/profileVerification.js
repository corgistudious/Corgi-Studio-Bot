const path = require('path');
const ProfileVerification = require('../models/ProfileVerification');

const BADGES = {
  BLUE: { icon: '🔵✓', en: 'Verified Identity', vi: 'Định danh tài khoản thật', asset: 'verified-blue.png' },
  PURPLE: { icon: '🟣✓', en: 'Corgi-Bot Partner', vi: 'Đối tác Corgi-Bot', asset: 'verified-purple.png' },
};

const BADGE_DIR = path.join(__dirname, '../../assets/verification');

const ACTIONS = ['PENDING', 'REVIEW', 'APPROVE', 'REJECT', 'REVOKE'];
const TYPES = Object.keys(BADGES);

function normalizeType(v = '') {
  const type = String(v || '').trim().toUpperCase();
  if (!type) return '';
  if (!TYPES.includes(type)) throw new Error('Badge type must be BLUE or PURPLE.');
  return type;
}

async function get(userId) {
  return ProfileVerification.findOne({ userId: String(userId) }).lean();
}

async function recent(limit = 10) {
  return ProfileVerification.find({}).sort({ updatedAt: -1 }).limit(limit).lean();
}

function approvedBadges(row) {
  if (!row || row.status !== 'APPROVED') return [];

  const values = Array.isArray(row.badges) ? row.badges : [];
  const out = values.filter(x => TYPES.includes(x));

  // Backward compatibility for records not migrated yet.
  if (!out.length && TYPES.includes(row.badgeType)) {
    out.push(row.badgeType);
  }

  return [...new Set(out)];
}

async function manage({ userId, action, badgeType = '', note = '', actorId }) {
  userId = String(userId || '').trim();
  if (!/^\d{15,25}$/.test(userId)) throw new Error('Invalid Discord User ID.');

  action = String(action || '').trim().toUpperCase();
  if (!ACTIONS.includes(action)) {
    throw new Error('Action must be PENDING, REVIEW, APPROVE, REJECT or REVOKE.');
  }

  const type = normalizeType(badgeType);
  const now = new Date();
  const current = await ProfileVerification.findOne({ userId });

  if (action === 'APPROVE' && !type) {
    throw new Error('APPROVE requires a badge type: BLUE or PURPLE.');
  }

  const update = {
    note: String(note || '').trim().slice(0, 1000),
    reviewedBy: String(actorId || ''),
    reviewedAt: now,
  };

  if (action === 'APPROVE') {
    // APPROVE adds the selected badge without deleting the other badge.
    update.status = 'APPROVED';
    update.badgeType = type;

    return ProfileVerification.findOneAndUpdate(
      { userId },
      {
        $set: update,
        $addToSet: { badges: type },
        $setOnInsert: { userId, requestedAt: now }
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  if (action === 'REVOKE' && type) {
    // Revoke only the selected badge.
    const existing = approvedBadges(current?.toObject ? current.toObject() : current);
    const remaining = existing.filter(x => x !== type);

    update.status = remaining.length ? 'APPROVED' : 'REVOKED';
    update.badgeType = remaining[0] || '';

    return ProfileVerification.findOneAndUpdate(
      { userId },
      {
        $set: update,
        $pull: { badges: type },
        $setOnInsert: { userId, requestedAt: now }
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  const statusMap = {
    PENDING: 'PENDING',
    REVIEW: 'REVIEW',
    REJECT: 'REJECTED',
    REVOKE: 'REVOKED',
  };

  update.status = statusMap[action];

  if (action === 'PENDING' && !current) {
    update.requestedAt = now;
  }

  return ProfileVerification.findOneAndUpdate(
    { userId },
    { $set: update, $setOnInsert: { userId, requestedAt: now } },
    { upsert: true, returnDocument: 'after' }
  );
}


function badgeAttachments(row) {
  return approvedBadges(row).map(type => {
    const badge = BADGES[type];
    if (!badge?.asset) return null;

    return {
      type,
      path: path.join(BADGE_DIR, badge.asset),
      name: `corgi-verified-${String(type).toLowerCase()}.png`,
    };
  }).filter(Boolean);
}

// Compatibility for older callers.
function badgeAttachment(row) {
  return badgeAttachments(row)[0] || null;
}


function publicLabel(row, lang = 'en') {
  if (!row) return lang === 'vi' ? 'Chưa xác minh' : 'Not verified';

  const badges = approvedBadges(row);

  if (badges.length) {
    return badges.map(type => {
      const b = BADGES[type];
      return `${b.icon} **${lang === 'vi' ? b.vi : b.en}**`;
    }).join(' • ');
  }

  if (row.status === 'PENDING')
    return lang === 'vi' ? '🕓 Đang chờ xem xét' : '🕓 Pending review';

  if (row.status === 'REVIEW')
    return lang === 'vi'
      ? '🔎 Đang được Developer xem xét'
      : '🔎 Under developer review';

  return lang === 'vi' ? 'Chưa xác minh' : 'Not verified';
}


module.exports = {
  BADGES,
  TYPES,
  ACTIONS,
  get,
  recent,
  manage,
  approvedBadges,
  publicLabel,
  badgeAttachment,
  badgeAttachments
};
