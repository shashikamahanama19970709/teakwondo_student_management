const fs = require('fs');
const path = require('path');
const s = fs.readFileSync(path.join(process.cwd(),'src','app','course-modules','page.tsx'),'utf8');
const counts = { '{':0,'}':0,'(':0,')':0,'[':0,']':0,'`':0,"'":0,'"':0,'<':0,'>':0 };
for (const ch of s) { if (ch in counts) counts[ch]++; }
console.log(counts);

function findUnterminated(token){
  let stack=[];
  for(let i=0;i<s.length;i++){
    const c=s[i];
    if(c==='"' || c==="'"){
      // skip strings
      const q=c; i++; while(i<s.length && s[i]!==q){ if(s[i]==='\\') i++; i++; }
    } else if(c==='`'){
      // find next unescaped backtick
      i++; while(i<s.length && s[i]!== '`'){ if(s[i]==='\\') i++; i++; }
    }
  }
}
