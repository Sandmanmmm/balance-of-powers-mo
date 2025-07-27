import { useEffect, useRef } from 'react';
import { GameState, Province, Nation, GameEvent, Technology } from '../lib/types';
import { sampleProvinces, sampleNations, sampleEvents, sampleTechnologies, getBuildingById, resourcesData } from '../lib/gameData';
import { toast } from 'sonner';
import { 
  calculateResourceShortageEffects, 
  applyShortageEffectsToProvinces, 
  applyShortageEffectsToNation 
} from '../lib/resourceEffects';
import { 
  generateAITradeOffer, 
  evaluateTradeOfferAI, 
  executeTradeAgreement,
  acceptTradeOffer 
} from '../lib/tradeSystem';
import { checkResourceNotifications, sendTradeNotification } from '../lib/resourceNotifications';

interface UseSimulationEngineProps {
  gameState: GameState;
  provinces: Province[];
  nations: Nation[];
  onAdvanceTime: (days: number) => void;
  onUpdateProvince: (provinceId: string, updates: Partial<Province>) => void;
  onUpdateNation: (nationId: string, updates: Partial<Nation>) => void;
  onProcessConstructionTick?: () => void;
}

interface SimulationContext {
  gameState: GameState;
  provinces: Province[];
  nations: Nation[];
  events: GameEvent[];
  technologies: Technology[];
}

export function useSimulationEngine({
  gameState,
  provinces,
  nations,
  onAdvanceTime,
  onUpdateProvince,
  onUpdateNation,
  onProcessConstructionTick
}: UseSimulationEngineProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const lastEventCheckRef = useRef<number>(Date.now());
  const aiDecisionCooldownRef = useRef<Map<string, number>>(new Map());

  // Ensure we have safe arrays to work with
  const safeProvinces = Array.isArray(provinces) ? provinces.filter(p => p) : [];
  const safeNations = Array.isArray(nations) ? nations.filter(n => n) : [];

  useEffect(() => {
    // Don't start simulation until we have valid data
    if (safeProvinces.length === 0 || safeNations.length === 0) {
      console.log('Simulation paused: waiting for game data to load');
      return;
    }
    
    if (gameState.isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 1 real second = 1 week in game time
    const updateInterval = 1000 / gameState.timeSpeed;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeDelta = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      // Calculate weeks to advance (1 second = 1 week)
      const weeksToAdvance = (timeDelta / 1000) * gameState.timeSpeed;

      if (weeksToAdvance >= 1) {
        const daysToAdvance = Math.floor(weeksToAdvance) * 7;
        
        // Advance time
        onAdvanceTime(daysToAdvance);
        
        // Create simulation context
        const context: SimulationContext = {
          gameState,
          provinces: safeProvinces,
          nations: safeNations,
          events: sampleEvents,
          technologies: sampleTechnologies
        };

        // Run core simulation systems
        simulateProvinces(context, Math.floor(weeksToAdvance), onUpdateProvince);
        simulateNations(context, Math.floor(weeksToAdvance), onUpdateNation);
        
        // Process resource production/consumption with shortage effects
        processResourceSystem(context, Math.floor(weeksToAdvance), onUpdateProvince, onUpdateNation);
        
        // Process trade agreements
        processTradeSystem(context, Math.floor(weeksToAdvance), onUpdateNation);
        
        // Process construction projects
        if (onProcessConstructionTick) {
          onProcessConstructionTick();
        }
        
        // Check resource notifications for player nation
        const playerNation = context.nations.find(n => n.id === context.gameState.selectedNation);
        if (playerNation) {
          checkResourceNotifications(playerNation, context.gameState.currentDate);
        }
        
        // Run technology progression
        progressTechnology(context, Math.floor(weeksToAdvance), onUpdateNation);
        
        // Debug output every 10 weeks
        if (Math.floor(weeksToAdvance) > 0 && Math.random() < 0.1) {
          console.log(`Simulation tick: ${Math.floor(weeksToAdvance)} weeks advanced. Date: ${context.gameState.currentDate}`);
        }
        
        // Check for events (less frequently)
        if (now - lastEventCheckRef.current > 5000) { // Check every 5 seconds
          checkAndTriggerEvents(context, onUpdateProvince, onUpdateNation);
          lastEventCheckRef.current = now;
        }
        
        // AI decision making (with cooldown)
        processAIDecisions(context, aiDecisionCooldownRef.current, onUpdateNation, onUpdateProvince);
      }
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameState.isPaused, gameState.timeSpeed, safeProvinces.length, safeNations.length, onAdvanceTime, onUpdateProvince, onUpdateNation, onProcessConstructionTick]);
}

function simulateProvinces(
  context: SimulationContext,
  weeksElapsed: number,
  onUpdateProvince: (provinceId: string, updates: Partial<Province>) => void
) {
  // Safety checks
  if (!context.provinces || !Array.isArray(context.provinces)) {
    console.warn('Provinces data is invalid, skipping province simulation');
    return;
  }
  if (!context.nations || !Array.isArray(context.nations)) {
    console.warn('Nations data is invalid, skipping province simulation');
    return;
  }

  context.provinces.forEach(province => {
    if (!province) return;
    
    const updates: Partial<Province> = {};
    
    // Get the nation that owns this province
    const owningNation = context.nations.find(n => n.name === province.country);
    if (!owningNation) return;

    // 1. Population growth (yearly rate applied proportionally per week)
    const baseGrowthRate = 0.01; // 1% per year base rate
    const infrastructureBonus = ((province.infrastructure?.healthcare ?? 0) + (province.infrastructure?.education ?? 0)) * 0.001;
    const economicBonus = (province.economy?.gdpPerCapita ?? 0) > 50000 ? 0.002 : 
                         (province.economy?.gdpPerCapita ?? 0) > 30000 ? 0.001 : 0;
    const unrestPenalty = (province.unrest ?? 0) > 5 ? -0.002 : 0;
    
    // Technology effects on population growth
    const techLevel = owningNation.technology?.level ?? 0;
    const techBonus = techLevel > 8 ? 0.001 : techLevel > 6 ? 0.0005 : 0;
    
    const annualGrowthRate = baseGrowthRate + infrastructureBonus + economicBonus + unrestPenalty + techBonus;
    const weeklyGrowthRate = annualGrowthRate / 52;
    
    const populationGrowth = (province.population?.total ?? 0) * weeklyGrowthRate * weeksElapsed;
    if (Math.abs(populationGrowth) >= 1) {
      updates.population = {
        ...(province.population || { total: 0, ethnicGroups: [] }),
        total: Math.floor((province.population?.total ?? 0) + populationGrowth)
      };
    }

    // 2. GDP updates (based on population + infrastructure + technology)
    const infrastructureLevel = ((province.infrastructure?.roads ?? 0) + 
                               (province.infrastructure?.internet ?? 0) + 
                               (province.infrastructure?.healthcare ?? 0) + 
                               (province.infrastructure?.education ?? 0)) / 4;
    
    const baseGdpPerCapita = province.economy?.gdpPerCapita ?? 0;
    const techMultiplier = 1 + (techLevel - 5) * 0.05; // Technology boost/penalty
    const expectedGdpPerCapita = baseGdpPerCapita * (1 + (infrastructureLevel - 2.5) * 0.05) * techMultiplier;
    
    // GDP adjusts slowly toward expected value
    const gdpAdjustmentRate = 0.02;
    const gdpChange = (expectedGdpPerCapita - baseGdpPerCapita) * gdpAdjustmentRate * weeksElapsed;
    
    if (Math.abs(gdpChange) >= 10) {
      updates.economy = {
        ...(province.economy || { gdpPerCapita: 0, unemployment: 0, inflation: 0 }),
        gdpPerCapita: Math.max(1000, baseGdpPerCapita + gdpChange)
      };
    }

    // 3. Unrest changes based on multiple factors
    const monthsElapsed = weeksElapsed / 4.33;
    const currentGdp = updates.economy?.gdpPerCapita || (province.economy?.gdpPerCapita ?? 0);
    
    let unrestChange = 0;
    
    // Economic factors
    if (currentGdp < expectedGdpPerCapita * 0.95) {
      unrestChange += 0.1 * monthsElapsed;
    } else if (currentGdp > expectedGdpPerCapita * 1.05) {
      unrestChange -= 0.05 * monthsElapsed;
    }
    
    // Government approval effects
    if ((owningNation.government?.approval ?? 0) < 30) {
      unrestChange += 0.08 * monthsElapsed;
    } else if ((owningNation.government?.approval ?? 0) > 70) {
      unrestChange -= 0.03 * monthsElapsed;
    }
    
    // Military presence effects (if stationed units exist)
    if (province.military?.stationedUnits && Array.isArray(province.military.stationedUnits) && province.military.stationedUnits.length > 0) {
      const totalUnits = province.military.stationedUnits.reduce((sum, unit) => 
        sum + (unit && typeof unit === 'object' && unit.strength ? unit.strength : 50), 0);
      if (totalUnits > (province.population?.total ?? 0) / 1000) { // Heavy military presence
        unrestChange += 0.05 * monthsElapsed;
      }
    }
    
    if (Math.abs(unrestChange) > 0.01) {
      updates.unrest = Math.max(0, Math.min(10, (province.unrest ?? 0) + unrestChange));
    }

    // 4. Resource output changes based on technology and infrastructure
    const resourceUpdates: any = {};
    let resourcesChanged = false;
    
    // Energy output affected by technology
    const currentResearch = owningNation.technology?.currentResearch;
    if (Array.isArray(currentResearch) && (currentResearch.includes('Renewable Energy') || currentResearch.includes('Green Energy'))) {
      const energyBonus = Math.floor(10 * weeksElapsed);
      if (energyBonus > 0) {
        resourceUpdates.energy = (province.resourceOutput?.energy || 0) + energyBonus;
        resourcesChanged = true;
      }
    }
    
    // Technology output affected by infrastructure and tech level
    const internetLevel = province.infrastructure?.internet ?? 0;
    const educationLevel = province.infrastructure?.education ?? 0;
    if (internetLevel >= 3 && educationLevel >= 3) {
      const techBonus = Math.floor((internetLevel + educationLevel) * 2 * weeksElapsed);
      if (techBonus > 0) {
        resourceUpdates.technology = (province.resourceOutput?.technology || 0) + techBonus;
        resourcesChanged = true;
      }
    }
    
    if (resourcesChanged) {
      updates.resourceOutput = {
        ...(province.resourceOutput || {}),
        ...resourceUpdates
      };
    }

    // Random events affecting provinces
    if (Math.random() < 0.05 * weeksElapsed) { // 5% chance per week
      const randomEvents = [
        () => { // Local economic boom
          if (!updates.economy) updates.economy = { ...(province.economy || { gdpPerCapita: 0, unemployment: 0, inflation: 0 }) };
          updates.economy.gdpPerCapita = (updates.economy.gdpPerCapita || (province.economy?.gdpPerCapita ?? 0)) * 1.02;
          return "Economic activity increases in " + province.name;
        },
        () => { // Infrastructure improvement
          const infraTypes = ['roads', 'internet', 'healthcare', 'education'];
          const randomType = infraTypes[Math.floor(Math.random() * infraTypes.length)];
          if (!updates.infrastructure) updates.infrastructure = { ...(province.infrastructure || { roads: 0, internet: 0, healthcare: 0, education: 0 }) };
          (updates.infrastructure as any)[randomType] = Math.min(5, ((province.infrastructure as any)?.[randomType] ?? 0) + 0.1);
          return `Infrastructure improvement in ${province.name}: ${randomType}`;
        },
        () => { // Temporary unrest
          updates.unrest = Math.min(10, (province.unrest ?? 0) + 0.5);
          return `Minor civil disturbance in ${province.name}`;
        }
      ];
      
      const randomEvent = randomEvents[Math.floor(Math.random() * randomEvents.length)];
      const message = randomEvent();
      
      // Only show toast for player's nation
      if (province.country === context.gameState.selectedNation) {
        toast.info(message);
      }
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      onUpdateProvince(province.id, updates);
    }
  });
}

function simulateNations(
  context: SimulationContext,
  weeksElapsed: number,
  onUpdateNation: (nationId: string, updates: Partial<Nation>) => void
) {
  // Safety checks
  if (!context.nations || !Array.isArray(context.nations)) {
    console.warn('Nations data is invalid, skipping nation simulation');
    return;
  }
  if (!context.provinces || !Array.isArray(context.provinces)) {
    console.warn('Provinces data is invalid, skipping nation simulation');
    return;
  }

  context.nations.forEach(nation => {
    if (!nation) return;
    
    const updates: Partial<Nation> = {};
    
    // Get provinces belonging to this nation
    const nationProvinces = context.provinces.filter(p => p && p.country === nation.name);
    if (nationProvinces.length === 0) return;

    // Calculate aggregate metrics from provinces
    const totalPopulation = nationProvinces.reduce((sum, p) => sum + (p.population?.total ?? 0), 0);
    const avgUnrest = nationProvinces.reduce((sum, p) => sum + (p.unrest ?? 0), 0) / nationProvinces.length;
    const avgGdpPerCapita = totalPopulation > 0 ? 
      nationProvinces.reduce((sum, p) => sum + ((p.economy?.gdpPerCapita ?? 0) * (p.population?.total ?? 0)), 0) / totalPopulation : 0;

    // 1. Government approval changes based on multiple factors
    if (Math.random() < 0.3 * weeksElapsed) {
      let approvalChange = (Math.random() - 0.5) * 0.5; // Base random change
      
      // Economic conditions affect approval
      const economicFactor = (nation.economy?.inflation ?? 0) > 4 ? -0.4 : 
                           (nation.economy?.inflation ?? 0) < 2 ? 0.2 :
                           (nation.economy?.tradeBalance ?? 0) > 0 ? 0.3 : -0.2;
      
      // Unrest affects approval
      const unrestFactor = avgUnrest > 6 ? -0.5 : avgUnrest < 3 ? 0.3 : 0;
      
      // Technology progress affects approval
      const techFactor = (nation.technology?.level ?? 0) > 8 ? 0.2 : 
                        (nation.technology?.level ?? 0) < 4 ? -0.2 : 0;
      
      // Military strength relative to threats
      const militaryFactor = (nation.military?.equipment ?? 0) > 80 ? 0.1 : 
                           (nation.military?.equipment ?? 0) < 40 ? -0.3 : 0;
      
      const totalChange = (approvalChange + economicFactor + unrestFactor + techFactor + militaryFactor) * weeksElapsed;
      const newApproval = Math.max(0, Math.min(100, (nation.government?.approval ?? 0) + totalChange));
      
      updates.government = {
        ...(nation.government || { type: 'democracy' as const, leader: '', approval: 0, stability: 0 }),
        approval: newApproval
      };
      
      // Political stability is affected by approval changes
      const stabilityChange = totalChange * 0.3; // Stability changes more slowly
      if (Math.abs(stabilityChange) > 0.1) {
        updates.government = {
          ...updates.government,
          stability: Math.max(0, Math.min(100, (nation.government?.stability ?? 0) + stabilityChange))
        };
      }
    }

    // 2. National GDP update based on provincial GDP
    const expectedGdp = totalPopulation * avgGdpPerCapita;
    const gdpAdjustmentRate = 0.015; // 1.5% adjustment per week
    const gdpChange = (expectedGdp - (nation.economy?.gdp ?? 0)) * gdpAdjustmentRate * weeksElapsed;
    
    if (Math.abs(gdpChange) >= (nation.economy?.gdp ?? 0) * 0.001) {
      updates.economy = {
        ...(nation.economy || { gdp: 0, debt: 0, inflation: 0, tradeBalance: 0 }),
        gdp: Math.max((nation.economy?.gdp ?? 0) * 0.3, (nation.economy?.gdp ?? 0) + gdpChange)
      };
    }

    // 3. Inflation changes based on economic conditions
    if (Math.random() < 0.2 * weeksElapsed) {
      let inflationChange = (Math.random() - 0.5) * 0.1; // Base random change
      
      // High debt increases inflation pressure
      const debtRatio = (nation.economy?.debt ?? 0) / (nation.economy?.gdp ?? 1);
      if (debtRatio > 1.0) inflationChange += 0.05;
      else if (debtRatio > 0.6) inflationChange += 0.02;
      
      // Trade balance affects inflation
      if ((nation.economy?.tradeBalance ?? 0) < 0) inflationChange += 0.03;
      
      // Technology can help control inflation
      if ((nation.technology?.level ?? 0) > 7) inflationChange -= 0.02;
      
      const newInflation = Math.max(0, Math.min(15, (nation.economy?.inflation ?? 0) + inflationChange * weeksElapsed));
      if (!updates.economy) updates.economy = { ...(nation.economy || { gdp: 0, debt: 0, inflation: 0, tradeBalance: 0, treasury: 0 }) };
      updates.economy.inflation = newInflation;
    }

    // 4. Military equipment and manpower changes
    if (Math.random() < 0.15 * weeksElapsed) {
      const militaryBudgetRatio = (nation.economy?.gdp ?? 0) * 0.03; // Assume 3% of GDP on military
      const equipmentMaintenance = (nation.military?.equipment ?? 0) * 0.02; // 2% decay per week
      const equipmentProduction = Math.min(5, militaryBudgetRatio / 1000000000); // Production based on budget
      
      const netEquipmentChange = equipmentProduction - equipmentMaintenance;
      const newEquipment = Math.max(0, Math.min(100, (nation.military?.equipment ?? 0) + netEquipmentChange * weeksElapsed));
      
      updates.military = {
        ...(nation.military || { manpower: 0, equipment: 50, doctrine: 'Standard', nuclearCapability: false, readiness: 100 }),
        equipment: newEquipment
      };
      
      // Manpower changes based on population and recruitment
      const recruitmentRate = totalPopulation * 0.002; // 0.2% of population available for military
      const manpowerGain = Math.floor(recruitmentRate * weeksElapsed);
      if (manpowerGain > 0) {
        updates.military = {
          ...updates.military,
          manpower: (nation.military?.manpower ?? 0) + manpowerGain
        };
      }
    }

    // 5. Research progress with tech level effects
    const researchEfficiency = Math.max(0.5, avgGdpPerCapita / 50000);
    const techLevelBonus = 1 + ((nation.technology?.level ?? 5) - 5) * 0.1;
    const baseResearchGain = 25 * researchEfficiency * techLevelBonus * weeksElapsed;
    
    // Random research breakthroughs
    const breakthroughChance = 0.05 * weeksElapsed;
    const researchMultiplier = Math.random() < breakthroughChance ? 1.5 : 1.0;
    
    const researchGain = Math.floor(baseResearchGain * researchMultiplier);
    
    if (researchGain > 0) {
      updates.technology = {
        ...(nation.technology || { researchPoints: 0, currentResearch: [], completedTech: [], level: 1 }),
        researchPoints: (nation.technology?.researchPoints ?? 0) + researchGain
      };
      
      if (researchMultiplier > 1.0 && nation.name === context.gameState.selectedNation) {
        toast.success(`Research breakthrough in ${nation.name}! +${researchGain} research points`);
      }
    }

    // 6. Trade balance fluctuations
    if (Math.random() < 0.25 * weeksElapsed) {
      const tradeVolatility = (nation.economy?.gdp ?? 0) * 0.001; // 0.1% of GDP volatility
      const tradeChange = (Math.random() - 0.5) * tradeVolatility * 2;
      
      // Technology and infrastructure improve trade
      const techTradeBonus = (nation.technology?.level ?? 0) > 6 ? tradeVolatility * 0.1 : 0;
      
      const newTradeBalance = (nation.economy?.tradeBalance ?? 0) + tradeChange + techTradeBonus;
      if (!updates.economy) updates.economy = { ...(nation.economy || { gdp: 0, debt: 0, inflation: 0, tradeBalance: 0, treasury: 0 }) };
      updates.economy.tradeBalance = newTradeBalance;
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      onUpdateNation(nation.id, updates);
    }
  });
}

function progressTechnology(
  context: SimulationContext,
  weeksElapsed: number,
  onUpdateNation: (nationId: string, updates: Partial<Nation>) => void
) {
  // Safety checks
  if (!context.nations || !Array.isArray(context.nations)) {
    console.warn('Nations data is invalid, skipping technology progression');
    return;
  }
  if (!context.technologies || !Array.isArray(context.technologies)) {
    console.warn('Technologies data is invalid, skipping technology progression');
    return;
  }

  context.nations.forEach(nation => {
    if (!nation) return;
    
    const updates: Partial<Nation> = {};
    
    // Check if current research can be completed
    const currentResearch = nation.technology?.currentResearch;
    if (currentResearch && Array.isArray(currentResearch) && currentResearch.length > 0) {
      const currentTech = currentResearch[0];
      const techData = Array.isArray(context.technologies) ? context.technologies.find(t => t && t.name === currentTech) : undefined;
      
      if (techData && (nation.technology?.researchPoints ?? 0) >= techData.researchCost) {
        // Complete the technology
        const researchCopy = [...currentResearch];
        const completedTech = researchCopy.shift();
        const newLevel = Math.min(10, (nation.technology?.level ?? 1) + 0.5);
        
        updates.technology = {
          ...(nation.technology || { researchPoints: 0, currentResearch: [], completedTech: [], level: 1 }),
          level: newLevel,
          researchPoints: (nation.technology?.researchPoints ?? 0) - techData.researchCost,
          currentResearch: researchCopy,
          completedTech: [...(nation.technology?.completedTech ?? []), completedTech!]
        };
        
        if (nation.name === context.gameState.selectedNation) {
          toast.success(`Technology completed: ${completedTech}`);
        }
        
        // Check for available follow-up technologies
        const technologies = Array.isArray(context.technologies) ? context.technologies : [];
        const availableTechs = technologies.filter(tech => 
          tech && tech.yearAvailable <= new Date(context.gameState.currentDate).getFullYear() &&
          !(updates.technology?.completedTech ?? []).includes(tech.name) &&
          !(updates.technology?.currentResearch ?? []).includes(tech.name) &&
          Array.isArray(tech.prerequisites) && tech.prerequisites.every(prereq => prereq && (updates.technology?.completedTech ?? []).includes(prereq))
        );
        
        // Auto-select next research if none queued and techs available
        if ((updates.technology?.currentResearch?.length ?? 0) === 0 && availableTechs.length > 0) {
          // AI picks research based on nation priorities
          const selectedTech = selectNextResearch(nation, availableTechs);
          if (selectedTech && updates.technology) {
            updates.technology.currentResearch = [...(updates.technology.currentResearch || []), selectedTech.name];
          }
        }
      }
    }
    
    // Auto-start research if none active
    const activeResearch = nation.technology?.currentResearch;
    if (!activeResearch || !Array.isArray(activeResearch) || activeResearch.length === 0) {
      const currentYear = new Date(context.gameState.currentDate).getFullYear();
      const technologies = Array.isArray(context.technologies) ? context.technologies : [];
      const availableTechs = technologies.filter(tech => 
        tech && tech.yearAvailable <= currentYear &&
        !(nation.technology?.completedTech ?? []).includes(tech.name) &&
        Array.isArray(tech.prerequisites) && tech.prerequisites.every(prereq => prereq && (nation.technology?.completedTech ?? []).includes(prereq))
      );
      
      if (availableTechs.length > 0) {
        const selectedTech = selectNextResearch(nation, availableTechs);
        if (selectedTech) {
          updates.technology = {
            ...(nation.technology || { researchPoints: 0, currentResearch: [], completedTech: [], level: 1 }),
            currentResearch: [selectedTech.name]
          };
        }
      }
    }
    
    if (Object.keys(updates).length > 0) {
      onUpdateNation(nation.id, updates);
    }
  });
}

function selectNextResearch(nation: Nation, availableTechs: Technology[]): Technology | null {
  if (!Array.isArray(availableTechs) || availableTechs.length === 0) return null;
  
  // AI research priorities based on nation characteristics
  const priorities: Record<string, number> = {
    computing: 1.0,
    energy: 1.0,
    manufacturing: 1.0,
    military: 1.0,
    space: 1.0,
    medical: 1.0
  };
  
  // Adjust priorities based on nation conditions
  if ((nation.military?.equipment ?? 0) < 60) {
    priorities.military = 2.0; // Prioritize military tech if equipment is low
  }
  
  if ((nation.economy?.inflation ?? 0) > 4) {
    priorities.manufacturing = 1.5; // Focus on efficiency
  }
  
  if ((nation.government?.approval ?? 0) < 50) {
    priorities.medical = 1.3; // Improve quality of life
    priorities.energy = 1.3;
  }
  
  // Score technologies based on priorities
  const scoredTechs = availableTechs.filter(tech => tech).map(tech => ({
    tech,
    score: (priorities[tech.category] || 1.0) * Math.random()
  }));
  
  // Return highest scored technology
  return scoredTechs.sort((a, b) => b.score - a.score)[0]?.tech || null;
}

function checkAndTriggerEvents(
  context: SimulationContext,
  onUpdateProvince: (provinceId: string, updates: Partial<Province>) => void,
  onUpdateNation: (nationId: string, updates: Partial<Nation>) => void
) {
  const currentYear = new Date(context.gameState.currentDate).getFullYear();
  const currentDate = new Date(context.gameState.currentDate);
  
  if (!Array.isArray(context.events)) {
    console.warn('Events data is invalid, skipping event checking');
    return;
  }
  
  context.events.forEach(event => {
    if (!event || !Array.isArray(event.triggerConditions)) {
      return;
    }
    
    // Check trigger conditions
    let shouldTrigger = true;
    
    for (const condition of event.triggerConditions) {
      if (!condition) continue;
      
      switch (condition.type) {
        case 'tech_level':
          const nation = Array.isArray(context.nations) ? context.nations.find(n => n && n.id === condition.target) : undefined;
          if (!nation || (nation.technology?.level ?? 0) < (condition.threshold ?? 0)) {
            shouldTrigger = false;
          }
          break;
          
        case 'random':
          if (Math.random() > (condition.probability ?? 0)) {
            shouldTrigger = false;
          }
          break;
          
        case 'season':
          const month = currentDate.getMonth();
          const season = month >= 2 && month <= 4 ? 'spring' :
                        month >= 5 && month <= 7 ? 'summer' :
                        month >= 8 && month <= 10 ? 'autumn' : 'winter';
          if (season !== condition.value) {
            shouldTrigger = false;
          }
          break;
          
        case 'province_unrest':
          const province = Array.isArray(context.provinces) ? context.provinces.find(p => p && p.id === condition.target) : undefined;
          if (!province || (province.unrest ?? 0) < (condition.threshold ?? 0)) {
            shouldTrigger = false;
          }
          break;
          
        case 'diplomatic_status':
          if (condition.nations && Array.isArray(condition.nations) && condition.nations.length >= 2 && condition.status === 'allied') {
            const nation1 = Array.isArray(context.nations) ? context.nations.find(n => n && n.id === condition.nations![0]) : undefined;
            const nation2 = Array.isArray(context.nations) ? context.nations.find(n => n && n.id === condition.nations![1]) : undefined;
            if (!nation1 || !nation2 || 
                !Array.isArray(nation1.diplomacy?.allies) || !nation1.diplomacy.allies.includes(nation2.name) ||
                !Array.isArray(nation2.diplomacy?.allies) || !nation2.diplomacy.allies.includes(nation1.name)) {
              shouldTrigger = false;
            }
          }
          break;
      }
      
      if (!shouldTrigger) break;
    }
    
    if (shouldTrigger) {
      // Trigger the event
      triggerEvent(event, context, onUpdateProvince, onUpdateNation);
    }
  });
}

function triggerEvent(
  event: GameEvent,
  context: SimulationContext,
  onUpdateProvince: (provinceId: string, updates: Partial<Province>) => void,
  onUpdateNation: (nationId: string, updates: Partial<Nation>) => void
) {
  if (!event || !Array.isArray(event.effects)) {
    return;
  }
  
  // Apply immediate effects
  event.effects.forEach(effect => {
    if (!effect || !effect.target) return;
    
    if (effect.target.includes('_')) {
      // Province effect
      const province = Array.isArray(context.provinces) ? context.provinces.find(p => p && p.id === effect.target) : undefined;
      if (province) {
        const updates = applyEffectToProvince(province, effect);
        if (Object.keys(updates).length > 0) {
          onUpdateProvince(province.id, updates);
        }
      }
    } else {
      // Nation effect
      const nation = Array.isArray(context.nations) ? context.nations.find(n => n && n.id === effect.target) : undefined;
      if (nation) {
        const updates = applyEffectToNation(nation, effect);
        if (Object.keys(updates).length > 0) {
          onUpdateNation(nation.id, updates);
        }
      }
    }
  });
  
  // Show notification to player if it affects their nation or provinces
  const affectedProvinces = event.affectedProvinces || [];
  const provinces = Array.isArray(context.provinces) ? context.provinces : [];
  const playerProvinces = provinces.filter(p => 
    p && p.country === context.gameState.selectedNation && 
    affectedProvinces.includes(p.id)
  );
  
  if (playerProvinces.length > 0) {
    toast.info(`Event: ${event.title}`, {
      description: event.description,
      duration: 10000
    });
  }
}

function applyEffectToProvince(province: Province, effect: any): Partial<Province> {
  const updates: Partial<Province> = {};
  
  switch (effect.property) {
    case 'economy.gdp_per_capita':
      updates.economy = {
        ...province.economy,
        gdpPerCapita: province.economy.gdpPerCapita + effect.change
      };
      break;
      
    case 'unrest':
      updates.unrest = Math.max(0, Math.min(10, province.unrest + effect.change));
      break;
      
    case 'resource_output.technology':
      updates.resourceOutput = {
        ...province.resourceOutput,
        technology: (province.resourceOutput.technology || 0) + effect.change
      };
      break;
      
    case 'resource_output.energy':
      updates.resourceOutput = {
        ...province.resourceOutput,
        energy: (province.resourceOutput.energy || 0) + effect.change
      };
      break;
  }
  
  return updates;
}

function applyEffectToNation(nation: Nation, effect: any): Partial<Nation> {
  const updates: Partial<Nation> = {};
  
  switch (effect.property) {
    case 'technology.research_points':
      updates.technology = {
        ...(nation.technology || { researchPoints: 0, currentResearch: [], completedTech: [], level: 1 }),
        researchPoints: (nation.technology?.researchPoints ?? 0) + effect.change
      };
      break;
      
    case 'economy.debt':
      updates.economy = {
        ...(nation.economy || { gdp: 0, debt: 0, inflation: 0, tradeBalance: 0, treasury: 0 }),
        debt: Math.max(0, (nation.economy?.debt ?? 0) + effect.change)
      };
      break;
      
    case 'government.approval':
      updates.government = {
        ...(nation.government || { type: 'democracy', leader: 'Unknown', approval: 50, stability: 50 }),
        approval: Math.max(0, Math.min(100, (nation.government?.approval ?? 0) + effect.change))
      };
      break;
      
    case 'government.stability':
      updates.government = {
        ...(nation.government || { type: 'democracy', leader: 'Unknown', approval: 50, stability: 50 }),
        stability: Math.max(0, Math.min(100, (nation.government?.stability ?? 0) + effect.change))
      };
      break;
      
    case 'military.equipment':
      updates.military = {
        ...(nation.military || { manpower: 0, equipment: 50, doctrine: 'Standard', nuclearCapability: false, readiness: 100 }),
        equipment: Math.max(0, Math.min(100, (nation.military?.equipment ?? 0) + effect.change))
      };
      break;
  }
  
  return updates;
}

function processAIDecisions(
  context: SimulationContext,
  cooldowns: Map<string, number>,
  onUpdateNation: (nationId: string, updates: Partial<Nation>) => void,
  onUpdateProvince: (provinceId: string, updates: Partial<Province>) => void
) {
  const now = Date.now();
  
  if (!Array.isArray(context.nations)) {
    console.warn('Nations data is invalid, skipping AI decisions');
    return;
  }
  
  context.nations.forEach(nation => {
    if (!nation) return;
    
    // Skip player nation
    if (nation.name === context.gameState.selectedNation) return;
    
    // Check cooldown
    const lastDecision = cooldowns.get(nation.id) || 0;
    if (now - lastDecision < 30000) return; // 30 second cooldown
    
    // Make AI decision
    makeAIDecision(nation, context, onUpdateNation, onUpdateProvince);
    cooldowns.set(nation.id, now);
  });
}

function makeAIDecision(
  nation: Nation,
  context: SimulationContext,
  onUpdateNation: (nationId: string, updates: Partial<Nation>) => void,
  onUpdateProvince: (provinceId: string, updates: Partial<Province>) => void
) {
  if (!nation) return;
  
  const provinces = Array.isArray(context.provinces) ? context.provinces : [];
  const nationProvinces = provinces.filter(p => p && p.country === nation.name);
  const avgUnrest = nationProvinces.length > 0 ? 
    nationProvinces.reduce((sum, p) => sum + (p.unrest ?? 0), 0) / nationProvinces.length : 0;
  
  // Decision matrix based on current conditions
  const decisions: Array<{
    type: string;
    action: string;
    priority: number;
    execute: () => void;
  }> = [];
  
  // Economic decisions
  if ((nation.economy?.inflation ?? 0) > 5) {
    decisions.push({
      type: 'economic_policy',
      action: 'reduce_inflation',
      priority: 0.8,
      execute: () => {
        const updates: Partial<Nation> = {
          economy: {
            ...(nation.economy || { gdp: 0, debt: 0, inflation: 0, tradeBalance: 0 }),
            inflation: Math.max(0, (nation.economy?.inflation ?? 0) - 0.5),
            debt: (nation.economy?.debt ?? 0) * 1.02 // Cost of intervention
          }
        };
        onUpdateNation(nation.id, updates);
        
        if (Math.random() < 0.3) {
          toast.info(`${nation.name} implements anti-inflation measures`);
        }
      }
    });
  }
  
  // Military decisions
  if ((nation.military?.equipment ?? 0) < 50) {
    decisions.push({
      type: 'military_buildup',
      action: 'increase_equipment',
      priority: 0.6,
      execute: () => {
        const updates: Partial<Nation> = {
          military: {
            ...(nation.military || { manpower: 0, equipment: 0, doctrine: '', nuclearCapability: false }),
            equipment: Math.min(100, (nation.military?.equipment ?? 0) + 5)
          },
          economy: {
            ...(nation.economy || { gdp: 0, debt: 0, inflation: 0, tradeBalance: 0 }),
            debt: (nation.economy?.debt ?? 0) + (nation.economy?.gdp ?? 0) * 0.01 // 1% of GDP
          }
        };
        onUpdateNation(nation.id, updates);
        
        if (Math.random() < 0.2) {
          toast.info(`${nation.name} increases military spending`);
        }
      }
    });
  }
  
  // Unrest management
  if (avgUnrest > 6) {
    decisions.push({
      type: 'domestic_policy',
      action: 'address_unrest',
      priority: 0.9,
      execute: () => {
        // Reduce unrest in worst affected provinces
        const worstProvinces = nationProvinces
          .filter(p => p && (p.unrest ?? 0) > 5)
          .sort((a, b) => (b.unrest ?? 0) - (a.unrest ?? 0))
          .slice(0, 2);
          
        worstProvinces.forEach(province => {
          if (!province) return;
          const updates: Partial<Province> = {
            unrest: Math.max(0, (province.unrest ?? 0) - 1.5)
          };
          onUpdateProvince(province.id, updates);
        });
        
        // Cost to nation
        const nationUpdates: Partial<Nation> = {
          economy: {
            ...(nation.economy || { gdp: 0, debt: 0, inflation: 0, tradeBalance: 0 }),
            debt: (nation.economy?.debt ?? 0) + (nation.economy?.gdp ?? 0) * 0.005 // 0.5% of GDP
          }
        };
        onUpdateNation(nation.id, nationUpdates);
        
        if (Math.random() < 0.4) {
          toast.info(`${nation.name} implements domestic reforms`);
        }
      }
    });
  }
  
  // Select and execute highest priority decision
  if (decisions.length > 0) {
    const selectedDecision = decisions.sort((a, b) => b.priority - a.priority)[0];
    if (Math.random() < selectedDecision.priority) {
      selectedDecision.execute();
    }
  }
}

// Validation function for building placement based on features
export function validateBuildingPlacement(buildingId: string, province: Province, nation: Nation): { valid: boolean; reason?: string } {
  const building = getBuildingById(buildingId);
  if (!building) {
    return { valid: false, reason: 'Building not found' };
  }

  // Check feature requirements
  if (building.requiresFeatures && Array.isArray(building.requiresFeatures) && building.requiresFeatures.length > 0) {
    const missingFeatures = building.requiresFeatures.filter(feature => 
      !(province.features && Array.isArray(province.features) && province.features.includes(feature))
    );
    
    if (missingFeatures.length > 0) {
      return { 
        valid: false, 
        reason: `Province lacks required features: ${missingFeatures.join(', ')}` 
      };
    }
  }

  // Check infrastructure requirements
  if (building.requirements?.infrastructure && province.infrastructure.roads < building.requirements.infrastructure) {
    return { 
      valid: false, 
      reason: `Insufficient infrastructure level (requires ${building.requirements?.infrastructure}, has ${province.infrastructure.roads})` 
    };
  }

  // Check technology requirements
  if (building.requirements?.technology && !(nation.technology?.completedTech && Array.isArray(nation.technology.completedTech) && nation.technology.completedTech.includes(building.requirements.technology))) {
    return { 
      valid: false, 
      reason: `Missing required technology: ${building.requirements?.technology}` 
    };
  }

  // Check if building already exists (for unique buildings)
  const existingBuilding = province.buildings && Array.isArray(province.buildings) ? province.buildings.find(b => b.buildingId === buildingId) : undefined;
  if (existingBuilding) {
    return { 
      valid: false, 
      reason: `${building.name} already exists in this province` 
    };
  }

  // Check if already under construction
  const underConstruction = province.constructionProjects && Array.isArray(province.constructionProjects) ? province.constructionProjects.find(p => 
    p.buildingId === buildingId && p.status === 'in_progress'
  ) : undefined;
  if (underConstruction) {
    return { 
      valid: false, 
      reason: `${building.name} is already under construction` 
    };
  }

  return { valid: true };
}

// Resource system processing
function processResourceSystem(
  context: SimulationContext,
  weeksElapsed: number,
  onUpdateProvince: (provinceId: string, updates: Partial<Province>) => void,
  onUpdateNation: (nationId: string, updates: Partial<Nation>) => void
) {
  // Safety checks
  if (!context.nations || !Array.isArray(context.nations)) {
    console.warn('Nations data is invalid, skipping resource system processing');
    return;
  }
  if (!context.provinces || !Array.isArray(context.provinces)) {
    console.warn('Provinces data is invalid, skipping resource system processing');
    return;
  }

  context.nations.forEach(nation => {
    if (!nation) return;
    
    const nationProvinces = Array.isArray(context.provinces) ? 
      context.provinces.filter(p => p && p.country === nation.name) : [];
    const updates: Partial<Nation> = {};
    
    // Initialize resource system if not present
    if (!nation.resourceStockpiles) {
      // Initialize with basic starting stockpiles
      const startingStockpiles: Record<string, number> = {};
      if (resourcesData && typeof resourcesData === 'object') {
        Object.keys(resourcesData).forEach(resourceId => {
          // Give starting stockpiles based on resource type
          switch (resourceId) {
            case 'food':
              startingStockpiles[resourceId] = 10000; // 10,000 tons
              break;
            case 'water':
              startingStockpiles[resourceId] = 1000000; // 1M liters
              break;
            case 'manpower':
              startingStockpiles[resourceId] = 100000; // 100k people
              break;
            case 'electricity':
              startingStockpiles[resourceId] = 5000; // 5000 MWh
              break;
            case 'oil':
              startingStockpiles[resourceId] = 1000; // 1000 barrels
              break;
            case 'steel':
              startingStockpiles[resourceId] = 500; // 500 tons
              break;
            default:
              startingStockpiles[resourceId] = 100; // Default amount
          }
        });
      }
      
      updates.resourceStockpiles = startingStockpiles;
      updates.resourceProduction = {};
      updates.resourceConsumption = {};
      updates.resourceShortages = {};
      updates.resourceEfficiency = { overall: 1.0 };
    }
    
    const newStockpiles = { ...nation.resourceStockpiles };
    const newProduction = { ...nation.resourceProduction };
    const newConsumption = { ...nation.resourceConsumption };
    const newShortages = { ...nation.resourceShortages };
    const efficiency = nation.resourceEfficiency?.overall || 1;
    
    // Reset production/consumption for recalculation
    if (resourcesData && typeof resourcesData === 'object') {
      Object.keys(resourcesData).forEach(resourceId => {
        newProduction[resourceId] = 0;
        newConsumption[resourceId] = 0;
        newShortages[resourceId] = 0;
      });
    }
    
    // Calculate production and consumption from buildings with efficiency effects
    nationProvinces.forEach(province => {
      if (!province?.buildings || !Array.isArray(province.buildings)) {
        return;
      }
      
      // Debug logging for food production
      if (nation.id === context.gameState.selectedNation) {
        const foodBuildings = province.buildings.filter(b => {
          const building = getBuildingById(b.buildingId);
          return building && building.produces && building.produces.food;
        });
        
        if (foodBuildings.length > 0) {
          console.log(`Food production in ${province.name}:`, foodBuildings);
        }
      }
      
      province.buildings.forEach(building => {
        if (!building) return;
        
        const buildingData = getBuildingById(building.buildingId);
        if (!buildingData) return;
      
      // Ensure building has proper level
      const buildingLevel = building.level || 1;
      const buildingEfficiency = (building.efficiency || 1) * efficiency;
      
      // Check if building can operate (has required inputs)
      let canOperate = true;
      const requiredInputs: Record<string, number> = {};
      
      if (buildingData.consumes && typeof buildingData.consumes === 'object') {
        Object.entries(buildingData.consumes).forEach(([resourceId, amount]) => {
          if (typeof amount === 'number') {
            const requiredAmount = amount * buildingLevel * weeksElapsed;
            requiredInputs[resourceId] = requiredAmount;
            
            // Check if we have enough stockpiles to operate
            const available = newStockpiles[resourceId] || 0;
            if (available < requiredAmount) {
              canOperate = false;
              
              // Debug logging for failed buildings
              if (nation.id === context.gameState.selectedNation && buildingData.produces && buildingData.produces.food) {
                console.log(`Food building ${buildingData.name} in ${province.name} cannot operate: needs ${requiredAmount} ${resourceId}, has ${available}`);
              }
            }
          }
        });
      }
      
      if (canOperate) {
        // Building can operate - consume resources and produce outputs
        Object.entries(requiredInputs).forEach(([resourceId, amount]) => {
          newConsumption[resourceId] = (newConsumption[resourceId] || 0) + amount;
          newStockpiles[resourceId] = Math.max(0, (newStockpiles[resourceId] || 0) - amount);
        });
        
        // Add production (affected by efficiency)
        if (buildingData.produces && typeof buildingData.produces === 'object') {
          Object.entries(buildingData.produces).forEach(([resourceId, amount]) => {
            if (typeof amount === 'number') {
              const producedAmount = amount * buildingLevel * weeksElapsed * buildingEfficiency;
              newProduction[resourceId] = (newProduction[resourceId] || 0) + producedAmount;
              
              // Debug logging for food production
              if (nation.id === context.gameState.selectedNation && resourceId === 'food') {
                console.log(`Food produced in ${province.name}: ${producedAmount} by ${buildingData.name}`);
              }
            }
          });
        }
      } else {
        // Building cannot operate - reduce production proportionally
        const efficiencyRatio = Math.min(1, 
          Math.min(...Object.entries(requiredInputs).map(([resourceId, amount]) => {
            const available = newStockpiles[resourceId] || 0;
            return amount > 0 ? available / amount : 1;
          }))
        );
        
        // Consume proportionally
        Object.entries(requiredInputs).forEach(([resourceId, amount]) => {
          const consumedAmount = amount * efficiencyRatio;
          newConsumption[resourceId] = (newConsumption[resourceId] || 0) + consumedAmount;
          newStockpiles[resourceId] = Math.max(0, (newStockpiles[resourceId] || 0) - consumedAmount);
        });
        
        // Produce at reduced efficiency
        if (buildingData.produces && typeof buildingData.produces === 'object') {
          Object.entries(buildingData.produces).forEach(([resourceId, amount]) => {
            if (typeof amount === 'number') {
              const producedAmount = amount * buildingLevel * weeksElapsed * efficiencyRatio * buildingEfficiency;
              newProduction[resourceId] = (newProduction[resourceId] || 0) + producedAmount;
              
              // Debug logging for food production
              if (nation.id === context.gameState.selectedNation && resourceId === 'food') {
                console.log(`Food produced in ${province.name} at ${efficiencyRatio * 100}% efficiency: ${producedAmount} by ${buildingData.name}`);
              }
            }
          });
        }
        
        // Update building efficiency for display
        const provinceUpdates: Partial<Province> = {
          buildings: (province.buildings || []).map(b => 
            b && b.buildingId === building.buildingId 
              ? { ...b, efficiency: efficiencyRatio * buildingEfficiency }
              : b
          )
        };
        onUpdateProvince(province.id, provinceUpdates);
      }
    });
    
    // Add production from resource deposits
    if (province.resourceDeposits && typeof province.resourceDeposits === 'object') {
      Object.entries(province.resourceDeposits).forEach(([resourceId, depositAmount]) => {
        if (typeof depositAmount === 'number' && depositAmount > 0) {
          // Base extraction rate is 10% of deposit per week
          const extractionRate = Math.min(depositAmount * 0.1, depositAmount);
          newProduction[resourceId] = (newProduction[resourceId] || 0) + extractionRate * weeksElapsed;
        }
      });
    }
  });
    
  // Calculate base resource production
  newProduction.manpower = (newProduction.manpower || 0) + (nation.demographics?.population || 0) * 0.001 * weeksElapsed; // 0.1% of population per week
  newProduction.research = (newProduction.research || 0) + (nation.technology?.researchPoints ?? 0) * 0.1 * weeksElapsed;
  
  // Calculate base consumption
  const totalPopulation = nationProvinces.reduce((sum, p) => sum + (p.population?.total || 0), 0);
  newConsumption.food = (newConsumption.food || 0) + totalPopulation * 0.01 * weeksElapsed; // 1% of population per week
  newConsumption.consumer_goods = (newConsumption.consumer_goods || 0) + totalPopulation * 0.005 * weeksElapsed;
  
  // Calculate shortages and apply net change to stockpiles
  if (resourcesData && typeof resourcesData === 'object') {
    Object.keys(resourcesData).forEach(resourceId => {
      const production = newProduction[resourceId] || 0;
      const consumption = newConsumption[resourceId] || 0;
      const netChange = production - consumption;
      const oldStockpile = newStockpiles[resourceId] || 0;
      newStockpiles[resourceId] = Math.max(0, oldStockpile + netChange);
      
      // Debug logging for food specifically
      if (nation.id === context.gameState.selectedNation && resourceId === 'food') {
        console.log(`Food summary for ${nation.name}:`);
        console.log(`- Production: ${production}`);
        console.log(`- Consumption: ${consumption}`);
        console.log(`- Net change: ${netChange}`);
        console.log(`- Old stockpile: ${oldStockpile}`);
        console.log(`- New stockpile: ${newStockpiles[resourceId]}`);
      }
      
      // Calculate shortage severity
      if (consumption > 0) {
        const weeksOfSupply = newStockpiles[resourceId] / consumption;
        if (weeksOfSupply < 8) { // Less than 8 weeks supply
          newShortages[resourceId] = Math.max(0, 1 - weeksOfSupply / 8);
        } else {
          newShortages[resourceId] = 0;
        }
      } else {
        newShortages[resourceId] = 0;
      }
    });
  }
  
  // Apply shortage effects
  const shortageEffects = calculateResourceShortageEffects({
    ...nation,
    resourceShortages: newShortages
  });
  
  // Apply effects to nation
  const nationEffects = applyShortageEffectsToNation(nation, shortageEffects);
  Object.assign(updates, nationEffects);
  
  // Apply effects to provinces
  const provinceEffects = applyShortageEffectsToProvinces(
    nationProvinces, 
    { ...nation, resourceShortages: newShortages }, 
    shortageEffects
  );
  
  provinceEffects.forEach(({ id, ...provinceUpdates }) => {
    if (id) {
      onUpdateProvince(id, provinceUpdates);
    }
  });
  
  // Update nation resources
  updates.resourceStockpiles = newStockpiles;
  updates.resourceProduction = newProduction;
  updates.resourceConsumption = newConsumption;
  updates.resourceShortages = newShortages;
  
  if (Object.keys(updates).length > 0) {
    onUpdateNation(nation.id, updates);
  }
  });
}

// Trade system processing
function processTradeSystem(
  context: SimulationContext,
  weeksElapsed: number,
  onUpdateNation: (nationId: string, updates: Partial<Nation>) => void
) {
  // Safety checks
  if (!context.nations || !Array.isArray(context.nations)) {
    console.warn('Nations data is invalid, skipping trade system processing');
    return;
  }

  // Process existing trade agreements
  const nations = Array.isArray(context.nations) ? context.nations : [];
  nations.forEach(nation => {
    if (!nation) return;
    
    const tradeAgreements = nation.tradeAgreements;
    if (!tradeAgreements || !Array.isArray(tradeAgreements) || tradeAgreements.length === 0) return;
    
    const updates: Partial<Nation> = {};
    const updatedAgreements = [...tradeAgreements];
    
    tradeAgreements.forEach((agreement, index) => {
      if (!agreement || agreement.status !== 'active') return;
      
      // Execute trade agreement
      const tradeResult = executeTradeAgreement(agreement, nations);
      
      if (tradeResult.success) {
        // Apply resource updates
        if (tradeResult.updates && Array.isArray(tradeResult.updates)) {
          tradeResult.updates.forEach(({ nationId, updates: nationUpdates }) => {
            if (!nationId || !nationUpdates) return;
            
            if (nationId === nation.id) {
              // Merge stockpile updates
              updates.resourceStockpiles = {
                ...(updates.resourceStockpiles || nation.resourceStockpiles || {}),
                ...(nationUpdates.resourceStockpiles || {})
              };
            } else {
              // Update other nation
              onUpdateNation(nationId, nationUpdates);
            }
          });
        }
      } else {
        // Trade failed - suspend agreement
        if (updatedAgreements[index]) {
          updatedAgreements[index] = { ...agreement, status: 'suspended' };
        }
        
        if (nation.id === context.gameState.selectedNation) {
          const partnerNation = nations.find(n => 
            n && agreement.nations && Array.isArray(agreement.nations) && 
            agreement.nations.includes(n.id) && n.id !== nation.id
          );
          sendTradeNotification('agreement_expired', {
            toNation: partnerNation?.name || 'Unknown'
          });
        }
      }
      
      // Decrease agreement duration
      if (updatedAgreements[index]) {
        updatedAgreements[index] = {
          ...updatedAgreements[index],
          duration: Math.max(0, updatedAgreements[index].duration - weeksElapsed)
        };
        
        // Expire agreement if duration is up
        if (updatedAgreements[index].duration <= 0) {
          updatedAgreements[index] = { ...updatedAgreements[index], status: 'cancelled' };
        }
      }
    });
    
    updates.tradeAgreements = updatedAgreements;
    
    if (Object.keys(updates).length > 0) {
      onUpdateNation(nation.id, updates);
    }
  });
  
  // Generate AI trade offers periodically
  if (Math.random() < 0.1 * weeksElapsed) { // 10% chance per week
    const nations = Array.isArray(context.nations) ? context.nations : [];
    nations.forEach(nation => {
      if (!nation) return;
      
      // Skip player nation for AI trade offers
      if (nation.id === context.gameState.selectedNation) return;
      
      const potentialPartners = nations.filter(n => 
        n && n.id !== nation.id && 
        (!Array.isArray(nation.diplomacy?.enemies) || !nation.diplomacy.enemies.includes(n.id)) &&
        (!Array.isArray(nation.diplomacy?.embargoes) || !nation.diplomacy.embargoes.includes(n.id))
      );
      
      const tradeOffer = generateAITradeOffer(nation, potentialPartners);
      
      if (tradeOffer) {
        // Add offer to offering nation
        const offerUpdates: Partial<Nation> = {
          tradeOffers: [...(nation.tradeOffers && Array.isArray(nation.tradeOffers) ? nation.tradeOffers : []), tradeOffer]
        };
        onUpdateNation(nation.id, offerUpdates);
        
        // Notify if offer is to player
        if (tradeOffer.toNation === context.gameState.selectedNation) {
          const resourceNames = Object.keys(tradeOffer.offering || {}).map(id => resourcesData[id]?.name).filter(Boolean);
          sendTradeNotification('offer_received', {
            fromNation: nation.name,
            resources: resourceNames
          });
        }
        
        // Auto-evaluate AI response for AI-to-AI offers
        const targetNation = nations.find(n => n && n.id === tradeOffer.toNation);
        if (targetNation && targetNation.id !== context.gameState.selectedNation) {
          const evaluation = evaluateTradeOfferAI(targetNation, tradeOffer);
          
          if (evaluation.shouldAccept) {
            // Accept trade offer
            const agreement = acceptTradeOffer(tradeOffer, targetNation);
            
            // Update both nations
            const offeringNationUpdates: Partial<Nation> = {
              tradeOffers: (nation.tradeOffers && Array.isArray(nation.tradeOffers) ? nation.tradeOffers : []).filter(o => o && o.id !== tradeOffer.id),
              tradeAgreements: [...(nation.tradeAgreements && Array.isArray(nation.tradeAgreements) ? nation.tradeAgreements : []), agreement]
            };
            
            const acceptingNationUpdates: Partial<Nation> = {
              tradeAgreements: [...(targetNation.tradeAgreements && Array.isArray(targetNation.tradeAgreements) ? targetNation.tradeAgreements : []), agreement]
            };
            
            onUpdateNation(nation.id, offeringNationUpdates);
            onUpdateNation(targetNation.id, acceptingNationUpdates);
            
            // Notify if either nation is player
            if (nation.id === context.gameState.selectedNation) {
              sendTradeNotification('offer_accepted', {
                toNation: targetNation.name
              });
            }
          } else {
            // Reject trade offer
            const offeringNationUpdates: Partial<Nation> = {
              tradeOffers: (nation.tradeOffers && Array.isArray(nation.tradeOffers) ? nation.tradeOffers : []).filter(o => o && o.id !== tradeOffer.id)
            };
            onUpdateNation(nation.id, offeringNationUpdates);
            
            if (nation.id === context.gameState.selectedNation) {
              sendTradeNotification('offer_rejected', {
                toNation: targetNation.name,
                reason: evaluation.reason
              });
            }
          }
        }
      }
    });
  }
}