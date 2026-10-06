const { chromium } = require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files']});const dir=process.argv[2];
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))){const s=f.startsWith('fg_')?432:288;
const p=await b.newPage({viewport:{width:s,height:s}});await p.goto('file://'+dir+'/'+f);await p.waitForTimeout(300);
await p.screenshot({path:dir+'/'+f.replace('.html','.png'),omitBackground:true});await p.close();}
await b.close();})();
