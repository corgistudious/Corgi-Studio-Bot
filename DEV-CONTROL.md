# Corgi-Bot V4.5 Developer Control Center

Open with `/dev`. Access is restricted to Discord IDs in `DEVELOPER_USER_IDS` or the legacy `DEVELOPER_ID` environment variable.

Implemented pages/actions:
- Home dashboard: guild/member counts, WS ping, uptime, MongoDB state, Premium count, CD key count, economy profiles, maintenance/blacklist counts, AI key status and developer-log status.
- System & Services: runtime state and maintenance ON/OFF.
- Servers: list up to 20 guilds with IDs and member counts.
- Premium: list active Premium, grant/extend only approved durations, revoke all Premium records for a guild.
- CD Keys: create Cstar keys, create Premium keys, list recent keys, disable a key. Premium durations remain 7d/14d/21d/30d/1y/2y/5y/10y; there is no lifetime option.
- Cstar: add/subtract Cstar by guild/user ID, preventing negative balances.
- Blacklist: store/toggle blocked guild IDs and user IDs in MongoDB.

Note: blacklist and maintenance state are now stored, but enforcement across every ordinary command/event is a separate policy layer. V4.5 exposes and persists the controls; it does not silently block all modules without explicit enforcement logic.
