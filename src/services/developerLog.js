const { EmbedBuilder } = require('discord.js');

async function sendDeveloperLog(client, { title, description, fields = [] }) {
  const id = process.env.DEVELOPER_LOG_CHANNEL_ID;
  if (!id || !client?.isReady?.()) return false;
  try {
    const ch = await client.channels.fetch(id).catch(() => null);
    if (!ch?.isTextBased()) return false;
    await ch.send({ embeds: [new EmbedBuilder().setTitle(title).setDescription(description || null).addFields(fields).setFooter({ text: 'Corgi Studio • Developer Log' }).setTimestamp()] });
    return true;
  } catch (e) {
    console.warn('Developer log failed:', e.message);
    return false;
  }
}
module.exports = { sendDeveloperLog };
