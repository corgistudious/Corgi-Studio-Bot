CORGI-BOT V4.19.3 — TICKET STAFF TAG PATCH

Mục tiêu
- Member KHÔNG cần Staff Role để mở Ticket.
- Admin chọn 1 Staff Role trong /setup -> Community Panels -> Ticket Center.
- Khi member mở Ticket, bot:
  1) tạo kênh Ticket riêng,
  2) cấp quyền xem/gửi tin cho member,
  3) cấp quyền xem/gửi tin/đính kèm file cho Staff Role,
  4) tag Staff Role ngay tin nhắn mở Ticket.
- Nếu một Ticket type đã có staffRoleId riêng, role riêng đó vẫn ưu tiên; nếu không có thì dùng Staff Role chung.
- /help và ?help được cập nhật đồng bộ.

FILE CẦN THAY
- src/models/CommunityPanel.js
- src/ui/community.js
- src/events/communityPanel.js
- src/commands/utility/help.js

CÁCH UPDATE VPS
1. Upload/ghi đè 4 file đúng đường dẫn trong /opt/corgi-studio.
2. SSH VPS:
   cd /opt/corgi-studio
   node --check src/models/CommunityPanel.js
   node --check src/ui/community.js
   node --check src/events/communityPanel.js
   node --check src/commands/utility/help.js
   pm2 restart corgi-studio-bot
   pm2 logs corgi-studio-bot --lines 50

CẤU HÌNH TRONG DISCORD
/setup -> Community Panels -> Ticket Center -> Chọn Role Staff

LƯU Ý
- Staff Role chỉ để bot thêm vào Ticket + tag thông báo; member thường vẫn mở Ticket tự do.
- Để Staff thực sự nhận ping, nên bật "Allow anyone to @mention this role" cho Staff Role, hoặc cấp quyền mention phù hợp cho bot.
- Bot cần Manage Channels để tạo kênh Ticket riêng.
