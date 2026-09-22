const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { guildLang, mtx } = require('../../services/i18n');

function lines(lang, category) {
  const vi = lang === 'vi';
  const pages = {
    all: vi ? [
      '**Cách sử dụng Help**',
      '• `/help category:<danh mục>` — mở hướng dẫn theo nhóm.',
      '• `?help <danh_mục>` — bản Prefix tương ứng.',
      '• Prefix mặc định: `?`.',
      '',
      '**Danh mục hướng dẫn**',
      '🛠️ `setup` — cấu hình server, ngôn ngữ, kênh Global Mail.',
      '👤 `member` — Profile, Ranking, ví và các lệnh thường dùng.',
      '⭐ `economy` — <:cxu_coin:1551759873241251912> CXu, Daily, chuyển tiền, Inventory.',
      '🎮 `games` — Game Hub Direct Action, 50 game, Fishing 2.0 và Tournament.',
      '🧡 `community` — Giveaway, Contest, Poll, Reaction Role, Ticket, Stats.',
      '🛡️ `moderation` — Warn, Kick, Mute, Ban, Clear...',
      '💎 `premium` — Premium Server, VIP Profile, Redeem CD Key.',
      '🤖 `ai` — Corgi AI.',
      '🧑‍💻 `developer` — CD Key tùy chỉnh, xác minh Profile và công cụ Developer.',
      '',
      '**Ký hiệu trong hướng dẫn**',
      '• `<...>` = bắt buộc nhập.',
      '• `[...]` = tùy chọn.',
      '• `@user` = mention thành viên.',
      '• `USER_ID` / `message_id` = ID Discord tương ứng.',
      '',
      'Ví dụ: `/help category:games` hoặc `?help games`.'
    ] : [
      '**How to use Help**',
      '• `/help category:<category>` — open a detailed command group.',
      '• `?help <category>` — matching Prefix guide.',
      '• Default prefix: `?`.',
      '',
      '**Help categories**',
      '🛠️ `setup` — server configuration, language, Global Mail channel.',
      '👤 `member` — Profile, Ranking and common member commands.',
      '⭐ `economy` — <:cxu_coin:1551759873241251912> CXu, Daily, transfers and Inventory.',
      '🎮 `games` — Direct Action Game Hub, 50 games, Fishing 2.0 and Tournaments.',
      '🧡 `community` — Giveaway, Contest, Poll, Reaction Role, Ticket, Stats.',
      '🛡️ `moderation` — Warn, Kick, Mute, Ban, Clear...',
      '💎 `premium` — Server Premium, VIP Profile, CD Key redemption.',
      '🤖 `ai` — Corgi AI.',
      '🧑‍💻 `developer` — custom CD Keys, Profile verification and Developer tools.',
      '',
      '**Guide notation**',
      '• `<...>` = required.',
      '• `[...]` = optional.',
      '• `@user` = member mention.',
      '• `USER_ID` / `message_id` = matching Discord ID.',
      '',
      'Example: `/help category:games` or `?help games`.'
    ],

    setup: vi ? [
      '**🛠️ Cấu hình Server**',
      '`/setup` — mở Control Center tương tác. Cần **Manage Server** hoặc **Administrator**.',
      '`?setup` — nhắc mở `/setup`; cấu hình đầy đủ dùng Slash.',
      '',
      '**Các mục chính trong `/setup`**',
      '• **Modules** — bật/tắt hệ thống.',
      '• **Channels** — Welcome, Leave, Logs, Stats, Ticket và **Global Mail**.',
      '• **Server Stats** — bật/tắt từng mục Stats riêng; có nút bật/tắt toàn bộ Free và Premium Stats.',
      '• **Events** — Giveaway / Contest Builder.',
      '• **Community Panels** — Welcome, Ticket, Reaction Role.',
      '• **Premium & Branding** — tùy chỉnh Premium.',
      '• **Language** — `🇺🇸 EN` / `🇻🇳 VI`.',
      '',
      '**📬 Kênh Global Mail**',
      'Vào `/setup` → **Channels** → **Global Mail** → chọn kênh text/announcement.',
      'Sau khi đặt, Global Mail từ Developer ưu tiên gửi đúng kênh này.',
      'Nếu chưa đặt, bot fallback: System Channel → Logs → Welcome → kênh text bot gửi được.',
      '',
      '**Ngôn ngữ**',
      'Profile và các phần bot hỗ trợ sẽ theo `/setup → Language`.'
    ] : [
      '**🛠️ Server Configuration**',
      '`/setup` — opens the interactive Control Center. Requires **Manage Server** or **Administrator**.',
      '`?setup` — points you to `/setup`; full configuration uses Slash.',
      '',
      '**Main `/setup` pages**',
      '• **Modules** — enable/disable systems.',
      '• **Channels** — Welcome, Leave, Logs, Stats, Ticket and **Global Mail**.',
      '• **Server Stats** — enable/disable each stat individually; bulk enable/disable Free and Premium Stats.',
      '• **Events** — Giveaway / Contest Builder.',
      '• **Community Panels** — Welcome, Ticket, Reaction Role.',
      '• **Premium & Branding** — Premium customization.',
      '• **Language** — `🇺🇸 EN` / `🇻🇳 VI`.',
      '',
      '**📬 Global Mail channel**',
      'Open `/setup` → **Channels** → **Global Mail** → select a text/announcement channel.',
      'Developer Global Mail will prefer this channel.',
      'If unset, fallback is System Channel → Logs → Welcome → first writable text channel.',
      '',
      '**Language**',
      'Profile and supported bot UI follow `/setup → Language`.'
    ],

    member: vi ? [
      '**👤 Hồ sơ & xếp hạng**',
      '`/profile [user]` • `?profile [@user]` • alias `?pf`',
      '→ Xem hồ sơ gaming liên server. Bỏ `user` để xem chính mình.',
      'Ví dụ: `/profile user:@Corgi` hoặc `?pf @Corgi`.',
      '',
      '`/ranking [type]` • `?ranking [weekly|global]` • alias `?rank`',
      '→ `weekly` = BXH tuần, `global` = BXH tổng EXP.',
      'Ví dụ: `/ranking type:global` hoặc `?rank global`.',
      '',
      '**✨ EXP & Level**',
      '• EXP chỉ tăng từ **tin nhắn trò chuyện bình thường của member** trong server.',
      '• Mỗi lần đủ điều kiện nhận ngẫu nhiên **15–25 EXP**, có **cooldown 60 giây** theo cấu hình mặc định.',
      '• Slash Command, Prefix `?`, Button, Select Menu, Modal và thao tác cấu hình bot **không cộng EXP**.',
      '• `/profile`, `/ranking`, `/help`, `/setup`, `/dev`, game, Ticket, Premium, Redeem... chỉ dùng tính năng và **không tạo EXP**.',
      '• **Hạng liên server** dùng `totalXp` cộng dồn; **Đua Top tuần** chỉ dùng EXP chat kiếm được trong tuần hiện tại.',
      '',
      '**✅ Xác minh Profile**',
      'Profile có thể được Developer xét duyệt theo từng giai đoạn.',
      '• 🔵 Identity — định danh tài khoản thật.',
      '• 🔴 Developer — tài khoản Developer.',
      '• 🟡 Admin — quản trị chung.',
      '• 🟣 Partner — đối tác Corgi-Bot.',
      'Khi APPROVED, badge Application Emoji hiển thị nhỏ ngay cạnh tên Discord trên `/profile`.',
      'Góc phải Profile dùng logo Corgi-Bot thường; server có Premium active sẽ tự đổi sang logo Corgi-Bot Premium.',
      '',
      '**⭐ Lệnh nhanh Member**',
      '`/balance` • `?balance` / `?bal` — xem <:cxu_coin:1551759873241251912> CXu.',
      '`/daily` • `?daily` — nhận Daily.',
      '`/inventory` • `?inventory` / `?inv` — xem túi đồ.',
      '`/leaderboard` • `?leaderboard` / `?lb` — BXH <:cxu_coin:1551759873241251912> CXu.',
      '`/transfer user:@user amount:1000` • `?transfer @user 1000` / `?pay @user 1000`.',
      '',
      '`/games` • `?games` — mở Game Hub; Pet Hunt/Pet Arena nằm trong Game Hub.'
    ] : [
      '**👤 Profile & rankings**',
      '`/profile [user]` • `?profile [@user]` • alias `?pf`',
      '→ View a global gaming profile. Omit the user to view yourself.',
      'Example: `/profile user:@Corgi` or `?pf @Corgi`.',
      '',
      '`/ranking [type]` • `?ranking [weekly|global]` • alias `?rank`',
      '→ `weekly` = weekly ranking, `global` = all-time EXP.',
      'Example: `/ranking type:global` or `?rank global`.',
      '',
      '**✨ EXP & Level**',
      '• EXP is earned only from **normal member chat messages** in the server.',
      '• Each eligible award grants a random **15–25 EXP** with the default **60-second cooldown**.',
      '• Slash Commands, Prefix `?`, Buttons, Select Menus, Modals and bot-configuration actions **do not grant EXP**.',
      '• `/profile`, `/ranking`, `/help`, `/setup`, `/dev`, games, Ticket, Premium, Redeem and similar feature actions **do not create EXP**.',
      '• **Global Rank** uses cumulative `totalXp`; **Weekly Rank** uses only chat EXP earned in the current week.',
      '',
      '**✅ Profile Verification**',
      'Profiles can be reviewed by a Developer through staged verification.',
      '• 🔵 Identity — real-account identity verification.',
      '• 🔴 Developer — Developer account.',
      '• 🟡 Admin — general administration.',
      '• 🟣 Partner — Corgi-Bot partner.',
      'When APPROVED, the Application Emoji badge appears inline next to the Discord name on `/profile`.',
      'The Profile thumbnail uses the normal Corgi-Bot logo; an active Premium server automatically uses the Premium logo.',
      '',
      '**⭐ Common member commands**',
      '`/balance` • `?balance` / `?bal` — view <:cxu_coin:1551759873241251912> CXu.',
      '`/daily` • `?daily` — claim Daily.',
      '`/inventory` • `?inventory` / `?inv` — view inventory.',
      '`/leaderboard` • `?leaderboard` / `?lb` — <:cxu_coin:1551759873241251912> CXu leaderboard.',
      '`/transfer user:@user amount:1000` • `?transfer @user 1000` / `?pay @user 1000`.',
      '',
      '`/games` • `?games` — open Game Hub; Pet Hunt/Pet Arena are available inside the hub.'
    ],

    economy: vi ? [
      '**⭐ <:cxu_coin:1551759873241251912> CXu Economy**',
      '`/balance` • `?balance` / `?bal` — xem ví liên server.',
      '`/daily` • `?daily` — random **1–10.000 <:cxu_coin:1551759873241251912> CXu**; Premium STANDARD nhận **×2** trong cùng một lần claim.',
      '`/inventory` • `?inventory` / `?inv` — xem Inventory.',
      '`/leaderboard` • `?leaderboard` / `?lb` — Top 10 <:cxu_coin:1551759873241251912> CXu toàn hệ thống.',
      '',
      '**Chuyển <:cxu_coin:1551759873241251912> CXu**',
      'Slash: `/transfer user:@member amount:<số>`',
      'Prefix: `?transfer @member <số>` hoặc `?pay @member <số>`',
      'Ví dụ: `?transfer @Corgi 5000`.',
      'Không thể tự chuyển cho chính mình hoặc bot.',
      '',
      '**CD Key**',
      '`/redeem` • `?redeem` — mở Panel Redeem CD Key.',
      'Nhấn **🔑 Nhập CD Key** → nhập key trong Modal riêng → xác nhận.',
      'CD Key không cần gõ trực tiếp vào kênh chat.',
      'Developer có thể tạo key tên tùy chỉnh như `Corgi2026`, `CorgiTanThu` hoặc để bot tạo key tự động.'
    ] : [
      '**⭐ <:cxu_coin:1551759873241251912> CXu Economy**',
      '`/balance` • `?balance` / `?bal` — global wallet balance.',
      '`/daily` • `?daily` — random **1–10,000 <:cxu_coin:1551759873241251912> CXu**; STANDARD Premium receives **×2** in the same claim.',
      '`/inventory` • `?inventory` / `?inv` — view Inventory.',
      '`/leaderboard` • `?leaderboard` / `?lb` — global Top 10 <:cxu_coin:1551759873241251912> CXu.',
      '',
      '**Transfer <:cxu_coin:1551759873241251912> CXu**',
      'Slash: `/transfer user:@member amount:<number>`',
      'Prefix: `?transfer @member <number>` or `?pay @member <number>`',
      'Example: `?transfer @Corgi 5000`.',
      'You cannot transfer to yourself or a bot.',
      '',
      '**CD Key**',
      '`/redeem` • `?redeem` — open the CD Key Redeem panel.',
      'Press **🔑 Enter CD Key** → enter the key in the private modal → confirm.',
      'The CD Key does not need to be typed directly into chat.',
      'Developers can create custom key names such as `Corgi2026`, `CorgiTanThu`, or let the bot generate a key automatically.'
    ],

    games: vi ? [
      '**🎮 Game Hub Direct Action • 50 Game**','`/games` • `?games` — mở Hub và chơi bằng Button/Select. `?game <id>` hoặc `/game name:<id>` để vào game bằng lệnh.','`/tournaments` • `?tournaments` — Tournament Center.','Fishing 2.0, Pet Hunt, Pet Arena, Expedition, Dungeon, Mining và nhiều game khác dùng chung Game Hub.','',
      '**🎮 Game dùng <:cxu_coin:1551759873241251912> CXu**','Mức cược: **10 → 1.000.000 <:cxu_coin:1551759873241251912> CXu**. <:cxu_coin:1551759873241251912> CXu chỉ là tiền ảo giải trí.','',
      '**🎣 Corgi Fishing**','`/fish` • `?fish` — mở Trung tâm Câu Cá. `/fishing` • `?fishing` — câu ngay.','Trung tâm Câu Cá gồm Túi cá, Fishdex, Cửa hàng mồi, nâng cấp cần và **1 bảng xếp hạng câu cá toàn cầu**.','Nâng cần yêu cầu đồng thời số cá đã câu tích lũy + tổng cân nặng tích lũy + <:cxu_coin:1551759873241251912> CXu. Bán cá không làm mất Fishdex/kỷ lục.','',
      '**🎲 Tài Xỉu / Sic Bo nâng cao**','`/taixiu` • `?taixiu` — mở panel • vẫn hỗ trợ cược nhanh bằng tham số','Cửa: `tai/xiu`, `total4`…`total17`, `single1`…`single6`, `double1`…`double6`, `triple1`…`triple6`, `anytriple`, hoặc cặp hai mặt như `pair12`.','',
      '**🃏 Poker Texas Hold’em**','`/poker bet:<số>` • `?poker <số>`','Cược mở đầu → 2 lá riêng + Flop 3 lá → Theo/Cược thêm/Bỏ → Turn → cược → River → cược → Showdown.','',
      '**🎡 Roulette đầy đủ**','`/roullette` • `?roulette` — mở panel • vẫn hỗ trợ cược nhanh bằng tham số','Hỗ trợ Straight, Split, Street, Zero Trio, Corner, 0-1-2-3 Basket, Six Line, Dozen, Column, Red/Black, Odd/Even và 1–18/19–36.','Ví dụ: `?roulette straight 17 500` hoặc `?roulette color red 1000`.','',
      '**🂡 Liêng**','`/lieng bet:<số>` • `?lieng <số>`','Cược mở đầu → chia 3 lá → Theo/Cược thêm/Bỏ → lật bài. Xếp hạng: Sáp > Liêng > Ảnh > Điểm.','',
      '**🎰 Spin**','`/spin bet:<số>` • `?spin <số>`','Tiền thắng chờ nút **Rút <:cxu_coin:1551759873241251912> CXu** nếu phiên yêu cầu.','',
      '**🎟️ Lottery 24 giờ**','`/lottery buy bet:<giá vé>` • `?lottery buy <giá vé>`','Bot cấp ngẫu nhiên 5 số + 1 số đặc biệt. Vé **không mở ngay**; tự mở và trả thưởng sau 24 giờ.','`/lottery status` • `?lottery status` — xem vé gần nhất.'
    ] : [
      '**🎮 Direct Action Game Hub • 50 Games**','`/games` • `?games` — open the Hub and play with Buttons/Selects. `?game <id>` or `/game name:<id>` opens a game by command.','`/tournaments` • `?tournaments` — Tournament Center.','Fishing 2.0, Pet Hunt, Pet Arena, Expedition, Dungeon, Mining and many more share the Game Hub.','',
      '**🎮 <:cxu_coin:1551759873241251912> CXu Games**','Bet range: **10 → 1,000,000 <:cxu_coin:1551759873241251912> CXu**. <:cxu_coin:1551759873241251912> CXu is entertainment-only virtual currency.','',
      '**🎣 Corgi Fishing**','`/fish` • `?fish` — open Fishing Center. `/fishing` • `?fishing` — cast immediately.','Fishing Center includes Bag, Fishdex, bait shop, rod upgrades and **one global Fishing Ranking**.','Rod upgrades require lifetime fish count + lifetime weight + <:cxu_coin:1551759873241251912> CXu together. Selling fish never removes Fishdex/records.','',
      '**🎲 Advanced Sic Bo**','`/taixiu` • `?taixiu` — open panel • quick-play parameters are still supported','Bets: `big/small`, `total4`…`total17`, `single1`…`single6`, `double1`…`double6`, `triple1`…`triple6`, `anytriple`, or two-face combinations such as `pair12`.','',
      '**🃏 Texas Hold’em Poker**','`/poker bet:<amount>` • `?poker <amount>`','Opening bet → 2 hole cards + 3-card Flop → Check/Bet again/Fold → Turn → betting → River → betting → Showdown.','',
      '**🎡 Full Roulette**','`/roullette` • `?roulette` — open panel • quick-play parameters are still supported','Supports Straight, Split, Street, Zero Trio, Corner, 0-1-2-3 Basket, Six Line, Dozen, Column, Red/Black, Odd/Even, and 1–18/19–36.','Example: `?roulette straight 17 500` or `?roulette color red 1000`.','',
      '**🂡 Liêng**','`/lieng bet:<amount>` • `?lieng <amount>`','Opening bet → 3 cards → Check/Bet again/Fold → showdown. Ranking: Three of a Kind > Straight > Three Face Cards > Points.','',
      '**🎰 Spin**','`/spin bet:<amount>` • `?spin <amount>`','Winnings remain pending until **cashout** when required.','',
      '**🎟️ 24-hour Lottery**','`/lottery buy bet:<ticket price>` • `?lottery buy <ticket price>`','The bot assigns 5 random main numbers + 1 Power number. Tickets are **not drawn immediately**; settlement happens automatically after 24 hours.','`/lottery status` • `?lottery status` — view recent tickets.'
    ],

    community: vi ? [
      '**🧡 Giveaway**',
      '`/giveaway panel` — mở Builder.',
      '`/giveaway pause message_id:<ID>` — tạm dừng.',
      '`/giveaway resume message_id:<ID>` — tiếp tục.',
      '`/giveaway end message_id:<ID>` — kết thúc ngay.',
      '`/giveaway reroll message_id:<ID>` — quay lại người thắng sau khi kết thúc.',
      '`?giveaway` chỉ hướng dẫn bạn sang Builder; thao tác nhanh dùng Slash.',
      '',
      '**🏆 Contest**',
      '`/contest panel` — mở Builder.',
      '`/contest submit contest_id:<ID> file:<upload> [caption]` — member nộp bài.',
      'Admin: `approve`, `reject`, `approve_all`, `close_submissions`, `open_vote`, `end_vote`, `results`, `publish`, `cancel`.',
      '`?contest` chỉ hướng dẫn; nộp bài dùng `/contest submit`.',
      '',
      '**📊 Poll**',
      '`/poll question:<câu hỏi> option1:<A> option2:<B> [option3] [option4]`',
      '`?poll <câu hỏi>` — Prefix tạo poll Yes/No đơn giản.',
      '',
      '**🎭 Reaction Role**',
      '`/reactionrole add message_id:<ID> emoji:<emoji> role:@role`',
      '`/reactionrole remove message_id:<ID> emoji:<emoji>`',
      'Builder nhiều Emoji → Role nằm trong `/setup → Community Panels`.',
      '',
      '**🎫 Ticket / 📊 Stats**',
      '`/ticket panel` — đăng panel tạo Ticket.',
      'Trong `/setup → Community Panels → Ticket Center`, chọn **Role Staff**. Member không cần Role để mở Ticket; khi Ticket được tạo, bot tự thêm và tag Role Staff trong kênh riêng.',
      '`/stats` — tạo/sửa Stats Board.',
      'Trong Stats Config có thể bật/tắt riêng từng mục: Members, Humans, Bots, Roles và các Premium Stats nếu server đủ quyền.',
      'Có nút **Bật tất cả / Tắt tất cả** để dọn các Stats không sử dụng.',
      'Hai lệnh này hiện dùng Slash.'
    ] : [
      '**🧡 Giveaway**',
      '`/giveaway panel` — open Builder.',
      '`/giveaway pause message_id:<ID>` — pause.',
      '`/giveaway resume message_id:<ID>` — resume.',
      '`/giveaway end message_id:<ID>` — end now.',
      '`/giveaway reroll message_id:<ID>` — reroll after ending.',
      '`?giveaway` points you to the Builder; quick actions use Slash.',
      '',
      '**🏆 Contest**',
      '`/contest panel` — open Builder.',
      '`/contest submit contest_id:<ID> file:<upload> [caption]` — member submission.',
      'Admin: `approve`, `reject`, `approve_all`, `close_submissions`, `open_vote`, `end_vote`, `results`, `publish`, `cancel`.',
      '`?contest` is guidance only; submissions use `/contest submit`.',
      '',
      '**📊 Poll**',
      '`/poll question:<question> option1:<A> option2:<B> [option3] [option4]`',
      '`?poll <question>` — Prefix creates a simple Yes/No poll.',
      '',
      '**🎭 Reaction Role**',
      '`/reactionrole add message_id:<ID> emoji:<emoji> role:@role`',
      '`/reactionrole remove message_id:<ID> emoji:<emoji>`',
      'Multi Emoji → Role Builder is in `/setup → Community Panels`.',
      '',
      '**🎫 Ticket / 📊 Stats**',
      '`/ticket panel` — post Ticket panel.',
      'In `/setup → Community Panels → Ticket Center`, choose the **Staff Role**. Members do not need the role to open a ticket; the bot adds and mentions the Staff Role inside the private ticket channel.',
      '`/stats` — create/repair Stats Board.',
      'Stats Config can toggle Members, Humans, Bots, Roles and unlocked Premium Stats individually.',
      'Bulk **Enable All / Disable All** controls are available for unused stats.',
      'These currently use Slash.'
    ],

    moderation: vi ? [
      '**🛡️ Moderation — Slash / Prefix**',
      '`/warn user:@member reason:<lý do>`',
      '`?warn @member <lý do>`',
      '',
      '`/warnings user:@member` • `?warnings @member`',
      '`/kick user:@member [reason]` • `?kick @member [lý do]`',
      '`/mute user:@member minutes:<1-40320> [reason]`',
      '`?mute @member <phút> [lý do]`',
      '`/unmute user:@member [reason]` • `?unmute @member [lý do]`',
      '`/ban user:@member [reason]` • `?ban @member [lý do]`',
      '`/unban user_id:<USER_ID> [reason]` • `?unban USER_ID [lý do]`',
      '`/clear amount:<1-100>` • `?clear <1-100>` • alias `?xoa`',
      '',
      '**Ví dụ**',
      '`?mute @Corgi 30 spam liên tục`',
      '`?unban 123456789012345678 đã xử lý khiếu nại`',
      '`?clear 50`',
      '',
      'Bot phải có quyền Discord phù hợp và role bot phải đứng cao hơn member mục tiêu.'
    ] : [
      '**🛡️ Moderation — Slash / Prefix**',
      '`/warn user:@member reason:<reason>`',
      '`?warn @member <reason>`',
      '',
      '`/warnings user:@member` • `?warnings @member`',
      '`/kick user:@member [reason]` • `?kick @member [reason]`',
      '`/mute user:@member minutes:<1-40320> [reason]`',
      '`?mute @member <minutes> [reason]`',
      '`/unmute user:@member [reason]` • `?unmute @member [reason]`',
      '`/ban user:@member [reason]` • `?ban @member [reason]`',
      '`/unban user_id:<USER_ID> [reason]` • `?unban USER_ID [reason]`',
      '`/clear amount:<1-100>` • `?clear <1-100>` • alias `?xoa`',
      '',
      '**Examples**',
      '`?mute @Corgi 30 repeated spam`',
      '`?unban 123456789012345678 appeal approved`',
      '`?clear 50`',
      '',
      'The bot needs the matching Discord permissions and its role must be above the target member.'
    ],

    premium: vi ? [
      '**💎 Server Premium**',
      '`/premium status` — trạng thái Premium server.',
      '`/premium benefits` — quyền lợi/tier.',
      '`/premium history` — lịch sử Premium gần đây.',
      '`?premium` — xem nhanh trạng thái.',
      'Discord Store hiện bán **Corgi Premium Standard** theo Guild Subscription; CD Key/manual Premium vẫn hoạt động song song.',
      '',
      '**🎟️ Redeem CD Key**',
      '`/redeem` • `?redeem` — mở Panel → nhấn **🔑 Nhập CD Key** → nhập key trong Modal riêng.',
      '',
      '**💎 VIP Profile cá nhân**',
      '`/vip shop` • `?vip shop` — bảng giá.',
      '`/vip status` • `?vip status` — trạng thái cá nhân.',
      '`/vip buy tier:<VIP|VIP+|VVIP|SVIP|SSVIP|SSSVIP>`',
      'Prefix: `?vip buy VIP`, `?vip buy VIP+`, `?vip buy VVIP`...',
      'Gói mua bằng <:cxu_coin:1551759873241251912> CXu có thời hạn 30 ngày.',
      '',
      'Lưu ý: **Server Premium** và **VIP Profile cá nhân** là hai hệ thống riêng.'
    ] : [
      '**💎 Server Premium**',
      '`/premium status` — server Premium status.',
      '`/premium benefits` — benefits/tier information.',
      '`/premium history` — recent Premium activity.',
      '`?premium` — quick status.',
      'Discord Store currently provides **Corgi Premium Standard** as a Guild Subscription; CD Key/manual Premium continues to work alongside it.',
      '',
      '**🎟️ Redeem CD Key**',
      '`/redeem` • `?redeem` — open Panel → press **🔑 Enter CD Key** → enter the key privately.',
      '',
      '**💎 Personal VIP Profile**',
      '`/vip shop` • `?vip shop` — pricing.',
      '`/vip status` • `?vip status` — personal status.',
      '`/vip buy tier:<VIP|VIP+|VVIP|SVIP|SSVIP|SSSVIP>`',
      'Prefix: `?vip buy VIP`, `?vip buy VIP+`, `?vip buy VVIP`...',
      '<:cxu_coin:1551759873241251912> CXu purchases last 30 days.',
      '',
      'Note: **Server Premium** and **personal VIP Profile** are separate systems.'
    ],

    developer: vi ? [
      '**🧑‍💻 Developer Control — chỉ Developer**',
      '`/dev` — mở Developer Control Center.',
      '',
      '**🔑 Custom CD Key**',
      'Developer có thể tạo CD Key với tên tự chọn hoặc để trống để bot tạo tự động.',
      'Ví dụ key tùy chỉnh: `Corgi2026`, `CorgiTanThu`.',
      'Loại phần thưởng hiện hỗ trợ: <:cxu_coin:1551759873241251912> CXu, Server Premium và VIP Profile.',
      'Có thể đặt số lượt dùng, thời hạn key và tắt key khi cần.',
      '',
      '**✅ Profile Verification**',
      'Vào `/dev` → **Profile Verification** → Review / Update Verification.',
      'Các trạng thái: `PENDING`, `REVIEW`, `APPROVE`, `REJECT`, `REVOKE`.',
      'Loại badge: `IDENTITY` 🔵, `DEVELOPER` 🔴, `ADMIN` 🟡, `PARTNER` 🟣.',
      'Chỉ badge được APPROVE mới hiển thị công khai, nằm ngay cạnh tên Discord trên Profile.',
      'Thumbnail Profile luôn dành cho logo Corgi-Bot; Premium active sẽ dùng logo Premium.',
      '',
      '**Lưu ý**',
      'Các công cụ Developer được khóa theo Developer allowlist; member/admin server bình thường không dùng được.'
    ] : [
      '**🧑‍💻 Developer Control — Developer only**',
      '`/dev` — open the Developer Control Center.',
      '',
      '**🔑 Custom CD Keys**',
      'Developers can choose a custom key name or leave it blank for automatic generation.',
      'Examples: `Corgi2026`, `CorgiTanThu`.',
      'Current reward types include <:cxu_coin:1551759873241251912> CXu, Server Premium and VIP Profile.',
      'Maximum uses, expiry and key disabling are supported.',
      '',
      '**✅ Profile Verification**',
      'Open `/dev` → **Profile Verification** → Review / Update Verification.',
      'Statuses: `PENDING`, `REVIEW`, `APPROVE`, `REJECT`, `REVOKE`.',
      'Badge types: `IDENTITY` 🔵, `DEVELOPER` 🔴, `ADMIN` 🟡, `PARTNER` 🟣.',
      'Only APPROVED badges are shown publicly, inline next to the Discord name on the Profile.',
      'The Profile thumbnail is reserved for Corgi-Bot branding; active Premium uses the Premium logo.',
      '',
      '**Note**',
      'Developer controls are protected by the Developer allowlist and are not available to normal members/server admins.'
    ],

    ai: vi ? [
      '**🤖 Corgi AI — Miễn phí**',
      'Slash: `/ai question:<nội dung>`',
      'Prefix: `?ai <nội dung>`',
      '',
      '**Ví dụ**',
      '`/ai question:Giải thích cách dùng Giveaway của Corgi-Bot`',
      '`?ai giúp mình viết thông báo sự kiện gaming`',
      '',
      'Corgi AI có thể hỗ trợ kiến thức chung, code, Discord, viết nội dung, gaming, ý tưởng và hướng dẫn dùng bot.',
      '💬 Khi tán gẫu, AI hiểu slang/từ tục theo đúng ngữ cảnh, có thể cà khịa hoặc đáp lại hơi “láo” khi đang đùa; không tự đổi nghĩa các từ như `cút` thành từ khác.',
      '🧠 Khi hỏi code, lỗi bot, hướng dẫn, Moderation, Premium, bảo mật hoặc nội dung cần độ chính xác, AI tự giảm độ “láo” và ưu tiên câu trả lời rõ ràng/chính xác.',
      'Ngôn ngữ phản hồi theo cấu hình `/setup → Language` của server.'
    ] : [
      '**🤖 Corgi AI — Free**',
      'Slash: `/ai question:<text>`',
      'Prefix: `?ai <text>`',
      '',
      '**Examples**',
      '`/ai question:Explain how to use Corgi-Bot Giveaway`',
      '`?ai help me write a gaming event announcement`',
      '',
      'Corgi AI can help with general knowledge, coding, Discord, writing, gaming, ideas and bot usage.',
      '💬 In casual chat, AI understands slang/profanity as written and may use light swearing, teasing or playful clapbacks when the context invites it.',
      '🧠 For coding, troubleshooting, moderation, Premium, security or accuracy-sensitive help, AI turns the chaos down and prioritizes clear, correct answers.',
      'Response language follows the server `/setup → Language` setting.'
    ]
  };
  return (pages[category] || pages.all).join('\n');
}

function title(lang, category) {
  const vi = lang === 'vi';
  const map = {
    all: vi ? '🐶 Corgi-Bot • Trung tâm hướng dẫn' : '🐶 Corgi-Bot • Help Center',
    setup: vi ? '🛠️ Hướng dẫn cấu hình Server' : '🛠️ Server Setup Guide',
    member: vi ? '👤 Hướng dẫn Member & Profile' : '👤 Member & Profile Guide',
    economy: vi ? '⭐ Hướng dẫn <:cxu_coin:1551759873241251912> CXu Economy' : '⭐ <:cxu_coin:1551759873241251912> CXu Economy Guide',
    games: vi ? '🎮 Hướng dẫn trò chơi' : '🎮 Games Guide',
    community: vi ? '🧡 Hướng dẫn Community' : '🧡 Community Guide',
    moderation: vi ? '🛡️ Hướng dẫn Moderation' : '🛡️ Moderation Guide',
    premium: vi ? '💎 Hướng dẫn Premium & VIP' : '💎 Premium & VIP Guide',
    developer: vi ? '🧑‍💻 Hướng dẫn Developer' : '🧑‍💻 Developer Guide',
    ai: '🤖 Corgi AI • FREE'
  };
  return map[category] || map.all;
}

function embedFor(lang, category='all') {
  return new EmbedBuilder()
    .setColor(0xF59E0B)
    .setTitle(title(lang, category))
    .setDescription(lines(lang, category))
    .setFooter({ text: mtx(lang, 'Corgi Studio • Default prefix: ? • Use /help for categories', 'Corgi Studio • Prefix mặc định: ? • Dùng /help để chọn danh mục') })
    .setTimestamp();
}

const choices = [
  ['All commands','Tổng quan','all'],
  ['Server Setup','Cấu hình Server','setup'],
  ['Member & Profile','Member & Profile','member'],
  ['Economy','Kinh tế <:cxu_coin:1551759873241251912> CXu','economy'],
  ['Games','Trò chơi','games'],
  ['Community','Cộng đồng','community'],
  ['Moderation','Kiểm duyệt','moderation'],
  ['Premium & VIP','Premium & VIP','premium'],
  ['Developer','Developer','developer'],
  ['AI','AI','ai']
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Detailed Corgi-Bot command guide')
    .setDescriptionLocalizations({ vi:'Hướng dẫn chi tiết lệnh Corgi-Bot' })
    .addStringOption(o => {
      o.setName('category')
       .setDescription('Choose a help category')
       .setDescriptionLocalizations({ vi:'Chọn danh mục hướng dẫn' });
      for (const [en, vi, value] of choices) o.addChoices({ name:en, name_localizations:{ vi }, value });
      return o;
    }),
  prefix:['help'],
  async execute(i) {
    const lang = await guildLang(i.guildId);
    const category = i.options.getString('category') || 'all';
    return i.reply({ embeds:[embedFor(lang,category)], flags:64 });
  },
  async executePrefix(m,args) {
    const lang = await guildLang(m.guildId);
    const aliases = { commands:'all', command:'all', config:'setup', profile:'member', cstar:'economy', game:'games', event:'community', admin:'moderation', mod:'moderation', vip:'premium', dev:'developer', developer:'developer' };
    const raw = String(args[0] || 'all').toLowerCase();
    const category = aliases[raw] || raw;
    return m.reply({ embeds:[embedFor(lang,category)] });
  }
};
