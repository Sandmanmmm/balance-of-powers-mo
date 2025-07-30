/**
 * Test script to validate the new country-based boundary loading system
 */

import { geographicDataManager } from './managers/GeographicDataManager';
import type { DetailLevel } from './types/geo';

export async function testCountryBoundarySystem() {
  console.log('🧪 Testing Country-Based Boundary Loading System');
  console.log('=' .repeat(60));

  const testCases = [
    { country: 'USA', level: 'overview' as DetailLevel },
    { country: 'USA', level: 'detailed' as DetailLevel },
    { country: 'USA', level: 'ultra' as DetailLevel },
    { country: 'CAN', level: 'overview' as DetailLevel },
    { country: 'CAN', level: 'detailed' as DetailLevel },
    { country: 'CHN', level: 'overview' as DetailLevel },
    { country: 'IND', level: 'overview' as DetailLevel },
    { country: 'MEX', level: 'overview' as DetailLevel },
    { country: 'RUS', level: 'overview' as DetailLevel },
    { country: 'DEU', level: 'overview' as DetailLevel },
    { country: 'FRA', level: 'overview' as DetailLevel },
    // Test non-existent country
    { country: 'XXX', level: 'overview' as DetailLevel }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const test of testCases) {
    try {
      const startTime = Date.now();
      const result = await geographicDataManager.loadNationBoundaries(test.country, test.level);
      const loadTime = Date.now() - startTime;
      const boundaryCount = Object.keys(result).length;
      
      if (boundaryCount > 0) {
        console.log(`✅ ${test.country} (${test.level}): ${boundaryCount} boundaries loaded in ${loadTime}ms`);
        successCount++;
      } else {
        console.log(`⚠️  ${test.country} (${test.level}): No boundaries found (${loadTime}ms)`);
        if (test.country !== 'XXX') errorCount++;
      }
      
    } catch (error) {
      console.error(`❌ ${test.country} (${test.level}): ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (test.country !== 'XXX') errorCount++;
    }
  }

  console.log('\n📊 Test Results:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📈 Success Rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);

  // Test cache statistics
  const stats = geographicDataManager.getStats();
  console.log('\n💾 Cache Statistics:');
  console.log(`Cache Entries: ${stats.cacheEntries}`);
  console.log(`Cache Hit Ratio: ${(stats.hitRatio * 100).toFixed(1)}%`);
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Cache Hits: ${stats.cacheHits}`);
  console.log(`Cache Misses: ${stats.cacheMisses}`);
  console.log(`Current Cache Size: ${Math.round(stats.currentCacheSize / 1024)}KB`);

  // Test upgrade functionality
  console.log('\n🔄 Testing Detail Level Upgrade:');
  try {
    const upgradeResult = await geographicDataManager.upgradeNationDetail('USA', 'ultra');
    console.log(`✅ Successfully upgraded USA to ultra detail: ${Object.keys(upgradeResult).length} boundaries`);
  } catch (error) {
    console.error(`❌ Failed to upgrade USA detail level: ${error}`);
  }

  // Test cache clearing
  console.log('\n🧹 Testing Cache Management:');
  const cacheRegions = geographicDataManager.getCachedRegions();
  console.log(`Cached regions before clear: ${cacheRegions.length}`);
  
  geographicDataManager.clearCache('USA');
  const cacheRegionsAfter = geographicDataManager.getCachedRegions();
  console.log(`Cached regions after clearing USA: ${cacheRegionsAfter.length}`);

  console.log('\n🎯 Country-Based Boundary System Test Complete!');
  return {
    success: successCount,
    errors: errorCount,
    stats
  };
}

// For direct testing
if (typeof window !== 'undefined') {
  (window as any).testCountryBoundarySystem = testCountryBoundarySystem;
}