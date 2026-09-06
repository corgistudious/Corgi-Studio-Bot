const { Schema, model } = require('mongoose');
const schema = new Schema({
  guildId: { type: String, unique: true, index: true, required: true },
  prefix: { type: String, default: '?' },
  language: { type: String, enum: ['en','vi'], default: 'en' },
  modules: {
    giveaway:{type:Boolean,default:true}, reactionRole:{type:Boolean,default:true}, stats:{type:Boolean,default:true}, welcome:{type:Boolean,default:true},
    ticket:{type:Boolean,default:true}, moderation:{type:Boolean,default:true}, poll:{type:Boolean,default:true}, logs:{type:Boolean,default:true},
    contest:{type:Boolean,default:true}, economy:{type:Boolean,default:true}, premium:{type:Boolean,default:true}, pet:{type:Boolean,default:false}, ai:{type:Boolean,default:true}, games:{type:Boolean,default:true}
  },
  channels: { welcome:String, leave:String, logs:String, ticketCategory:String, stats:String },
  messages: { welcome:{type:String,default:'Welcome {user} to **{server}**! You are member **#{count}**.'}, leave:{type:String,default:'{username} left **{server}**.'} },
  economy: { dailyAmount:{type:Number,default:250}, transferTaxPercent:{type:Number,default:0}, gamesEnabled:{type:Boolean,default:true} },
  premiumBranding: { botName:String, avatarUrl:String, emojiTheme:{type:String,default:'default'}, useCorgiStudioEmoji:{type:Boolean,default:false} },
  statsMessageId: String,
  statsVoiceChannels: { members:String, humans:String, bots:String, boosts:String }
}, { timestamps:true, minimize:false });
module.exports = model('GuildSettings', schema);