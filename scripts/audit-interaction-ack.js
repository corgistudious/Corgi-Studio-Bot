const fs=require('fs');
let failed=false;
const checks=[['src/modules/creatureHunt.js',/return\s+i\.reply\s*\(/g,'Pet Hunt component handler must not reply() after router deferUpdate()']];
for(const [file,re,msg] of checks){const src=fs.readFileSync(file,'utf8');if(re.test(src)){console.error(`❌ ${msg} • ${file}`);failed=true;}}
const router=fs.readFileSync('src/events/interactionCreate.js','utf8');
for(const prefix of ['ch:','ch6:','chs:','gh:','fish:','startup:','pete:']){if(!router.includes(`startsWith('${prefix}')`)){console.error(`❌ Missing early ACK ownership for ${prefix}`);failed=true;}}
for(const legacy of ['farm:','mine:','farmcrop:','farmseed:','farmanimal:']){if(router.includes(`startsWith('${legacy}')`)){console.error(`❌ Legacy handler still present: ${legacy}`);failed=true;}}
if(failed)process.exit(1);
console.log('⚡ interaction ACK audit • Pet/Game Hub/Fishing/Startup contract PASS');
