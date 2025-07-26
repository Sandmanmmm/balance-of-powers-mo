import * as yaml from 'js-yaml';
import { Building, Province, Nation } from './types';

export async function loadBuildingsFromYAML(): Promise<Building[]> {
  try {
    // Import the YAML file as text
    const response = await fetch('/src/data/buildings.yaml');
    if (!response.ok) {
      throw new Error(`Failed to fetch buildings.yaml: ${response.status}`);
    }
    const yamlText = await response.text();
    
    // Parse the YAML
    const data = yaml.load(yamlText) as { buildings: any[] };
    
    if (!data.buildings || !Array.isArray(data.buildings)) {
      throw new Error('Invalid buildings.yaml format');
    }
    
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
    const response = await fetch('/src/data/provinces.yaml');
    const yamlText = await response.text();
    
    const data = yaml.load(yamlText) as { provinces: Record<string, any> };
    
    return Object.entries(data.provinces).map(([id, provinceData]) => ({
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
      unrest: provinceData.unrest,
      infrastructure: provinceData.infrastructure,
      resourceDeposits: provinceData.resource_deposits || {},
      military: {
        stationedUnits: (provinceData.military?.stationed_units || []).map((unitId: string) => ({
          id: unitId,
          strength: Math.floor(Math.random() * 100) + 50
        })),
        fortificationLevel: provinceData.military?.fortification_level || 0
      },
      resourceOutput: {
        energy: provinceData.resource_output.energy,
        iron: provinceData.resource_output.iron,
        food: provinceData.resource_output.food,
        technology: provinceData.resource_output.technology
      },
      politics: {
        partySupport: provinceData.politics.party_support,
        governorApproval: provinceData.politics.governor_approval
      },
      economy: {
        gdpPerCapita: provinceData.economy.gdp_per_capita,
        unemployment: provinceData.economy.unemployment,
        inflation: provinceData.economy.inflation
      },
      buildings: (provinceData.buildings || []).map((building: any) => ({
        buildingId: building.buildingId || building.building_id,
        level: building.level || 1,
        constructedDate: building.constructedDate ? new Date(building.constructedDate) : new Date(),
        effects: building.effects || {},
        efficiency: building.efficiency || 1.0 // Default to 100% efficiency
      })),
      constructionProjects: provinceData.construction_projects || []
    }));
  } catch (error) {
    console.error('Failed to load provinces from YAML:', error);
    return [];
  }
}

export async function loadNationsFromYAML(): Promise<Nation[]> {
  try {
    const response = await fetch('/src/data/nations.yaml');
    const yamlText = await response.text();
    
    const data = yaml.load(yamlText) as { nations: Record<string, any> };
    
    return Object.entries(data.nations).map(([id, nationData]) => ({
      id,
      name: nationData.name,
      capital: nationData.capital,
      flag: nationData.flag,
      government: nationData.government,
      economy: {
        gdp: nationData.economy.gdp,
        debt: nationData.economy.debt,
        inflation: nationData.economy.inflation,
        tradeBalance: nationData.economy.trade_balance,
        treasury: nationData.economy.treasury
      },
      military: {
        manpower: nationData.military.manpower,
        equipment: nationData.military.equipment,
        doctrine: nationData.military.doctrine,
        nuclearCapability: nationData.military.nuclear_capability,
        readiness: nationData.military.readiness || 100 // Default to 100% readiness
      },
      technology: {
        researchPoints: nationData.technology?.research_points || 0,
        currentResearch: nationData.technology?.current_research || [],
        completedTech: nationData.technology?.completed_tech || [],
        level: nationData.technology?.tech_level || 1
      },
      diplomacy: {
        allies: nationData.diplomacy?.allies || [],
        enemies: nationData.diplomacy?.enemies || [],
        tradePartners: nationData.diplomacy?.trade_partners || [],
        embargoes: nationData.diplomacy?.embargoes || [], // Nations under embargo by this nation
        sanctions: nationData.diplomacy?.sanctions || [] // Nations imposing sanctions on this nation
      },
      resourceStockpiles: nationData.resourceStockpiles || {},
      resourceProduction: nationData.resourceProduction || {},
      resourceConsumption: nationData.resourceConsumption || {},
      resourceShortages: nationData.resourceShortages || {}, // New: shortage severity tracking
      resourceEfficiency: nationData.resourceEfficiency || {}, // New: efficiency modifiers
      tradeOffers: nationData.tradeOffers || [], // New: active trade offers
      tradeAgreements: nationData.tradeAgreements || [] // New: active trade agreements
    }));
  } catch (error) {
    console.error('Failed to load nations from YAML:', error);
    return [];
  }
}