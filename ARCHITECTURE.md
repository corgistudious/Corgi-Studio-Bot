# Architecture

`src/index.js` only boots the client, database, handlers, and background services.

- `commands/` Slash + prefix command pairs.
- `events/` Discord event entry points.
- `services/` shared business rules: permissions, premium, i18n, guild settings.
- `models/` MongoDB schemas.
- `modules/` isolated feature domains, so Giveaway/Ticket/Pet/etc. can grow independently.
- `scripts/` slash deployment and maintenance utilities.

## Permission invariant
Developer identity and Discord guild management permission are intentionally separate. Being a Developer never bypasses `/setup` requirements.

## Stats invariant
The Stats service ticks every 3 seconds as specified. Only configured guilds/messages are touched, avoiding global message spam.
