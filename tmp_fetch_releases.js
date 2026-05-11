const https = require('https');
const fs = require('fs');
const versions = ['2026.4.20','2026.4.21','2026.4.22','2026.4.23','2026.4.24','2026.4.25','2026.4.26','2026.4.27','2026.4.29','2026.5.2','2026.5.3','2026.5.4','2026.5.5','2026.5.6','2026.5.7'];
function fetch(url){return new Promise((resolve,reject)=>{https.get(url,res=>{let s='';res.on('data',d=>s+=d);res.on('end',()=>resolve(s));}).on('error',reject);});}
(async()=>{
 let out='';
 for(const v of versions){
   const url = `https://github.com/openclaw/openclaw/releases/tag/v${v}`;
   const html = await fetch(url);
   const m = html.match(/<div[^>]*data-test-selector="body-content"[^>]*>([\s\S]*?)<\/div>/i);
   let text = html;
   if (m) text = m[1];
   text = text.replace(/<script[\s\S]*?<\/script>/gi,' ')
              .replace(/<style[\s\S]*?<\/style>/gi,' ')
              .replace(/<[^>]+>/g,' ')
              .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&')
              .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
              .replace(/\s+/g,' ').trim();
   out += `VERSION ${v}\n${text.slice(0,6000)}\n\n__END__\n`;
 }
 fs.writeFileSync('/Users/canozgel-macmini/.openclaw/workspace/release_notes_gap.txt', out);
})();
