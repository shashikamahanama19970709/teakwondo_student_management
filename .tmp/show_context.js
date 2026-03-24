const fs = require('fs'); const p = require('path'); const s = fs.readFileSync(p.join(process.cwd(),'src','app','course-modules','page.tsx'),'utf8');
const idx = s.indexOf('gap-3');
console.log('index', idx);
console.log(JSON.stringify(s.slice(Math.max(0, idx-60), idx+60)));
