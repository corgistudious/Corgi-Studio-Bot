const {
  PermissionsBitField
} = require("discord.js");

const isDeveloper =
  require("./isDeveloper");

/**
 * Kiểm tra Bot Developer
 */
function isBotDeveloper(userId) {
  return isDeveloper(userId);
}

/**
 * Kiểm tra Server Owner
 */
function isGuildOwner(interaction) {
  return (
    interaction.guild &&
    interaction.guild.ownerId ===
      interaction.user.id
  );
}

/**
 * Kiểm tra Administrator
 */
function isAdministrator(interaction) {
  return Boolean(
    interaction.member?.permissions?.has(
      PermissionsBitField.Flags.Administrator
    )
  );
}

/**
 * Kiểm tra Manage Server
 */
function canManageGuild(interaction) {
  if (!interaction.guild) {
    return false;
  }

  // Bot Developer có toàn quyền Dashboard
  if (
    isBotDeveloper(
      interaction.user.id
    )
  ) {
    return true;
  }

  // Server Owner
  if (
    isGuildOwner(
      interaction
    )
  ) {
    return true;
  }

  // Administrator
  if (
    isAdministrator(
      interaction
    )
  ) {
    return true;
  }

  // Manage Server
  return Boolean(
    interaction.member?.permissions?.has(
      PermissionsBitField.Flags.ManageGuild
    )
  );
}

/**
 * Chỉ Bot Developer được chỉnh
 * hệ thống XP lõi.
 */
function canManageCoreXp(
  interaction
) {
  return isBotDeveloper(
    interaction.user.id
  );
}

/**
 * Level Roles / Level Up Channel
 *
 * Developer
 * Owner
 * Administrator
 * Manage Server
 */
function canManageLevelSettings(
  interaction
) {
  return canManageGuild(
    interaction
  );
}

module.exports = {
  isBotDeveloper,
  isGuildOwner,
  isAdministrator,
  canManageGuild,
  canManageCoreXp,
  canManageLevelSettings
};