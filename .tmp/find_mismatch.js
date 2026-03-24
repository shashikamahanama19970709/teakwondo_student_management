const fs = require('fs');
const path = require('path');
const s = fs.readFileSync(path.join(process.cwd(),'src','app','course-modules','page.tsx'),'utf8');

let brace=0, paren=0, bracket=0;
const issues = [];
const lines = s.split('\n');
for(let i=0;i<lines.length;i++){
  const line = lines[i];
  for(let j=0;j<line.length;j++){
    const c=line[j];
    if(c==='\'' || c==='"'){
      const q=c; j++;
      while(i<lines.length && j<lines[i].length && lines[i][j]!==q){ if(lines[i][j]==='\\') j++; j++; }
      continue;
    }
    if(c==='`'){
      j++;
      while(i<lines.length){
        while(j<lines[i].length && lines[i][j] !== '`'){
          if(lines[i][j]==='\\') j++;
          j++;
        }
        if(j<lines[i].length && lines[i][j]==='`') break;
        i++; j=0;
      }
      continue;
    }

    if(c==='{') brace++;
    if(c==='}') brace--;
    if(c==='(') paren++;
    if(c===')') paren--;
    if(c==='[') bracket++;
    if(c===']') bracket--;

    if(brace<0){ issues.push({type:'}', line:i+1, col:j+1}); brace=0; }
    if(paren<0){ issues.push({type:')', line:i+1, col:j+1}); paren=0; }
    if(bracket<0){ issues.push({type:']', line:i+1, col:j+1}); bracket=0; }
  }
}

console.log('Done scanning. Depths -> brace:',brace,'paren:',paren,'bracket:',bracket);
if(issues.length>0) console.log('Issues:',issues.slice(0,50));
