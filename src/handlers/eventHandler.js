const fs = require("fs");
const path = require("path");

function loadEvents(client) {
  const eventsPath = path.join(
    __dirname,
    "../events"
  );

  if (!fs.existsSync(eventsPath)) {
    console.warn(
      "⚠️ Không tìm thấy thư mục events."
    );
    return;
  }

  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

  let loaded = 0;

  for (const file of eventFiles) {
    const filePath = path.join(
      eventsPath,
      file
    );

    const event = require(filePath);

    if (!event.name || !event.execute) {
      console.warn(
        `⚠️ Event không hợp lệ: ${file}`
      );
      continue;
    }

    const handler = (...args) =>
      event.execute(...args);

    if (event.once) {
      client.once(event.name, handler);
    } else {
      client.on(event.name, handler);
    }

    loaded++;

    console.log(
      `📡 Đã load Event: ${event.name}`
    );
  }

  console.log(
    `✅ Đã load ${loaded} event.`
  );
}

module.exports = loadEvents;