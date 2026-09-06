# V4.3 Voice Stats Board

`/stats` now creates a locked Discord voice-channel stats board instead of a text embed.

Default layout:

- 📊 SERVER STATS (category)
- 👥 Members: N
- 👤 Humans: N
- 🤖 Bots: N
- 🚀 Boosts: N

The stat voice channels are visible to @everyone but deny Connect/Speak/Stream/UseVAD.
The stats service checks every 3 seconds and only renames a voice channel when its value changed, reducing unnecessary Discord API edits.

In `/setup` -> Channels, **Stats** now selects a category. If none is selected, `/stats` creates `📊 SERVER STATS` automatically.

Bot permissions required: Manage Channels, View Channels.
