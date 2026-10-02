const path = require('path');
const fs = require('fs');

const EMOJI_NAME = 'cxu_coin';
const ASSET = path.join(__dirname, '../../assets/currency/cxu_coin_128.png');
const FALLBACK = '🪙';

async function syncCurrencyEmoji(client) {
  if (!client.application) await client.application.fetch();
  const existing = await client.application.emojis.fetch();
  let emoji = existing.find((e) => e.name === EMOJI_NAME);
  if (!emoji && fs.existsSync(ASSET)) {
    try {
      emoji = await client.application.emojis.create({ attachment: ASSET, name: EMOJI_NAME });
      console.log('🪙 Synced CXu currency application emoji.');
    } catch (error) {
      console.warn('CXu application emoji sync failed:', error.message);
    }
  }
  return emoji || null;
}

async function getCurrencyEmoji(client) {
  try {
    if (!client?.application) return FALLBACK;
    const cache = client.application.emojis.cache.size
      ? client.application.emojis.cache
      : await client.application.emojis.fetch();
    const emoji = cache.find((e) => e.name === EMOJI_NAME);
    return emoji ? emoji.toString() : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

module.exports = { EMOJI_NAME, FALLBACK, syncCurrencyEmoji, getCurrencyEmoji };
