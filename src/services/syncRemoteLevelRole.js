const {
  getGuildSettings
} = require("./guildSettingsService");

async function syncRemoteLevelRole(
  client,
  guildId,
  userId,
  level
) {
  try {
    const guild =
      client.guilds.cache.get(
        guildId
      );

    if (!guild) {
      return {
        success: false,
        reason: "GUILD_NOT_FOUND"
      };
    }

    let member = null;

    try {
      member =
        await guild.members.fetch(
          userId
        );
    } catch {
      member = null;
    }

    if (!member) {
      return {
        success: false,
        reason: "MEMBER_NOT_FOUND"
      };
    }

    const settings =
      await getGuildSettings(
        guildId
      );

    const levelRoles =
      Array.isArray(
        settings.leveling?.levelRoles
      )
        ? settings.leveling.levelRoles
        : [];

    const managedRoleIds =
      Array.isArray(
        settings.leveling?.managedLevelRoleIds
      )
        ? settings.leveling.managedLevelRoleIds.map(String)
        : [];

    const sortedRoles =
      [...levelRoles]
        .filter(
          (item) =>
            Number.isFinite(
              Number(item.level)
            ) &&
            item.roleId
        )
        .map(
          (item) => ({
            level:
              Number(item.level),

            roleId:
              String(item.roleId)
          })
        )
        .sort(
          (a, b) =>
            a.level - b.level
        );

    let targetConfig = null;

    for (const item of sortedRoles) {
      if (
        Number(level) >=
        item.level
      ) {
        targetConfig = item;
      } else {
        break;
      }
    }

    const targetRoleId =
      targetConfig?.roleId || null;

    const allManagedRoleIds =
      new Set([
        ...managedRoleIds,
        ...sortedRoles.map(
          (item) =>
            item.roleId
        )
      ]);

    const removedRoleIds = [];

    // =====================================
    // REMOVE OLD LEVEL ROLES
    // =====================================

    for (
      const roleId
      of allManagedRoleIds
    ) {
      if (
        roleId ===
        targetRoleId
      ) {
        continue;
      }

      if (
        !member.roles.cache.has(
          roleId
        )
      ) {
        continue;
      }

      const role =
        guild.roles.cache.get(
          roleId
        );

      if (!role) {
        continue;
      }

      if (!role.editable) {
        console.warn(
          `⚠️ Remote Sync không thể gỡ ${role.name}`
        );

        continue;
      }

      try {
        await member.roles.remove(
          role,
          `Corgi Studio Remote Level Sync → Level ${level}`
        );

        removedRoleIds.push(
          role.id
        );

        console.log(
          `🧹 Remote Sync gỡ ${role.name} khỏi ${member.user.tag}`
        );
      } catch (error) {
        console.error(
          `❌ Không thể gỡ ${role.name}:`,
          error
        );
      }
    }

    // =====================================
    // ADD TARGET ROLE
    // =====================================

    let addedRoleId = null;

    if (targetRoleId) {
      let targetRole =
        guild.roles.cache.get(
          targetRoleId
        );

      if (!targetRole) {
        try {
          targetRole =
            await guild.roles.fetch(
              targetRoleId
            );
        } catch {
          targetRole = null;
        }
      }

      if (
        targetRole &&
        targetRole.editable &&
        !member.roles.cache.has(
          targetRole.id
        )
      ) {
        try {
          await member.roles.add(
            targetRole,
            `Corgi Studio Remote Level Sync → Level ${level}`
          );

          addedRoleId =
            targetRole.id;

          console.log(
            `🎖️ Remote Sync cấp ${targetRole.name} cho ${member.user.tag}`
          );
        } catch (error) {
          console.error(
            `❌ Không thể cấp ${targetRole.name}:`,
            error
          );
        }
      }
    }

    return {
      success: true,
      targetRoleId,
      addedRoleId,
      removedRoleIds
    };
  } catch (error) {
    console.error(
      "❌ Remote Level Role Sync Error:",
      error
    );

    return {
      success: false,
      reason: "SYNC_ERROR"
    };
  }
}

module.exports = {
  syncRemoteLevelRole
};