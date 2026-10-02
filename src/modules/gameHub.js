const GameCore = require('../services/gameCore');

function home(uid, lang) {
  return GameCore.home(uid, lang);
}

async function handle(i, lang) {
  const [, action, uid] = i.customId.split(':');
  if (!uid || String(i.user.id) !== String(uid)) {
    return i.followUp({ content: '❌ This Game Hub belongs to another player.', flags: 64 }).catch(() => {});
  }

  const map = {
    home: GameCore.home,
    treasure: GameCore.treasure,
    quest: GameCore.quest,
    lootbox: GameCore.lootbox,
    achievement: GameCore.achievement,
    leaderboard: GameCore.leaderboard
  };

  const fn = map[action] || GameCore.home;
  const payload = await fn(uid, lang);
  return i.editReply(payload);
}

module.exports = { home, handle };
