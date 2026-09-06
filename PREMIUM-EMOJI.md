# Corgi Studio Premium Emoji

V4.7 bundles the 28 supplied 128px Corgi Studio PNG emoji assets in `assets/corgi-premium/`.

On bot ready, Corgi-Bot synchronizes missing assets as Discord **application emojis** named `corgi_cs_01` through `corgi_cs_28`. Application emojis are owned by the bot application, so Premium servers can use the same exclusive set without copying the images into every guild.

Premium access rules:
- Server Premium must be active.
- `/setup -> Premium & Branding -> Corgi Emoji` must be ON.
- When Premium expires or the toggle is OFF, helpers fall back to normal Unicode emoji.
- The 28 source images remain bundled with the bot for synchronization.

The `/premium benefits` panel uses the Premium set when access is active, providing a runtime check that the emoji integration is working.
