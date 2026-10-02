const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','src','events');
const files=fs.readdirSync(dir).filter(n=>n.endsWith('.js'));
const handlers=[];
for(const n of files){const p=path.join(dir,n),s=fs.readFileSync(p,'utf8');if(/name\s*:\s*Events\.InteractionCreate/.test(s))handlers.push({n,s});}
const owners=new Map();
for(const {n,s} of handlers){
  for(const m of s.matchAll(/customId\?*\.startsWith\(['"]([^'"]+)['"]\)/g)){const k=m[1];if(!owners.has(k))owners.set(k,[]);owners.get(k).push(n);}
}
const dup=[...owners].filter(([,v])=>new Set(v).size>1);
console.log(`🎛️ interaction audit • ${handlers.length} InteractionCreate event files`);
if(dup.length){for(const [k,v] of dup)console.error(`❌ duplicate prefix ${k}: ${[...new Set(v)].join(', ')}`);process.exit(2);}
console.log('✅ No duplicate customId prefix ownership detected');
