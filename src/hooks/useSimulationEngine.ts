import { useEffect, useRef } from 'react';
import { GameState, Province, Nation, GameEvent, Technology } from '../lib/types';
import { sampleProvinces, sampleNations, sampleEvents, sampleTechnologies, getBuildingById } from '../lib/gameData';
import { toast } from 'sonner';

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

  useEffect(() => {
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
          provinces,
          nations,
          events: sampleEvents,
          technologies: sampleTechnologies
        };

        // Run core simulation systems
        simulateProvinces(context, Math.floor(weeksToAdvance), onUpdateProvince);
        simulateNations(context, Math.floor(weeksToAdvance), onUpdateNation);
        
        // Process construction projects
        if (onProcessConstructionTick) {
          onProcessConstructionTick();
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
  }, [gameState.isPaused, gameState.timeSpeed, provinces, nations, onAdvanceTime, onUpdateProvince, onUpdateNation, onProcessConstructionTick]);
}

function simulateProvinces(
  context: SimulationContext,
  weeksElapsed: number,
  onUpdateProvince: (provinceId: string, updates: Partial<Province>) => void
) {
  context.provinces.forEach(province => {
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
    if (province.military?.stationedUnits && province.military.stationedUnits.length > 0) {
      const totalUnits = province.military.stationedUnits.reduce((sum, unit) => 
        sum + (typeof unit === 'object' ? unit.strength : 50), 0);
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
    if ((owningNation.technology?.currentResearch ?? []).includes('Renewable Energy') || 
        (owningNation.technology?.currentResearch ?? []).includes('Green Energy')) {
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
  context.nations.forEach(nation => {
    const updates: Partial<Nation> = {};
    
    // Get provinces belonging to this nation
    const nationProvinces = context.provinces.filter(p => p.country === nation.name);
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
      const debtRatio = nation.economy.debt / nation.economy.gdp;
      if (debtRatio > 1.0) inflationChange += 0.05;
      else if (debtRatio > 0.6) inflationChange += 0.02;
      
      // Trade balance affects inflation
      if (nation.economy.tradeBalance < 0) inflationChange += 0.03;
      
      // Technology can help control inflation
      if (nation.technology.level > 7) inflationChange -= 0.02;
      
      const newInflation = Math.max(0, Math.min(15, nation.economy.inflation + inflationChange * weeksElapsed));
      if (!updates.economy) updates.economy = { ...nation.economy };
      updates.economy.inflation = newInflation;
    }

    // 4. Military equipment and manpower changes
    if (Math.random() < 0.15 * weeksElapsed) {
      const militaryBudgetRatio = nation.economy.gdp * 0.03; // Assume 3% of GDP on military
      const equipmentMaintenance = nation.military.equipment * 0.02; // 2% decay per week
      const equipmentProduction = Math.min(5, militaryBudgetRatio / 1000000000); // Production based on budget
      
      const netEquipmentChange = equipmentProduction - equipmentMaintenance;
      const newEquipment = Math.max(0, Math.min(100, nation.military.equipment + netEquipmentChange * weeksElapsed));
      
      updates.military = {
        ...nation.military,
        equipment: newEquipment
      };
      
      // Manpower changes based on population and recruitment
      const recruitmentRate = totalPopulation * 0.002; // 0.2% of population available for military
      const manpowerGain = Math.floor(recruitmentRate * weeksElapsed);
      if (manpowerGain > 0) {
        updates.military = {
          ...updates.military,
          manpower: nation.military.manpower + manpowerGain
        };
      }
    }

    // 5. Research progress with tech level effects
    const researchEfficiency = Math.max(0.5, avgGdpPerCapita / 50000);
    const techLevelBonus = 1 + (nation.technology.level - 5) * 0.1;
    const baseResearchGain = 25 * researchEfficiency * techLevelBonus * weeksElapsed;
    
    // Random research breakthroughs
    const breakthroughChance = 0.05 * weeksElapsed;
    const researchMultiplier = Math.random() < breakthroughChance ? 1.5 : 1.0;
    
    const researchGain = Math.floor(baseResearchGain * researchMultiplier);
    
    if (researchGain > 0) {
      updates.technology = {
        ...nation.technology,
        researchPoints: nation.technology.researchPoints + researchGain
      };
      
      if (researchMultiplier > 1.0 && nation.name === context.gameState.selectedNation) {
        toast.success(`Research breakthrough in ${nation.name}! +${researchGain} research points`);
      }
    }

    // 6. Trade balance fluctuations
    if (Math.random() < 0.25 * weeksElapsed) {
      const tradeVolatility = nation.economy.gdp * 0.001; // 0.1% of GDP volatility
      const tradeChange = (Math.random() - 0.5) * tradeVolatility * 2;
      
      // Technology and infrastructure improve trade
      const techTradeBonus = nation.technology.level > 6 ? tradeVolatility * 0.1 : 0;
      
      const newTradeBalance = nation.economy.tradeBalance + tradeChange + techTradeBonus;
      if (!updates.economy) updates.economy = { ...nation.economy };
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
  context.nations.forEach(nation => {
    const updates: Partial<Nation> = {};
    
    // Check if current research can be completed
    if (nation.technology.currentResearch.length > 0) {
      const currentTech = nation.technology.currentResearch[0];
      const techData = context.technologies.find(t => t.name === currentTech);
      
      if (techData && nation.technology.researchPoints >= techData.researchCost) {
        // Complete the technology
        const completedTech = nation.technology.currentResearch.shift();
        const newLevel = Math.min(10, nation.technology.level + 0.5);
        
        updates.technology = {
          ...nation.technology,
          level: newLevel,
          researchPoints: nation.technology.researchPoints - techData.researchCost,
          currentResearch: [...nation.technology.currentResearch],
          completedTech: [...(nation.technology.completedTech || []), completedTech!]
        };
        
        if (nation.name === context.gameState.selectedNation) {
          toast.success(`Technology completed: ${completedTech}`);
        }
        
        // Check for available follow-up technologies
        const availableTechs = context.technologies.filter(tech => 
          tech.yearAvailable <= new Date(context.gameState.currentDate).getFullYear() &&
          !(updates.technology?.completedTech ?? []).includes(tech.name) &&
          !(updates.technology?.currentResearch ?? []).includes(tech.name) &&
          tech.prerequisites.every(prereq => (updates.technology?.completedTech ?? []).includes(prereq))
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
    if (nation.technology.currentResearch.length === 0) {
      const currentYear = new Date(context.gameState.currentDate).getFullYear();
      const availableTechs = context.technologies.filter(tech => 
        tech.yearAvailable <= currentYear &&
        !(nation.technology.completedTech || []).includes(tech.name) &&
        tech.prerequisites.every(prereq => (nation.technology.completedTech || []).includes(prereq))
      );
      
      if (availableTechs.length > 0) {
        const selectedTech = selectNextResearch(nation, availableTechs);
        if (selectedTech) {
          updates.technology = {
            ...nation.technology,
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
  if (availableTechs.length === 0) return null;
  
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
  if (nation.military.equipment < 60) {
    priorities.military = 2.0; // Prioritize military tech if equipment is low
  }
  
  if (nation.economy.inflation > 4) {
    priorities.manufacturing = 1.5; // Focus on efficiency
  }
  
  if (nation.government.approval < 50) {
    priorities.medical = 1.3; // Improve quality of life
    priorities.energy = 1.3;
  }
  
  // Score technologies based on priorities
  const scoredTechs = availableTechs.map(tech => ({
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
  
  context.events.forEach(event => {
    // Check trigger conditions
    let shouldTrigger = true;
    
    for (const condition of event.triggerConditions) {
      switch (condition.type) {
        case 'tech_level':
          const nation = context.nations.find(n => n.id === condition.target);
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
          const province = context.provinces.find(p => p.id === condition.target);
          if (!province || (province.unrest ?? 0) < (condition.threshold ?? 0)) {
            shouldTrigger = false;
          }
          break;
          
        case 'diplomatic_status':
          if (condition.nations && condition.status === 'allied') {
            const nation1 = context.nations.find(n => n.id === condition.nations![0]);
            const nation2 = context.nations.find(n => n.id === condition.nations![1]);
            if (!nation1 || !nation2 || 
                !(nation1.diplomacy?.allies ?? []).includes(nation2.name) ||
                !(nation2.diplomacy?.allies ?? []).includes(nation1.name)) {
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
  // Apply immediate effects
  event.effects.forEach(effect => {
    if (effect.target.includes('_')) {
      // Province effect
      const province = context.provinces.find(p => p.id === effect.target);
      if (province) {
        const updates = applyEffectToProvince(province, effect);
        if (Object.keys(updates).length > 0) {
          onUpdateProvince(province.id, updates);
        }
      }
    } else {
      // Nation effect
      const nation = context.nations.find(n => n.id === effect.target);
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
  const playerProvinces = context.provinces.filter(p => 
    p.country === context.gameState.selectedNation && 
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
        ...nation.technology,
        researchPoints: nation.technology.researchPoints + effect.change
      };
      break;
      
    case 'economy.debt':
      updates.economy = {
        ...nation.economy,
        debt: Math.max(0, nation.economy.debt + effect.change)
      };
      break;
      
    case 'government.approval':
      updates.government = {
        ...nation.government,
        approval: Math.max(0, Math.min(100, nation.government.approval + effect.change))
      };
      break;
      
    case 'government.stability':
      updates.government = {
        ...nation.government,
        stability: Math.max(0, Math.min(100, nation.government.stability + effect.change))
      };
      break;
      
    case 'military.equipment':
      updates.military = {
        ...nation.military,
        equipment: Math.max(0, Math.min(100, nation.military.equipment + effect.change))
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
  
  context.nations.forEach(nation => {
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
  const nationProvinces = context.provinces.filter(p => p.country === nation.name);
  const avgUnrest = nationProvinces.reduce((sum, p) => sum + (p.unrest ?? 0), 0) / nationProvinces.length;
  
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
          .filter(p => (p.unrest ?? 0) > 5)
          .sort((a, b) => (b.unrest ?? 0) - (a.unrest ?? 0))
          .slice(0, 2);
          
        worstProvinces.forEach(province => {
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
  if (building.requiresFeatures.length > 0) {
    const missingFeatures = building.requiresFeatures.filter(feature => 
      !province.features.includes(feature)
    );
    
    if (missingFeatures.length > 0) {
      return { 
        valid: false, 
        reason: `Province lacks required features: ${missingFeatures.join(', ')}` 
      };
    }
  }

  // Check infrastructure requirements
  if (building.requirements.infrastructure && province.infrastructure.roads < building.requirements.infrastructure) {
    return { 
      valid: false, 
      reason: `Insufficient infrastructure level (requires ${building.requirements.infrastructure}, has ${province.infrastructure.roads})` 
    };
  }

  // Check technology requirements
  if (building.requirements.technology && !nation.technology.completedTech.includes(building.requirements.technology)) {
    return { 
      valid: false, 
      reason: `Missing required technology: ${building.requirements.technology}` 
    };
  }

  // Check if building already exists (for unique buildings)
  const existingBuilding = province.buildings.find(b => b.buildingId === buildingId);
  if (existingBuilding) {
    return { 
      valid: false, 
      reason: `${building.name} already exists in this province` 
    };
  }

  // Check if already under construction
  const underConstruction = province.constructionProjects.find(p => 
    p.buildingId === buildingId && p.status === 'in_progress'
  );
  if (underConstruction) {
    return { 
      valid: false, 
      reason: `${building.name} is already under construction` 
    };
  }

  return { valid: true };
}