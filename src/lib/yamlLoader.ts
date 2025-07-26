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
    
    // Convert to Building objects
    return data.buildings.map((building: any) => ({
      id: building.id,
      name: building.name,
      description: building.description,
      category: building.category,
      cost: building.cost,
      buildTime: building.buildTime,
      produces: building.produces || {},
      consumes: building.consumes || {},
      improves: building.improves || {},
      requiresFeatures: building.requiresFeatures || [],
      requirements: building.requirements || {},
      icon: building.icon
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
    
    const provinces = Object.entries(data.provinces).map(([id, provinceData]) => ({
      id,
      name: provinceData.name,
      country: provinceData.country,
      coordinates: provinceData.coordinates as [number, number],
      features: provinceData.features || [],
      population: {
        total: provinceData.population?.total || 0,
        ethnicGroups: (provinceData.population?.ethnic_groups || []).map((group: any) => ({
          group: group?.group || 'Unknown',
          percent: group?.percent || 0
        }))
      },
      unrest: provinceData.unrest || 0,
      infrastructure: provinceData.infrastructure || { roads: 1, internet: 1, healthcare: 1, education: 1 },
      resourceDeposits: provinceData.resource_deposits || {},
      military: {
        stationedUnits: (provinceData.military?.stationed_units || []).map((unitId: string) => ({
          id: unitId,
          strength: Math.floor(Math.random() * 100) + 50
        })),
        fortificationLevel: provinceData.military?.fortification_level || 0
      },
      resourceOutput: {
        energy: provinceData.resource_output?.energy || 0,
        iron: provinceData.resource_output?.iron || 0,
        food: provinceData.resource_output?.food || 0,
        technology: provinceData.resource_output?.technology || 0
      },
      politics: {
        partySupport: provinceData.politics?.party_support || {},
        governorApproval: provinceData.politics?.governor_approval || 50
      },
      economy: {
        gdpPerCapita: provinceData.economy?.gdp_per_capita || 25000,
        unemployment: provinceData.economy?.unemployment || 5,
        inflation: provinceData.economy?.inflation || 2
      },
      buildings: (provinceData.buildings || []).map((building: any) => ({
        buildingId: building.buildingId || building.building_id,
        level: building.level || 1,
        constructedDate: building.constructedDate ? new Date(building.constructedDate) : new Date(),
        effects: building.effects || {},
        efficiency: building.efficiency || 1.0
      })),
      constructionProjects: provinceData.construction_projects || []
    }));
    
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
    
    const data = yaml.load(nationsYamlRaw) as { nations: Record<string, any> };
    
    if (!data.nations) {
      throw new Error('Invalid nations.yaml format');
    }
    
    const nations = Object.entries(data.nations).map(([id, nationData]) => ({
      id,
      name: nationData.name,
      capital: nationData.capital,
      flag: nationData.flag,
      government: nationData.government || { type: 'democracy', leader: 'Unknown', approval: 50, stability: 50 },
      economy: {
        gdp: nationData.economy?.gdp || 1000000000000,
        debt: nationData.economy?.debt || 500000000000,
        inflation: nationData.economy?.inflation || 2,
        tradeBalance: nationData.economy?.trade_balance || 0,
        treasury: nationData.economy?.treasury || 100000000000
      },
      military: {
        manpower: nationData.military?.manpower || 100000,
        equipment: nationData.military?.equipment || 50,
        doctrine: nationData.military?.doctrine || 'Standard',
        nuclearCapability: nationData.military?.nuclear_capability || false,
        readiness: nationData.military?.readiness || 100
      },
      technology: {
        researchPoints: nationData.technology?.research_points || nationData.technology?.researchPoints || 0,
        currentResearch: nationData.technology?.current_research || nationData.technology?.currentResearch || [],
        completedTech: nationData.technology?.completed_tech || nationData.technology?.completedTech || [],
        level: nationData.technology?.tech_level || nationData.technology?.level || 1
      },
      diplomacy: {
        allies: nationData.diplomacy?.allies || [],
        enemies: nationData.diplomacy?.enemies || [],
        tradePartners: nationData.diplomacy?.trade_partners || nationData.diplomacy?.tradePartners || [],
        embargoes: nationData.diplomacy?.embargoes || [],
        sanctions: nationData.diplomacy?.sanctions || []
      },
      resourceStockpiles: nationData.resourceStockpiles || nationData.resource_stockpiles || {},
      resourceProduction: nationData.resourceProduction || nationData.resource_production || {},
      resourceConsumption: nationData.resourceConsumption || nationData.resource_consumption || {},
      resourceShortages: nationData.resourceShortages || nationData.resource_shortages || {},
      resourceEfficiency: nationData.resourceEfficiency || nationData.resource_efficiency || { overall: 1.0 },
      tradeOffers: nationData.tradeOffers || nationData.trade_offers || [],
      tradeAgreements: nationData.tradeAgreements || nationData.trade_agreements || []
    }));
    
    console.log(`Loaded ${nations.length} nations from YAML`);
    return nations;
  } catch (error) {
    console.error('Failed to load nations from YAML:', error);
    return [];
  }
}