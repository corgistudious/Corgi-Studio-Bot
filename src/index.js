const {
  Client,
  GatewayIntentBits,
  Events
} = require("discord.js");

require("dotenv").config();

const connectDatabase =
  require("./database/mongodb");

const loadCommands =
  require("./handlers/commandHandler");

const loadComponents =
  require("./handlers/componentHandler");

const loadEvents =
  require("./handlers/eventHandler");

const loadInteractionHandler =
  require("./handlers/interactionHandler");

const loadPrefixCommands =
  require("./handlers/prefixCommandHandler");

// =====================================
// CLIENT
// =====================================

const client =
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

// =====================================
// LOAD SYSTEMS
// =====================================

loadCommands(client);

loadComponents(client);

loadEvents(client);

loadInteractionHandler(client);

loadPrefixCommands(client);

// =====================================
// READY
// =====================================

client.once(
  Events.ClientReady,
  (readyClient) => {
    console.log(
      "===================================="
    );

    console.log(
      "✅ CORGI STUDIO BOT ĐÃ ONLINE"
    );

    console.log(
      `🤖 Bot: ${readyClient.user.tag}`
    );

    console.log(
      `🆔 Bot ID: ${readyClient.user.id}`
    );

    console.log(
      `🌐 Servers: ${readyClient.guilds.cache.size}`
    );

    console.log(
      "⌨️ Prefix Commands: ?"
    );

    console.log(
      "===================================="
    );
  }
);

// =====================================
// CLIENT ERROR
// =====================================

client.on(
  Events.Error,
  (error) => {
    console.error(
      "❌ Discord Client Error:",
      error
    );
  }
);

// =====================================
// PROCESS ERROR
// =====================================

process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "❌ Unhandled Promise Rejection:",
      error
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "❌ Uncaught Exception:",
      error
    );
  }
);

// =====================================
// START BOT
// =====================================

async function startBot() {
  try {
    await connectDatabase();

    console.log(
      "⏳ Đang kết nối tới Discord..."
    );

    await client.login(
      process.env.DISCORD_TOKEN
    );
  } catch (error) {
    console.error(
      "❌ Không thể khởi động Corgi Studio Bot:"
    );

    console.error(
      error
    );

    process.exit(1);
  }
}

startBot();