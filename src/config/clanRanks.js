const CLAN_RANKS = [
  { key: 'D', name: 'Clan D', minPoints: 0, color: 0x64748b, emoji: '⚙️' },
  { key: 'C', name: 'Clan C', minPoints: 10000, color: 0x22c55e, emoji: '🌿' },
  { key: 'B', name: 'Clan B', minPoints: 30000, color: 0x3b82f6, emoji: '💎' },
  { key: 'A', name: 'Clan A', minPoints: 75000, color: 0x8b5cf6, emoji: '🔮' },
  { key: 'S', name: 'Clan S', minPoints: 150000, color: 0xf59e0b, emoji: '👑' },
  { key: 'SS', name: 'Clan SS', minPoints: 300000, color: 0xef4444, emoji: '🔥' },
  { key: 'SSS', name: 'Clan SSS', minPoints: 600000, color: 0xec4899, emoji: '✨' },
];

function rankForPoints(points = 0) {
  const value = Math.max(0, Math.trunc(Number(points) || 0));
  return [...CLAN_RANKS].reverse().find((rank) => value >= rank.minPoints) || CLAN_RANKS[0];
}
function rankByKey(key = 'D') { return CLAN_RANKS.find((rank) => rank.key === key) || CLAN_RANKS[0]; }
function nextRank(key = 'D') { const i=CLAN_RANKS.findIndex((rank)=>rank.key===key); return i>=0&&i<CLAN_RANKS.length-1?CLAN_RANKS[i+1]:null; }
module.exports={CLAN_RANKS,rankForPoints,rankByKey,nextRank};
