const path = require('path');
const sharp = require('sharp');

const P = require('./progression');
const { ensureWallet } = require('./economyWallet');
const Social = require('./socialProfile');
const Verification = require('./profileVerification');
const Cosmetic = require('../models/GlobalCosmetic');
const CosmeticAssets = require('./cosmeticAssetStorage');

const BG = path.join(__dirname, '../../assets/profile/default-background.png');
const CXU_ICON = path.join(__dirname, '../../assets/currency/cxu_coin_128.png');

const LABELS = {
  en: {
    player: 'Corgi Player', level: 'LEVEL', xp: 'LEVEL PROGRESS',
    cxu: 'CXu', likes: 'LIKES', followers: 'FOLLOWERS', following: 'FOLLOWING',
    progress: 'PROGRESS', totalXp: 'Total XP', messages: 'Messages',
    collection: 'COLLECTION', cosmetics: 'Cosmetics owned',
    about: 'ABOUT ME', defaultBio: 'Good games • Good people • Brighter days',
    footer: 'CORGI-BOT • GLOBAL PROFILE', max: 'MAX LEVEL'
  },
  vi: {
    player: 'Người chơi Corgi', level: 'CẤP', xp: 'TIẾN ĐỘ CẤP',
    cxu: 'CXu', likes: 'LƯỢT THÍCH', followers: 'NGƯỜI THEO DÕI', following: 'ĐANG THEO DÕI',
    progress: 'TIẾN TRÌNH', totalXp: 'Tổng XP', messages: 'Tin nhắn',
    collection: 'BỘ SƯU TẬP', cosmetics: 'Vật phẩm ngoại hình',
    about: 'GIỚI THIỆU', defaultBio: 'Chơi vui • Bạn tốt • Ngày tươi sáng',
    footer: 'CORGI-BOT • HỒ SƠ TOÀN CẦU', max: 'CẤP TỐI ĐA'
  }
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function num(value) {
  return Number(value || 0).toLocaleString('en-US');
}

async function avatarBuffer(user) {
  const response = await fetch(
    user.displayAvatarURL({ extension: 'png', size: 256 })
  );
  return Buffer.from(await response.arrayBuffer());
}

async function cosmeticItem(type, selected) {
  selected = String(selected || '').trim();

  if (!selected || selected === 'default' || selected === 'ice') return null;

  const key = selected.includes(':')
    ? selected
    : `${String(type).toLowerCase()}:${selected}`;

  return Cosmetic.findOne({ key, type }).lean();
}

async function imageAsset(item) {
  if (!item?.value) return null;

  const absolute = CosmeticAssets.resolve(item.value);
  if (!absolute) return null;

  try {
    await sharp(absolute).metadata();
    return absolute;
  } catch {
    return null;
  }
}

async function render(user, lang = 'en') {
  const z = LABELS[lang] || LABELS.en;

  const [p, wallet, social, verify, cfg] = await Promise.all([
    P.ensureProgress(user.id),
    ensureWallet(user.id),
    Social.ensure(user.id),
    Verification.get(user.id),
    P.settings()
  ]);

  const progressionCfg = cfg?.progression;
  if (!progressionCfg) throw new Error('Missing progression configuration');

  const level = Number(p.level || 1);
  const currentXp = Number(p.xp || 0);
  const neededXp = Number(P.xpNeeded(level, progressionCfg) || 0);
  const maxLevel = level >= Number(progressionCfg.maxLevel || 100000);

  const xpRatio = maxLevel
    ? 1
    : Math.max(0, Math.min(1, currentXp / Math.max(1, neededXp)));

  const barWidth = Math.round(540 * xpRatio);

  const [backgroundItem, frameItem, accentItem, nameplateItem, titleItem] =
    await Promise.all([
      cosmeticItem('BACKGROUND', social.cosmetics?.background),
      cosmeticItem('FRAME', social.cosmetics?.frame),
      cosmeticItem('ACCENT', social.cosmetics?.accent),
      cosmeticItem('NAMEPLATE', social.cosmetics?.nameplate),
      cosmeticItem('TITLE', social.cosmetics?.title)
    ]);

  const [backgroundAsset, frameAsset, nameplateAsset] = await Promise.all([
    imageAsset(backgroundItem),
    imageAsset(frameItem),
    imageAsset(nameplateItem)
  ]);

  const bg = await sharp(backgroundAsset || BG)
    .resize(900, 1600, { fit: 'cover' })
    .png()
    .toBuffer();

  const avatar = await sharp(await avatarBuffer(user))
    .resize(220, 220)
    .composite([{
      input: Buffer.from(
        '<svg width="220" height="220"><circle cx="110" cy="110" r="106" fill="white"/></svg>'
      ),
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  const cxuIcon = await sharp(CXU_ICON)
    .resize(30, 30, { fit: 'contain' })
    .png()
    .toBuffer();

  const legacyAccent = {
    ice: '#64c8ff',
    gold: '#ffd36a',
    sakura: '#ff8fca',
    emerald: '#67e8a5'
  }[social.cosmetics?.accent];

  const customAccent = String(accentItem?.value || '').trim();
  const accent = /^#[0-9a-fA-F]{6}$/.test(customAccent)
    ? customAccent
    : (legacyAccent || '#64c8ff');

  const name = esc((user.globalName || user.username).slice(0, 30));

  const equippedTitle = String(titleItem?.value || '').trim();
  const legacyTitle = String(social.cosmetics?.title || '').trim();

  const title = esc(
    (
      equippedTitle ||
      (!legacyTitle.includes(':') ? legacyTitle : '') ||
      p.activeTitle ||
      z.player
    ).slice(0, 32)
  );
  const bio = esc((social.bio || z.defaultBio).slice(0, 150));
  const verificationBadges = Verification.approvedBadges(verify);

  const verificationBadgeAssets = verificationBadges.map(type => ({
    type,
    asset:
      type === 'PURPLE'
        ? path.join(__dirname, '../../assets/verification/verified-purple.png')
        : type === 'BLUE'
          ? path.join(__dirname, '../../assets/verification/verified-blue.png')
          : null
  })).filter(x => x.asset);


  const likes = social.likes?.length || 0;
  const followers = social.followers?.length || 0;
  const following = social.following?.length || 0;
  const cosmetics = social.ownedCosmetics?.length || 0;

  const xpText = maxLevel
    ? z.max
    : `${num(currentXp)} / ${num(neededXp)} XP`;

  const svg = `
  <svg width="900" height="1600" xmlns="http://www.w3.org/2000/svg">
    <style>
      .t{font-family:Arial,sans-serif;fill:#fff}
      .m{font-family:Arial,sans-serif;fill:#cbdaf0}
      .a{font-family:Arial,sans-serif;fill:${accent}}
      .box{fill:#07172ddd;stroke:${accent};stroke-width:2}
      .label{font-size:18px;font-weight:700;letter-spacing:1px}
      .value{font-size:31px;font-weight:700}
    </style>

    <rect x="105" y="70" width="690" height="1460" rx="42"
          fill="#06152ac4" stroke="#ffffff26" stroke-width="2"/>

    <circle cx="450" cy="220" r="122"
            fill="#07172d" stroke="${accent}" stroke-width="8"/>

    <text x="450" y="390" text-anchor="middle"
          class="t" font-size="46" font-weight="700">${name}</text>

    <text x="450" y="432" text-anchor="middle"
          class="a" font-size="23" font-weight="700">${title}</text>

    <!-- LEVEL + CXU -->
    <rect class="box" x="150" y="475" width="600" height="220" rx="24"/>

    <text x="180" y="520" class="m label">${z.level}</text>
    <text x="180" y="565" class="t value">LV. ${num(level)}</text>

    <text x="720" y="520" text-anchor="end" class="m label">${z.cxu}</text>
    <text x="720" y="565" text-anchor="end" class="t value">${num(wallet.cstar)}</text>

    <text x="180" y="610" class="a" font-size="18" font-weight="700">${z.xp}</text>
    <text x="720" y="610" text-anchor="end" class="m" font-size="18">${xpText}</text>

    <rect x="180" y="635" width="540" height="18" rx="9" fill="#ffffff20"/>
    <rect x="180" y="635" width="${barWidth}" height="18" rx="9" fill="${accent}"/>

    <!-- SOCIAL -->
    <rect class="box" x="150" y="725" width="600" height="125" rx="24"/>

    <text x="245" y="770" text-anchor="middle" class="m label">${z.likes}</text>
    <text x="245" y="815" text-anchor="middle" class="t value">♥ ${num(likes)}</text>

    <text x="450" y="770" text-anchor="middle" class="m label">${z.followers}</text>
    <text x="450" y="815" text-anchor="middle" class="t value">${num(followers)}</text>

    <text x="655" y="770" text-anchor="middle" class="m label">${z.following}</text>
    <text x="655" y="815" text-anchor="middle" class="t value">${num(following)}</text>

    <!-- PROGRESS -->
    <rect class="box" x="150" y="880" width="600" height="175" rx="24"/>

    <text x="180" y="925" class="a" font-size="22" font-weight="700">${z.progress}</text>

    <text x="180" y="975" class="t" font-size="23">${z.totalXp}</text>
    <text x="720" y="975" text-anchor="end" class="t" font-size="23" font-weight="700">${num(p.totalXp)}</text>

    <text x="180" y="1020" class="t" font-size="23">${z.messages}</text>
    <text x="720" y="1020" text-anchor="end" class="t" font-size="23" font-weight="700">${num(p.totalMessages)}</text>

    <!-- COLLECTION -->
    <rect class="box" x="150" y="1085" width="600" height="135" rx="24"/>

    <text x="180" y="1130" class="a" font-size="22" font-weight="700">${z.collection}</text>
    <text x="180" y="1180" class="t" font-size="23">${z.cosmetics}</text>
    <text x="720" y="1180" text-anchor="end" class="t" font-size="25" font-weight="700">${num(cosmetics)}</text>

    <!-- ABOUT -->
    <rect class="box" x="150" y="1250" width="600" height="155" rx="24"/>

    <text x="180" y="1295" class="a" font-size="22" font-weight="700">${z.about}</text>

    <text x="180" y="1340" class="t" font-size="20">${bio}</text>

    <text x="450" y="1470" text-anchor="middle"
          class="m" font-size="18">${z.footer}</text>
  </svg>`;

  const layers = [
    { input: Buffer.from(svg), top: 0, left: 0 },
    { input: avatar, top: 110, left: 340 }
  ];

  if (verificationBadgeAssets.length) {
    try {
      const badgeSize = 48;
      const badgeGap = 5;

      const renderedBadges = [];

      for (const entry of verificationBadgeAssets) {
        const input = await sharp(entry.asset)
          .resize(badgeSize, badgeSize, {
            fit: 'contain',
            withoutEnlargement: true
          })
          .png()
          .toBuffer();

        renderedBadges.push(input);
      }

      const estimatedNameWidth = Math.min(
        520,
        Math.max(40, name.length * 25)
      );

      let badgeLeft = Math.min(
        735,
        Math.round(450 + (estimatedNameWidth / 2) + 8)
      );

      // If the user owns both badges they appear next to each other:
      // VERIFIED -> PARTNER.
      for (const badge of renderedBadges) {
        layers.push({
          input: badge,
          top: 348,
          left: badgeLeft
        });

        badgeLeft += badgeSize + badgeGap;
      }
    } catch {}
  }


  if (frameAsset) {
    try {
      const frame = await sharp(frameAsset)
        .resize(270, 270, { fit: 'contain' })
        .png()
        .toBuffer();

      layers.push({
        input: frame,
        top: 85,
        left: 315
      });
    } catch {}
  }

  if (nameplateAsset) {
    try {
      const nameplate = await sharp(nameplateAsset)
        .resize(600, 100, {
          fit: 'contain',
          withoutEnlargement: true
        })
        .png()
        .toBuffer();

      layers.push({
        input: nameplate,
        top: 342,
        left: 150
      });
    } catch {}
  }

  layers.push({
    input: cxuIcon,
    top: 493,
    left: 645
  });

  return sharp(bg)
    .composite(layers)
    .png()
    .toBuffer();
}

module.exports = { render };
