/**
 * Simple validation test for the bulletproof data loader
 */

import { loadWorldData } from '../data/dataLoader';

export async function validateBulletproofLoader(): Promise<void> {
  try {
    console.log('🔍 Validating bulletproof data loader...');
    
    const startTime = performance.now();
    const worldData = await loadWorldData();
    const loadTime = performance.now() - startTime;
    
    // Basic validation
    const hasNations = worldData.nations && worldData.nations.length > 0;
    const hasProvinces = worldData.provinces && worldData.provinces.length > 0;
    const hasWarnings = Array.isArray(worldData.warnings);
    const hasSummary = worldData.loadingSummary && typeof worldData.loadingSummary === 'object';
    
    console.log('✅ Bulletproof loader validation results:');
    console.log(`  📊 Load time: ${loadTime.toFixed(2)}ms`);
    console.log(`  🏛️ Nations loaded: ${hasNations ? worldData.nations.length : 0}`);
    console.log(`  🗺️ Provinces loaded: ${hasProvinces ? worldData.provinces.length : 0}`);
    console.log(`  ⚠️ Warnings tracked: ${hasWarnings ? worldData.warnings.length : 'N/A'}`);
    console.log(`  📈 Summary provided: ${hasSummary ? 'Yes' : 'No'}`);
    
    if (hasWarnings && worldData.warnings.length > 0) {
      console.log(`  📋 Sample warnings: ${worldData.warnings.slice(0, 3).join('; ')}`);
    }
    
    // Validate Canada specifically
    const canada = worldData.nations.find(n => n.id === 'CAN');
    const canadianProvinces = worldData.provinces.filter(p => p.country === 'Canada');
    
    console.log(`  🇨🇦 Canada loaded: ${!!canada}`);
    console.log(`  🍁 Canadian provinces: ${canadianProvinces.length}`);
    
    // Validate China specifically
    const china = worldData.nations.find(n => n.id === 'CHN');
    const chineseProvinces = worldData.provinces.filter(p => p.country === 'China');
    
    console.log(`  🇨🇳 China loaded: ${!!china}`);
    console.log(`  🏮 Chinese provinces: ${chineseProvinces.length}`);
    
    if (chineseProvinces.length > 0) {
      const majorProvinces = ['Beijing', 'Shanghai', 'Guangdong', 'Sichuan', 'Xinjiang', 'Tibet'];
      const foundMajor = majorProvinces.filter(name => 
        chineseProvinces.some(p => p.name === name)
      );
      console.log(`  🏙️ Major Chinese provinces found: ${foundMajor.join(', ')}`);
    }
    
    if (hasSummary) {
      const summary = worldData.loadingSummary;
      const successRate = summary.totalFiles > 0 ? (summary.successfulFiles / summary.totalFiles) * 100 : 0;
      console.log(`  📊 File success rate: ${successRate.toFixed(1)}%`);
    }
    
    // Overall assessment
    const isHealthy = hasNations && hasProvinces && hasWarnings && hasSummary;
    console.log(`  🎯 Overall health: ${isHealthy ? '✅ EXCELLENT' : '⚠️ NEEDS ATTENTION'}`);
    
  } catch (error) {
    console.error('❌ Bulletproof loader validation failed:', error);
  }
}