#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');

console.log('🔍 Validating USA data files...\n');

try {
  // Load provinces
  const provincesData = fs.readFileSync('./src/data/regions/superpowers/provinces_usa.yaml', 'utf8');
  const provinces = yaml.load(provincesData);
  
  console.log('✅ Provinces YAML loaded successfully');
  console.log(`📊 Found ${Object.keys(provinces.provinces).length} provinces`);
  
  // Check for our new states
  const newStates = ['USA_NV', 'USA_CO', 'USA_UT'];
  newStates.forEach(stateId => {
    if (provinces.provinces[stateId]) {
      console.log(`✅ ${stateId} (${provinces.provinces[stateId].name}) found`);
    } else {
      console.log(`❌ ${stateId} missing`);
    }
  });
  
  // Load boundaries
  const boundariesData = fs.readFileSync('./src/data/regions/superpowers/province-boundaries_usa.json', 'utf8');
  const boundaries = JSON.parse(boundariesData);
  
  console.log('\n✅ Boundaries JSON loaded successfully');
  console.log(`📊 Found ${boundaries.features.length} boundary features`);
  
  // Check for our new states in boundaries
  newStates.forEach(stateId => {
    const found = boundaries.features.find(f => f.properties.id === stateId);
    if (found) {
      console.log(`✅ ${stateId} boundary found`);
    } else {
      console.log(`❌ ${stateId} boundary missing`);
    }
  });
  
  console.log('\n🎉 Data validation complete!');
  
} catch (error) {
  console.error('❌ Error validating data:', error.message);
  process.exit(1);
}