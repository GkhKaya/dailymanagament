import fs from 'fs';
import path from 'path';

function walkSync(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkSync(dirPath, callback) : callback(dirPath);
  });
}

// Fix viewmodels
walkSync('./src/viewmodels', (filePath) => {
  if (!filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Remove `error,` if it's still lingering somewhere inside the return statement
  content = content.replace(/\berror,\s*\n/g, '\n');
  content = content.replace(/\b\s*error\b/g, (match, offset, full) => {
    // If it's part of the return { ... error } we should try to remove it.
    // Instead of regex hacking, let's just do a clean replacement of typical patterns
    return match; // fallback
  });

  // A safer regex to remove `error` from return objects:
  content = content.replace(/(\{\s*[\s\S]*?)(\s*error\s*,?)([\s\S]*?\})/g, '$1$3');

  if (content !== original) fs.writeFileSync(filePath, content);
});

// Fix components
walkSync('./src/components', (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Remove `error` from destructuring like: const { ..., error } = useViewModel();
  content = content.replace(/,\s*error\s*}/g, ' }');
  content = content.replace(/{\s*error\s*,/g, '{ ');
  content = content.replace(/,\s*error\s*,/g, ', ');
  content = content.replace(/\n\s*error,?\n/g, '\n');

  if (content !== original) fs.writeFileSync(filePath, content);
});

console.log("Fixes applied");
