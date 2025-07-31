#!/usr/bin/env node

/**
 * Complete Natural Earth Pipeline Runner
 * 
 * Orchestrates the complete download, processing, and validation pipeline
 */

const { SimpleNaturalEarthPipeline } = require('./simple-natural-earth.cjs');
const { NaturalEarthValidator } = require('./validate-natural-earth.cjs');
const fs = require('fs').promises;
const path = require('path');

class NaturalEarthManager {
  constructor() {
    // Use the active public/data/boundaries directory that the game actually reads from
    this.boundariesDir = path.join(__dirname, '../public/data/boundaries');
  }

  /**
   * Run the complete pipeline
   */
  async run() {
    console.log('🚀 Starting Complete Natural Earth Pipeline...');
    console.log('===============================================');
    
    try {
      // Step 1: Check current state
      await this.checkCurrentState();
      
      // Step 2: Download and process data
      console.log('\n🌍 STEP 1: Downloading Natural Earth Data');
      console.log('==========================================');
      const downloader = new SimpleNaturalEarthPipeline();
      await downloader.run();
      
      // Step 3: Validate and enhance
      console.log('\n🔍 STEP 2: Validating and Enhancing Data');
      console.log('========================================');
      const validator = new NaturalEarthValidator();
      await validator.run();
      
      // Step 4: Final summary
      await this.generateFinalSummary();
      
      console.log('\n🎉 COMPLETE PIPELINE FINISHED SUCCESSFULLY!');
      console.log('===========================================');
      
    } catch (error) {
      console.error('❌ Complete pipeline failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  /**
   * Check current state of boundary data
   */
  async checkCurrentState() {
    console.log('📊 Checking current boundary data state...');
    
    const levels = ['overview', 'detailed', 'ultra'];
    const currentState = {};
    
    for (const level of levels) {
      const levelDir = path.join(this.boundariesDir, level);
      
      try {
        const files = await fs.readdir(levelDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        currentState[level] = {
          files: jsonFiles.length,
          countries: jsonFiles.map(f => f.replace('.json', ''))
        };
        console.log(`  ${level}: ${jsonFiles.length} files`);
      } catch {
        currentState[level] = { files: 0, countries: [] };
        console.log(`  ${level}: No data found`);
      }
    }
    
    // Save current state for comparison
    const statePath = path.join(this.boundariesDir, 'pipeline-state.json');
    await fs.writeFile(statePath, JSON.stringify({
      timestamp: new Date().toISOString(),
      before_pipeline: currentState
    }, null, 2));
  }

  /**
   * Generate final summary after complete pipeline
   */
  async generateFinalSummary() {
    console.log('\n📊 Generating final pipeline summary...');
    
    const levels = ['overview', 'detailed', 'ultra'];
    const finalState = {};
    let totalFiles = 0;
    
    for (const level of levels) {
      const levelDir = path.join(this.boundariesDir, level);
      
      try {
        const files = await fs.readdir(levelDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        finalState[level] = {
          files: jsonFiles.length,
          countries: jsonFiles.map(f => f.replace('.json', '')).sort()
        };
        totalFiles += jsonFiles.length;
        console.log(`  ✅ ${level}: ${jsonFiles.length} files`);
      } catch {
        finalState[level] = { files: 0, countries: [] };
        console.log(`  ❌ ${level}: No data`);
      }
    }
    
    // Load previous state for comparison
    let beforeState = {};
    try {
      const statePath = path.join(this.boundariesDir, 'pipeline-state.json');
      const stateData = JSON.parse(await fs.readFile(statePath, 'utf8'));
      beforeState = stateData.before_pipeline || {};
    } catch {
      console.log('  📝 No previous state found');
    }
    
    // Calculate differences
    const differences = {};
    for (const level of levels) {
      const before = beforeState[level]?.files || 0;
      const after = finalState[level]?.files || 0;
      differences[level] = after - before;
    }
    
    // Generate comprehensive summary
    const summary = {
      pipeline_completed: new Date().toISOString(),
      version: '1.0.0',
      status: 'SUCCESS',
      before_state: beforeState,
      after_state: finalState,
      changes: differences,
      totals: {
        total_files: totalFiles,
        unique_countries: new Set(
          Object.values(finalState).flatMap(level => level.countries)
        ).size,
        files_added: Object.values(differences).reduce((sum, diff) => sum + Math.max(0, diff), 0)
      },
      recommendations: [],
      next_steps: [
        'Test the game with new boundary data',
        'Verify all expected countries are present',
        'Check map rendering performance',
        'Add any missing provincial boundaries'
      ]
    };
    
    // Add recommendations based on results
    if (summary.totals.unique_countries < 50) {
      summary.recommendations.push('Consider adding more countries for global coverage');
    }
    if (finalState.ultra.files < finalState.detailed.files) {
      summary.recommendations.push('Ultra detail level has fewer files than detailed - investigate');
    }
    if (summary.totals.files_added === 0) {
      summary.recommendations.push('No new files were added - pipeline may have failed');
    }
    
    // Write final summary
    const summaryPath = path.join(this.boundariesDir, 'pipeline-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`\n📋 Final Summary:`);
    console.log(`   🌍 Total countries: ${summary.totals.unique_countries}`);
    console.log(`   📁 Total files: ${summary.totals.total_files}`);
    console.log(`   ➕ Files added: ${summary.totals.files_added}`);
    console.log(`   💾 Summary saved: ${summaryPath}`);
    
    // Sample countries for verification
    const sampleCountries = Array.from(new Set(
      Object.values(finalState).flatMap(level => level.countries)
    )).slice(0, 10);
    console.log(`   📋 Sample countries: ${sampleCountries.join(', ')}`);
    
    return summary;
  }

  /**
   * Quick status check without running pipeline
   */
  async status() {
    console.log('📊 Natural Earth Data Status');
    console.log('============================');
    
    const levels = ['overview', 'detailed', 'ultra'];
    
    for (const level of levels) {
      const levelDir = path.join(this.boundariesDir, level);
      
      try {
        const files = await fs.readdir(levelDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        console.log(`${level.toUpperCase()}: ${jsonFiles.length} files`);
        
        if (jsonFiles.length > 0) {
          const sampleFile = path.join(levelDir, jsonFiles[0]);
          const stat = await fs.stat(sampleFile);
          console.log(`  Sample file: ${jsonFiles[0]} (${Math.round(stat.size / 1024)}KB)`);
        }
      } catch {
        console.log(`${level.toUpperCase()}: No data directory`);
      }
    }
    
    // Check for summary files
    try {
      const summaryFiles = ['pipeline-summary.json', 'validation-report.json', 'download-summary.json'];
      
      for (const file of summaryFiles) {
        try {
          await fs.access(path.join(this.boundariesDir, file));
          console.log(`✅ ${file} exists`);
        } catch {
          console.log(`❌ ${file} missing`);
        }
      }
    } catch {
      console.log('No summary files found');
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Natural Earth Complete Pipeline

Usage:
  node natural-earth-complete.js [command] [options]

Commands:
  run         Run the complete download and validation pipeline (default)
  status      Show current status of boundary data
  
Options:
  --help, -h  Show this help message

This script runs the complete Natural Earth data pipeline:
1. Downloads GeoJSON boundary data from multiple sources
2. Processes and splits data by country
3. Validates data integrity
4. Enhances with game metadata
5. Generates comprehensive reports
    `);
    process.exit(0);
  }
  
  const manager = new NaturalEarthManager();
  
  if (args.includes('status')) {
    manager.status().catch(error => {
      console.error('Status check failed:', error);
      process.exit(1);
    });
  } else {
    // Default: run complete pipeline
    manager.run().catch(error => {
      console.error('Complete pipeline failed:', error);
      process.exit(1);
    });
  }
}

module.exports = { NaturalEarthManager };