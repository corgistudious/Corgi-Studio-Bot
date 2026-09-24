const { Schema, model } = require('mongoose');

const schema = new Schema({
  guildId: { type: String, unique: true, index: true, required: true },
  prefix: { type: String, default: '?' },
  language: { type: String, enum: ['en','vi','pt-BR','pt-PT','es','fr','de','ja','ko','id','zh-TW','zh-CN'], default: 'en' },
  modules: {
    giveaway:{type:Boolean,default:true}, reactionRole:{type:Boolean,default:true}, stats:{type:Boolean,default:true}, welcome:{type:Boolean,default:true},
    ticket:{type:Boolean,default:true}, moderation:{type:Boolean,default:true}, poll:{type:Boolean,default:true}, logs:{type:Boolean,default:true},
    contest:{type:Boolean,default:true}, economy:{type:Boolean,default:true}, leveling:{type:Boolean,default:true}, premium:{type:Boolean,default:true}, pet:{type:Boolean,default:false}, ai:{type:Boolean,default:true}, games:{type:Boolean,default:true}
  },
  channels: { welcome:String, leave:String, logs:String, moderationLogs:String, ticketCategory:String, stats:String, globalMail:String, marketAnnouncements:String, seasonalAnnouncements:String },
  marketNotifications:{enabled:{type:Boolean,default:true},thresholdPercent:{type:Number,default:5},cooldownMinutes:{type:Number,default:60},direction:{type:String,enum:['both','up','down'],default:'both'}},
  messages: {
    welcome:{type:String,default:'Welcome {user} to **{server}**! You are member **#{count}**.'},
    leave:{type:String,default:'{username} left **{server}**.'}
  },
  economy: {
    dailyAmount:{type:Number,default:250},
    transferTaxPercent:{type:Number,default:0},
    gamesEnabled:{type:Boolean,default:true}
  },
  premiumBranding: {
    botName:String,
    avatarUrl:String,
    emojiTheme:{type:String,default:'default'},
    useCorgiStudioEmoji:{type:Boolean,default:false}
  },
  moderationCaseCounter: {type:Number,default:0,min:0},
  webSetup: { type:Schema.Types.Mixed, default:()=>({ giveaway:{}, contest:{}, ticket:{}, verification:{badges:['BLUE','PURPLE']}, welcome:{}, autoRole:{}, reactionRole:{}, moderation:{}, stats:{}, ai:{}, economy:{}, fishing:{}, gameHub:{}, tournament:{}, market:{}, premium:{}, clan:{} }) },
  statsMessageId: String,
  statsConfig: {
    freeEnabled: { type: [String], default: ['members','humans','bots','roles'] },
    premiumEnabled: { type: [String], default: [] }
  },
  statsVoiceChannels: {
    members:String,
    humans:String,
    bots:String,
    roles:String,
    online:String,
    boosts:String,
    boostLevel:String,
    emojis:String,
    stickers:String,
    categories:String,
    textChannels:String,
    voiceChannels:String,
    stageChannels:String,
    forums:String,
    announcements:String,
    threads:String,
    events:String
  }
}, { timestamps:true, minimize:false });

module.exports = model('GuildSettings', schema);
