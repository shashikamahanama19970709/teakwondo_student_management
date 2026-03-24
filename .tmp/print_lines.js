const fs=require('fs');const p=require('path');const s=fs.readFileSync(p.join(process.cwd(),'src','app','course-modules','page.tsx'),'utf8');const lines=s.split('\n');
function printRange(a,b){for(let i=a;i<=b;i++){console.log((i)+': '+(lines[i-1]||''));}}
printRange(410,440);console.log('---');printRange(1106,1120);
