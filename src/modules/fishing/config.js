const RARITIES=[
 {id:'N',en:'Normal',vi:'Thường',chance:55,color:0xA7A7A7,score:1},
 {id:'R',en:'Rare',vi:'Hiếm',chance:25,color:0x43D17A,score:3},
 {id:'VR',en:'Very Rare',vi:'Rất Hiếm',chance:10,color:0x3498DB,score:8},
 {id:'UR',en:'Ultra Rare',vi:'Siêu Hiếm',chance:5,color:0x00D9FF,score:20},
 {id:'E',en:'Epic',vi:'Sử Thi',chance:2.5,color:0x9B59FF,score:55},
 {id:'L',en:'Legendary',vi:'Huyền Thoại',chance:1.3,color:0xFFD700,score:150},
 {id:'M',en:'Mythic',vi:'Thần Thoại',chance:.7,color:0xFF3B4F,score:400},
 {id:'GR',en:'God Rare',vi:'Thần Hiếm',chance:.3,color:0xFF7A00,score:1100},
 {id:'SR',en:'Secret Rare',vi:'Bí Mật',chance:.12,color:0xFF3DCE,score:3000},
 {id:'SSR',en:'Super Secret Rare',vi:'Siêu Bí Mật',chance:.06,color:0xE8FFFF,score:9000},
 {id:'??',en:'Infiniti Rare',vi:'Hiếm Vô Cực',chance:.02,color:0xFFFFFF,score:30000}
];
const FISH=[
 ['bluegill','Bluegill','Cá thái dương','N',.15,2.2,18],['anchovy','Anchovy','Cá cơm','N',.03,.35,12],['carp','Common Carp','Cá chép','N',.8,18,24],['catfish','Channel Catfish','Cá trê','R',1.2,28,42],['bass','Largemouth Bass','Cá vược','R',.7,12,48],['salmon','Atlantic Salmon','Cá hồi Đại Tây Dương','VR',2,22,75],['tuna','Yellowfin Tuna','Cá ngừ vây vàng','VR',8,95,90],['mahimahi','Great White Shark','Cá Mập Trắng','UR',4,38,140],['swordfish','Swordfish','Cá kiếm','UR',30,180,165],['arapaima','Stingray','Cá Đuối','E',35,210,260],['sturgeon','Arapaima','Cá Hải Tượng','E',45,300,290],['marlin','Dragon Fish','Cá Rồng','L',80,520,500],['coelacanth','Legendary Koi','Cá Koi Huyền Thoại','L',25,110,620],['giant_manta','Celestial Angelfish','Cá Thiên Thần','M',350,1600,900],['oarfish','Abyss Ghostfish','Cá Ma Vực','M',80,320,1050],['abyss_shark','Soul Fish','Cá Linh Hồn','GR',450,2200,1800],['golden_koi','Frost Fish','Cá Băng Giá','GR',8,55,2200],['ghost_whale','Flame Fish','Cá Hỏa Diễm','SR',1800,9000,5000],['void_ray','Thunder Fish','Cá Lôi Quang','SR',500,2800,5600],['crown_leviathan','Nebula Fish','Cá Tinh Vân','SSR',3500,18000,12000],['eternal_dragonfish','Space-Time Fish','Cá Thời Không','SSR',120,800,14000],['infinity_serpent','???','???','??',5000,30000,50000]
].map(([id,en,vi,rarity,min,max,base])=>({id,en,vi,rarity,min,max,base}));
const RODS=[
 {nameEn:'Bamboo Rod',nameVi:'Cần Tre',fish:0,kg:0,cost:0,luck:0,weight:1},
 {nameEn:'Iron Rod',nameVi:'Cần Sắt',fish:50,kg:100,cost:2500,luck:.02,weight:1.08},
 {nameEn:'Steel Rod',nameVi:'Cần Thép',fish:200,kg:750,cost:10000,luck:.04,weight:1.16},
 {nameEn:'Carbon Rod',nameVi:'Cần Carbon',fish:600,kg:3000,cost:35000,luck:.06,weight:1.25},
 {nameEn:'Ocean Rod',nameVi:'Cần Đại Dương',fish:1500,kg:12000,cost:100000,luck:.08,weight:1.35},
 {nameEn:'Elite Rod',nameVi:'Cần Tinh Anh',fish:4000,kg:50000,cost:300000,luck:.10,weight:1.47},
 {nameEn:'Legendary Rod',nameVi:'Cần Huyền Thoại',fish:10000,kg:200000,cost:1000000,luck:.12,weight:1.60}
];
const BAITS={basic:{en:'Basic Bait',vi:'Mồi Cơ Bản',cost:100,qty:10,luck:0,weight:0},worm:{en:'Fresh Worm',vi:'Trùn Tươi',cost:300,qty:10,luck:.02,weight:.02},shrimp:{en:'Ocean Shrimp',vi:'Tôm Biển',cost:1200,qty:10,luck:.05,weight:.04},glow:{en:'Glow Bait',vi:'Mồi Phát Sáng',cost:5000,qty:10,luck:.09,weight:.07}};
module.exports={RARITIES,FISH,RODS,BAITS};
