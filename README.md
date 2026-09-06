# Corgi-Bot V4.9.1 — Groq AI Free + Full Help

Corgi-Bot Discord codebase with server setup, moderation, Cstar economy/games, Premium/CD Key, 28 Corgi Studio Premium emojis, Pet Game (Coming Soon), Ticket, Giveaway, Contest/Event, Reaction Role, server logs, voice stats, Developer Control, blacklist/maintenance and FREE Groq AI.

## Quick start

Requirements: Node.js 20+, MongoDB/MongoDB Atlas, Discord bot token.

```powershell
npm install
npm run deploy:commands
npm start
```

Keep your current `.env`. For FREE AI:

```env
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-120b
```

No OpenAI key or extra Groq npm package is required. The source uses Node.js 20 built-in `fetch` and Groq's OpenAI-compatible Chat Completions endpoint.

## In-bot help

```text
/help
/help category:moderation
/help category:economy
/help category:community
/help category:premium
/help category:ai
```

Prefix also supports:

```text
?help
?help moderation
?help economy
```

## Full documentation

See **`COMMAND-GUIDE.md`** for every command, syntax, permission and usage flow in this build.

## Important permission model

- `/setup`: Manage Server or Administrator.
- `/dev`: configured Developer IDs only.
- Developer without Manage Server/Admin does not get `/setup`.
- Blacklist + Maintenance are enforced on bot use.
- Prefix commands mirror slash `default_member_permissions`, preventing prefix moderation permission bypass.

## AI

`/ai` and `?ai` are FREE. Premium is not required. Blacklist and Maintenance still apply.

Default model:

```text
openai/gpt-oss-120b
```

## Premium

Supported durations only: 7d, 14d, 21d, 30d, 1y, 2y, 5y, 10y. No lifetime.

Premium includes 28 Corgi Studio application emojis and branding/configuration features implemented in the build. AI is not Premium-only.

## Bot avatar limitation

Discord bot account avatar is global across all guilds using that bot account. Automatic avatar changes remain protected by:

```env
ALLOW_GLOBAL_AVATAR_BRANDING=false
```

Per-guild nickname remains safe/server-scoped.

## Slash command deployment

Use `DEV_GUILD_ID` during development for fast guild command updates. Remove it and run `npm run deploy:commands` for production global commands. The deploy script clears stale guild/global scopes to reduce duplicate slash commands.


## Pet Game status
Pet Game is intentionally locked in V4.10 and marked **Coming Soon**. `/pet` and `?pet` only show the Coming Soon notice. The Pet model/module source is retained for future development, but setup cannot enable it and no Cstar/Pet data is changed by the command.
