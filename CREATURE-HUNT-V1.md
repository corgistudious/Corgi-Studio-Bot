# Corgi-Bot V9.0 — Creature Hunt V1

## Direction
Utility/social-first Corgi-Bot with a lightweight creature collection loop inspired by the accessibility of collection bots, while using original Corgi-Bot names, assets, data model and battle rules.

## Creature Hunt
- 64 original creature assets.
- 8 rarities: Common, Uncommon, Rare, Epic, Legendary, Mythic, Celestial, Secret.
- 8 elements: Normal, Fire, Water, Nature, Light, Dark, Ice, Electric.
- 5 Capture Orbs.
- `/hunt`, `/pet`, `/collection`, `/team`, `/battle`.
- Global collection profile; not tied to one Discord server.
- Duplicate captures increase copy count instead of creating uncontrolled duplicate rows.
- 20-second Hunt cooldown and 2-minute capture encounter.

## PvP
- Up to 3 creatures per team.
- Automatic PvP with HP / ATK / DEF / SPD and elemental advantages.
- PvP does not destroy pets or charge CXu.
- Rating starts at 1000; wins/losses are persistent.

## Game cleanup
Retired from command registration in V9: Farm, Frontier and casino-style CXu games (Tài Xỉu, Poker, Roulette, Liêng, Spin, Lottery). Their old models/modules are intentionally left in source so existing database data is not destroyed.

Fishing remains because its collection loop fits the lighter social direction. Clan, economy/CXu, profiles, creator cosmetics/marketplace, moderation, tickets, Premium and other non-game systems are preserved.

## Deploy
1. Back up production.
2. `npm install`
3. `npm run validate`
4. `npm run migrate:creature-v1`
5. `npm run deploy:commands`
6. Restart only the Corgi-Bot PM2 process.
