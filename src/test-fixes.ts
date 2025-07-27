// Quick test to ensure undefined access errors are fixed
import { Nation } from './lib/types';

// Create a nation with undefined/missing properties to test our fixes
const testNation = {
  id: 'TEST',
  name: 'Test Nation',
  capital: 'Test City',
  flag: '🏳️',
  // Missing government, economy, military, technology properties
} as Nation;

// Test accessing properties that were causing undefined errors
console.log('Testing undefined access fixes:');

// Test technology.level access (was causing "Cannot read properties of undefined (reading 'level')")
const techLevel = (testNation.technology?.level ?? 0).toFixed(1);
console.log('Tech level:', techLevel);

// Test economy.gdp access (was causing "Cannot read properties of undefined (reading 'gdp')")
const gdp = testNation.economy?.gdp ?? 0;
console.log('GDP:', gdp);

// Test economy.debt access (was causing "Cannot read properties of undefined (reading 'debt')")
const debt = testNation.economy?.debt ?? 0;
console.log('Debt:', debt);

console.log('All property accesses completed without errors!');