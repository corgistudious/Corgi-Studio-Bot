# Creature Hunt V5 localization fix

- Added dedicated Creature Hunt localization service for 12 configured locales.
- Localized primary V5 navigation/buttons and major V5 runtime surfaces.
- Added 12-locale slash-command descriptions for all Creature Hunt commands.
- Updated Game Hub Creature Hunt label from V4 to V5.
- Preserved CreatureProfile schema, MongoDB data, rewards, progression and pet appearance behavior.
- Existing V5 recovery/ascension/adventure/boss/relic/mission/achievement logic is preserved.
- `npm run validate` PASS before packaging.

Deploy by merging `src/` over the current project, then run `npm run validate`, deploy commands, and restart PM2.
