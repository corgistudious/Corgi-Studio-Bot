# Corgi-Bot V4.9.1 — Hướng dẫn sử dụng & lệnh đầy đủ

Tài liệu này mô tả đúng các lệnh đang có trong source V4.9.1. Prefix mặc định là `?`.

## 1. Cài đặt và khởi động

Yêu cầu: Node.js 20+, MongoDB/MongoDB Atlas, Discord Bot Token.

1. Giữ file `.env` hiện tại của bạn. AI Groq cần:

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

2. Cài package:

```powershell
npm install
```

3. Đồng bộ slash command sau khi đổi command/schema:

```powershell
npm run deploy:commands
```

4. Chạy bot:

```powershell
npm start
```

Trong lúc dev, có thể đặt `DEV_GUILD_ID` để slash command cập nhật nhanh trong một server. Khi production global, bỏ `DEV_GUILD_ID` rồi deploy lại.

## 2. Quyền truy cập

- Member thường: dùng các lệnh member/economy/game/AI nếu module và access control cho phép.
- Manage Server hoặc Administrator: dùng `/setup` và các tool server phù hợp.
- Developer ID: dùng `/dev`. Developer không tự có `/setup` nếu không có Manage Server/Admin.
- Blacklist User/Guild và Maintenance được kiểm tra ở cả slash, prefix và interaction.
- Prefix command giờ mirror `default_member_permissions` của slash command, nên member thường không thể dùng prefix moderation để vượt quyền.

## 3. Help

### Slash

```text
/help
/help category:setup
/help category:moderation
/help category:economy
/help category:games
/help category:community
/help category:premium
/help category:ai
/help category:pet
/help category:developer
```

### Prefix

```text
?help
?help setup
?help moderation
?help economy
?help games
?help community
?help premium
?help ai
?help pet
?help developer
```

## 4. Setup server

### `/setup`
Mở giao diện Corgi-Bot Control Center. Cần Manage Server hoặc Administrator.

Các trang hiện có:
- Modules: bật/tắt module.
- Channels: Welcome, Leave, Logs, Stats Category, Ticket Category.
- Premium & Branding: nickname, avatar URL, emoji theme, Corgi Studio Emoji.
- Language: EN/VI.

Prefix:

```text
?setup
```

Prefix chỉ hướng dẫn mở `/setup` vì phần cấu hình chính dùng Discord components.

### `/stats`
Tạo/sửa bảng thống kê bằng voice channel khóa trong category `📊 SERVER STATS` hoặc category đã chọn. Bot kiểm tra số liệu mỗi 3 giây, chỉ rename khi số thay đổi.

Bot cần `Manage Channels`.

## 5. AI — FREE

AI không yêu cầu Premium.

```text
/ai question:Bạn hướng dẫn dùng ticket như nào?
?ai Bạn hướng dẫn dùng ticket như nào?
```

Provider: Groq. Model mặc định: `openai/gpt-oss-120b`.

Nếu key sai, hết quota hoặc request timeout, bot sẽ báo lỗi thay vì crash.

## 6. Economy — Cstar

### Balance

```text
/balance
?balance
?bal
```

### Daily
Nhận 250 Cstar mỗi 24 giờ.

```text
/daily
?daily
```

### Inventory

```text
/inventory
?inventory
?inv
```

### Leaderboard
Top 10 Cstar trong server.

```text
/leaderboard
?leaderboard
?lb
```

### Transfer

```text
/transfer user:@Member amount:100
?transfer @Member 100
?pay @Member 100
```

Không thể gửi cho bot hoặc chính mình ở slash command. Số tiền phải lớn hơn 0 và người gửi phải đủ Cstar.

## 7. Economy Games

Cstar chỉ là tiền ảo trong bot, không có giá trị tiền thật/cash-out.

### Tài/Xỉu

```text
/game taixiu pick:tai bet:100
/game taixiu pick:xiu bet:100
```

3 xúc xắc; tổng từ 11 trở lên = Tài, còn lại = Xỉu.

### Lottery

```text
/game lottery number:7 bet:100
```

Chọn số 1–20. Trúng nhận theo logic hiện tại của source.

### Lucky Spin

```text
/game spin bet:100
```

### Quick Poker

```text
/game poker bet:100
```

Đây là mini-game điểm số 5 lá đơn giản trong bản hiện tại, chưa phải luật poker đầy đủ.

Prefix:

```text
?game
```

Hiện prefix `?game` chỉ hướng dẫn các slash subcommand ở trên.

## 8. Pet Game — Coming Soon

Pet Game is temporarily hidden/locked for a future update.

```text
/pet
?pet
```

Both commands only display **🐾 Pet Game • Coming Soon**. There is no adoption/gameplay in V4.10, no Cstar is charged, and Pet data is not modified. `/setup` shows Pet as locked and does not offer it in the module toggle menu.


## 9. Premium & CD Key

AI không thuộc Premium.

### Premium status

```text
/premium status
/premium benefits
/premium history
?premium
```

Các kỳ hạn Premium được hỗ trợ:

```text
7d, 14d, 21d, 30d, 1y, 2y, 5y, 10y
```

Không có lifetime.

### Redeem key

```text
/redeem key:YOUR-CODE
?redeem YOUR-CODE
```

Key có thể cấp Cstar hoặc Premium. Hệ thống kiểm tra disabled, expired, max uses và chống cùng user redeem lại cùng key trong cùng server.

### Premium hiện có trong build
- 28 Corgi Studio application emojis.
- Corgi emoji toggle trong `/setup`.
- Bot nickname branding theo guild.
- Emoji theme/config Premium.
- Avatar URL config. Lưu ý avatar account bot là global; thay avatar tự động chỉ chạy khi `ALLOW_GLOBAL_AVATAR_BRANDING=true`.

## 10. Moderation — lệnh ngắn

### Warn
Cần Moderate Members.

```text
/warn user:@Member reason:Spam
?warn @Member Spam
```

### Warnings
Cần Moderate Members.

```text
/warnings user:@Member
?warnings @Member
```

### Kick / Kích
Cần Kick Members.

```text
/kick user:@Member reason:Reason
?kick @Member Reason
?kich @Member Reason
```

### Mute / Timeout
Cần Moderate Members.

```text
/mute user:@Member minutes:10 reason:Reason
?mute @Member 10 Reason
```

Thời gian slash cho phép 1–40320 phút.

### Unmute
Cần Moderate Members.

```text
/unmute user:@Member reason:Reason
?unmute @Member Reason
```

### Ban
Cần Ban Members.

```text
/ban user:@Member reason:Reason
?ban @Member Reason
```

### Unban
Cần Ban Members.

```text
/unban user_id:123456789012345678 reason:Reason
?unban 123456789012345678 Reason
```

### Moderation suite cũ

```text
/moderation warn
/moderation warnings
/moderation timeout
/moderation kick
/moderation ban
/moderation clear
```

`/moderation clear` cần Manage Messages. Prefix `?mod` hiện chỉ hướng dẫn chuyển sang slash suite.

## 11. Poll

Slash poll 2–4 lựa chọn:

```text
/poll question:Bạn chọn game nào? option1:RPG option2:Fishing option3:Pet option4:Other
```

Cần Manage Messages.

Prefix nhanh Yes/No:

```text
?poll Có tổ chức event tối nay không?
```

## 12. Giveaway

Cần Manage Server.

```text
/giveaway create prize:Nitro duration:30m winners:1
/giveaway end message_id:MESSAGE_ID
```

Format duration hiện hỗ trợ kiểu `30m`, `2h`, `1d`. Bản hiện tại dùng reaction 🎉 để tham gia.

## 13. Contest / Event

Cần Manage Server.

```text
/contest create title:Art Event description:Đăng bài dự thi minutes:60
/contest end id:MONGODB_CONTEST_ID
```

Người chơi tham gia bằng nút Join Contest. Prefix `?contest` hiện hướng dẫn dùng slash creator.

## 14. Reaction Role

Cần Manage Roles.

```text
/reactionrole add message_id:MESSAGE_ID emoji:✅ role:@Verified
/reactionrole remove message_id:MESSAGE_ID emoji:✅
```

Khi member add/remove reaction, bot add/remove role theo binding đã lưu.

## 15. Ticket

Cần Manage Server để tạo panel:

```text
/ticket panel
```

Member bấm `Create Ticket` để bot tạo channel riêng. Trong ticket có nút `Close Ticket`. Khi đóng, bot tạo transcript text từ tối đa 100 message gần nhất và gửi vào Logs channel nếu đã cấu hình, sau đó xóa channel sau 5 giây.

## 16. Developer Control

Chỉ Discord ID nằm trong cấu hình Developer mới dùng được.

```text
/dev
?dev
```

Control Center hiện có:
- System status, ping, uptime, Mongo state.
- Maintenance ON/OFF.
- Server list.
- Premium grant/extend/revoke.
- Cstar/Premium CD Key create/disable.
- Cstar adjustment.
- Guild blacklist.
- User blacklist.
- Developer logs nếu có channel cấu hình.

Developer permission không tự cấp quyền `/setup`.

## 17. Blacklist & Maintenance

- User blacklist: chặn user sử dụng bot.
- Guild blacklist: chặn bot command/interactions trong guild đó.
- Maintenance: chặn user thường; Developer vẫn bypass để quản trị/sửa bot.

## 18. Welcome / Leave / Logs

Các module này bật/tắt và chọn channel qua `/setup`.

Server logs hiện bắt các event như message edit/delete, channel create/delete, role create/delete, ban/unban và moderation log tùy event/source.

## 19. 28 Corgi Studio Premium Emoji

Assets nằm trong:

```text
assets/corgi-premium/
```

Bot đồng bộ application emoji khi service chạy. Server cần Premium đang active và bật Corgi Studio Emoji trong `/setup` để dùng theme Premium trong các phần đã tích hợp.

## 20. Lệnh vận hành source

Cài package:

```powershell
npm install
```

Deploy slash command:

```powershell
npm run deploy:commands
```

Chạy bot:

```powershell
npm start
```

Dev/watch mode:

```powershell
npm run dev
```

Sau khi chỉ thay `.env` (ví dụ thêm Groq key), chỉ cần restart bot. Sau khi thay slash command schema/options, chạy `npm run deploy:commands` rồi restart.
