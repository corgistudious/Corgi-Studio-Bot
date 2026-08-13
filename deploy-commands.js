const fs = require("fs");
const path = require("path");

const {
  REST,
  Routes
} = require("discord.js");

require("dotenv").config();

// =====================================
// COMMAND ARRAYS
// =====================================

const globalCommands = [];
const developerCommands = [];

// =====================================
// COMMANDS PATH
// =====================================

const commandsPath =
  path.join(
    __dirname,
    "src/commands"
  );

const folders =
  fs.readdirSync(
    commandsPath
  );

// =====================================
// LOAD COMMANDS
// =====================================

for (const folder of folders) {
  const folderPath =
    path.join(
      commandsPath,
      folder
    );

  if (
    !fs
      .statSync(folderPath)
      .isDirectory()
  ) {
    continue;
  }

  const commandFiles =
    fs
      .readdirSync(
        folderPath
      )
      .filter(
        (file) =>
          file.endsWith(".js")
      );

  for (
    const file
    of commandFiles
  ) {
    const filePath =
      path.join(
        folderPath,
        file
      );

    const command =
      require(filePath);

    if (!command.data) {
      console.warn(
        `⚠️ Command không có data: ${filePath}`
      );

      continue;
    }

    const commandData =
      command.data.toJSON();

    // =====================================
    // /DEV = DEVELOPER GUILD ONLY
    // =====================================

    if (
      commandData.name === "dev"
    ) {
      developerCommands.push(
        commandData
      );

      console.log(
        "🔐 Guild Command: /dev"
      );

      continue;
    }

    // =====================================
    // EVERYTHING ELSE = GLOBAL
    // =====================================

    globalCommands.push(
      commandData
    );

    console.log(
      `🌍 Global Command: /${commandData.name}`
    );
  }
}

// =====================================
// REST
// =====================================

const rest =
  new REST({
    version: "10"
  }).setToken(
    process.env.DISCORD_TOKEN
  );

// =====================================
// DEPLOY
// =====================================

async function deployCommands() {
  try {
    // =====================================
    // ENV CHECK
    // =====================================

    if (
      !process.env.DISCORD_TOKEN
    ) {
      throw new Error(
        "Thiếu DISCORD_TOKEN trong .env"
      );
    }

    if (
      !process.env.CLIENT_ID
    ) {
      throw new Error(
        "Thiếu CLIENT_ID trong .env"
      );
    }

    if (
      !process.env.GUILD_ID
    ) {
      throw new Error(
        "Thiếu GUILD_ID trong .env"
      );
    }

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log(
      `🌍 Global Commands: ${globalCommands.length}`
    );

    console.log(
      `🔐 Developer Commands: ${developerCommands.length}`
    );

    console.log(
      `🏠 Developer Guild: ${process.env.GUILD_ID}`
    );

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    // =====================================
    // DEPLOY GLOBAL COMMANDS
    // =====================================

    console.log(
      "⏳ Đang đăng ký Global Commands..."
    );

    await rest.put(
      Routes.applicationCommands(
        process.env.CLIENT_ID
      ),

      {
        body:
          globalCommands
      }
    );

    console.log(
      `✅ Đã đăng ký ${globalCommands.length} Global Commands.`
    );

    // =====================================
    // DEPLOY DEVELOPER GUILD COMMANDS
    // =====================================

    console.log(
      "⏳ Đang đăng ký Developer Guild Commands..."
    );

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),

      {
        body:
          developerCommands
      }
    );

    console.log(
      `✅ Đã đăng ký ${developerCommands.length} Developer Guild Commands.`
    );

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log(
      "🎉 Deploy Slash Commands hoàn tất!"
    );

    console.log(
      "🌍 Tất cả command thường → GLOBAL"
    );

    console.log(
      "🔐 /dev → Developer Guild Only"
    );

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
  } catch (error) {
    console.error(
      "❌ Không thể đăng ký Slash Commands:"
    );

    console.error(
      error
    );
  }
}

// =====================================
// START
// =====================================

deployCommands();