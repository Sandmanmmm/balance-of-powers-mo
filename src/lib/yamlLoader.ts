import * as yaml from 'js-yaml';
import { Building, Province, Nation } from './types';

// Import YAML files as raw text
import buildingsYamlRaw from '../data/buildings.yaml?raw';
import provincesYamlRaw from '../data/provinces.yaml?raw';
import nationsYamlRaw from '../data/nations.yaml?raw';

export async function loadBuildingsFromYAML(): Promise<Building[]> {
  try {
    console.log('Loading buildings from YAML...');
    
    // Parse the YAML
    const data = yaml.load(buildingsYamlRaw) as { buildings: any[] };
    
    if (!data.buildings || !Array.isArray(data.buildings)) {
      throw new Error('Invalid buildings.yaml format');
    }
    
    console.log(`Loaded ${data.buildings.length} buildings from YAML`);
    
    // Convert to Building objects with robust type checking
    return data.buildings.map((building: any) => ({
      id: String(building?.id || ''),
      name: String(building?.name || 'Unknown Building'),
      description: String(building?.description || ''),
      category: String(building?.category || 'misc'),
      cost: Number(building?.cost) || 0,
      buildTime: Number(building?.buildTime) || 1,
      produces: (typeof building?.produces === 'object') ? building.produces || {} : {},
      consumes: (typeof building?.consumes === 'object') ? building.consumes || {} : {},
      improves: (typeof building?.improves === 'object') ? building.improves || {} : {},
      requiresFeatures: Array.isArray(building?.requiresFeatures) ? building.requiresFeatures : [],
      requirements: (typeof building?.requirements === 'object') ? building.requirements || {} : {},
      icon: String(building?.icon || '🏢')
    }));
  } catch (error) {
    console.error('Failed to load buildings from YAML:', error);
    return [];
  }
}

export async function loadProvincesFromYAML(): Promise<Province[]> {
  try {
    console.log('Loading provinces from YAML...');
    
    const data = yaml.load(provincesYamlRaw) as { provinces: Record<string, any> };
    
    if (!data.provinces) {
      throw new Error('Invalid provinces.yaml format');
    }
    
    const provinces = Object.entries(data.provinces).map(([id, provinceData]) => {
      // Ensure all required fields are present and properly formatted
      const province = {
        id: id || '',
        name: provinceData.name || 'Unknown',
        country: provinceData.country || 'Unknown',
        coordinates: Array.isArray(provinceData.coordinates) ? provinceData.coordinates as [number, number] : [0, 0],
        features: Array.isArray(provinceData.features) ? provinceData.features : [],
        population: {
          total: Number(provinceData.population?.total) || 0,
          ethnicGroups: Array.isArray(provinceData.population?.ethnic_groups) 
            ? provinceData.population.ethnic_groups.map((group: any) => ({
                group: String(group?.group || 'Unknown'),
                percent: Number(group?.percent) || 0
              }))
            : []
        },
        unrest: Number(provinceData.unrest) || 0,
        infrastructure: {
          roads: Number(provinceData.infrastructure?.roads) || 1,
          internet: Number(provinceData.infrastructure?.internet) || 1,
          healthcare: Number(provinceData.infrastructure?.healthcare) || 1,
          education: Number(provinceData.infrastructure?.education) || 1
        },
        resourceDeposits: (typeof provinceData.resource_deposits === 'object') 
          ? provinceData.resource_deposits || {} 
          : {},
        military: {
          stationedUnits: Array.isArray(provinceData.military?.stationed_units) 
            ? provinceData.military.stationed_units.map((unitId: string) => ({
                id: String(unitId),
                strength: Math.floor(Math.random() * 100) + 50
              }))
            : [],
          fortificationLevel: Number(provinceData.military?.fortification_level) || 0
        },
        resourceOutput: {
          energy: Number(provinceData.resource_output?.energy) || 0,
          iron: Number(provinceData.resource_output?.iron) || 0,
          food: Number(provinceData.resource_output?.food) || 0,
          technology: Number(provinceData.resource_output?.technology) || 0
        },
        politics: {
          partySupport: (typeof provinceData.politics?.party_support === 'object') 
            ? provinceData.politics.party_support || {} 
            : {},
          governorApproval: Number(provinceData.politics?.governor_approval) || 50
        },
        economy: {
          gdpPerCapita: Number(provinceData.economy?.gdp_per_capita) || 25000,
          unemployment: Number(provinceData.economy?.unemployment) || 5,
          inflation: Number(provinceData.economy?.inflation) || 2
        },
        buildings: Array.isArray(provinceData.buildings) 
          ? provinceData.buildings.map((building: any) => ({
              buildingId: String(building?.buildingId || building?.building_id || ''),
              level: Number(building?.level) || 1,
              constructedDate: building?.constructedDate ? new Date(building.constructedDate) : new Date(),
              effects: (typeof building?.effects === 'object') ? building.effects || {} : {},
              efficiency: Number(building?.efficiency) || 1.0
            }))
          : [],
        constructionProjects: Array.isArray(provinceData.construction_projects) 
          ? provinceData.construction_projects 
          : []
      };
      
      return province;
    });
    
    console.log(`Loaded ${provinces.length} provinces from YAML`);
    return provinces;
  } catch (error) {
    console.error('Failed to load provinces from YAML:', error);
    return [];
  }
}

export async function loadNationsFromYAML(): Promise<Nation[]> {
  try {
    console.log('Loading nations from YAML...');
    
    if (!nationsYamlRaw || typeof nationsYamlRaw !== 'string') {
      throw new Error('Nations YAML data not available');
    }
    
    const data = yaml.load(nationsYamlRaw) as { nations: Record<string, any> };
    
    if (!data || !data.nations || typeof data.nations !== 'object') {
      throw new Error('Invalid nations.yaml format - missing nations object');
    }
    
    const nationEntries = Object.entries(data.nations);
    if (nationEntries.length === 0) {
      throw new Error('No nations found in YAML');
    }
    
    const nations = nationEntries.map(([id, nationData]) => {
      try {
        // Ensure all required fields are present and properly formatted
        if (!nationData || typeof nationData !== 'object') {
          throw new Error(`Invalid nation data for ${id}`);
        }
        
        const nation = {
          id: id || '',
          name: nationData.name || 'Unknown',
          capital: nationData.capital || 'Unknown',
          flag: nationData.flag || '🏳️',
          government: {
            type: nationData.government?.type || 'democracy',
            leader: nationData.government?.leader || 'Unknown',
            approval: Number(nationData.government?.approval) || 50,
            stability: Number(nationData.government?.stability) || 50,
            ruling_party: nationData.government?.ruling_party || 'Unknown',
            ideology: nationData.government?.ideology || 'Unknown',
            election_cycle: Number(nationData.government?.election_cycle) || 4,
            last_election: nationData.government?.last_election || '1990-01-01'
          },
          economy: {
            gdp: Number(nationData.economy?.gdp) || 1000000000000,
            debt: Number(nationData.economy?.debt) || 500000000000,
            inflation: Number(nationData.economy?.inflation) || 2,
            tradeBalance: Number(nationData.economy?.trade_balance) || 0,
            treasury: Number(nationData.economy?.treasury) || 100000000000
          },
          military: {
            manpower: Number(nationData.military?.manpower) || 100000,
            equipment: Number(nationData.military?.equipment) || 50,
            doctrine: nationData.military?.doctrine || 'Standard',
            nuclearCapability: Boolean(nationData.military?.nuclear_capability),
            readiness: Number(nationData.military?.readiness) || 100
          },
          technology: {
            researchPoints: Number(nationData.technology?.researchPoints || nationData.technology?.research_points) || 0,
            currentResearch: Array.isArray(nationData.technology?.currentResearch || nationData.technology?.current_research) 
              ? (nationData.technology?.currentResearch || nationData.technology?.current_research) 
              : [],
            completedTech: Array.isArray(nationData.technology?.completedTech || nationData.technology?.completed_tech) 
              ? (nationData.technology?.completedTech || nationData.technology?.completed_tech) 
              : [],
            level: Number(nationData.technology?.level || nationData.technology?.tech_level) || 1
          },
          diplomacy: {
            allies: Array.isArray(nationData.diplomacy?.allies) ? nationData.diplomacy.allies : [],
            enemies: Array.isArray(nationData.diplomacy?.enemies) ? nationData.diplomacy.enemies : [],
            tradePartners: Array.isArray(nationData.diplomacy?.trade_partners || nationData.diplomacy?.tradePartners) 
              ? (nationData.diplomacy?.trade_partners || nationData.diplomacy?.tradePartners) 
              : [],
            embargoes: Array.isArray(nationData.diplomacy?.embargoes) ? nationData.diplomacy.embargoes : [],
            sanctions: Array.isArray(nationData.diplomacy?.sanctions) ? nationData.diplomacy.sanctions : []
          },
          resourceStockpiles: (typeof (nationData.resourceStockpiles || nationData.resource_stockpiles) === 'object') 
            ? (nationData.resourceStockpiles || nationData.resource_stockpiles || {}) 
            : {},
          resourceProduction: (typeof (nationData.resourceProduction || nationData.resource_production) === 'object') 
            ? (nationData.resourceProduction || nationData.resource_production || {}) 
            : {},
          resourceConsumption: (typeof (nationData.resourceConsumption || nationData.resource_consumption) === 'object') 
            ? (nationData.resourceConsumption || nationData.resource_consumption || {}) 
            : {},
          resourceShortages: (typeof (nationData.resourceShortages || nationData.resource_shortages) === 'object') 
            ? (nationData.resourceShortages || nationData.resource_shortages || {}) 
            : {},
          resourceEfficiency: (typeof (nationData.resourceEfficiency || nationData.resource_efficiency) === 'object') 
            ? (nationData.resourceEfficiency || nationData.resource_efficiency || { overall: 1.0 }) 
            : { overall: 1.0 },
          tradeOffers: Array.isArray(nationData.tradeOffers || nationData.trade_offers) 
            ? (nationData.tradeOffers || nationData.trade_offers) 
            : [],
          tradeAgreements: Array.isArray(nationData.tradeAgreements || nationData.trade_agreements) 
            ? (nationData.tradeAgreements || nationData.trade_agreements) 
            : []
        };
        
        return nation;
      } catch (error) {
        console.error(`Error processing nation ${id}:`, error);
        return null;
      }
    }).filter(Boolean) as Nation[];
    
    console.log(`Loaded ${nations.length} nations from YAML`);
    return nations;
  } catch (error) {
    console.error('Failed to load nations from YAML:', error);
    return [];
  }
}