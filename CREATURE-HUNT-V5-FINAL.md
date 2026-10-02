# Creature Hunt V5

V5 adds star-only Ascension (no appearance evolution), PvE Adventure, Boss Hunt, Relics, Daily/Weekly missions, Achievements, account progression, command/button parity, Developer dashboard, and preserves existing Creature data. The DARK UI asset is replaced with the supplied V5 artwork.

Migration: `npm run migrate:creature-v5`
Validation: `npm run validate`
Deploy commands: `npm run deploy:commands`

## V5.1 Level Reward + Pet Recovery
- Main Corgi Level Up card now grants and displays CXu from the shared global wallet.
- Level reward scales with level; every 10th level receives a milestone bonus.
- Level card labels support all 12 configured locales.
- Creature pets retain battle HP and recover progressively while online or offline.
- Recovery uses timestamps, survives bot restarts, and displays a countdown.
- KO pets have a longer recovery lock; injured pets need minimum HP before battle.
- Adventure/Boss battles now apply persistent post-battle damage and a small victory recovery bonus.
- Creature Hub includes a Recovery screen.
