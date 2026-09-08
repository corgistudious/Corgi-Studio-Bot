const path = require('path');
const { isPremiumGuild } = require('./premium');

const PREMIUM_LOGO = path.join(__dirname, '../../assets/branding/corgi-premium.png');
const PREMIUM_WATERMARK = path.join(__dirname, '../../assets/branding/corgi-premium-watermark.png');
const WATERMARK_NAME = 'corgi-premium-watermark.png';
const LOGO_NAME = 'corgi-premium.png';

async function premiumPanelVisual(guildId, embed) {
  if (!guildId || !embed || !(await isPremiumGuild(guildId))) return { embed, files: [] };
  // Discord embeds do not support a CSS-style background watermark. A faint PNG is
  // placed in the dedicated thumbnail area so it can never overlap/readability-block text.
  embed.setThumbnail(`attachment://${WATERMARK_NAME}`);
  return { embed, files: [{ attachment: PREMIUM_WATERMARK, name: WATERMARK_NAME }] };
}

function premiumStatusVisual(embed) {
  if (!embed) return { embed, files: [] };
  embed.setThumbnail(`attachment://${LOGO_NAME}`);
  return { embed, files: [{ attachment: PREMIUM_LOGO, name: LOGO_NAME }] };
}

module.exports = { premiumPanelVisual, premiumStatusVisual };
