const fs = require("fs");
const path = require("path");
const { Collection } = require("discord.js");

function loadCollection(directory, collection, label) {
  if (!fs.existsSync(directory)) {
    return;
  }

  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".js"));

  for (const file of files) {
    const filePath = path.join(directory, file);
    const component = require(filePath);

    if (!component.customId || !component.execute) {
      console.warn(`⚠️ ${label} không hợp lệ: ${file}`);
      continue;
    }

    collection.set(component.customId, component);

    console.log(
      `📦 Đã load ${label}: ${component.customId}`
    );
  }
}

function loadComponents(client) {
  client.buttons = new Collection();
  client.modals = new Collection();
  client.selectMenus = new Collection();

  const interactionsPath = path.join(
    __dirname,
    "../interactions"
  );

  loadCollection(
    path.join(interactionsPath, "buttons"),
    client.buttons,
    "Button"
  );

  loadCollection(
    path.join(interactionsPath, "modals"),
    client.modals,
    "Modal"
  );

  loadCollection(
    path.join(interactionsPath, "selectMenus"),
    client.selectMenus,
    "Select Menu"
  );

  console.log(
    `✅ Components: ${client.buttons.size} buttons | ` +
    `${client.modals.size} modals | ` +
    `${client.selectMenus.size} menus`
  );
}

module.exports = loadComponents;