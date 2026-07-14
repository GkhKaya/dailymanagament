import fs from 'fs';
import path from 'path';

function walkSync(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkSync(dirPath, callback) : callback(dirPath);
  });
}

// 1. Refactor ViewModels
walkSync('./src/viewmodels', (filePath) => {
  if (!filePath.endsWith('.ts')) return;
  if (filePath.includes('useRegisterViewModel')) return; // Already did manually

  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('setError')) {
    console.log(`Refactoring ${filePath}`);
    
    // Add import if missing
    if (!content.includes("@/lib/alerts")) {
      content = "import { Alert } from '@/lib/alerts';\n" + content;
    }
    
    // Remove state declaration
    content = content.replace(/const \[error, setError\] = useState<string \| null>\(null\);\n?/g, '');
    
    // Replace setError(null)
    content = content.replace(/setError\(null\);\n?/g, '');
    
    // Replace setError(res.error || ...)
    content = content.replace(/setError\((.+?)\);/g, "Alert.error($1);");
    
    // Remove error from return block
    content = content.replace(/^\s*error,\n?/gm, '');
    
    fs.writeFileSync(filePath, content);
  }
});

// 2. Refactor Components
walkSync('./src/components', (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  if (filePath.includes('RegisterForm.tsx')) return; // Already did manually

  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('{error && (')) {
    console.log(`Refactoring Component ${filePath}`);
    
    // Remove error from ViewModel destructuring
    content = content.replace(/^\s*error,\n?/gm, '');
    content = content.replace(/,\s*error\s*}/g, ' }'); // inline destructuring
    content = content.replace(/\{\s*error\s*,\s*/g, '{ '); // inline destructuring
    
    // Remove the error JSX block
    // It's usually like:
    // {error && (
    //   <div className="p-3 ...">
    //     {error}
    //   </div>
    // )}
    const regex = /\{error && \([\s\S]*?<\/div>\n\s*\)\}\n?/g;
    content = content.replace(regex, '');
    
    // Some are like: {error && <div ...>{error}</div>}
    const regex2 = /\{error && <div[\s\S]*?<\/div>\}\n?/g;
    content = content.replace(regex2, '');
    
    fs.writeFileSync(filePath, content);
  }
});

console.log("Refactoring complete");
