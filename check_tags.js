const fs = require('fs');
const content = fs.readFileSync(process.argv[2], 'utf8');

const openTags = [];
const tagRegex = /<(\/?motion\.[a-z0-9]+|main|section|div|p|h1|h2|h3|h4|h5|h6|span|ul|li|button|a|img|Image|Link|Input|Textarea|Label|Button|DialogContent|DialogHeader|DialogTitle|Dialog|DropdownMenu|DropdownMenuContent|DropdownMenuItem|DropdownMenuTrigger|ChevronDown|ChevronUp|AnimatePresence)(?:\s+[^>]*?)?(\/?)>/gi;

let match;
const stack = [];
let line = 1;
let lastIdx = 0;

while ((match = tagRegex.exec(content)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    const isSelfClosing = match[2] === '/' || ['img', 'input', 'hr', 'br'].includes(tagName);
    const isClosing = tagName.startsWith('/');

    // Track lines
    const textBefore = content.substring(lastIdx, match.index);
    line += (textBefore.match(/\n/g) || []).length;
    lastIdx = match.index;

    if (isSelfClosing && !isClosing) {
        // console.log(`[${line}] Self-closing: ${tagName}`);
    } else if (isClosing) {
        const actualTagName = tagName.substring(1);
        if (stack.length === 0) {
            console.log(`[${line}] Unexpected closing tag: </${actualTagName}>`);
        } else {
            const last = stack.pop();
            if (last.name !== actualTagName) {
                console.log(`[${line}] Tag mismatch: Expected </${last.name}> but found </${actualTagName}> (opened at line ${last.line})`);
            }
        }
    } else {
        stack.push({ name: tagName, line: line });
        // console.log(`[${line}] Opening: ${tagName}`);
    }
}

while (stack.length > 0) {
    const last = stack.pop();
    console.log(`[End] Unclosed tag: <${last.name}> opened at line ${last.line}`);
}
