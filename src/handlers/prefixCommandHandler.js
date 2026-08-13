const {
  Events
} = require("discord.js");

const path =
  require("path");

const fs =
  require("fs");

const PREFIX = "?";

// =====================================
// LOAD PREFIX COMMAND FILES
// =====================================

function loadPrefixCommandFiles() {
  const commands =
    new Map();

  const basePath =
    path.join(
      __dirname,
      "../prefixCommands"
    );

  if (
    !fs.existsSync(
      basePath
    )
  ) {
    console.warn(
      "⚠️ Không tìm thấy thư mục prefixCommands."
    );

    return commands;
  }

  const folders =
    fs.readdirSync(
      basePath
    );

  for (
    const folder
    of folders
  ) {
    const folderPath =
      path.join(
        basePath,
        folder
      );

    if (
      !fs
        .statSync(
          folderPath
        )
        .isDirectory()
    ) {
      continue;
    }

    const files =
      fs
        .readdirSync(
          folderPath
        )
        .filter(
          (file) =>
            file.endsWith(
              ".js"
            )
        );

    for (
      const file
      of files
    ) {
      const filePath =
        path.join(
          folderPath,
          file
        );

      const command =
        require(
          filePath
        );

      if (
        !command.name ||
        typeof command.execute !==
          "function"
      ) {
        console.warn(
          `⚠️ Prefix command không hợp lệ: ${filePath}`
        );

        continue;
      }

      commands.set(
        command.name.toLowerCase(),
        command
      );

      console.log(
        `⌨️ Loaded Prefix Command: ?${command.name}`
      );

      // =====================================
      // ALIASES
      // =====================================

      if (
        Array.isArray(
          command.aliases
        )
      ) {
        for (
          const alias
          of command.aliases
        ) {
          commands.set(
            alias.toLowerCase(),
            command
          );
        }
      }
    }
  }

  return commands;
}

// =====================================
// PREFIX HANDLER
// =====================================

function loadPrefixCommands(
  client
) {
  const commands =
    loadPrefixCommandFiles();

  client.prefixCommands =
    commands;

  client.on(
    Events.MessageCreate,

    async (message) => {
      try {
        // =====================================
        // BASIC CHECKS
        // =====================================

        if (
          !message.guild
        ) {
          return;
        }

        if (
          message.author.bot
        ) {
          return;
        }

        if (
          !message.content.startsWith(
            PREFIX
          )
        ) {
          return;
        }

        // =====================================
        // PARSE
        // =====================================

        const content =
          message.content
            .slice(
              PREFIX.length
            )
            .trim();

        if (!content) {
          return;
        }

        const args =
          content.split(
            /\s+/
          );

        const commandName =
          args
            .shift()
            ?.toLowerCase();

        if (
          !commandName
        ) {
          return;
        }

        // =====================================
        // BUILT-IN PING
        // =====================================

        if (
          commandName ===
          "ping"
        ) {
          await message.reply({
            content:
              "🏓 Pong!",

            allowedMentions: {
              repliedUser:
                false
            }
          });

          return;
        }

        // =====================================
        // FIND COMMAND
        // =====================================

        const command =
          commands.get(
            commandName
          );

        if (!command) {
          return;
        }

        // =====================================
        // EXECUTE
        // =====================================

        console.log(
          `⌨️ Prefix | ${message.author.tag} | ?${commandName}`
        );

        await command.execute({
          client,
          message,
          args,
          prefix:
            PREFIX
        });
      } catch (
        error
      ) {
        console.error(
          "❌ Prefix Command Handler Error:",
          error
        );

        try {
          await message.reply({
            content:
              "❌ Không thể xử lý Prefix Command này.",

            allowedMentions: {
              repliedUser:
                false
            }
          });
        } catch {}
      }
    }
  );

  console.log(
    "✅ Prefix Command Handler đã sẵn sàng."
  );
}

module.exports =
  loadPrefixCommands;