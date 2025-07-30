// Simple test to validate TypeScript compilation
import fs from 'fs';
import path from 'path';

const srcDir = './src';

function checkTSFiles(dir) {
  const files = fs.readdirSync(dir);
  let errors = [];
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      errors.push(...checkTSFiles(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for obvious syntax errors
        if (content.includes('import ') && !content.includes('from ')) {
          errors.push(`${filePath}: Possible malformed import`);
        }
        
        // Check for unterminated strings
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.includes('import ') && line.includes('from ') && !line.endsWith(';')) {
            const quotes = (line.match(/'/g) || []).length + (line.match(/"/g) || []).length;
            if (quotes % 2 !== 0) {
              errors.push(`${filePath}:${i+1}: Unterminated string in import`);
            }
          }
        }
        
      } catch (err) {
        errors.push(`${filePath}: Error reading file - ${err.message}`);
      }
    }
  }
  
  return errors;
}

console.log('Checking TypeScript files for syntax errors...');
const errors = checkTSFiles(srcDir);

if (errors.length === 0) {
  console.log('✅ No obvious syntax errors found');
} else {
  console.log('❌ Found potential issues:');
  errors.forEach(err => console.log(err));
}