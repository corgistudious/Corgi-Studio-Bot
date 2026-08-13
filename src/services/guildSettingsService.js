const GuildSettings = require("../models/GuildSettings");

async function getGuildSettings(guildId) {
  let settings = await GuildSettings.findOne({
    guildId
  });

  if (!settings) {
    settings = await GuildSettings.create({
      guildId
    });

    console.log(
      `🆕 Đã tạo cấu hình cho server ${guildId}`
    );
  }

  return settings;
}

async function updateGuildSettings(
  guildId,
  update
) {
  return GuildSettings.findOneAndUpdate(
    { guildId },
    update,
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  );
}

module.exports = {
  getGuildSettings,
  updateGuildSettings
};