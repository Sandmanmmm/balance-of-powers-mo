import yaml from 'js-yaml';
import { Province, Nation } from '../lib/types';

// Manual imports for debugging
import northAmericaNationsRaw from './regions/north_america/nations_north_america.yaml?raw';
import northAmericaProvincesRaw from './regions/north_america/provinces_north_america.yaml?raw';
import southAmericaNationsRaw from './regions/south_america/nations_south_america.yaml?raw';
import southAmericaProvincesRaw from './regions/south_america/provinces_south_america.yaml?raw';

// Helper functions to convert raw YAML data to TypeScript interfaces
function convertRawNation(id: string, rawData: any): Nation {
  return {
    id,
    name: rawData.name || id,
    capital: rawData.capital || '',
    flag: rawData.flag || '',
    government: {
      type: rawData.government?.type || 'democracy',
      leader: rawData.government?.leader || rawData.leader || 'Unknown',
      approval: rawData.government?.approval || 50,
      stability: rawData.government?.stability || rawData.stability || 50
    },
    economy: {
      gdp: rawData.economy?.gdp || 0,
      debt: rawData.economy?.debt || 0,
      inflation: rawData.economy?.inflation || 0,
      tradeBalance: rawData.economy?.trade_balance || rawData.economy?.tradeBalance || 0,
      treasury: rawData.economy?.treasury || 0
    },
    military: {
      manpower: rawData.military?.manpower || 0,
      equipment: rawData.military?.equipment || 0,
      readiness: rawData.military?.readiness || 100,
      doctrine: rawData.military?.doctrine || 'Standard',
      nuclearCapability: rawData.military?.nuclear_capability || rawData.military?.nuclearCapability || rawData.military?.nuclear || false
    },
    technology: {
      researchPoints: rawData.technology?.researchPoints || rawData.technology?.research_points || 0,
      currentResearch: rawData.technology?.currentResearch || rawData.technology?.current_research || [],
      completedTech: rawData.technology?.completedTech || rawData.technology?.completed_tech || [],
      level: rawData.technology?.level || rawData.technology?.tech_level || 1.0
    },
    diplomacy: {
      allies: rawData.diplomacy?.allies || [],
      enemies: rawData.diplomacy?.enemies || [],
      embargoes: rawData.diplomacy?.embargoes || [],
      sanctions: rawData.diplomacy?.sanctions || [],
      tradePartners: rawData.diplomacy?.tradePartners || rawData.diplomacy?.trade_partners || []
    },
    resourceStockpiles: rawData.resources || rawData.resourceStockpiles || rawData.resource_stockpiles || {},
    resourceProduction: rawData.resourceProduction || rawData.resource_production || {},
    resourceConsumption: rawData.resourceConsumption || rawData.resource_consumption || {},
    resourceShortages: rawData.resourceShortages || rawData.resource_shortages || {},
    resourceEfficiency: rawData.resourceEfficiency || rawData.resource_efficiency || { overall: 1.0 },
    tradeOffers: rawData.tradeOffers || rawData.trade_offers || [],
    tradeAgreements: rawData.tradeAgreements || rawData.trade_agreements || []
  };
}

function convertRawProvince(id: string | number, rawData: any): Province {
  const provinceId = String(id);
  
  return {
    id: provinceId,
    name: rawData.name || provinceId,
    country: rawData.country || 'Unknown',
    coordinates: rawData.coordinates || [0, 0] as [number, number],
    features: rawData.features || [],
    population: {
      total: rawData.population?.total || 0,
      ethnicGroups: (rawData.population?.ethnic_groups || []).map((group: any) => ({
        group: group.group || 'Unknown',
        percent: group.percent || 0
      }))
    },
    unrest: rawData.unrest || 0,
    infrastructure: {
      roads: rawData.infrastructure?.roads || 1,
      internet: rawData.infrastructure?.internet || 1,
      healthcare: rawData.infrastructure?.healthcare || 1,
      education: rawData.infrastructure?.education || 1
    },
    resourceDeposits: rawData.resource_deposits || rawData.resourceDeposits || {},
    military: {
      stationedUnits: (rawData.military?.stationed_units || []).map((unitData: any) => {
        if (typeof unitData === 'string') {
          return { id: unitData, strength: Math.floor(Math.random() * 100) + 50 };
        } else {
          return { id: unitData.id || 'unknown', strength: unitData.strength || 50 };
        }
      }),
      fortificationLevel: rawData.military?.fortification_level || rawData.military?.fortificationLevel || 1
    },
    resourceOutput: rawData.resource_output || rawData.resourceOutput || {},
    politics: {
      partySupport: rawData.politics?.party_support || rawData.politics?.partySupport || {},
      governorApproval: rawData.politics?.governor_approval || rawData.politics?.governorApproval || 50
    },
    economy: {
      gdpPerCapita: rawData.economy?.gdp_per_capita || rawData.economy?.gdpPerCapita || 0,
      unemployment: rawData.economy?.unemployment || 0,
      inflation: rawData.economy?.inflation || 0
    },
    buildings: rawData.buildings || [],
    constructionProjects: rawData.construction_projects || rawData.constructionProjects || []
  };
}

export async function loadWorldDataManual() {
  console.log('Manual Loader: Starting...');
  
  const nations: Nation[] = [];
  const provinces: Province[] = [];
  
  try {
    // Load North America Nations
    console.log('Loading North America nations...');
    console.log('Raw North America nations data length:', northAmericaNationsRaw?.length || 0);
    
    let northAmericaNationsData;
    try {
      northAmericaNationsData = yaml.load(northAmericaNationsRaw);
      console.log('Parsed North America nations data:', northAmericaNationsData);
    } catch (yamlError) {
      console.error('YAML parsing error for North America nations:', yamlError);
      northAmericaNationsData = null;
    }
    
    if (northAmericaNationsData && northAmericaNationsData.nations) {
      let nationsToAdd: Nation[] = [];
      
      if (Array.isArray(northAmericaNationsData.nations)) {
        // Array format: [{ id: "CAN", ... }, ...]
        nationsToAdd = northAmericaNationsData.nations.map((data: any) => 
          convertRawNation(data.id, data)
        );
      } else if (typeof northAmericaNationsData.nations === 'object') {
        // Object format: { CAN: {...}, MEX: {...} }
        nationsToAdd = Object.entries(northAmericaNationsData.nations).map(([id, data]) => 
          convertRawNation(id, data as any)
        );
      }
      
      nations.push(...nationsToAdd);
      console.log(`Added ${nationsToAdd.length} North America nations`);
    } else {
      console.warn('No nations found in North America data or data is malformed');
    }
    
    // Load North America Provinces
    console.log('Loading North America provinces...');
    console.log('Raw North America provinces data length:', northAmericaProvincesRaw?.length || 0);
    
    let northAmericaProvincesData;
    try {
      northAmericaProvincesData = yaml.load(northAmericaProvincesRaw);
      console.log('Parsed North America provinces data structure:', Object.keys(northAmericaProvincesData || {}));
    } catch (yamlError) {
      console.error('YAML parsing error for North America provinces:', yamlError);
      northAmericaProvincesData = null;
    }
    
    if (northAmericaProvincesData && northAmericaProvincesData.provinces) {
      let provincesToAdd: Province[] = [];
      
      if (Array.isArray(northAmericaProvincesData.provinces)) {
        // Array format: [{ province_id: "CAN_001", ... }, ...]
        provincesToAdd = northAmericaProvincesData.provinces.map((data: any) => 
          convertRawProvince(data.province_id || data.id, data)
        );
      } else if (typeof northAmericaProvincesData.provinces === 'object') {
        // Object format: { CAN_001: {...}, CAN_002: {...} }
        provincesToAdd = Object.entries(northAmericaProvincesData.provinces).map(([id, data]) => 
          convertRawProvince(id, data as any)
        );
      }
      
      provinces.push(...provincesToAdd);
      console.log(`Added ${provincesToAdd.length} North America provinces`);
    } else {
      console.warn('No provinces found in North America data or data is malformed');
    }
    
    // Load South America Nations
    console.log('Loading South America nations...');
    console.log('Raw South America nations data length:', southAmericaNationsRaw?.length || 0);
    
    let southAmericaNationsData;
    try {
      southAmericaNationsData = yaml.load(southAmericaNationsRaw);
      console.log('Parsed South America nations data:', southAmericaNationsData);
    } catch (yamlError) {
      console.error('YAML parsing error for South America nations:', yamlError);
      southAmericaNationsData = null;
    }
    
    if (southAmericaNationsData && southAmericaNationsData.nations) {
      let nationsToAdd: Nation[] = [];
      
      if (Array.isArray(southAmericaNationsData.nations)) {
        // Array format: [{ id: "BRA", ... }, ...]
        nationsToAdd = southAmericaNationsData.nations.map((data: any) => 
          convertRawNation(data.id, data)
        );
      } else if (typeof southAmericaNationsData.nations === 'object') {
        // Object format: { BRA: {...}, ARG: {...} }
        nationsToAdd = Object.entries(southAmericaNationsData.nations).map(([id, data]) => 
          convertRawNation(id, data as any)
        );
      }
      
      nations.push(...nationsToAdd);
      console.log(`Added ${nationsToAdd.length} South America nations`);
    } else {
      console.warn('No nations found in South America data or data is malformed');
    }
    
    // Load South America Provinces
    console.log('Loading South America provinces...');
    console.log('Raw South America provinces data length:', southAmericaProvincesRaw?.length || 0);
    
    let southAmericaProvincesData;
    try {
      southAmericaProvincesData = yaml.load(southAmericaProvincesRaw);
      console.log('Parsed South America provinces data structure:', Object.keys(southAmericaProvincesData || {}));
    } catch (yamlError) {
      console.error('YAML parsing error for South America provinces:', yamlError);
      southAmericaProvincesData = null;
    }
    
    if (southAmericaProvincesData && southAmericaProvincesData.provinces) {
      let provincesToAdd: Province[] = [];
      
      if (Array.isArray(southAmericaProvincesData.provinces)) {
        // Array format: [{ province_id: "BRA_001", ... }, ...]
        provincesToAdd = southAmericaProvincesData.provinces.map((data: any) => 
          convertRawProvince(data.province_id || data.id, data)
        );
      } else if (typeof southAmericaProvincesData.provinces === 'object') {
        // Object format: { BRA_001: {...}, ARG_001: {...} }
        provincesToAdd = Object.entries(southAmericaProvincesData.provinces).map(([id, data]) => 
          convertRawProvince(id, data as any)
        );
      }
      
      provinces.push(...provincesToAdd);
      console.log(`Added ${provincesToAdd.length} South America provinces`);
    } else {
      console.warn('No provinces found in South America data or data is malformed');
    }
    
    console.log(`Manual Loader: Complete. Nations: ${nations.length}, Provinces: ${provinces.length}`);
    console.log('Final nations list:', nations.map(n => ({ id: n.id, name: n.name })));
    console.log('Final provinces list (first 10):', provinces.slice(0, 10).map(p => ({ id: p.id, name: p.name, country: p.country })));
    
    return {
      nations,
      provinces,
      boundaries: {} // Empty for now
    };
    
  } catch (error) {
    console.error('Manual Loader: Error:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}