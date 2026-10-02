const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Progression = require('./progression');

const WIDTH = 1200;
const HEIGHT = 675;
const BG_PATH = path.join(__dirname, '../../assets/branding/corgi-level-card-bg.png');
const ClanMember = require('../models/ClanMember');

function esc(v='') {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function compactName(user) {
  const raw = user.globalName || user.displayName || user.username || 'Member';
  return raw.length > 22 ? `${raw.slice(0, 21)}…` : raw;
}

function compactHandle(user) {
  const raw = `@${user.username || 'member'}`;
  return raw.length > 25 ? `${raw.slice(0, 24)}…` : raw;
}

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US');
}

async function avatarBuffer(user) {
  const url = user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Avatar HTTP ${r.status}`);
  const b = Buffer.from(await r.arrayBuffer());
  const mask = Buffer.from(`<svg width="126" height="126"><circle cx="63" cy="63" r="60" fill="#fff"/></svg>`);
  return sharp(b)
    .resize(126, 126, { fit: 'cover' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function buildLevelCard({ user, profile, lang='en', rewardCXu=0 }) {
  if (!fs.existsSync(BG_PATH)) throw new Error('Missing level card background asset.');

  const cfg = (await Progression.settings()).progression;
  const rank = await Progression.ranks(user.id);
  const need = Progression.xpNeeded(profile.level, cfg);
  const pct = need > 0 ? Math.max(0, Math.min(100, Math.floor((profile.xp / need) * 100))) : 100;
  const barWidth = Math.round(590 * pct / 100);
  const T={en:['LEVEL UP!','NEXT LEVEL PROGRESS','MESSAGES','GLOBAL RANK','WEALTH RANK','REWARD'],vi:['THĂNG CẤP!','TIẾN ĐỘ CẤP TIẾP THEO','TIN NHẮN','HẠNG GLOBAL','HẠNG TÀI SẢN','PHẦN THƯỞNG'],de:['LEVELAUFSTIEG!','FORTSCHRITT ZUM NÄCHSTEN LEVEL','NACHRICHTEN','GLOBALER RANG','VERMÖGENSRANG','BELOHNUNG'],es:['¡SUBISTE DE NIVEL!','PROGRESO AL SIGUIENTE NIVEL','MENSAJES','RANGO GLOBAL','RANGO DE RIQUEZA','RECOMPENSA'],fr:['NIVEAU SUPÉRIEUR !','PROGRESSION DU NIVEAU SUIVANT','MESSAGES','RANG GLOBAL','RANG DE RICHESSE','RÉCOMPENSE'],id:['NAIK LEVEL!','PROGRES LEVEL BERIKUTNYA','PESAN','PERINGKAT GLOBAL','PERINGKAT KEKAYAAN','HADIAH'],ja:['レベルアップ！','次のレベルまで','メッセージ','グローバル順位','資産順位','報酬'],ko:['레벨 업!','다음 레벨 진행도','메시지','글로벌 순위','자산 순위','보상'],'pt-BR':['SUBIU DE NÍVEL!','PROGRESSO DO PRÓXIMO NÍVEL','MENSAGENS','RANK GLOBAL','RANK DE RIQUEZA','RECOMPENSA'],'pt-PT':['SUBIU DE NÍVEL!','PROGRESSO DO PRÓXIMO NÍVEL','MENSAGENS','RANK GLOBAL','RANK DE RIQUEZA','RECOMPENSA'],'zh-CN':['升级！','下一等级进度','消息','全球排名','财富排名','奖励'],'zh-TW':['升級！','下一等級進度','訊息','全球排名','財富排名','獎勵']};
  const z=T[lang]||T.en;
  const name = esc(compactName(user));
  const handle = esc(compactHandle(user));
  const [title,nextLabel,msgLabel,rankLabel,weeklyLabel,rewardLabel]=z;
  const footer = esc('CORGI BOT • XP & LEVEL');

  const overlay = Buffer.from(`
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity="0.45"/></filter>
      <linearGradient id="gold" x1="0" x2="1"><stop offset="0" stop-color="#ffd45a"/><stop offset="1" stop-color="#ff9f1c"/></linearGradient>
      <linearGradient id="xp" x1="0" x2="1"><stop offset="0" stop-color="#19c7ff"/><stop offset="0.55" stop-color="#5b7cff"/><stop offset="1" stop-color="#b44cff"/></linearGradient>
    </defs>

    <g font-family="DejaVu Sans, Arial, sans-serif" fill="#fff" filter="url(#shadow)">
      <text x="535" y="216" font-size="30" font-weight="800" letter-spacing="4" fill="#ffd45a">${title}</text>
      <text x="535" y="268" font-size="43" font-weight="800">${name}</text>
      <text x="535" y="306" font-size="22" font-weight="600" fill="#9bb8ff">${handle}</text>
      <text x="535" y="342" font-size="20" font-weight="800" fill="#ffd45a">${esc(rewardLabel)}: +${fmt(rewardCXu)} CXu</text>

      <text x="430" y="392" font-size="24" font-weight="700" fill="#a8b8e8">LEVEL</text>
      <text x="430" y="450" font-size="62" font-weight="900" fill="url(#gold)">${fmt(profile.level)}</text>

      <text x="650" y="392" font-size="24" font-weight="700" fill="#a8b8e8">XP</text>
      <text x="650" y="446" font-size="40" font-weight="900">${fmt(profile.xp)} <tspan fill="#a8b8e8" font-size="27">/ ${fmt(need)}</tspan></text>

      <text x="430" y="504" font-size="18" font-weight="700" letter-spacing="1.5" fill="#9fb4e7">${nextLabel}</text>
      <rect x="430" y="525" width="590" height="28" rx="14" fill="#080d22" stroke="#6678d8" stroke-width="2"/>
      <rect x="430" y="525" width="${barWidth}" height="28" rx="14" fill="url(#xp)"/>
      <text x="1045" y="548" font-size="23" font-weight="800" text-anchor="end">${pct}%</text>

      <rect x="430" y="565" width="183" height="70" rx="18" fill="#0a1233" fill-opacity="0.72" stroke="#304c9c" stroke-width="2"/>
      <rect x="628" y="565" width="183" height="70" rx="18" fill="#0a1233" fill-opacity="0.72" stroke="#304c9c" stroke-width="2"/>
      <rect x="826" y="565" width="194" height="70" rx="18" fill="#0a1233" fill-opacity="0.72" stroke="#304c9c" stroke-width="2"/>

      <text x="450" y="592" font-size="16" font-weight="700" fill="#91a9df">${msgLabel}</text>
      <text x="450" y="620" font-size="28" font-weight="900">${fmt(profile.totalMessages)}</text>

      <text x="648" y="592" font-size="16" font-weight="700" fill="#91a9df">${rankLabel}</text>
      <text x="648" y="620" font-size="28" font-weight="900" fill="#ffd45a">#${fmt(rank.globalRank)}</text>

      <text x="846" y="592" font-size="16" font-weight="700" fill="#91a9df">${weeklyLabel}</text>
      <text x="846" y="620" font-size="28" font-weight="900" fill="#86d8ff">#${fmt(rank.wealthRank)}</text>

      <text x="725" y="655" font-size="17" font-weight="700" letter-spacing="2" text-anchor="middle" fill="#b9c9ef">${footer}</text>
    </g>

    <circle cx="458" cy="260" r="70" fill="#0a1338" stroke="#35cfff" stroke-width="5"/>
    <circle cx="458" cy="260" r="64" fill="none" stroke="#8c59ff" stroke-width="2" opacity="0.75"/>
  </svg>`);

  let bgInput=BG_PATH;
  try{const cm=await ClanMember.findOne({userId:user.id}).select('cardBackgroundAsset').lean();if(cm?.cardBackgroundAsset){const r=await fetch(cm.cardBackgroundAsset,{signal:AbortSignal.timeout(8000)});if(r.ok)bgInput=Buffer.from(await r.arrayBuffer());}}catch(e){console.warn('Clan card background failed:',e.message)}
  const base = sharp(bgInput).resize(WIDTH, HEIGHT, { fit: 'cover' });
  const layers = [{ input: overlay, top: 0, left: 0 }];
  try {
    layers.push({ input: await avatarBuffer(user), top: 197, left: 395 });
  } catch (e) {
    console.warn('Level card avatar fetch failed:', e.message);
  }

  return base.composite(layers).png({ compressionLevel: 8, palette: true }).toBuffer();
}

module.exports = { buildLevelCard };
