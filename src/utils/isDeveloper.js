function isDeveloper(userId) {
  const developerId =
    process.env.DEVELOPER_ID;

  if (!developerId) {
    console.error(
      "❌ DEVELOPER_ID chưa được thiết lập trong .env"
    );

    return false;
  }

  return userId === developerId;
}

module.exports = isDeveloper;