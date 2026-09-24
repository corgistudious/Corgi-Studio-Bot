const {SlashCommandBuilder,AttachmentBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle}=require('discord.js');const Card=require('../../services/profileCard');const Social=require('../../services/socialProfile');const Verification=require('../../services/profileVerification');const {guildLang,t}=require('../../services/i18n');
async function payload(user,lang){
  const [s,verification]=await Promise.all([
    Social.ensure(user.id),
    Verification.get(user.id)
  ]);

  const card=await Card.render(user,lang);

  const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`social:like:${user.id}`)
      .setLabel(t(lang,'v6.profile.like'))
      .setEmoji('❤️')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`social:follow:${user.id}`)
      .setLabel(t(lang,'v6.profile.follow'))
      .setEmoji('➕')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`social:collection:${user.id}`)
      .setLabel(t(lang,'v6.profile.collection'))
      .setEmoji('🎨')
      .setStyle(ButtonStyle.Secondary)
  );

  const badges=Verification.approvedBadges(verification);
  const isPartner=badges.includes('PURPLE');

  let content=t(lang,'v6.profile.summary',{
    likes:s.likes.length,
    followers:s.followers.length
  });

  if(isPartner){
    content += `\n<:corgi_partner:1552830030697078835> ${t(lang,'profile.partnerNotice')}`;
  }

  return{
    content,
    files:[
      new AttachmentBuilder(card,{name:'corgi-profile.png'})
    ],
    components:[row]
  };
}

module.exports={data:new SlashCommandBuilder().setName('profile').setDescription('View a global Corgi profile').setDescriptionLocalizations({vi:'Xem hồ sơ Corgi Global'}).addUserOption(o=>o.setName('user').setDescription('Member to view').setDescriptionLocalizations({vi:'Thành viên muốn xem'})),prefix:['profile','pf'],payload,async execute(i){const l=await guildLang(i.guildId),u=i.options.getUser('user')||i.user;return i.reply(await payload(u,l));},async executePrefix(m){const l=await guildLang(m.guildId),u=m.mentions.users.first()||m.author;return m.reply(await payload(u,l));}};
