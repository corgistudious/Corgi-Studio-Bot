# Corgi-Bot V4.1 command sync test

Run:

```powershell
npm install
npm run deploy:commands
npm start
```

When `DEV_GUILD_ID` is present, deployment deliberately clears stale global commands and publishes one guild-scoped command set. This prevents duplicate commands left behind by earlier V1/V2/V3 deployments.

Expected unique slash commands (18):

- /giveaway
- /stats
- /contest
- /poll
- /ticket
- /reactionrole
- /daily
- /leaderboard
- /balance
- /inventory
- /transfer
- /pet
- /help
- /dev
- /premium
- /redeem
- /setup
- /moderation
- /game
- /ai

Note: the actual source currently contains 20 command files/names; trust the deploy script's printed count/list if this checklist becomes stale.
