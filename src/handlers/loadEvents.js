const fs=require('fs'); const path=require('path');
function loadEvents(client){const root=path.join(__dirname,'../events'); for(const f of fs.readdirSync(root).filter(x=>x.endsWith('.js'))){const e=require(path.join(root,f)); if(e.once) client.once(e.name,(...a)=>e.execute(...a,client)); else client.on(e.name,(...a)=>e.execute(...a,client));}}
module.exports={loadEvents};
