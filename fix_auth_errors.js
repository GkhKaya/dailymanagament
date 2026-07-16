const fs = require('fs');
const path = require('path');

const authDir = path.join(__dirname, 'src/components/auth');
const onboardingDir = path.join(__dirname, 'src/components/onboarding');

const fixFiles = (dir) => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Remove {error && ... } blocks
    content = content.replace(/\{error\s*&&\s*\([\s\S]*?<\/div>\s*\)\}/g, '');
    content = content.replace(/\{error\s*&&\s*<div[\s\S]*?<\/div>\s*\}/g, '');

    // Remove error from viewModel destructuring
    content = content.replace(/,\s*error\b/g, '');
    content = content.replace(/\berror,\s*/g, '');

    fs.writeFileSync(filePath, content, 'utf-8');
  });
};

fixFiles(authDir);
fixFiles(onboardingDir);

// Fix AddWeightForm.tsx which had viewModel.error
let awfPath = path.join(__dirname, 'src/components/forms/AddWeightForm.tsx');
let awf = fs.readFileSync(awfPath, 'utf-8');
awf = awf.replace(/\{viewModel\.error\s*&&\s*\([\s\S]*?<\/div>\s*\)\}/g, '');
fs.writeFileSync(awfPath, awf, 'utf-8');

console.log("Fixed missing components.");
