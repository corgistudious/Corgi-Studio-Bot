const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { guildLang, pick } = require('../../services/i18n');

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
      '⭐ `economy` — 🌟Cstar, Daily, chuyển tiền, Inventory.',
      '🎮 `games` — Tài Xỉu, Poker, Roulette, Spin, Lottery.',
      '🧡 `community` — Giveaway, Contest, Poll, Reaction Role, Ticket, Stats.',
      '🛡️ `moderation` — Warn, Kick, Mute, Ban, Clear...',
      '💎 `premium` — Premium Server, VIP Profile, Redeem CD Key.',
      '🤖 `ai` — Corgi AI.',
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
      '⭐ `economy` — 🌟Cstar, Daily, transfers and Inventory.',
      '🎮 `games` — Tài Xỉu, Poker, Roulette, Spin and Lottery.',
      '🧡 `community` — Giveaway, Contest, Poll, Reaction Role, Ticket, Stats.',
      '🛡️ `moderation` — Warn, Kick, Mute, Ban, Clear...',
      '💎 `premium` — Server Premium, VIP Profile, CD Key redemption.',
      '🤖 `ai` — Corgi AI.',
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
      '• **Server Stats** — cấu hình Stats.',
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
      '• **Server Stats** — configure Stats.',
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
      '**⭐ Lệnh nhanh Member**',
      '`/balance` • `?balance` / `?bal` — xem 🌟Cstar.',
      '`/daily` • `?daily` — nhận Daily.',
      '`/inventory` • `?inventory` / `?inv` — xem túi đồ.',
      '`/leaderboard` • `?leaderboard` / `?lb` — BXH 🌟Cstar.',
      '`/transfer user:@user amount:1000` • `?transfer @user 1000` / `?pay @user 1000`.',
      '',
      '`/pet` • `?pet` — hiện đang **Sắp ra mắt**.'
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
      '**⭐ Common member commands**',
      '`/balance` • `?balance` / `?bal` — view 🌟Cstar.',
      '`/daily` • `?daily` — claim Daily.',
      '`/inventory` • `?inventory` / `?inv` — view inventory.',
      '`/leaderboard` • `?leaderboard` / `?lb` — 🌟Cstar leaderboard.',
      '`/transfer user:@user amount:1000` • `?transfer @user 1000` / `?pay @user 1000`.',
      '',
      '`/pet` • `?pet` — currently **Coming Soon**.'
    ],

    economy: vi ? [
      '**⭐ 🌟Cstar Economy**',
      '`/balance` • `?balance` / `?bal` — xem ví liên server.',
      '`/daily` • `?daily` — nhận Daily; Premium server có multiplier theo tier.',
      '`/inventory` • `?inventory` / `?inv` — xem Inventory.',
      '`/leaderboard` • `?leaderboard` / `?lb` — Top 10 🌟Cstar toàn hệ thống.',
      '',
      '**Chuyển 🌟Cstar**',
      'Slash: `/transfer user:@member amount:<số>`',
      'Prefix: `?transfer @member <số>` hoặc `?pay @member <số>`',
      'Ví dụ: `?transfer @Corgi 5000`.',
      'Không thể tự chuyển cho chính mình hoặc bot.',
      '',
      '**CD Key**',
      '`/redeem` • `?redeem` — mở Panel Redeem CD Key.',
      'Nhấn **🔑 Nhập CD Key** → nhập key trong Modal riêng → xác nhận.',
      'CD Key không cần gõ trực tiếp vào kênh chat.'
    ] : [
      '**⭐ 🌟Cstar Economy**',
      '`/balance` • `?balance` / `?bal` — global wallet balance.',
      '`/daily` • `?daily` — claim Daily; server Premium can apply a tier multiplier.',
      '`/inventory` • `?inventory` / `?inv` — view Inventory.',
      '`/leaderboard` • `?leaderboard` / `?lb` — global Top 10 🌟Cstar.',
      '',
      '**Transfer 🌟Cstar**',
      'Slash: `/transfer user:@member amount:<number>`',
      'Prefix: `?transfer @member <number>` or `?pay @member <number>`',
      'Example: `?transfer @Corgi 5000`.',
      'You cannot transfer to yourself or a bot.',
      '',
      '**CD Key**',
      '`/redeem` • `?redeem` — open the CD Key Redeem panel.',
      'Press **🔑 Enter CD Key** → enter the key in the private modal → confirm.',
      'The CD Key does not need to be typed directly into chat.'
    ],

    games: vi ? [
      '**🎮 Game dùng 🌟Cstar**',
      'Mức cược hiện hỗ trợ: **10 → 1,000,000 🌟Cstar**.',
      '',
      '**Tài Xỉu**',
      '`/taixiu pick:tai|xiu bet:<số>`',
      '`?taixiu tai <số>` hoặc `?taixiu xiu <số>`',
      'Ví dụ: `?taixiu tai 500`.',
      '',
      '**Poker**',
      '`/poker bet:<số>` • `?poker <số>`',
      'Ví dụ: `/poker bet:1000`.',
      '',
      '**Roulette**',
      '`/roullette pick:red|black|green|0-36 bet:<số>`',
      '`?roullette red <số>` • alias `?roulette`',
      'Ví dụ: `?roulette 17 500` hoặc `?roullette red 1000`.',
      '',
      '**Spin**',
      '`/spin bet:<số>` • `?spin <số>`',
      'Tiền thắng chờ nút **Rút 🌟Cstar** nếu phiên game yêu cầu.',
      '',
      '**Lottery**',
      '`/lottery number:1-99 bet:<số>`',
      '`?lottery <1-99> <số>` • alias `?xoso`',
      'Ví dụ: `?xoso 68 500`.',
      '',
      '🌟Cstar chỉ là tiền ảo giải trí trong bot, không có giá trị tiền thật.'
    ] : [
      '**🎮 🌟Cstar Games**',
      'Current supported bet range: **10 → 1,000,000 🌟Cstar**.',
      '',
      '**Tài Xỉu**',
      '`/taixiu pick:tai|xiu bet:<amount>`',
      '`?taixiu tai <amount>` or `?taixiu xiu <amount>`',
      'Example: `?taixiu tai 500`.',
      '',
      '**Poker**',
      '`/poker bet:<amount>` • `?poker <amount>`',
      'Example: `/poker bet:1000`.',
      '',
      '**Roulette**',
      '`/roullette pick:red|black|green|0-36 bet:<amount>`',
      '`?roullette red <amount>` • alias `?roulette`',
      'Example: `?roulette 17 500` or `?roullette red 1000`.',
      '',
      '**Spin**',
      '`/spin bet:<amount>` • `?spin <amount>`',
      'Winnings can remain pending until **cashout** when the game session requires it.',
      '',
      '**Lottery**',
      '`/lottery number:1-99 bet:<amount>`',
      '`?lottery <1-99> <amount>` • alias `?xoso`',
      'Example: `?xoso 68 500`.',
      '',
      '🌟Cstar is in-bot entertainment currency only and has no real-money value.'
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
      '`/stats` — tạo/sửa Stats Board.',
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
      '`/stats` — create/repair Stats Board.',
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
      '',
      '**🎟️ Redeem CD Key**',
      '`/redeem` • `?redeem` — mở Panel → nhấn **🔑 Nhập CD Key** → nhập key trong Modal riêng.',
      '',
      '**💎 VIP Profile cá nhân**',
      '`/vip shop` • `?vip shop` — bảng giá.',
      '`/vip status` • `?vip status` — trạng thái cá nhân.',
      '`/vip buy tier:<VIP|VIP+|VVIP|SVIP|SSVIP|SSSVIP>`',
      'Prefix: `?vip buy VIP`, `?vip buy VIP+`, `?vip buy VVIP`...',
      'Gói mua bằng 🌟Cstar có thời hạn 30 ngày.',
      '',
      'Lưu ý: **Server Premium** và **VIP Profile cá nhân** là hai hệ thống riêng.'
    ] : [
      '**💎 Server Premium**',
      '`/premium status` — server Premium status.',
      '`/premium benefits` — benefits/tier information.',
      '`/premium history` — recent Premium activity.',
      '`?premium` — quick status.',
      '',
      '**🎟️ Redeem CD Key**',
      '`/redeem` • `?redeem` — open Panel → press **🔑 Enter CD Key** → enter the key privately.',
      '',
      '**💎 Personal VIP Profile**',
      '`/vip shop` • `?vip shop` — pricing.',
      '`/vip status` • `?vip status` — personal status.',
      '`/vip buy tier:<VIP|VIP+|VVIP|SVIP|SSVIP|SSSVIP>`',
      'Prefix: `?vip buy VIP`, `?vip buy VIP+`, `?vip buy VVIP`...',
      '🌟Cstar purchases last 30 days.',
      '',
      'Note: **Server Premium** and **personal VIP Profile** are separate systems.'
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
    economy: vi ? '⭐ Hướng dẫn 🌟Cstar Economy' : '⭐ 🌟Cstar Economy Guide',
    games: vi ? '🎮 Hướng dẫn trò chơi' : '🎮 Games Guide',
    community: vi ? '🧡 Hướng dẫn Community' : '🧡 Community Guide',
    moderation: vi ? '🛡️ Hướng dẫn Moderation' : '🛡️ Moderation Guide',
    premium: vi ? '💎 Hướng dẫn Premium & VIP' : '💎 Premium & VIP Guide',
    ai: '🤖 Corgi AI • FREE'
  };
  return map[category] || map.all;
}

function embedFor(lang, category='all') {
  return new EmbedBuilder()
    .setColor(0xF59E0B)
    .setTitle(title(lang, category))
    .setDescription(lines(lang, category))
    .setFooter({ text: pick(lang, 'Corgi Studio • Default prefix: ? • Use /help for categories', 'Corgi Studio • Prefix mặc định: ? • Dùng /help để chọn danh mục') })
    .setTimestamp();
}

const choices = [
  ['All commands','Tổng quan','all'],
  ['Server Setup','Cấu hình Server','setup'],
  ['Member & Profile','Member & Profile','member'],
  ['Economy','Kinh tế 🌟Cstar','economy'],
  ['Games','Trò chơi','games'],
  ['Community','Cộng đồng','community'],
  ['Moderation','Kiểm duyệt','moderation'],
  ['Premium & VIP','Premium & VIP','premium'],
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
    const aliases = { commands:'all', command:'all', config:'setup', profile:'member', cstar:'economy', game:'games', event:'community', admin:'moderation', mod:'moderation', vip:'premium' };
    const raw = String(args[0] || 'all').toLowerCase();
    const category = aliases[raw] || raw;
    return m.reply({ embeds:[embedFor(lang,category)] });
  }
};
