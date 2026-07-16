const fs = require('fs');
const path = require('path');

const formsDir = path.join(__dirname, 'src/components/forms');
const files = fs.readdirSync(formsDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(formsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('"use client";') && !content.startsWith('"use client";') && !content.startsWith("'use client';")) {
    // Remove all instances of "use client";
    content = content.replace(/"use client";\s*/g, '');
    content = content.replace(/'use client';\s*/g, '');
    // Prepend it to the top
    content = '"use client";\n' + content;
    fs.writeFileSync(filePath, content, 'utf-8');
  }
});

console.log("Fixed use client directives.");
