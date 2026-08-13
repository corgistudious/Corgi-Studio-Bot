function getXpTargetId(
  customId,
  prefix
) {
  if (
    !customId ||
    !customId.startsWith(prefix)
  ) {
    return null;
  }

  const userId =
    customId.slice(
      prefix.length
    );

  // Discord Snowflake
  if (!/^\d{17,20}$/.test(userId)) {
    return null;
  }

  return userId;
}

module.exports =
  getXpTargetId;