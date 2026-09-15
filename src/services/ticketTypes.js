const DEFAULTS={
 support:{emoji:'🛟',prefix:'SUP',en:['General Support','General help and questions'],vi:['Hỗ trợ chung','Hỗ trợ và câu hỏi chung']},
 bug:{emoji:'🐛',prefix:'BUG',en:['Bug Report','Report a bot/server issue'],vi:['Báo lỗi','Báo lỗi bot hoặc server']},
 member:{emoji:'👤',prefix:'REP',en:['Member Report','Report a member'],vi:['Báo cáo thành viên','Báo cáo một thành viên']},
 appeal:{emoji:'🛡️',prefix:'APL',en:['Punishment Appeal','Appeal a moderation action'],vi:['Kháng nghị xử phạt','Kháng nghị hành động kiểm duyệt']},
 bothelp:{emoji:'🤖',prefix:'BOT',en:['Bot / Feature Help','Help using bot commands and features'],vi:['Hỗ trợ Bot / Tính năng','Hỗ trợ sử dụng lệnh và tính năng bot']},
 account:{emoji:'🗃️',prefix:'DATA',en:['Account / Data Issue','Profile, progress or data issue'],vi:['Tài khoản / Dữ liệu','Lỗi hồ sơ, tiến trình hoặc dữ liệu']},
 partner:{emoji:'🤝',prefix:'PAR',en:['Partnership','Partnership requests'],vi:['Hợp tác','Yêu cầu hợp tác']},
 event:{emoji:'🎁',prefix:'EVT',en:['Giveaway / Event','Event support'],vi:['Giveaway / Sự kiện','Hỗ trợ sự kiện']},
 suggest:{emoji:'💡',prefix:'IDEA',en:['Suggestion','Suggestions and feedback'],vi:['Đề xuất','Đề xuất và phản hồi']},
 other:{emoji:'📋',prefix:'OTH',en:['Other','Anything else'],vi:['Khác','Các yêu cầu khác']},
};
function text(type,lang){const d=DEFAULTS[type.key];if(!d)return {name:type.name,description:type.description,emoji:type.emoji,prefix:type.prefix};const [name,description]=lang==='vi'?d.vi:d.en;return {name,description,emoji:type.emoji||d.emoji,prefix:type.prefix||d.prefix};}
function normalizedTypes(types=[]){const kept=types.filter(x=>!['payment','cdkey'].includes(x.key));for(const key of ['bothelp','account'])if(!kept.some(x=>x.key===key)){const d=DEFAULTS[key];kept.splice(key==='bothelp'?4:5,0,{key,name:d.en[0],description:d.en[1],emoji:d.emoji,prefix:d.prefix,enabled:true});}return kept;}
module.exports={DEFAULTS,text,normalizedTypes};
