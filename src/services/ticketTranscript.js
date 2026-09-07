const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtContent(m){
  let body=esc(m.cleanContent||m.content||'').replace(/\n/g,'<br>');
  const embeds=(m.embeds||[]).map(e=>`<div class="embed"><b>${esc(e.title||'Embed')}</b>${e.description?`<div>${esc(e.description)}</div>`:''}</div>`).join('');
  const files=[...m.attachments.values()].map(a=>{
    const url=esc(a.url),name=esc(a.name||'attachment');
    const image=(a.contentType||'').startsWith('image/');
    const video=(a.contentType||'').startsWith('video/');
    return `<div class="attachment"><a href="${url}" target="_blank">📎 ${name}</a>${image?`<br><img src="${url}" alt="${name}">`:video?`<br><video controls src="${url}"></video>`:''}</div>`;
  }).join('');
  return `${body}${embeds}${files}`||'<i>No text content</i>';
}
async function fetchMessages(channel,max=1000){
  const out=[];let before;
  while(out.length<max){const batch=await channel.messages.fetch({limit:100,before}).catch(()=>null);if(!batch?.size)break;out.push(...batch.values());before=batch.last().id;if(batch.size<100)break;}
  return out.sort((a,b)=>a.createdTimestamp-b.createdTimestamp);
}
async function buildHtml(channel,ticket,meta={}){
  const msgs=await fetchMessages(channel);
  const rows=msgs.map(m=>`<article class="msg"><img class="avatar" src="${esc(m.author?.displayAvatarURL?.({extension:'png',size:64})||'')}"/><div><div><b>${esc(m.author?.globalName||m.author?.username||'Unknown')}</b> <span>${esc(m.author?.tag||'')} • ${new Date(m.createdTimestamp).toLocaleString('en-US',{timeZone:'UTC'})} UTC</span></div><div class="content">${fmtContent(m)}</div></div></article>`).join('\n');
  const no=String(ticket.ticketNo||ticket._id).padStart(6,'0');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Ticket ${esc(no)}</title><style>body{margin:0;background:#1e1f22;color:#dbdee1;font:15px Arial,sans-serif}.top{padding:24px;background:#2b2d31;border-bottom:3px solid #f59e0b}.top h1{margin:0 0 8px;color:#fff}.meta{color:#b5bac1}.wrap{max-width:1000px;margin:auto}.msg{display:grid;grid-template-columns:48px 1fr;gap:12px;padding:14px 22px;border-bottom:1px solid #2b2d31}.msg:hover{background:#232428}.avatar{width:42px;height:42px;border-radius:50%}.msg span{color:#949ba4;font-size:12px}.content{margin-top:5px;line-height:1.45}.attachment img,.attachment video{max-width:min(620px,95%);max-height:480px;border-radius:8px;margin-top:8px}.attachment a{color:#00a8fc}.embed{border-left:4px solid #f59e0b;background:#2b2d31;padding:10px;margin-top:8px;border-radius:4px}.foot{padding:24px;color:#949ba4}</style></head><body><div class="wrap"><header class="top"><h1>🎫 Corgi Ticket Transcript • #${esc(no)}</h1><div class="meta">Type: ${esc(ticket.typeName||ticket.typeKey||'Support')} • Owner: ${esc(meta.ownerTag||ticket.ownerId)} • Exported: ${new Date().toISOString()}</div></header>${rows||'<div class="foot">No messages.</div>'}<footer class="foot">Corgi Studio • Advanced Ticket Transcript • Attachment URLs may expire or become unavailable if removed from Discord.</footer></div></body></html>`;
}
async function makeAttachment(channel,ticket,meta={}){const html=await buildHtml(channel,ticket,meta);const no=String(ticket.ticketNo||ticket._id).padStart(6,'0');return new AttachmentBuilder(Buffer.from(html,'utf8'),{name:`ticket-${no}-transcript.html`});}
async function deliverTranscript({channel,ticket,closer,settings,typeConfig}){
  const owner=await channel.client.users.fetch(ticket.ownerId).catch(()=>null);const meta={ownerTag:owner?.tag||ticket.ownerId};
  const make=()=>makeAttachment(channel,ticket,meta);const no=String(ticket.ticketNo||ticket._id).padStart(6,'0');
  const summary=`🎫 Ticket #${no} • ${ticket.typeName||'Support'}\nOwner: <@${ticket.ownerId}>\nRequested close by: <@${closer.id}>`;
  let dm=false,log=false;
  try{await owner?.send({content:`📄 Your Corgi Ticket transcript is attached for your records.\n${summary}`,files:[await make()]});dm=true;}catch{}
  const logId=typeConfig?.logChannelId||settings.channels?.logs;
  if(logId){try{const logCh=await channel.guild.channels.fetch(logId);if(logCh?.isTextBased()){await logCh.send({content:`🗃️ ${summary}`,files:[await make()]});log=true;}}catch{}}
  return {attachment:await make(),dm,log};
}
module.exports={buildHtml,makeAttachment,deliverTranscript};
