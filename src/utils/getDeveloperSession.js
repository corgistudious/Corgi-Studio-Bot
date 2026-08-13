module.exports = function getDeveloperSession(interaction) {
  const session =
    interaction.client
      .developerSessions
      ?.get(
        interaction.user.id
      );

  if (
    !session ||
    !session.guildId ||
    !session.userId
  ) {
    return null;
  }

  return session;
};