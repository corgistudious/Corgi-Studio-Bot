const fs=require('fs'); const path=require('path');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]).filter(f=>f.endsWith('.js'));}
function loadCommands(client){ client.commands=new Map(); client.prefixCommands=new Map(); const root=path.join(__dirname,'../commands');
 for(const file of walk(root)){ const c=require(file); if(c.data?.name&&c.execute) client.commands.set(c.data.name,c); for(const a of c.prefix||[]) client.prefixCommands.set(a,c); }
 console.log(`✅ Loaded ${client.commands.size} slash commands`); }
module.exports={loadCommands};
