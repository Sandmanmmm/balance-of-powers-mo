import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('🚀 Test script starting...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📁 Current directory:', __dirname);

// Test basic file reading
async function testBasicFunctionality() {
  try {
    console.log('📂 Testing file access...');
    const boundaryDir = path.join(__dirname, '..', 'public', 'data', 'boundaries', 'overview');
    console.log('🔍 Boundary directory:', boundaryDir);
    
    const files = await fs.readdir(boundaryDir);
    console.log(`📋 Found ${files.length} boundary files`);
    console.log('📄 First 5 files:', files.slice(0, 5));
    
    // Test loading one file
    const testFile = path.join(boundaryDir, 'USA.json');
    console.log('🧪 Testing file load:', testFile);
    
    const content = await fs.readFile(testFile, 'utf8');
    const data = JSON.parse(content);
    
    console.log('✅ File loaded successfully');
    console.log('📊 Data type:', data.type);
    console.log('🗺️ Features count:', data.features?.length || 'unknown');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBasicFunctionality();
