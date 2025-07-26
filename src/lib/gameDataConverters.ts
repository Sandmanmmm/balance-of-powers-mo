import { Province, Nation } from './types';

// Define inline data instead of loading from YAML files for now
// This will be replaced with proper YAML loading once the import issues are resolved

const provincesData = {
  provinces: {
    "CAN_001": {
      name: "British Columbia",
      country: "Canada",
      coordinates: [53.7267, -127.6476],
      features: ["mountainous", "coastal", "tech_hub", "scenic", "tourism", "fishing_grounds", "forest", "temperate_climate"],
      population: {
        total: 5200000,
        ethnic_groups: [
          { group: "European Canadian", percent: 52.4 },
          { group: "Chinese", percent: 12.3 },
          { group: "South Asian", percent: 8.7 },
          { group: "Indigenous", percent: 5.9 },
          { group: "Filipino", percent: 3.8 },
          { group: "Other", percent: 16.9 }
        ]
      },
      unrest: 2.8,
      infrastructure: {
        roads: 3,
        internet: 4,
        healthcare: 4,
        education: 4
      },
      resource_deposits: {
        oil: 200,
        steel: 450,
        rare_earth: 180,
        uranium: 25,
        food: 850
      },
      military: {
        stationed_units: ["CAN_NAV_1", "CAN_INF_2"],
        fortification_level: 2
      },
      resource_output: {
        energy: 2200,
        iron: 380,
        food: 1450,
        technology: 280
      },
      politics: {
        party_support: {
          "Liberal": 28.3,
          "Conservative": 22.8,
          "NDP": 26.1,
          "Green": 15.4,
          "Other": 7.4
        },
        governor_approval: 64.2
      },
      economy: {
        gdp_per_capita: 58000,
        unemployment: 5.8,
        inflation: 3.2
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_002": {
      name: "Alberta",
      country: "Canada", 
      coordinates: [53.9333, -116.5765],
      features: ["plains", "oil_rich", "flat_terrain", "cold_climate", "farmland", "energy_hub"],
      population: {
        total: 4400000,
        ethnic_groups: [
          { group: "European Canadian", percent: 68.2 },
          { group: "Indigenous", percent: 6.8 },
          { group: "South Asian", percent: 6.3 },
          { group: "Chinese", percent: 4.2 },
          { group: "Filipino", percent: 3.1 },
          { group: "Other", percent: 11.4 }
        ]
      },
      unrest: 4.1,
      infrastructure: {
        roads: 3,
        internet: 3,
        healthcare: 3,
        education: 3
      },
      resource_deposits: {
        oil: 15000,
        steel: 280,
        rare_earth: 45,
        uranium: 350,
        food: 1200
      },
      military: {
        stationed_units: ["CAN_INF_3"],
        fortification_level: 1
      },
      resource_output: {
        energy: 4800,
        iron: 220,
        food: 1800,
        technology: 180
      },
      politics: {
        party_support: {
          "Conservative": 52.3,
          "Liberal": 18.2,
          "NDP": 15.8,
          "Other": 13.7
        },
        governor_approval: 71.5
      },
      economy: {
        gdp_per_capita: 78000,
        unemployment: 4.2,
        inflation: 3.8
      },
      buildings: [],
      construction_projects: []
    },
    "CAN_005": {
      name: "Ontario",
      country: "Canada",
      coordinates: [51.2538, -85.3232],
      features: ["urban", "tech_hub", "industrial", "farmland", "river_access", "temperate_climate"],
      population: {
        total: 14800000,
        ethnic_groups: [
          { group: "European Canadian", percent: 48.9 },
          { group: "South Asian", percent: 12.6 },
          { group: "Chinese", percent: 8.8 },
          { group: "Black", percent: 4.7 },
          { group: "Filipino", percent: 3.2 },
          { group: "Indigenous", percent: 2.8 },
          { group: "Other", percent: 19.0 }
        ]
      },
      unrest: 3.5,
      infrastructure: {
        roads: 4,
        internet: 5,
        healthcare: 4,
        education: 5
      },
      resource_deposits: {
        oil: 50,
        steel: 800,
        rare_earth: 120,
        uranium: 2800,
        food: 1800
      },
      military: {
        stationed_units: ["CAN_INF_1", "CAN_AIR_1", "CAN_LOG_1"],
        fortification_level: 2
      },
      resource_output: {
        energy: 3200,
        iron: 650,
        food: 2200,
        technology: 850
      },
      politics: {
        party_support: {
          "Liberal": 38.2,
          "Conservative": 28.4,
          "NDP": 18.7,
          "Green": 7.8,
          "Other": 6.9
        },
        governor_approval: 59.8
      },
      economy: {
        gdp_per_capita: 62000,
        unemployment: 6.1,
        inflation: 3.1
      },
      buildings: [],
      construction_projects: []
    }
  }
};

const nationsData = {
  nations: {
    "CAN": {
      name: "Canada",
      capital: "Ottawa",
      flag: "🇨🇦",
      government: {
        type: "democracy" as const,
        leader: "Justin Trudeau",
        approval: 58.3,
        stability: 76.5,
        ruling_party: "Liberal Party",
        ideology: "Liberal Democracy",
        election_cycle: 4,
        last_election: "2021-09-20"
      },
      economy: {
        gdp: 1988000000000,
        debt: 1200000000000,
        inflation: 3.4,
        trade_balance: 12500000000,
        treasury: 280000000000,
        currency: "CAD",
        interest_rate: 5.0,
        sectors: {
          manufacturing: 10.2,
          services: 70.8,
          agriculture: 1.7,
          technology: 5.3,
          resources: 12.0
        }
      },
      military: {
        manpower: 67000,
        equipment: 72,
        doctrine: "Peacekeeping and Defense",
        nuclear_capability: false,
        military_spending_gdp: 1.32,
        conscription: false,
        reserve_forces: 19000
      },
      technology: {
        research_points: 980,
        current_research: ["Clean Energy", "Arctic Technology", "AI Development"],
        completed_tech: ["Internet", "Renewable Energy", "Resource Extraction", "Cold Weather Technology", "Peacekeeping Systems"],
        tech_level: 8.1,
        research_spending_gdp: 1.8
      },
      diplomacy: {
        allies: ["USA", "GBR", "FRA", "GER", "AUS", "JPN"],
        enemies: [],
        trade_partners: ["USA", "CHN", "MEX", "GBR", "GER", "JPN", "KOR"],
        international_relations: {
          NATO: "member",
          G7: "member",
          UN_Security_Council: false,
          Commonwealth: "member"
        }
      },
      provinces: ["CAN_001", "CAN_002", "CAN_003", "CAN_004", "CAN_005", "CAN_006", "CAN_007", "CAN_008", "CAN_009", "CAN_010", "CAN_011", "CAN_012", "CAN_013"],
      demographics: {
        population: 38000000,
        median_age: 41.1,
        birth_rate: 1.47,
        life_expectancy: 82.4,
        literacy_rate: 99.0,
        urbanization: 81.6
      },
      resourceStockpiles: {
        oil: 55000,
        electricity: 42000,
        steel: 45000,
        rare_earth: 8500,
        manpower: 1850000,
        research: 980,
        consumer_goods: 38000,
        food: 125000,
        uranium: 15000,
        semiconductors: 4200
      },
      resourceProduction: {
        oil: 1200,
        electricity: 800,
        steel: 250,
        rare_earth: 45,
        manpower: 850,
        research: 95,
        consumer_goods: 180,
        food: 2800,
        uranium: 120,
        semiconductors: 25
      },
      resourceConsumption: {
        oil: 420,
        electricity: 650,
        steel: 180,
        rare_earth: 20,
        manpower: 380,
        research: 0,
        consumer_goods: 850,
        food: 1200,
        uranium: 8,
        semiconductors: 65
      }
    }
  }
};

// Convert data to TypeScript interfaces
export function convertProvinces(): Province[] {
  return Object.entries(provincesData.provinces).map(([id, data]) => ({
    id,
    name: data.name,
    country: data.country,
    coordinates: data.coordinates as [number, number],
    features: data.features || [], // Add features array
    population: {
      total: data.population.total,
      ethnicGroups: data.population.ethnic_groups.map(group => ({
        group: group.group,
        percent: group.percent
      }))
    },
    unrest: data.unrest,
    infrastructure: data.infrastructure,
    resourceDeposits: data.resource_deposits || {}, // Add resource deposits
    military: {
      stationedUnits: data.military.stationed_units.map(unitId => ({
        id: unitId,
        strength: Math.floor(Math.random() * 100) + 50 // Random strength 50-150
      })),
      fortificationLevel: data.military.fortification_level
    },
    resourceOutput: {
      energy: data.resource_output.energy,
      iron: data.resource_output.iron,
      food: data.resource_output.food,
      technology: data.resource_output.technology
    },
    politics: {
      partySupport: data.politics.party_support,
      governorApproval: data.politics.governor_approval
    },
    economy: {
      gdpPerCapita: data.economy.gdp_per_capita,
      unemployment: data.economy.unemployment,
      inflation: data.economy.inflation
    },
    buildings: data.buildings || [],
    constructionProjects: data.construction_projects || []
  }));
}

export function convertNations(): Nation[] {
  return Object.entries(nationsData.nations).map(([id, data]) => ({
    id,
    name: data.name,
    capital: data.capital,
    flag: data.flag,
    government: data.government,
    economy: {
      gdp: data.economy.gdp,
      debt: data.economy.debt,
      inflation: data.economy.inflation,
      tradeBalance: data.economy.trade_balance || data.economy.tradeBalance,
      treasury: data.economy.treasury
    },
    military: {
      manpower: data.military.manpower,
      equipment: data.military.equipment,
      readiness: data.military.readiness || 100,
      doctrine: data.military.doctrine,
      nuclearCapability: data.military.nuclear_capability ?? data.military.nuclearCapability ?? false
    },
    technology: {
      researchPoints: data.technology.research_points ?? data.technology.researchPoints ?? 0,
      currentResearch: data.technology.current_research ?? data.technology.currentResearch ?? [],
      completedTech: data.technology.completed_tech ?? data.technology.completedTech ?? [],
      level: data.technology.tech_level ?? data.technology.level ?? 1.0
    },
    diplomacy: {
      allies: data.diplomacy.allies || [],
      enemies: data.diplomacy.enemies || [],
      embargoes: data.diplomacy.embargoes || [],
      sanctions: data.diplomacy.sanctions || [],
      tradePartners: data.diplomacy.trade_partners ?? data.diplomacy.tradePartners ?? []
    },
    resourceStockpiles: data.resourceStockpiles || data.resource_stockpiles || {},
    resourceProduction: data.resourceProduction || data.resource_production || {},
    resourceConsumption: data.resourceConsumption || data.resource_consumption || {},
    resourceShortages: data.resourceShortages || data.resource_shortages || {},
    resourceEfficiency: data.resourceEfficiency || data.resource_efficiency || { overall: 1.0 },
    tradeOffers: data.tradeOffers || data.trade_offers || [],
    tradeAgreements: data.tradeAgreements || data.trade_agreements || []
  }));
}