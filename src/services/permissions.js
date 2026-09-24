const { PermissionFlagsBits } = require('discord.js');

function developerIds() {
  const raw = [process.env.DEVELOPER_USER_IDS, process.env.DEVELOPER_ID]
    .filter(Boolean)
    .join(',');
  return [...new Set(raw.split(',').map(s => s.trim()).filter(Boolean))];
}

function isDeveloper(userId) {
  return developerIds().includes(String(userId));
}

function canSetup(member) {
  return member?.permissions?.has(PermissionFlagsBits.ManageGuild) ||
    member?.permissions?.has(PermissionFlagsBits.Administrator);
}

async function isAuthorizedDeveloper(userId) {
  if (isDeveloper(userId)) return true;
  try {
    const WebRole = require('../models/WebRole');
    const row = await WebRole.findOne({ discordId: String(userId), role: 'developer' }).select('_id').lean();
    return Boolean(row);
  } catch (error) {
    console.error('[Developer Access] Failed to verify global developer role:', error.message);
    return false;
  }
}

module.exports = { isDeveloper, isAuthorizedDeveloper, canSetup, developerIds };
