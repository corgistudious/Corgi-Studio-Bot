# Creature Hunt V5 — Developer Control + i18n

## Added to /dev → Creature Hunt V5
- Global V5 enable/disable
- Ascension: max Stars and Essence cost base
- Recovery: full recovery minutes, KO minutes, minimum battle-ready HP, win-heal rate
- PvE Adventure: Essence/EXP base and per-stage rewards
- Boss Hunt: Essence/EXP base and per-stage rewards
- Daily missions: Hunt/Battle requirements and Essence/Great Orb rewards
- Weekly missions: Capture/Boss requirements and Essence/Ultra/Celestial rewards
- Reset V5 settings to balanced defaults without resetting player data
- Live dashboard: player count, total Stars raised, total Boss kills, current settings

## Runtime integration
Developer settings are stored in DeveloperSettings.creatureV5 and are read by Creature V5 gameplay. Mission UI reads the same live settings, so requirements/rewards shown to players match the configured values.

## Localization
- Existing Creature Hunt V5 12-locale key-based localization retained.
- /dev command description now has all 12 Discord localizations.
- V5 mission dynamic labels continue to use Creature locale keys.
- Developer configuration itself intentionally uses stable admin terminology/values to avoid translating IDs or numeric configuration semantics.

## Safety
- No player CreatureProfile reset.
- No Pet/Star/Essence/Relic/Mission/Boss progress deletion.
- New DeveloperSettings fields use defaults for backward compatibility.
- Full JS syntax check passed.
- npm run validate passed: 12 locales / full-localization gate PASS.
