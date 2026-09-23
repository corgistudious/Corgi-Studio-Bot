const Cosmetic = require('../models/GlobalCosmetic');

const TYPES = ['FRAME','BACKGROUND','ACCENT','NAMEPLATE','TITLE','EFFECT'];
const RARITIES = ['COMMON','RARE','EPIC','LEGENDARY','LIMITED'];

function cleanKey(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeType(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeRarity(value) {
  return String(value || '').trim().toUpperCase();
}

function validateKey(key) {
  if (!/^[a-z0-9][a-z0-9:_-]{2,63}$/.test(key)) {
    throw new Error('Key must be 3-64 characters using a-z, 0-9, :, _ or -.');
  }
}

function validateType(type) {
  if (!TYPES.includes(type)) {
    throw new Error(`Invalid type. Use: ${TYPES.join(', ')}`);
  }
}

function validateRarity(rarity) {
  if (!RARITIES.includes(rarity)) {
    throw new Error(`Invalid rarity. Use: ${RARITIES.join(', ')}`);
  }
}

async function list(limit = 50) {
  return Cosmetic.find({})
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(100, Number(limit) || 50)))
    .lean();
}

async function create({ key, type, name, price, rarity, value }) {
  key = cleanKey(key);
  type = normalizeType(type);
  rarity = normalizeRarity(rarity);
  name = String(name || '').trim();
  value = String(value || '').trim();
  price = Math.floor(Number(price));

  validateKey(key);
  validateType(type);
  validateRarity(rarity);

  if (!name || name.length > 80) {
    throw new Error('Name must be 1-80 characters.');
  }

  if (!Number.isFinite(price) || price < 0 || price > 1000000000) {
    throw new Error('Price must be between 0 and 1,000,000,000 CXu.');
  }

  if (value.length > 500) {
    throw new Error('Value is too long.');
  }

  const exists = await Cosmetic.exists({ key });
  if (exists) throw new Error('This cosmetic key already exists.');

  return Cosmetic.create({
    key,
    type,
    name,
    price,
    rarity,
    value,
    enabled: true
  });
}

async function edit(key, { name, price, rarity, value }) {
  key = cleanKey(key);
  validateKey(key);

  const item = await Cosmetic.findOne({ key });
  if (!item) throw new Error('Cosmetic not found.');

  name = String(name || '').trim();
  rarity = normalizeRarity(rarity);
  value = String(value || '').trim();
  price = Math.floor(Number(price));

  validateRarity(rarity);

  if (!name || name.length > 80) {
    throw new Error('Name must be 1-80 characters.');
  }

  if (!Number.isFinite(price) || price < 0 || price > 1000000000) {
    throw new Error('Price must be between 0 and 1,000,000,000 CXu.');
  }

  if (value.length > 500) {
    throw new Error('Value is too long.');
  }

  item.name = name;
  item.price = price;
  item.rarity = rarity;
  item.value = value;

  await item.save();
  return item;
}

async function toggle(key) {
  key = cleanKey(key);
  validateKey(key);

  const item = await Cosmetic.findOne({ key });
  if (!item) throw new Error('Cosmetic not found.');

  item.enabled = !item.enabled;
  await item.save();

  return item;
}

async function remove(key) {
  key = cleanKey(key);
  validateKey(key);

  const item = await Cosmetic.findOne({ key });
  if (!item) throw new Error('Cosmetic not found.');

  item.enabled = false;
  await item.save();

  return item;
}

async function get(key) {
  return Cosmetic.findOne({ key: cleanKey(key) }).lean();
}

module.exports = {
  TYPES,
  RARITIES,
  list,
  create,
  edit,
  toggle,
  remove,
  get
};
