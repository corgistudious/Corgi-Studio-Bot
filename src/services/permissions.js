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

module.exports = { isDeveloper, canSetup, developerIds };
