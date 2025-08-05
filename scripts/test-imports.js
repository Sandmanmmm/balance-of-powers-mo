import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('🚀 Testing module imports...');

// Test geobuf import
try {
  console.log('📦 Testing geobuf import...');
  const geobuf = await import('geobuf');
  console.log('✅ geobuf imported successfully');
} catch (error) {
  console.error('❌ geobuf import failed:', error);
}

// Test pbf import
try {
  console.log('📦 Testing pbf import...');
  const Pbf = await import('pbf');
  console.log('✅ pbf imported successfully');
} catch (error) {
  console.error('❌ pbf import failed:', error);
}

// Test turf import
try {
  console.log('📦 Testing turf import...');
  const turf = await import('@turf/turf');
  console.log('✅ turf imported successfully');
  console.log('🔧 Available turf functions:', Object.keys(turf).slice(0, 10));
} catch (error) {
  console.error('❌ turf import failed:', error);
}

console.log('🎯 Module import test complete');
