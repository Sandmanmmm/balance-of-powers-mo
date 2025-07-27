import { Nation, Province, ResourceShortageEffect } from './types';
import { getResources } from '../data/gameData';

/**
 * Calculate resource shortage effects based on current shortages
 */
export async function calculateResourceShortageEffects(nation: Nation): Promise<ResourceShortageEffect[]> {
  const effects: ResourceShortageEffect[] = [];
  const shortages = nation.resourceShortages || {};

  // Load resources data from modular system
  try {
    const resourcesArray = await getResources();
    const resourcesData = resourcesArray.reduce((acc, resource) => {
      acc[resource.id] = resource;
      return acc;
    }, {} as Record<string, any>);

    // Safety check for resourcesData
    if (!resourcesData || typeof resourcesData !== 'object') {
      console.warn('Resource data not available for shortage effects calculation');
      return effects;
    }

  Object.entries(shortages).forEach(([resourceId, severity]) => {
    if (severity <= 0.1) return; // Ignore minor shortages

    const resource = resourcesData[resourceId];
    if (!resource) return;

    const effect: ResourceShortageEffect = {
      resourceId,
      severity,
      effects: {}
    };

    // Define resource-specific shortage effects
    switch (resourceId) {
      case 'electricity':
        effect.effects.buildingEfficiency = Math.max(0.3, 1 - severity * 0.8); // 20-70% efficiency
        effect.effects.provinceStability = severity * 0.5; // Unrest increase
        break;

      case 'oil':
        effect.effects.militaryReadiness = Math.max(0.2, 1 - severity * 0.9); // 10-80% readiness
        effect.effects.buildingEfficiency = Math.max(0.5, 1 - severity * 0.5); // 50-100% efficiency
        break;

      case 'steel':
        effect.effects.buildingEfficiency = Math.max(0.2, 1 - severity * 0.8); // 20-100% efficiency for industrial buildings
        effect.effects.militaryReadiness = Math.max(0.4, 1 - severity * 0.6); // 40-100% readiness
        break;

      case 'food':
        effect.effects.provinceStability = severity * 1.5; // Major unrest increase
        effect.effects.populationGrowth = Math.max(-0.02, -severity * 0.02); // Negative growth in severe shortages
        effect.effects.militaryReadiness = Math.max(0.5, 1 - severity * 0.5); // Hungry soldiers fight poorly
        break;

      case 'consumer_goods':
        effect.effects.provinceStability = severity * 0.8; // Moderate unrest increase
        effect.effects.populationGrowth = Math.max(0, 1 - severity * 0.3); // Reduced growth
        break;

      case 'manpower':
        effect.effects.militaryReadiness = Math.max(0.1, 1 - severity * 0.9); // Severe impact on military
        effect.effects.buildingEfficiency = Math.max(0.6, 1 - severity * 0.4); // Need workers to operate
        break;

      case 'rare_earth':
        effect.effects.buildingEfficiency = Math.max(0.4, 1 - severity * 0.6); // Affects high-tech production
        break;

      case 'semiconductors':
        effect.effects.buildingEfficiency = Math.max(0.3, 1 - severity * 0.7); // Critical for modern industry
        break;

      case 'uranium':
        // Only affects military readiness if nation has nuclear capability
        if (nation.military.nuclearCapability) {
          effect.effects.militaryReadiness = Math.max(0.6, 1 - severity * 0.4);
        }
        break;

      default:
        // Generic shortage effects for other resources
        effect.effects.buildingEfficiency = Math.max(0.5, 1 - severity * 0.5);
        break;
    }

    effects.push(effect);
  });

  return effects;
  } catch (error) {
    console.error('Error loading resources for shortage effects:', error);
    return effects;
  }
}

/**
 * Apply shortage effects to provinces
 */
export function applyShortageEffectsToProvinces(
  provinces: Province[],
  nation: Nation,
  effects: ResourceShortageEffect[]
): Partial<Province>[] {
  const nationProvinces = provinces.filter(p => p.country === nation.name);
  const updates: Partial<Province>[] = [];

  nationProvinces.forEach(province => {
    const provinceUpdates: Partial<Province> = {};

    effects.forEach(effect => {
      // Apply stability effects
      if (effect.effects.provinceStability) {
        const currentUnrest = province.unrest || 0;
        const unrestIncrease = effect.effects.provinceStability * effect.severity;
        provinceUpdates.unrest = Math.min(10, currentUnrest + unrestIncrease);
      }

      // Apply population growth effects
      if (effect.effects.populationGrowth && province.population) {
        const growthModifier = effect.effects.populationGrowth;
        const currentPopulation = province.population.total;
        const populationChange = currentPopulation * growthModifier * 0.01; // Weekly change
        
        if (Math.abs(populationChange) >= 1) {
          provinceUpdates.population = {
            ...province.population,
            total: Math.max(0, Math.floor(currentPopulation + populationChange))
          };
        }
      }

      // Apply building efficiency effects
      if (effect.effects.buildingEfficiency && province.buildings) {
        const efficiencyModifier = effect.effects.buildingEfficiency;
        const updatedBuildings = province.buildings.map(building => ({
          ...building,
          efficiency: Math.min(1, (building.efficiency || 1) * efficiencyModifier)
        }));
        provinceUpdates.buildings = updatedBuildings;
      }
    });

    if (Object.keys(provinceUpdates).length > 0) {
      updates.push({ id: province.id, ...provinceUpdates });
    }
  });

  return updates;
}

/**
 * Apply shortage effects to nation
 */
export function applyShortageEffectsToNation(
  nation: Nation,
  effects: ResourceShortageEffect[]
): Partial<Nation> {
  const updates: Partial<Nation> = {};

  let militaryReadinessModifier = 1;
  let overallEfficiencyModifier = 1;

  effects.forEach(effect => {
    if (effect.effects.militaryReadiness) {
      militaryReadinessModifier = Math.min(militaryReadinessModifier, effect.effects.militaryReadiness);
    }
    if (effect.effects.buildingEfficiency) {
      overallEfficiencyModifier = Math.min(overallEfficiencyModifier, effect.effects.buildingEfficiency);
    }
  });

  // Apply military readiness
  if (militaryReadinessModifier < 1) {
    const currentReadiness = nation.military.readiness || 100;
    const targetReadiness = 100 * militaryReadinessModifier;
    const readinessChange = (targetReadiness - currentReadiness) * 0.1; // Gradual change
    
    updates.military = {
      ...nation.military,
      readiness: Math.max(0, Math.min(100, currentReadiness + readinessChange))
    };
  }

  // Store efficiency modifier for use in production calculations
  if (overallEfficiencyModifier < 1) {
    updates.resourceEfficiency = {
      ...(nation.resourceEfficiency || {}),
      overall: overallEfficiencyModifier
    };
  }

  return updates;
}

/**
 * Get human-readable description of shortage effects
 */
export async function getShortageEffectDescription(effect: ResourceShortageEffect): Promise<string> {
  try {
    const resourcesArray = await getResources();
    const resourcesData = resourcesArray.reduce((acc, resource) => {
      acc[resource.id] = resource;
      return acc;
    }, {} as Record<string, any>);

    const resource = resourcesData[effect.resourceId];
    if (!resource) return '';

    const severityText = effect.severity > 0.7 ? 'Critical' : 
                        effect.severity > 0.4 ? 'Severe' : 
                        effect.severity > 0.2 ? 'Moderate' : 'Minor';

    const descriptions: string[] = [];

    if (effect.effects.buildingEfficiency && effect.effects.buildingEfficiency < 0.9) {
      const efficiency = Math.round(effect.effects.buildingEfficiency * 100);
      descriptions.push(`Industrial efficiency reduced to ${efficiency}%`);
    }

    if (effect.effects.militaryReadiness && effect.effects.militaryReadiness < 0.9) {
      const readiness = Math.round(effect.effects.militaryReadiness * 100);
      descriptions.push(`Military readiness reduced to ${readiness}%`);
    }

    if (effect.effects.provinceStability && effect.effects.provinceStability > 0.1) {
      descriptions.push(`Increased civil unrest`);
    }

    if (effect.effects.populationGrowth && effect.effects.populationGrowth < 0) {
      descriptions.push(`Population decline`);
    }

    const effectList = descriptions.length > 0 ? descriptions.join(', ') : 'Economic disruption';
    return `${severityText} ${resource.name} shortage: ${effectList}`;
  } catch (error) {
    console.error('Error loading resources for effect description:', error);
    return 'Resource shortage';
  }
}