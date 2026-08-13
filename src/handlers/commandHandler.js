const fs = require("fs");
const path = require("path");
const { Collection } = require("discord.js");

function loadCommands(client) {
  client.commands = new Collection();

  const commandsPath = path.join(__dirname, "../commands");

  if (!fs.existsSync(commandsPath)) {
    console.warn("⚠️ Không tìm thấy thư mục commands.");
    return;
  }

  const folders = fs.readdirSync(commandsPath);

  for (const folder of folders) {
    const folderPath = path.join(commandsPath, folder);

    if (!fs.statSync(folderPath).isDirectory()) {
      continue;
    }

    const commandFiles = fs
      .readdirSync(folderPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);

      if (!command.data || !command.execute) {
        console.warn(`⚠️ Command không hợp lệ: ${file}`);
        continue;
      }

      client.commands.set(command.data.name, command);

      console.log(`📦 Đã load command: /${command.data.name}`);
    }
  }

  console.log(`✅ Đã load ${client.commands.size} command.`);
}

module.exports = loadCommands;