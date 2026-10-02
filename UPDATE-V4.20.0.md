# Corgi-Bot V4.20.0 — Ticket + Advanced Table Games

## Ticket
- Removes Payment / Premium and CD Key from the default/support ticket selector.
- Existing guild ticket configs are normalized when Community Panel config is loaded.
- Adds Bot / Feature Help and Account / Data Issue.
- Built-in ticket type names/descriptions render in EN/VI from the guild language.

## Games
- Advanced Sic Bo: Big/Small, totals 4–17, singles, doubles, triples, any triple, two-number combinations.
- Texas Hold'em: opening bet, Flop, Turn, River, staged Check/Bet/Fold, showdown using best 5 of 7.
- Full European Roulette: straight, split, street, zero trio, corner, 0-1-2-3 basket, six line, dozen, column, red/black, odd/even, halves.
- 24-hour Lottery: random 5 main numbers + Power number; persistent MongoDB tickets; automatic settlement after 24 hours; status command.
- Liêng: opening bet, 3-card deal, Check/Bet/Fold, showdown; Sáp > Liêng > Ảnh > Điểm.
- Game wagers use atomic wallet debits for the new/updated table flows.

## Localization
- New slash descriptions/options, game messages, table buttons, ticket built-ins, and Help are synchronized EN/VI.
- Existing guild language setting remains the single locale source.

## Data safety
- No existing economy/progression collections are dropped or reset.
- New persistent collections: GameSession and LotteryTicket.
