const fs = require('fs');
const path = require('path');

const viewmodelsDir = path.join(__dirname, 'src/viewmodels');
const formsDir = path.join(__dirname, 'src/components/forms');

// 1. Refactor ViewModels
const vmFiles = fs.readdirSync(viewmodelsDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

vmFiles.forEach(file => {
  const filePath = path.join(viewmodelsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  if (content.includes('setError(')) {
    // Add toast import if missing
    if (!content.includes('react-hot-toast')) {
      content = "import toast from 'react-hot-toast';\n" + content;
    }

    // Replace setError(...) with toast.error(...)
    content = content.replace(/setError\(([^)]+)\)/g, 'toast.error($1)');
    
    // Remove setError(null)
    content = content.replace(/toast\.error\(null\);?/g, '');

    // Remove const [error, setError] = useState...
    content = content.replace(/const\s+\[error,\s*setError\]\s*=\s*useState<[^>]+>\([^)]*\);?/g, '');
    content = content.replace(/const\s+\[error,\s*setError\]\s*=\s*useState\([^)]*\);?/g, '');

    // Remove error from return block
    content = content.replace(/,\s*error\b/g, '');
    content = content.replace(/\berror,\s*/g, '');

    fs.writeFileSync(filePath, content, 'utf-8');
  }
});

// 2. Refactor Views (Forms)
const formFiles = fs.readdirSync(formsDir).filter(f => f.endsWith('.tsx'));

formFiles.forEach(file => {
  const filePath = path.join(formsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Remove {error && ... } blocks
  // A naive regex to remove standard error blocks
  content = content.replace(/\{error\s*&&\s*\([\s\S]*?<\/div>\s*\)\}/g, '');
  content = content.replace(/\{error\s*&&\s*<div[\s\S]*?<\/div>\s*\}/g, '');

  // Remove error from viewModel destructuring
  content = content.replace(/,\s*error\b/g, '');
  content = content.replace(/\berror,\s*/g, '');

  // Typography rules.md compliance
  content = content.replace(/text-xs/g, 'text-[var(--font-caption)]');
  content = content.replace(/text-sm/g, 'text-[var(--font-body)]');
  content = content.replace(/text-lg/g, 'text-[var(--font-headline)]');
  content = content.replace(/text-xl/g, 'text-[var(--font-headline)]');
  
  // Colors (some are using arbitrary colors, but let's just stick to typography for now)

  fs.writeFileSync(filePath, content, 'utf-8');
});

console.log("Refactoring complete.");
