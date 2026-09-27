const path=require('path');
const fs=require('fs');
const RARITIES=['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC','CELESTIAL','SECRET'];
const ELEMENTS=['NORMAL','FIRE','WATER','NATURE','LIGHT','DARK','ICE','ELECTRIC'];
const names=['Mochi Sprout','Ember Cub','Ripple Pup','Mossling','Luma Bunny','Dusk Kit','Frost Pip','Volt Finch','Cloud Paws','Cinder Fox','Bubble Otter','Fern Fawn','Halo Cub','Shade Lynx','Snowtail','Spark Mouse','Pebble Pup','Blaze Bunny','Coral Kit','Leaflet','Glimmer Fawn','Nightwhisker','Icicle Cub','Static Hare','Star Pup','Flare Fox','Tide Drake','Bloom Cat','Radiant Lynx','Umbral Cub','Glacier Hare','Storm Finch','Nova Kit','Pyra Drake','Aqua Wisp','Verdant Spirit','Solari Fox','Noctis Lynx','Cryo Drake','Tesla Cub','Astral Bunny','Inferno Kirin','Levi Pup','Sylvan Drake','Seraph Kit','Abyss Fox','Aurora Lynx','Thunder Kirin','Cosmo Fawn','Solar Drake','Aether Otter','Gaia Kirin','Lux Spirit','Eclipse Cat','Winter Wyrm','Tempest Fox','Nebula Kirin','Phoenix Pup','Ocean Oracle','Ancient Bloom','Celestia Lynx','Void Sovereign','Polar Seraph','Infinity Corgi'];
const rarityFor=i=>i<16?'COMMON':i<28?'UNCOMMON':i<38?'RARE':i<46?'EPIC':i<53?'LEGENDARY':i<58?'MYTHIC':i<62?'CELESTIAL':'SECRET';
const base={COMMON:[90,18,12,14],UNCOMMON:[105,22,15,16],RARE:[120,27,18,19],EPIC:[140,33,22,22],LEGENDARY:[165,40,27,25],MYTHIC:[190,47,32,28],CELESTIAL:[220,55,38,31],SECRET:[250,64,45,35]};
const dir=path.join(__dirname,'../../assets/creature-hunt/pets');
const files=fs.readdirSync(dir).filter(x=>/^pet-\d+\.(png|jpg|jpeg)$/i.test(x)).sort();
const pets=names.map((name,i)=>{const rarity=rarityFor(i),[hp,atk,def,spd]=base[rarity];return{id:`pet-${String(i+1).padStart(2,'0')}`,name,rarity,element:ELEMENTS[i%ELEMENTS.length],hp:hp+(i%7)*2,atk:atk+(i%5),def:def+(i%4),spd:spd+(i%6),asset:path.join(dir,files[i])};});
const byId=id=>pets.find(p=>p.id===id);
const weights={COMMON:42,UNCOMMON:25,RARE:15,EPIC:9,LEGENDARY:5,MYTHIC:2.5,CELESTIAL:1.2,SECRET:.3};
function randomPet(){const total=pets.reduce((s,p)=>s+weights[p.rarity],0);let r=Math.random()*total;for(const p of pets){r-=weights[p.rarity];if(r<=0)return p;}return pets[0];}
module.exports={pets,byId,RARITIES,ELEMENTS,randomPet};
