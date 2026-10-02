require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
  ).filter((file) => file.endsWith('.js'));
}

function loadCommandJson() {
  const root = path.join(__dirname, '../src/commands');
  const byName = new Map();

  for (const file of walk(root)) {
    delete require.cache[require.resolve(file)];
    const command = require(file);
    if (!command.data) continue;

    const json = command.data.toJSON();
    if (byName.has(json.name)) {
      throw new Error(
        `Duplicate slash command name '${json.name}' in ${file} and ${byName.get(json.name).file}`
      );
    }
    byName.set(json.name, { json, file });
  }

  return [...byName.values()].map((x) => x.json);
}

async function fetchAllBotGuilds(rest) {
  const guilds = [];
  let after;

  while (true) {
    const query = new URLSearchParams({ limit: '200' });
    if (after) query.set('after', after);

    // Discord GET /users/@me/guilds works for the currently authenticated bot user.
    const page = await rest.get(`/users/@me/guilds?${query.toString()}`);
    if (!Array.isArray(page) || page.length === 0) break;

    guilds.push(...page);
    if (page.length < 200) break;
    after = page[page.length - 1].id;
  }

  return guilds;
}

async function clearGuildCommands(rest, clientId, guildId) {
  const route = Routes.applicationGuildCommands(clientId, guildId);
  await rest.put(route, { body: [] });
}

(async () => {
  if (!process.env.DISCORD_TOKEN) throw new Error('Missing DISCORD_TOKEN in .env');
  if (!process.env.CLIENT_ID) throw new Error('Missing CLIENT_ID in .env');

  const commands = loadCommandJson();
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const globalRoute = Routes.applicationCommands(process.env.CLIENT_ID);

  console.log(`🔎 Found ${commands.length} unique slash commands:`);
  console.log(commands.map((c) => `/${c.name}`).join(', '));

  // IMPORTANT: Discord can display duplicate command names when one copy is GLOBAL
  // and another stale copy is registered to a specific guild. V4.2 always cleans
  // stale guild command scopes before syncing the selected scope.
  let guilds = [];
  try {
    guilds = await fetchAllBotGuilds(rest);
    console.log(`🔎 Bot is currently in ${guilds.length} guild(s).`);
  } catch (error) {
    console.warn('⚠️ Could not enumerate bot guilds automatically.');
    console.warn('   If duplicate commands remain, set DEV_GUILD_ID to the affected server ID and run deploy again.');
  }

  for (const guild of guilds) {
    try {
      await clearGuildCommands(rest, process.env.CLIENT_ID, guild.id);
      console.log(`🧹 Cleared stale GUILD commands: ${guild.name || guild.id} (${guild.id})`);
    } catch (error) {
      console.warn(`⚠️ Could not clear guild commands for ${guild.id}: ${error.message}`);
    }
  }

  if (process.env.DEV_GUILD_ID) {
    // Development mode: exactly one scope = target guild.
    await rest.put(globalRoute, { body: [] });
    console.log('🧹 Cleared GLOBAL commands because DEV_GUILD_ID is set.');

    const guildRoute = Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.DEV_GUILD_ID
    );
    const deployed = await rest.put(guildRoute, { body: commands });
    console.log(`✅ Synced ${deployed.length} GUILD slash commands to ${process.env.DEV_GUILD_ID}.`);
  } else {
    // Production mode: exactly one scope = global.
    const deployed = await rest.put(globalRoute, { body: commands });
    console.log(`✅ Synced ${deployed.length} GLOBAL slash commands.`);
  }

  console.log('✅ Command cleanup + sync complete.');
  console.log('ℹ️ Fully quit and reopen Discord once if its command picker still shows a cached duplicate.');
})().catch((error) => {
  console.error('❌ Slash command deployment failed:');
  console.error(error);
  process.exit(1);
});
