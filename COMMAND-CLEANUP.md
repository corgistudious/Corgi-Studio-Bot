# V4.2 Command Cleanup

This patch fixes duplicate slash commands caused by stale Discord guild-scoped commands coexisting with global commands.

Run:

```powershell
npm install
npm run deploy:commands
npm start
```

The deploy script now:
1. Verifies command names are unique in source.
2. Enumerates guilds the bot is currently in.
3. Clears old guild-scoped application commands.
4. Deploys only one active scope:
   - `DEV_GUILD_ID` set: guild commands only, global commands cleared.
   - `DEV_GUILD_ID` unset: global commands only, guild commands cleared.

After deployment, fully quit and reopen Discord once if the command picker still has cached entries.
