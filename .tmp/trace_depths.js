const fs = require('fs');
const path = require('path');
const s = fs.readFileSync(path.join(process.cwd(),'src','app','course-modules','page.tsx'),'utf8');
const lines = s.split('\n');
let brace=0, paren=0, bracket=0;
function skipString(i,j){
  const line = lines[i];
  const q = line[j];
  j++;
  while(i<lines.length){
    while(j<lines[i].length && lines[i][j]!==q){ if(lines[i][j]==='\\') j++; j++; }
    if(j<lines[i].length && lines[i][j]===q) return {i,j};
    i++; j=0;
  }
  return {i,j};
}
for(let i=0;i<lines.length;i++){
  let line = lines[i];
  for(let j=0;j<line.length;j++){
    const c = line[j];
    if(c==='\'' || c==='"'){
      const out = skipString(i,j);
      i = out.i; j = out.j;
      continue;
    }
    if(c==='`'){
      // skip template to next backtick
      j++;
      while(i<lines.length){
        while(j<lines[i].length && lines[i][j] !== '`'){ if(lines[i][j]==='\\') j++; j++; }
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
  }
  if(brace<0||paren<0||bracket<0) console.log('Negative at line',i+1,'brace',brace,'paren',paren,'bracket',bracket);
  if(i%20===0) console.log(`L${i+1}: brace=${brace} paren=${paren} bracket=${bracket}`);
}
console.log('FINAL', {brace,paren,bracket});
