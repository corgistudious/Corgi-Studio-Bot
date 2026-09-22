const fs=require('fs'),path=require('path');
const langs=require('../src/config/languages');
const root=path.join(__dirname,'..','src');
const expected=langs.map(x=>x.id);
let files=0; const legacy=[]; const compat=[]; const txMissing=[];
function walk(d){for(const n of fs.readdirSync(d)){const p=path.join(d,n),st=fs.statSync(p);if(st.isDirectory())walk(p);else if(p.endsWith('.js')){files++;const s=fs.readFileSync(p,'utf8');if(p.endsWith(path.join('services','i18n.js')))continue;const matches=[...s.matchAll(/\bpick\s*\(/g)];if(matches.length)legacy.push([path.relative(path.join(__dirname,'..'),p),matches.length]);const compatMatches=[...s.matchAll(/\blegacyTx\s*\(/g)];if(compatMatches.length)compat.push([path.relative(path.join(__dirname,'..'),p),compatMatches.length]);
// For literal tx(lang,{...}) maps, require every configured locale key. Dynamic maps are audited at their definitions instead.
for(const m of s.matchAll(/tx\s*\(\s*[^,]+\s*,\s*\{([\s\S]*?)\}\s*(?:,|\))/g)){const body=m[1];if(!/\ben\s*:|['"]en['"]\s*:/.test(body))continue;const missing=expected.filter(id=>!new RegExp(`(?:['"]${id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}['"]|\\b${id.replace('-', '\\-')})\\s*:`).test(body));if(missing.length)txMissing.push([path.relative(path.join(__dirname,'..'),p),missing]);}}
}}
walk(root);
const legacyCount=legacy.reduce((a,x)=>a+x[1],0);
console.log(`🌐 i18n audit • ${expected.length} locales configured • ${files} JS files scanned`);
console.log(`• legacy EN/VI pick() surfaces: ${legacyCount}`);
if(legacy.length){console.log('\nLegacy surfaces by file:');for(const [f,n] of legacy.sort((a,b)=>b[1]-a[1]))console.log(`  ${String(n).padStart(3)}  ${f}`);}
const compatCount=compat.reduce((a,x)=>a+x[1],0);console.log(`• compatibility legacyTx() surfaces: ${compatCount}`);if(compat.length){console.log('\nCompatibility surfaces by file:');for(const [f,n] of compat.sort((a,b)=>b[1]-a[1]))console.log(`  ${String(n).padStart(3)}  ${f}`);}
if(txMissing.length){console.log(`\n• literal tx() maps missing configured locale keys: ${txMissing.length}`);for(const [f,m] of txMissing.slice(0,50))console.log(`  ${f}: ${m.join(', ')}`);}
if(legacyCount||compatCount||txMissing.length){console.error('\n❌ V5.1 full-localization gate FAILED.');process.exitCode=2;}else console.log('✅ Full-localization gate PASS');
