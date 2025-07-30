import yaml from 'js-yaml';
import { z } from 'zod';
import { Province, Nation } from '../lib/types';
import type { DetailLevel } from '../types/geo';

// Schema validation using Zod
const NationSchema = z.object({
  id: z.string().min(1, 'Nation ID cannot be empty'),
  name: z.string().min(1, 'Nation name cannot be empty'),
  capital: z.string().optional(),
  flag: z.string().optional(),
  government: z.object({
    type: z.string(),
    leader: z.string(),
    approval: z.number().min(0).max(100),
    stability: z.number().min(0).max(100)
  }).optional(),
  economy: z.object({
    gdp: z.number().min(0),
    debt: z.number(),
    inflation: z.number(),
    tradeBalance: z.number(),
    treasury: z.number()
  }).optional(),
  military: z.object({
    manpower: z.number().min(0),
    equipment: z.number().min(0),
    readiness: z.number().min(0).max(100),
    doctrine: z.string(),
    nuclearCapability: z.boolean()
  }).optional(),
  technology: z.object({
    researchPoints: z.number().min(0),
    currentResearch: z.array(z.string()),
    completedTech: z.array(z.string()),
    level: z.number().min(0)
  }).optional(),
  diplomacy: z.object({
    allies: z.array(z.string()),
    enemies: z.array(z.string()),
    embargoes: z.array(z.string()),
    sanctions: z.array(z.string()),
    tradePartners: z.array(z.string())
  }).optional(),
  resourceStockpiles: z.record(z.number()).optional(),
  resourceProduction: z.record(z.number()).optional(),
  resourceConsumption: z.record(z.number()).optional(),
  resourceShortages: z.record(z.number()).optional(),
  resourceEfficiency: z.record(z.number()).optional(),
  tradeOffers: z.array(z.any()).optional(),
  tradeAgreements: z.array(z.any()).optional()
});

const ProvinceSchema = z.object({
  id: z.string().min(1, 'Province ID cannot be empty'),
  name: z.string().min(1, 'Province name cannot be empty'),
  country: z.string().min(1, 'Country name cannot be empty'),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
  features: z.array(z.string()).optional(),
  population: z.object({
    total: z.number().min(0),
    ethnicGroups: z.array(z.object({
      group: z.string(),
      percent: z.number().min(0).max(100)
    }))
  }).optional(),
  unrest: z.number().min(0).max(100).optional(),
  infrastructure: z.object({
    roads: z.number().min(1).max(5),
    internet: z.number().min(1).max(5),
    healthcare: z.number().min(1).max(5),
    education: z.number().min(1).max(5)
  }).optional(),
  resourceDeposits: z.record(z.number()).optional(),
  military: z.object({
    stationedUnits: z.array(z.object({
      id: z.string(),
      strength: z.number().min(0).max(100)
    })),
    fortificationLevel: z.number().min(1).max(5)
  }).optional(),
  resourceOutput: z.record(z.number()).optional(),
  politics: z.object({
    partySupport: z.record(z.number()),
    governorApproval: z.number().min(0).max(100)
  }).optional(),
  economy: z.object({
    gdpPerCapita: z.number().min(0),
    unemployment: z.number().min(0).max(100),
    inflation: z.number()
  }).optional(),
  buildings: z.array(z.string()).optional(),
  constructionProjects: z.array(z.any()).optional()
});


interface LoadingContext {
  warnings: string[];
  fileMetrics: {
    nations: { total: number; successful: number; failed: number };
    provinces: { total: number; successful: number; failed: number };
    boundaries: { total: number; successful: number; failed: number };
  };
  startTime: number;
}

function addWarning(context: LoadingContext, message: string): void {
  context.warnings.push(message);
  console.warn(`DataLoader Warning: ${message}`);
}

function validateAndConvertNation(id: string, rawData: any, context: LoadingContext): Nation | null {
  try {
    // First validate with schema
    const validationResult = NationSchema.safeParse({ id, ...rawData });
    
    if (!validationResult.success) {
      const errors = validationResult.error.format();
      addWarning(context, `Nation ${id} failed schema validation: ${JSON.stringify(errors)}`);
      // Continue with manual conversion for backward compatibility
    }

    return convertRawNation(id, rawData);
  } catch (error) {
    addWarning(context, `Failed to convert nation ${id}: ${error}`);
    return null;
  }
}

function validateAndConvertProvince(id: string, rawData: any, context: LoadingContext): Province | null {
  try {
    // First validate with schema
    const validationResult = ProvinceSchema.safeParse({ id, ...rawData });
    
    if (!validationResult.success) {
      const errors = validationResult.error.format();
      addWarning(context, `Province ${id} failed schema validation: ${JSON.stringify(errors)}`);
      // Continue with manual conversion for backward compatibility
    }

    return convertRawProvince(id, rawData);
  } catch (error) {
    addWarning(context, `Failed to convert province ${id}: ${error}`);
    return null;
  }
}
function convertRawNation(id: string, rawData: any): Nation {
  try {
    // Ensure rawData is valid
    if (!rawData || typeof rawData !== 'object') {
      console.warn(`convertRawNation: Invalid raw data for nation ${id}:`, typeof rawData);
      rawData = {};
    }

    return {
      id,
      name: rawData.name || id,
      capital: rawData.capital || '',
      flag: rawData.flag || '',
      government: {
        type: rawData.government_type || rawData.government?.type || 'democracy',
        leader: rawData.leader || rawData.government?.leader || 'Unknown',
        approval: Number(rawData.government?.approval) || 50,
        stability: Number(rawData.stability || rawData.government?.stability) || 50
      },
      economy: {
        gdp: Number(rawData.gdp || rawData.economy?.gdp) || 0,
        debt: Number(rawData.debt || rawData.economy?.debt) || 0,
        inflation: Number(rawData.inflation || rawData.economy?.inflation) || 0,
        tradeBalance: Number(rawData.economy?.trade_balance || rawData.economy?.tradeBalance) || 0,
        treasury: Number(rawData.treasury || rawData.economy?.treasury) || 0
      },
      military: {
        manpower: Number(rawData.resources?.manpower || rawData.military?.manpower) || 0,
        equipment: Number(rawData.military?.equipment) || 0,
        readiness: Number(rawData.military?.readiness) || 100,
        doctrine: rawData.military_doctrine || rawData.military?.doctrine || 'Standard',
        nuclearCapability: Boolean(rawData.military?.nuclear_capability || rawData.military?.nuclearCapability)
      },
      technology: {
        researchPoints: Number(rawData.technology?.researchPoints || rawData.technology?.research_points) || 0,
        currentResearch: Array.isArray(rawData.technology?.currentResearch || rawData.technology?.current_research) 
          ? (rawData.technology?.currentResearch || rawData.technology?.current_research) 
          : [],
        completedTech: Array.isArray(rawData.technology?.completedTech || rawData.technology?.completed_tech) 
          ? (rawData.technology?.completedTech || rawData.technology?.completed_tech) 
          : [],
        level: Number(rawData.technology?.level || rawData.technology?.tech_level) || 1.0
      },
      diplomacy: {
        allies: Array.isArray(rawData.diplomacy?.allies) ? rawData.diplomacy.allies : [],
        enemies: Array.isArray(rawData.diplomacy?.enemies) ? rawData.diplomacy.enemies : [],
        embargoes: Array.isArray(rawData.diplomacy?.embargoes) ? rawData.diplomacy.embargoes : [],
        sanctions: Array.isArray(rawData.diplomacy?.sanctions) ? rawData.diplomacy.sanctions : [],
        tradePartners: Array.isArray(rawData.diplomacy?.tradePartners || rawData.diplomacy?.trade_partners) 
          ? (rawData.diplomacy?.tradePartners || rawData.diplomacy?.trade_partners) 
          : []
      },
      resourceStockpiles: rawData.resourceStockpiles || rawData.resource_stockpiles || rawData.resources || {},
      resourceProduction: rawData.resourceProduction || rawData.resource_production || {},
      resourceConsumption: rawData.resourceConsumption || rawData.resource_consumption || {},
      resourceShortages: rawData.resourceShortages || rawData.resource_shortages || {},
      resourceEfficiency: rawData.resourceEfficiency || rawData.resource_efficiency || { overall: 1.0 },
      tradeOffers: rawData.tradeOffers || rawData.trade_offers || [],
      tradeAgreements: rawData.tradeAgreements || rawData.trade_agreements || []
    };
  } catch (error) {
    console.error(`convertRawNation: Error converting nation ${id}:`, error);
    throw error;
  }
}

function convertRawProvince(id: string, rawData: any): Province {
  try {
    // Ensure rawData is valid
    if (!rawData || typeof rawData !== 'object') {
      console.warn(`convertRawProvince: Invalid raw data for province ${id}:`, typeof rawData);
      rawData = {};
    }

    return {
      id,
      name: rawData.name || id,
      country: rawData.country || 'Unknown',
      coordinates: Array.isArray(rawData.coordinates) && rawData.coordinates.length >= 2 
        ? [Number(rawData.coordinates[0]) || 0, Number(rawData.coordinates[1]) || 0] as [number, number]
        : [0, 0] as [number, number],
      features: Array.isArray(rawData.features) ? rawData.features : [],
      population: {
        total: Number(rawData.population?.total) || 0,
        ethnicGroups: Array.isArray(rawData.population?.ethnic_groups) 
          ? rawData.population.ethnic_groups.map((group: any) => ({
              group: group?.group || 'Unknown',
              percent: Number(group?.percent) || 0
            }))
          : []
      },
      unrest: Number(rawData.unrest) || 0,
      infrastructure: {
        roads: Number(rawData.infrastructure?.roads) || 1,
        internet: Number(rawData.infrastructure?.internet) || 1,
        healthcare: Number(rawData.infrastructure?.healthcare) || 1,
        education: Number(rawData.infrastructure?.education) || 1
      },
      resourceDeposits: rawData.resource_deposits || rawData.resourceDeposits || {},
      military: {
        stationedUnits: Array.isArray(rawData.military?.stationed_units) 
          ? rawData.military.stationed_units.map((unitData: any) => {
              if (typeof unitData === 'string') {
                return { id: unitData, strength: Math.floor(Math.random() * 100) + 50 };
              } else if (unitData && typeof unitData === 'object') {
                return { 
                  id: unitData.id || 'unknown', 
                  strength: Number(unitData.strength) || 50 
                };
              } else {
                return { id: 'unknown', strength: 50 };
              }
            })
          : [],
        fortificationLevel: Number(rawData.military?.fortification_level || rawData.military?.fortificationLevel) || 1
      },
      resourceOutput: rawData.resource_output || rawData.resourceOutput || {},
      politics: {
        partySupport: rawData.politics?.party_support || rawData.politics?.partySupport || {},
        governorApproval: Number(rawData.politics?.governor_approval || rawData.politics?.governorApproval) || 50
      },
      economy: {
        gdpPerCapita: Number(rawData.economy?.gdp_per_capita || rawData.economy?.gdpPerCapita) || 0,
        unemployment: Number(rawData.economy?.unemployment) || 0,
        inflation: Number(rawData.economy?.inflation) || 0
      },
      buildings: Array.isArray(rawData.buildings) ? rawData.buildings : [],
      constructionProjects: Array.isArray(rawData.construction_projects || rawData.constructionProjects) 
        ? (rawData.construction_projects || rawData.constructionProjects) 
        : []
    };
  } catch (error) {
    console.error(`convertRawProvince: Error converting province ${id}:`, error);
    throw error;
  }
}

export interface WorldData {
  nations: Nation[];
  provinces: Province[];
  boundaries: Record<string, any>;
  warnings: string[];
  loadingSummary: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    totalNations: number;
    totalProvinces: number;
    totalBoundaries: number;
    loadTime: number;
  };
}

// Use import.meta.glob to dynamically load all region files from both root and regions subdirectories
const nationModules = import.meta.glob([
  '../data/nations_*.yaml',
  '../data/regions/**/nations_*.yaml',
  '../data/regions/*/nations_*.yaml'
], { as: 'raw' });

const provinceModules = import.meta.glob([
  '../data/provinces_*.yaml', 
  '../data/regions/**/provinces_*.yaml',
  '../data/regions/*/provinces_*.yaml'
], { as: 'raw' });

// Legacy boundary modules for backward compatibility
const boundariesModules = import.meta.glob([
  '../data/province-boundaries_*.json',
  '../data/regions/**/province-boundaries_*.json',
  '../data/regions/*/province-boundaries_*.json'
]);

// New country-based boundary modules organized by detail level
const countryBoundariesModules = import.meta.glob([
  '../data/boundaries/*/*.json'
]);

export async function loadWorldData(): Promise<WorldData> {
  const startTime = performance.now();
  
  console.log('DataLoader: Starting bulletproof world data loading...');
  console.log('DataLoader: Available files debug:');
  debugAvailableFiles();
  
  const context: LoadingContext = {
    warnings: [],
    fileMetrics: {
      nations: { total: 0, successful: 0, failed: 0 },
      provinces: { total: 0, successful: 0, failed: 0 },
      boundaries: { total: 0, successful: 0, failed: 0 }
    },
    startTime
  };
  
  const nations: Nation[] = [];
  const provinces: Province[] = [];
  const boundaries: Record<string, any> = {};

  try {
    // LOAD NATION FILES WITH ENHANCED ERROR HANDLING
    console.log('DataLoader: Loading nation files...');
    context.fileMetrics.nations.total = Object.keys(nationModules).length;
    console.log(`DataLoader: Found ${context.fileMetrics.nations.total} nation files to process`);
    
    if (context.fileMetrics.nations.total === 0) {
      addWarning(context, 'No nation files found! Check file naming and paths.');
    }
    
    for (const path in nationModules) {
      try {
        console.log(`DataLoader: Processing nation file: ${path}`);
        const rawContent = await nationModules[path]();
        
        if (!rawContent || typeof rawContent !== 'string' || rawContent.trim().length === 0) {
          addWarning(context, `Empty or invalid content in nation file: ${path}`);
          context.fileMetrics.nations.failed++;
          continue;
        }
        
        let parsedData: any;
        try {
          parsedData = yaml.load(rawContent);
        } catch (yamlError) {
          addWarning(context, `YAML parsing failed for ${path}: ${yamlError}`);
          context.fileMetrics.nations.failed++;
          continue;
        }
        
        if (!parsedData || typeof parsedData !== 'object') {
          addWarning(context, `Parsed data is not an object in ${path}`);
          context.fileMetrics.nations.failed++;
          continue;
        }
        
        let nationsToAdd: Nation[] = [];
        let validNationsCount = 0;
        let invalidNationsCount = 0;
        
        // Handle different YAML structures with enhanced validation
        if (parsedData.nations && typeof parsedData.nations === 'object') {
          // Standard structure: { nations: { CAN: {...}, USA: {...} } }
          for (const [id, data] of Object.entries(parsedData.nations)) {
            const nation = validateAndConvertNation(id, data, context);
            if (nation) {
              nationsToAdd.push(nation);
              validNationsCount++;
            } else {
              invalidNationsCount++;
            }
          }
        } else if (Array.isArray(parsedData)) {
          // Array structure: [{ id: "CAN", ... }, ...]
          parsedData.forEach((nationData: any, index: number) => {
            const id = nationData.id || nationData.name?.toLowerCase().replace(/\s+/g, '_') || `nation_${index}`;
            const nation = validateAndConvertNation(id, nationData, context);
            if (nation) {
              nationsToAdd.push(nation);
              validNationsCount++;
            } else {
              invalidNationsCount++;
            }
          });
        } else if (parsedData.id || parsedData.name) {
          // Single nation object
          const id = parsedData.id || parsedData.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown';
          const nation = validateAndConvertNation(id, parsedData, context);
          if (nation) {
            nationsToAdd.push(nation);
            validNationsCount++;
          } else {
            invalidNationsCount++;
          }
        } else {
          addWarning(context, `Unsupported nation file structure in ${path}`);
          context.fileMetrics.nations.failed++;
          continue;
        }
        
        if (nationsToAdd.length > 0) {
          // Check for duplicate IDs
          const existingIds = new Set(nations.map(n => n.id));
          const duplicates = nationsToAdd.filter(n => existingIds.has(n.id));
          if (duplicates.length > 0) {
            addWarning(context, `Duplicate nation IDs found in ${path}: ${duplicates.map(n => n.id).join(', ')}`);
          }
          
          // Add only non-duplicates
          const uniqueNations = nationsToAdd.filter(n => !existingIds.has(n.id));
          nations.push(...uniqueNations);
          context.fileMetrics.nations.successful++;
          
          console.log(`DataLoader: ✓ Successfully loaded ${uniqueNations.length} nations from ${path}: ${uniqueNations.map(n => n.id).join(', ')}`);
          if (invalidNationsCount > 0) {
            console.log(`DataLoader: ⚠️ ${invalidNationsCount} invalid nations skipped in ${path}`);
          }
        } else {
          addWarning(context, `No valid nations found in ${path}`);
          context.fileMetrics.nations.failed++;
        }
        
      } catch (error) {
        addWarning(context, `Critical error processing nation file ${path}: ${error}`);
        context.fileMetrics.nations.failed++;
      }
    }

    // LOAD PROVINCE FILES WITH ENHANCED ERROR HANDLING
    console.log('DataLoader: Loading province files...');
    context.fileMetrics.provinces.total = Object.keys(provinceModules).length;
    console.log(`DataLoader: Found ${context.fileMetrics.provinces.total} province files to process`);
    
    if (context.fileMetrics.provinces.total === 0) {
      addWarning(context, 'No province files found! Check file naming and paths.');
    }
    
    for (const path in provinceModules) {
      try {
        console.log(`DataLoader: Processing province file: ${path}`);
        const rawContent = await provinceModules[path]();
        
        if (!rawContent || typeof rawContent !== 'string' || rawContent.trim().length === 0) {
          addWarning(context, `Empty or invalid content in province file: ${path}`);
          context.fileMetrics.provinces.failed++;
          continue;
        }
        
        let parsedData: any;
        try {
          parsedData = yaml.load(rawContent);
        } catch (yamlError) {
          addWarning(context, `YAML parsing failed for ${path}: ${yamlError}`);
          context.fileMetrics.provinces.failed++;
          continue;
        }
        
        if (!parsedData || typeof parsedData !== 'object') {
          addWarning(context, `Parsed data is not an object in ${path}`);
          context.fileMetrics.provinces.failed++;
          continue;
        }
        
        let provincesToAdd: Province[] = [];
        let validProvincesCount = 0;
        let invalidProvincesCount = 0;
        
        // Handle different YAML structures with enhanced validation
        if (parsedData.provinces && typeof parsedData.provinces === 'object') {
          // Standard structure: { provinces: { CAN_001: {...}, CAN_002: {...} } }
          for (const [id, data] of Object.entries(parsedData.provinces)) {
            const province = validateAndConvertProvince(id, data, context);
            if (province) {
              provincesToAdd.push(province);
              validProvincesCount++;
            } else {
              invalidProvincesCount++;
            }
          }
        } else if (Array.isArray(parsedData)) {
          // Array structure: [{ id: "CAN_001", ... }, ...]
          parsedData.forEach((provinceData: any, index: number) => {
            const id = provinceData.id || provinceData.name?.toLowerCase().replace(/\s+/g, '_') || `province_${index}`;
            const province = validateAndConvertProvince(id, provinceData, context);
            if (province) {
              provincesToAdd.push(province);
              validProvincesCount++;
            } else {
              invalidProvincesCount++;
            }
          });
        } else if (parsedData.id || parsedData.name) {
          // Single province object
          const id = parsedData.id || parsedData.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown';
          const province = validateAndConvertProvince(id, parsedData, context);
          if (province) {
            provincesToAdd.push(province);
            validProvincesCount++;
          } else {
            invalidProvincesCount++;
          }
        } else {
          addWarning(context, `Unsupported province file structure in ${path}`);
          context.fileMetrics.provinces.failed++;
          continue;
        }
        
        if (provincesToAdd.length > 0) {
          // Check for duplicate IDs
          const existingIds = new Set(provinces.map(p => p.id));
          const duplicates = provincesToAdd.filter(p => existingIds.has(p.id));
          if (duplicates.length > 0) {
            addWarning(context, `Duplicate province IDs found in ${path}: ${duplicates.map(p => p.id).join(', ')}`);
          }
          
          // Add only non-duplicates
          const uniqueProvinces = provincesToAdd.filter(p => !existingIds.has(p.id));
          provinces.push(...uniqueProvinces);
          context.fileMetrics.provinces.successful++;
          
          console.log(`DataLoader: ✓ Successfully loaded ${uniqueProvinces.length} provinces from ${path}: ${uniqueProvinces.slice(0, 3).map(p => p.id).join(', ')}${uniqueProvinces.length > 3 ? '...' : ''}`);
          if (invalidProvincesCount > 0) {
            console.log(`DataLoader: ⚠️ ${invalidProvincesCount} invalid provinces skipped in ${path}`);
          }
        } else {
          addWarning(context, `No valid provinces found in ${path}`);
          context.fileMetrics.provinces.failed++;
        }
        
      } catch (error) {
        addWarning(context, `Critical error processing province file ${path}: ${error}`);
        context.fileMetrics.provinces.failed++;
      }
    }

    // LOAD BOUNDARY FILES WITH ENHANCED ERROR HANDLING
    console.log('DataLoader: Loading boundary files...');
    
    // Get all nations that were loaded
    const loadedNationCodes = nations.map(n => n.id);
    
    // Try to load country boundaries using the new structure first
    console.log('DataLoader: Loading country boundaries using new structure...');
    const detailLevel: DetailLevel = 'overview'; // Start with overview detail
    
    for (const nationCode of loadedNationCodes) {
      try {
        console.log(`DataLoader: Loading boundaries for nation ${nationCode}...`);
        const { geographicDataManager } = await import('../managers/GeographicDataManager');
        const nationBoundaries = await geographicDataManager.loadNationBoundaries(nationCode, detailLevel);
        
        // Merge nation boundaries into the main boundaries object
        Object.assign(boundaries, nationBoundaries);
        console.log(`DataLoader: ✓ Loaded ${Object.keys(nationBoundaries).length} boundaries for ${nationCode}`);
        
      } catch (error) {
        console.warn(`DataLoader: Failed to load boundaries for ${nationCode}: ${error}`);
        // Continue with next nation - we'll try legacy loading below
      }
    }
    
    // Fallback to legacy boundary loading for any missing data
    console.log('DataLoader: Loading legacy boundary files...');
    context.fileMetrics.boundaries.total = Object.keys(boundariesModules).length;
    console.log(`DataLoader: Found ${context.fileMetrics.boundaries.total} legacy boundary files to process`);
    
    if (context.fileMetrics.boundaries.total === 0 && Object.keys(boundaries).length === 0) {
      addWarning(context, 'No boundary files found! Provinces will be rendered as simple shapes.');
    }
    
    for (const path in boundariesModules) {
      try {
        console.log(`DataLoader: Processing legacy boundary file: ${path}`);
        const moduleResult = await boundariesModules[path]() as any;
        
        // Handle different boundary file structures
        let boundaryData = moduleResult.default || moduleResult;
        
        if (!boundaryData) {
          addWarning(context, `No boundary data found in ${path}`);
          context.fileMetrics.boundaries.failed++;
          continue;
        }
        
        let featuresAdded = 0;
        
        if (boundaryData && boundaryData.type === 'FeatureCollection' && Array.isArray(boundaryData.features)) {
          // GeoJSON FeatureCollection format
          boundaryData.features.forEach((feature: any) => {
            if (feature && feature.properties && feature.properties.id) {
              // Validate feature has required geometry
              if (!feature.geometry || !feature.geometry.type || !feature.geometry.coordinates) {
                addWarning(context, `Invalid geometry for boundary feature ${feature.properties.id} in ${path}`);
                return;
              }
              
              // Only add if not already loaded by new system
              if (!boundaries[feature.properties.id]) {
                boundaries[feature.properties.id] = feature;
                featuresAdded++;
              }
            } else {
              addWarning(context, `Boundary feature missing ID in ${path}`);
            }
          });
          
          if (featuresAdded > 0) {
            context.fileMetrics.boundaries.successful++;
            console.log(`DataLoader: ✓ Successfully loaded ${featuresAdded} legacy boundary features from ${path}`);
          } else {
            console.log(`DataLoader: All features from ${path} already loaded by new system`);
            context.fileMetrics.boundaries.successful++;
          }
        } else if (boundaryData && typeof boundaryData === 'object') {
          // Direct object format
          const keysAdded = Object.keys(boundaryData).length;
          if (keysAdded > 0) {
            // Validate each boundary object
            for (const [key, value] of Object.entries(boundaryData)) {
              if (value && typeof value === 'object') {
                // Only add if not already loaded by new system
                if (!boundaries[key]) {
                  boundaries[key] = value;
                  featuresAdded++;
                }
              } else {
                addWarning(context, `Invalid boundary object for key ${key} in ${path}`);
              }
            }
            
            if (featuresAdded > 0) {
              context.fileMetrics.boundaries.successful++;
              console.log(`DataLoader: ✓ Successfully loaded ${featuresAdded} legacy boundary objects from ${path}`);
            } else {
              console.log(`DataLoader: All objects from ${path} already loaded by new system`);
              context.fileMetrics.boundaries.successful++;
            }
          } else {
            addWarning(context, `Empty boundary object in ${path}`);
            context.fileMetrics.boundaries.failed++;
          }
        } else {
          addWarning(context, `Unsupported boundary format in ${path}, type: ${typeof boundaryData}`);
          context.fileMetrics.boundaries.failed++;
        }
        
      } catch (error) {
        addWarning(context, `Critical error processing boundary file ${path}: ${error}`);
        context.fileMetrics.boundaries.failed++;
      }
    }

    // FINAL VALIDATION AND CROSS-REFERENCE CHECKS
    console.log('DataLoader: Performing cross-reference validation...');
    
    // Check for provinces without countries
    const nationNames = new Set(nations.map(n => n.name));
    const orphanedProvinces = provinces.filter(p => !nationNames.has(p.country));
    if (orphanedProvinces.length > 0) {
      addWarning(context, `${orphanedProvinces.length} provinces reference non-existent countries: ${orphanedProvinces.slice(0, 3).map(p => `${p.id}(${p.country})`).join(', ')}${orphanedProvinces.length > 3 ? '...' : ''}`);
    }
    
    // Check for provinces without boundaries
    const provinceIds = new Set(provinces.map(p => p.id));
    const boundaryIds = new Set(Object.keys(boundaries));
    const provincesWithoutBoundaries = provinces.filter(p => !boundaryIds.has(p.id));
    if (provincesWithoutBoundaries.length > 0) {
      addWarning(context, `${provincesWithoutBoundaries.length} provinces missing boundary data: ${provincesWithoutBoundaries.slice(0, 3).map(p => p.id).join(', ')}${provincesWithoutBoundaries.length > 3 ? '...' : ''}`);
    }

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    // COMPREHENSIVE FINAL SUMMARY
    const totalFiles = context.fileMetrics.nations.total + context.fileMetrics.provinces.total + context.fileMetrics.boundaries.total;
    const successfulFiles = context.fileMetrics.nations.successful + context.fileMetrics.provinces.successful + context.fileMetrics.boundaries.successful;
    const failedFiles = context.fileMetrics.nations.failed + context.fileMetrics.provinces.failed + context.fileMetrics.boundaries.failed;

    console.log(`\n=== Enhanced DataLoader Summary ===`);
    console.log(`⏱️ Load Time: ${loadTime.toFixed(2)}ms`);
    console.log(`📁 Files: ${successfulFiles}/${totalFiles} successful (${failedFiles} failed)`);
    console.log(`🏛️ Nations: ${context.fileMetrics.nations.successful}/${context.fileMetrics.nations.total} files → ${nations.length} nations loaded`);
    console.log(`🗺️ Provinces: ${context.fileMetrics.provinces.successful}/${context.fileMetrics.provinces.total} files → ${provinces.length} provinces loaded`);
    console.log(`🌍 Boundaries: ${context.fileMetrics.boundaries.successful}/${context.fileMetrics.boundaries.total} files → ${Object.keys(boundaries).length} boundaries loaded`);
    console.log(`⚠️ Warnings: ${context.warnings.length}`);
    
    if (context.warnings.length > 0) {
      console.log(`\n=== Warnings Summary ===`);
      context.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    // Final validation
    if (nations.length === 0) {
      console.error('DataLoader: ❌ CRITICAL: No nations loaded!');
      addWarning(context, 'No nations were successfully loaded. Check your nation files.');
    } else {
      console.log(`DataLoader: ✅ Loaded nations: ${nations.map(n => n.id).join(', ')}`);
    }
    
    if (provinces.length === 0) {
      console.error('DataLoader: ❌ CRITICAL: No provinces loaded!');
      addWarning(context, 'No provinces were successfully loaded. Check your province files.');
    } else {
      console.log(`DataLoader: ✅ Sample provinces: ${provinces.slice(0, 5).map(p => p.id).join(', ')}${provinces.length > 5 ? ` (+${provinces.length - 5} more)` : ''}`);
    }
    
    if (Object.keys(boundaries).length === 0) {
      console.warn('DataLoader: ⚠️ No boundaries loaded - provinces will render as simple shapes');
    }

    return {
      nations,
      provinces,
      boundaries,
      warnings: context.warnings,
      loadingSummary: {
        totalFiles,
        successfulFiles,
        failedFiles,
        totalNations: nations.length,
        totalProvinces: provinces.length,
        totalBoundaries: Object.keys(boundaries).length,
        loadTime
      }
    };
    
  } catch (error) {
    console.error('DataLoader: ❌ CATASTROPHIC ERROR during world data loading:', error);
    addWarning(context, `Catastrophic loading error: ${error}`);
    
    // Return partial data even on critical error
    const endTime = performance.now();
    return {
      nations,
      provinces,
      boundaries,
      warnings: context.warnings,
      loadingSummary: {
        totalFiles: context.fileMetrics.nations.total + context.fileMetrics.provinces.total + context.fileMetrics.boundaries.total,
        successfulFiles: 0,
        failedFiles: context.fileMetrics.nations.total + context.fileMetrics.provinces.total + context.fileMetrics.boundaries.total,
        totalNations: nations.length,
        totalProvinces: provinces.length,
        totalBoundaries: Object.keys(boundaries).length,
        loadTime: endTime - startTime
      }
    };
  }
}

// Helper function to get available region files
export function getAvailableRegions(): string[] {
  const nationPaths = Object.keys(nationModules);
  const provincePaths = Object.keys(provinceModules);
  const boundaryPaths = Object.keys(boundariesModules);
  
  // Extract region names from file paths
  const regions = new Set<string>();
  
  [...nationPaths, ...provincePaths, ...boundaryPaths].forEach(path => {
    const match = path.match(/.*?([a-z_]+)\.(?:yaml|json)$/);
    if (match && match[1]) {
      regions.add(match[1]);
    }
  });
  
  return Array.from(regions);
}

// Debug function to show what files are detected
export function debugAvailableFiles(): void {
  console.log('DataLoader Debug - Available files:');
  console.log('Nation files:', Object.keys(nationModules));
  console.log('Province files:', Object.keys(provinceModules));
  console.log('Legacy boundary files:', Object.keys(boundariesModules));
  console.log('Country boundary files:', Object.keys(countryBoundariesModules));
  console.log('Detected regions:', getAvailableRegions());
}