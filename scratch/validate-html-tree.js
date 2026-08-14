const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../frontend/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Simple HTML stack parser to find mismatched closing divs or tags
const tagRegex = /<\/?([a-zA-Z0-9]+)[^>]*>/g;

let stack = [];
let match;
let lineNumber = 1;
let lastIndex = 0;

function getLineNumber(str, index) {
  return str.substring(0, index).split('\n').length;
}

console.log('--- HTML TAG STACK VALIDATION FOR index.html ---');

while ((match = tagRegex.exec(html)) !== null) {
  const fullTag = match[0];
  const tagName = match[1].toLowerCase();
  const index = match.index;
  const line = getLineNumber(html, index);

  // Self-closing tags
  if (['meta', 'link', 'img', 'br', 'hr', 'input', 'source'].includes(tagName) || fullTag.endsWith('/>')) {
    continue;
  }

  if (fullTag.startsWith('</')) {
    // Closing tag
    if (stack.length === 0) {
      console.error(`❌ Unexpected closing tag </${tagName}> at line ${line}`);
    } else {
      const top = stack.pop();
      if (top.name !== tagName) {
        console.error(`❌ Mismatched closing tag </${tagName}> at line ${line}. Expected </${top.name}> (opened at line ${top.line} <${top.name} id="${top.id}">)`);
      }
    }
  } else {
    // Opening tag
    const idMatch = /id=["']([^"']+)["']/.exec(fullTag);
    const classMatch = /class=["']([^"']+)["']/.exec(fullTag);
    const id = idMatch ? idMatch[1] : '';
    const className = classMatch ? classMatch[1] : '';
    stack.push({ name: tagName, line, id, className, fullTag });
  }
}

if (stack.length > 0) {
  console.error(`❌ Unclosed tags remaining (${stack.length}):`);
  stack.forEach(item => {
    console.error(`  - <${item.name} id="${item.id}" class="${item.className}"> opened at line ${item.line}`);
  });
} else {
  console.log('✅ HTML structure is 100% balanced!');
}
