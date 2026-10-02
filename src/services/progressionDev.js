const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,ModalBuilder,TextInputBuilder,TextInputStyle}=require('discord.js');
const P=require('./progression');

function row(...buttons){return new ActionRowBuilder().addComponents(...buttons);}
function back(){return row(new ButtonBuilder().setCustomId('dev:home').setLabel('Developer Home').setEmoji('⬅️').setStyle(ButtonStyle.Secondary));}
function input(id,label,value,required=true){const x=new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(TextInputStyle.Short).setRequired(required);if(value!==undefined&&value!==null&&String(value)!=='')x.setValue(String(value));return new ActionRowBuilder().addComponents(x);}
async function levelPage(){const s=await P.settings(),c=s.progression;const e=new EmbedBuilder().setColor(0xF59E0B).setTitle('⚔️ Global Level & EXP Control').setDescription('One Discord user = one global Level/EXP profile across every server. Default curve is intentionally slower at high levels.').addFields({name:'EXP per qualified message',value:`**${c.xpMin}–${c.xpMax} EXP**`,inline:true},{name:'Cooldown',value:`**${c.cooldownSeconds}s**`,inline:true},{name:'Maximum Level',value:`**${c.maxLevel.toLocaleString()}**`,inline:true},{name:'Curve',value:`EXP next ≈ **${c.curveBase} × (1 + Level / ${c.curveDivisor}) ^ ${c.curvePower}**`});return{embeds:[e],components:[row(new ButtonBuilder().setCustomId('progdev:level:edit').setLabel('Edit EXP Config').setEmoji('⚙️').setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId('progdev:level:advanced').setLabel('Advanced Curve').setEmoji('📈').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId('progdev:level:user').setLabel('Adjust User').setEmoji('🧑‍💻').setStyle(ButtonStyle.Success)),back()]};}

async function levelModal(){const s=await P.settings(),c=s.progression;return new ModalBuilder().setCustomId('progdev:modal:level').setTitle('Level & EXP Configuration').addComponents(input('xpMin','Minimum EXP per message',c.xpMin),input('xpMax','Maximum EXP per message',c.xpMax),input('cooldown','Cooldown seconds',c.cooldownSeconds),input('curveBase','Curve base EXP',c.curveBase),input('curvePower','Curve power (1.01 - 3.00)',c.curvePower));}



function userLevelModal(){return new ModalBuilder().setCustomId('progdev:modal:userlevel').setTitle('Developer • Set User Level/EXP').addComponents(input('userId','Discord User ID','123456789012345678'),input('level','Level (1 - 100000)','1'),input('xp','Current level EXP','0'));}
async function advancedLevelModal(){const s=await P.settings(),c=s.progression;return new ModalBuilder().setCustomId('progdev:modal:advancedlevel').setTitle('Advanced Level Curve').addComponents(input('maxLevel','Maximum Level (max 100000)',c.maxLevel),input('curveDivisor','Curve divisor',c.curveDivisor));}

module.exports={levelPage,levelModal,userLevelModal,advancedLevelModal};
