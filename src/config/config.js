require("dotenv").config();

const requiredEnv = [
  "DISCORD_TOKEN",
  "CLIENT_ID",
  "GUILD_ID"
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Thiếu biến môi trường: ${key}`);
  }
}

module.exports = {
  discordToken: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  mongoUri: process.env.MONGODB_URI || "",
  environment: process.env.NODE_ENV || "development"
};