const fs = require('fs');
const content = fs.readFileSync(process.argv[2], 'utf8');

let braces = 0;
let parens = 0;
let brackets = 0;
let inString = null;
let escaped = false;
let line = 1;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '\n') line++;

    if (escaped) {
        escaped = false;
        continue;
    }
    if (char === '\\') {
        escaped = true;
        continue;
    }
    if (inString) {
        if (char === inString) inString = null;
        continue;
    }
    if (char === '/' && content[i + 1] === '/') {
        while (i < content.length && content[i] !== '\n') i++;
        line++;
        continue;
    }
    if (char === '/' && content[i + 1] === '*') {
        i += 2;
        while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) {
            if (content[i] === '\n') line++;
            i++;
        }
        i++;
        continue;
    }
    if (char === '"' || char === "'" || char === '`') {
        inString = char;
        continue;
    }
    if (char === '{') braces++;
    else if (char === '}') braces--;
    else if (char === '(') parens++;
    else if (char === ')') parens--;
    else if (char === '[') brackets++;
    else if (char === ']') brackets--;

    if (braces < 0) { console.log(`Negative braces at line ${line}`); braces = 0; }
    if (parens < 0) { console.log(`Negative parens at line ${line}`); parens = 0; }
    if (brackets < 0) { console.log(`Negative brackets at line ${line}`); brackets = 0; }
}

console.log(`Final counts: Braces=${braces}, Parens=${parens}, Brackets=${brackets}`);
