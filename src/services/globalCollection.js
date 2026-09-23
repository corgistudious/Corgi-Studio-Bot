const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');

const Social = require('./socialProfile');
const Cosmetic = require('../models/GlobalCosmetic');
const { t } = require('./i18n');

const TYPES = ['FRAME', 'BACKGROUND', 'ACCENT', 'NAMEPLATE', 'TITLE'];

const DEFAULTS = {
  'background:default': { type: 'BACKGROUND', name: 'Default Background' },
  'frame:default': { type: 'FRAME', name: 'Default Frame' },
  'accent:ice': { type: 'ACCENT', name: 'Ice Blue' }
};

const TYPE_EMOJI = {
  FRAME: '🖼️',
  BACKGROUND: '🌌',
  ACCENT: '🎨',
  NAMEPLATE: '🏷️',
  TITLE: '👑'
};

const TYPE_I18N = {
  FRAME: 'v6.collection.type.frame',
  BACKGROUND: 'v6.collection.type.background',
  ACCENT: 'v6.collection.type.accent',
  NAMEPLATE: 'v6.collection.type.nameplate',
  TITLE: 'v6.collection.type.title'
};

function selectedKey(profile, type) {
  const c = profile.cosmetics || {};

  if (type === 'FRAME') return `frame:${c.frame || 'default'}`;
  if (type === 'BACKGROUND') return `background:${c.background || 'default'}`;
  if (type === 'ACCENT') return `accent:${c.accent || 'ice'}`;
  if (type === 'NAMEPLATE') return `nameplate:${c.nameplate || 'default'}`;

  if (type === 'TITLE') {
    const value = String(c.title || '');
    return value ? (value.includes(':') ? value : `title:${value}`) : '';
  }

  return '';
}

function typeFromKey(key) {
  const prefix = String(key || '').split(':')[0].toUpperCase();
  return TYPES.includes(prefix) ? prefix : null;
}

async function ownedItems(userId) {
  const profile = await Social.ensure(userId);
  const keys = [...new Set(profile.ownedCosmetics || [])];

  const rows = await Cosmetic.find({
    key: { $in: keys }
  }).lean();

  const byKey = new Map(rows.map(x => [x.key, x]));

  const items = keys.map(key => {
    const db = byKey.get(key);

    if (db) return {
      key: db.key,
      type: db.type,
      name: db.name,
      rarity: db.rarity || 'COMMON',
      enabled: db.enabled !== false,
      legacy: false
    };

    const def = DEFAULTS[key];
    if (def) return {
      key,
      type: def.type,
      name: def.name,
      rarity: 'DEFAULT',
      enabled: true,
      legacy: false
    };

    return {
      key,
      type: typeFromKey(key),
      name: key,
      rarity: 'LEGACY',
      enabled: false,
      legacy: true
    };
  });

  return { profile, items };
}

async function home(userId, viewerId, lang = 'en') {
  const { profile, items } = await ownedItems(userId);
  const own = userId === viewerId;

  const counts = {};
  for (const type of TYPES) {
    counts[type] = items.filter(x => x.type === type).length;
  }

  const lines = TYPES.map(type =>
    `${TYPE_EMOJI[type]} **${t(lang, TYPE_I18N[type])}** • ${counts[type]}`
  );

  const embed = new EmbedBuilder()
    .setTitle(`🎨 ${t(lang, 'v6.profile.collection')}`)
    .setDescription(
      `${lines.join('\n')}\n\n` +
      (own
        ? t(lang, 'v6.collection.ownHint')
        : t(lang, 'v6.collection.readOnly'))
    );

  const options = TYPES
    .filter(type => counts[type] > 0)
    .map(type =>
      new StringSelectMenuOptionBuilder()
        .setLabel(`${t(lang, TYPE_I18N[type])} (${counts[type]})`.slice(0, 100))
        .setValue(type)
        .setEmoji(TYPE_EMOJI[type])
    );

  const components = [];

  if (options.length) {
    components.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`collection:type:${userId}`)
          .setPlaceholder(t(lang, 'v6.collection.chooseCategory').slice(0, 150))
          .addOptions(options)
      )
    );
  }

  return { embeds: [embed], components, flags: 64 };
}

async function category(userId, viewerId, type, lang = 'en') {
  type = String(type || '').toUpperCase();
  if (!TYPES.includes(type)) throw new Error('INVALID_TYPE');

  const { profile, items } = await ownedItems(userId);
  const own = userId === viewerId;

  const list = items.filter(x => x.type === type).slice(0, 25);
  const equipped = selectedKey(profile, type);

  const embed = new EmbedBuilder()
    .setTitle(`${TYPE_EMOJI[type]} ${t(lang, TYPE_I18N[type])}`)
    .setDescription(
      list.length
        ? list.map(x =>
            `${x.key === equipped ? '✅' : '▫️'} **${x.name}** • ${x.rarity}` +
            (x.legacy ? ` • ${t(lang, 'v6.collection.legacy')}` : '')
          ).join('\n')
        : t(lang, 'v6.collection.empty')
    );

  const components = [];

  if (own && list.length) {
    const options = list
      .filter(x => !x.legacy)
      .map(x =>
        new StringSelectMenuOptionBuilder()
          .setLabel(x.name.slice(0, 100))
          .setDescription(
            `${x.rarity}${x.key === equipped ? ` • ${t(lang, 'v6.collection.equipped')}` : ''}`.slice(0, 100)
          )
          .setValue(x.key)
          .setDefault(x.key === equipped)
      );

    if (options.length) {
      components.push(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`collection:equip:${userId}`)
            .setPlaceholder(t(lang, 'v6.collection.equip').slice(0, 150))
            .addOptions(options)
        )
      );
    }
  }

  return { embeds: [embed], components, flags: 64 };
}

async function equip(userId, key) {
  const profile = await Social.ensure(userId);

  if (!profile.ownedCosmetics.includes(key)) {
    throw new Error('NOT_OWNED');
  }

  const [rawType, ...parts] = String(key).split(':');
  const type = rawType.toUpperCase();
  const value = parts.join(':');

  if (!TYPES.includes(type) || !value) {
    throw new Error('INVALID_COSMETIC');
  }

  const isDefault = Object.prototype.hasOwnProperty.call(DEFAULTS, key);

  if (!isDefault) {
    const item = await Cosmetic.findOne({ key }).lean();
    if (!item) throw new Error('COSMETIC_NOT_FOUND');
    if (item.type !== type) throw new Error('COSMETIC_TYPE_MISMATCH');
  }

  if (type === 'FRAME') profile.cosmetics.frame = value;
  else if (type === 'BACKGROUND') profile.cosmetics.background = value;
  else if (type === 'ACCENT') profile.cosmetics.accent = value;
  else if (type === 'NAMEPLATE') profile.cosmetics.nameplate = value;
  else if (type === 'TITLE') profile.cosmetics.title = value;

  await profile.save();
  return profile;
}

module.exports = {
  TYPES,
  home,
  category,
  equip
};
