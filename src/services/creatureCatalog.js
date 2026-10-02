const path = require('path');
const fs = require('fs');

const RARITIES = ['N','R','VR','SR','SSR','UR','GR'];
const ELEMENTS = [
  'NORMAL','FIRE','WATER','NATURE',
  'LIGHT','DARK','ICE','ELECTRIC'
];

const ASSET_ROOT = path.join(
  __dirname,
  '../../assets/creature-hunt/pets'
);

const asset = (group, id) =>
  path.join(ASSET_ROOT, group, `${id}.png`);

const pets = [
  // =========================================================
  // 19 HUNTABLE PETS
  // =========================================================
  {
    id:'pet-01', name:'Cáo',
    rarity:'N', aptitude:80, element:'NORMAL',
    hp:110, atk:28, def:24, spd:20
  },
  {
    id:'pet-02', name:'Mèo',
    rarity:'N', aptitude:81, element:'NORMAL',
    hp:114, atk:30, def:26, spd:22
  },
  {
    id:'pet-03', name:'Rồng',
    rarity:'R', aptitude:82, element:'FIRE',
    hp:118, atk:32, def:28, spd:24
  },
  {
    id:'pet-04', name:'Cú mèo',
    rarity:'R', aptitude:83, element:'DARK',
    hp:122, atk:34, def:30, spd:26
  },
  {
    id:'pet-05', name:'Voi',
    rarity:'VR', aptitude:84, element:'NATURE',
    hp:126, atk:36, def:32, spd:20
  },
  {
    id:'pet-06', name:'Husky',
    rarity:'VR', aptitude:85, element:'ICE',
    hp:130, atk:38, def:34, spd:22
  },
  {
    id:'pet-07', name:'Khỉ',
    rarity:'SR', aptitude:86, element:'NATURE',
    hp:134, atk:40, def:36, spd:24
  },
  {
    id:'pet-08', name:'Sư tử',
    rarity:'SR', aptitude:87, element:'FIRE',
    hp:138, atk:42, def:38, spd:26
  },
  {
    id:'pet-09', name:'Rùa',
    rarity:'SSR', aptitude:88, element:'WATER',
    hp:142, atk:44, def:40, spd:20
  },
  {
    id:'pet-10', name:'Cừu',
    rarity:'N', aptitude:89, element:'NORMAL',
    hp:146, atk:46, def:42, spd:22
  },
  {
    id:'pet-11', name:'Ếch',
    rarity:'R', aptitude:90, element:'WATER',
    hp:150, atk:48, def:44, spd:24
  },
  {
    id:'pet-12', name:'Panda',
    rarity:'VR', aptitude:91, element:'NATURE',
    hp:154, atk:50, def:46, spd:26
  },
  {
    id:'pet-13', name:'Unicorn',
    rarity:'SR', aptitude:92, element:'LIGHT',
    hp:158, atk:52, def:48, spd:20
  },
  {
    id:'pet-14', name:'Đại Bàng',
    rarity:'SSR', aptitude:93, element:'ELECTRIC',
    hp:162, atk:54, def:50, spd:22
  },
  {
    id:'pet-15', name:'Nhím',
    rarity:'N', aptitude:94, element:'NATURE',
    hp:166, atk:56, def:52, spd:24
  },
  {
    id:'pet-16', name:'Chim cánh cụt',
    rarity:'R', aptitude:95, element:'ICE',
    hp:170, atk:58, def:54, spd:26
  },
  {
    id:'pet-17', name:'Bạch tuộc',
    rarity:'VR', aptitude:96, element:'WATER',
    hp:174, atk:60, def:56, spd:20
  },
  {
    id:'pet-18', name:'Thỏ',
    rarity:'SR', aptitude:97, element:'LIGHT',
    hp:178, atk:62, def:58, spd:22
  },
  {
    id:'pet-19', name:'Tê Giác',
    rarity:'SSR', aptitude:98, element:'NORMAL',
    hp:182, atk:64, def:60, spd:24
  }
].map(p => ({
  ...p,
  group: 'HUNT',
  huntable: true,
  eventOnly: false,
  acquisition: 'HUNT',
  asset: asset('hunt', p.id)
}));

// ===========================================================
// 5 SPECIAL RED PETS
// KHÔNG XUẤT HIỆN TRONG HUNT
// ===========================================================
pets.push(
  {
    id:'pet-20',
    name:'Thanh Long',
    rarity:'UR',
    aptitude:95,
    element:'NATURE',
    hp:210, atk:78, def:70, spd:42,
    group:'SPECIAL_RED',
    huntable:false,
    eventOnly:false,
    acquisition:'SPECIAL_FRAGMENT',
    asset:asset('special','pet-20')
  },
  {
    id:'pet-21',
    name:'Chu Tước',
    rarity:'UR',
    aptitude:96,
    element:'FIRE',
    hp:222, atk:83, def:75, spd:44,
    group:'SPECIAL_RED',
    huntable:false,
    eventOnly:false,
    acquisition:'SPECIAL_FRAGMENT',
    asset:asset('special','pet-21')
  },
  {
    id:'pet-22',
    name:'Huyền Vũ',
    rarity:'UR',
    aptitude:97,
    element:'WATER',
    hp:234, atk:88, def:80, spd:46,
    group:'SPECIAL_RED',
    huntable:false,
    eventOnly:false,
    acquisition:'SPECIAL_FRAGMENT',
    asset:asset('special','pet-22')
  },
  {
    id:'pet-23',
    name:'Bạch Hổ',
    rarity:'UR',
    aptitude:98,
    element:'LIGHT',
    hp:246, atk:93, def:85, spd:48,
    group:'SPECIAL_RED',
    huntable:false,
    eventOnly:false,
    acquisition:'SPECIAL_FRAGMENT',
    asset:asset('special','pet-23')
  },
  {
    id:'pet-24',
    name:'Cửu Vĩ Hồ',
    rarity:'UR',
    aptitude:99,
    element:'DARK',
    hp:258, atk:98, def:90, spd:50,
    group:'SPECIAL_RED',
    huntable:false,
    eventOnly:false,
    acquisition:'SPECIAL_FRAGMENT',
    asset:asset('special','pet-24')
  }
);

// ===========================================================
// EVENT RAINBOW
// ===========================================================
pets.push({
  id:'pet-25',
  name:'Niên Thú',
  rarity:'GR',
  aptitude:100,
  element:'FIRE',
  hp:300,
  atk:110,
  def:100,
  spd:55,

  group:'EVENT_RAINBOW',
  huntable:false,
  eventOnly:true,
  acquisition:'EVENT_ONLY',

  asset:asset('event','pet-25')
});

const byId = id => pets.find(p => p.id === id);

const weights = {
  N:38,
  R:27,
  VR:18,
  SR:11,
  SSR:6,
  UR:0,
  GR:0
};

function randomPet() {
  const pool = pets.filter(p => p.huntable === true);

  const total = pool.reduce(
    (sum, p) => sum + (weights[p.rarity] || 0),
    0
  );

  if (!pool.length || total <= 0)
    throw new Error('NO_HUNTABLE_PETS');

  let r = Math.random() * total;

  for (const p of pool) {
    r -= weights[p.rarity] || 0;
    if (r <= 0) return p;
  }

  return pool[pool.length - 1];
}

// ===========================================================
// BOOT VALIDATION
// ===========================================================
function validateCatalog() {
  const hunt = pets.filter(p => p.huntable);
  const special = pets.filter(p => p.group === 'SPECIAL_RED');
  const event = pets.filter(p => p.group === 'EVENT_RAINBOW');

  // Dynamic catalog: the original 25 pets are the seed, /dev may add, disable or retire pets at runtime.
  if (pets.length < 25) throw new Error(`PET_CATALOG_TOO_SMALL_${pets.length}`);

  const ids = new Set();

  for (const pet of pets) {
    if (ids.has(pet.id))
      throw new Error(`DUPLICATE_PET_ID_${pet.id}`);

    ids.add(pet.id);

    if (!pet.retired && !fs.existsSync(pet.asset))
      throw new Error(`MISSING_PET_ASSET_${pet.id}:${pet.asset}`);
  }

  return {
    total:pets.length,
    hunt:hunt.length,
    special:special.length,
    event:event.length
  };
}

validateCatalog();

module.exports = {
  pets,
  byId,
  RARITIES,
  ELEMENTS,
  randomPet,
  validateCatalog
};
