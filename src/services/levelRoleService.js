async function syncLevelRole(
  member,
  level,
  settings
) {
  if (
    !member ||
    !settings
  ) {
    return {
      changed: false,
      role: null
    };
  }

  // =====================================
  // CURRENT LEVEL ROLES
  // =====================================

  const levelRoles =
    settings.leveling?.levelRoles || [];

  // =====================================
  // MANAGED ROLE HISTORY
  // =====================================

  const managedRoleIds =
    new Set(
      settings.leveling
        ?.managedLevelRoleIds || []
    );

  // Các role đang active cũng luôn được
  // xem là managed.
  for (const config of levelRoles) {
    if (config.roleId) {
      managedRoleIds.add(
        String(config.roleId)
      );
    }
  }

  // =====================================
  // VALID CONFIG
  // =====================================

  const sorted =
    levelRoles
      .filter(
        (config) =>
          Number.isFinite(
            Number(config.level)
          ) &&
          Number(config.level) >= 1 &&
          config.roleId
      )
      .map(
        (config) => ({
          level:
            Number(config.level),

          roleId:
            String(config.roleId)
        })
      )
      .sort(
        (a, b) =>
          a.level - b.level
      );

  // =====================================
  // TARGET ROLE
  // =====================================

  let targetConfig = null;

  for (const config of sorted) {
    if (
      level >= config.level
    ) {
      targetConfig =
        config;
    }
  }

  let targetRole = null;

  if (targetConfig) {
    targetRole =
      member.guild.roles.cache.get(
        targetConfig.roleId
      );

    if (!targetRole) {
      try {
        targetRole =
          await member.guild.roles.fetch(
            targetConfig.roleId
          );
      } catch {
        targetRole = null;
      }
    }
  }

  let changed = false;

  // =====================================
  // CLEANUP MANAGED ROLES
  // =====================================

  const rolesToRemove =
    member.roles.cache.filter(
      (role) =>
        managedRoleIds.has(
          role.id
        ) &&
        (
          !targetRole ||
          role.id !==
            targetRole.id
        )
    );

  for (
    const role
    of rolesToRemove.values()
  ) {
    // Không cố gỡ role bot không quản lý được
    if (!role.editable) {
      console.warn(
        `⚠️ Không thể gỡ managed Level Role ${role.name}`
      );

      continue;
    }

    try {
      await member.roles.remove(
        role,
        `Corgi Studio Level Role Cleanup → Level ${level}`
      );

      changed = true;

      console.log(
        `🧹 ${member.user.tag} mất Level Role cũ ${role.name}`
      );
    } catch (error) {
      console.error(
        `❌ Không thể cleanup role ${role.name}:`,
        error
      );
    }
  }

  // =====================================
  // USER CHƯA ĐẠT MỐC NÀO
  // =====================================

  if (!targetConfig) {
    return {
      changed,
      role: null
    };
  }

  // Config tồn tại nhưng role đã bị xóa
  if (!targetRole) {
    console.warn(
      `⚠️ Không tìm thấy Level Role ${targetConfig.roleId}`
    );

    return {
      changed,
      role: null
    };
  }

  // =====================================
  // BOT KHÔNG QUẢN LÝ ĐƯỢC TARGET
  // =====================================

  if (!targetRole.editable) {
    console.warn(
      `⚠️ Bot không thể quản lý role ${targetRole.name}`
    );

    return {
      changed,
      role: null
    };
  }

  // =====================================
  // ĐÃ CÓ TARGET ROLE
  // =====================================

  if (
    member.roles.cache.has(
      targetRole.id
    )
  ) {
    return {
      changed,
      role:
        targetRole
    };
  }

  // =====================================
  // ADD TARGET ROLE
  // =====================================

  try {
    await member.roles.add(
      targetRole,
      `Corgi Studio → Level ${level}`
    );

    changed = true;

    console.log(
      `🎖️ ${member.user.tag} nhận ${targetRole.name}`
    );

    return {
      changed,
      role:
        targetRole
    };
  } catch (error) {
    console.error(
      `❌ Không thể cấp Level Role ${targetRole.name}:`,
      error
    );

    return {
      changed,
      role: null
    };
  }
}

module.exports = {
  syncLevelRole
};