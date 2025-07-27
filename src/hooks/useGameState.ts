import { useState, useEffect, useCallback } from 'react';
import { useKV } from '@github/spark/hooks';
import { GameState, Province, Nation, GameEvent, MapOverlayType, ConstructionProject, Building } from '../lib/types';
import { loadGameData, loadBuildingsData } from '../lib/gameDataModular';
import { validateBuildingPlacement } from './useSimulationEngine';

const initialGameState: GameState = {
  currentDate: new Date('1990-01-01'),
  timeSpeed: 1,
  isPaused: false,
  selectedNation: 'CAN',
  mapOverlay: 'political',
  notifications: []
};

export function useGameState() {
  const [gameState, setGameState] = useKV('gameState', initialGameState);
  // Temporarily use regular useState instead of useKV to test if that's the issue
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);

  // Load buildings data
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const buildingsData = await loadBuildingsData();
        setBuildings(buildingsData);
        console.log('✓ Buildings loaded:', buildingsData.length);
      } catch (error) {
        console.error('❌ Failed to load buildings:', error);
      }
    };
    loadBuildings();
  }, []);

  const getBuildingById = useCallback((id: string) => {
    return buildings.find(b => b.id === id);
  }, [buildings]);
  const [events, setEvents] = useKV('events', []);
  const [isInitialized, setIsInitialized] = useState(false);

  // Debug: Force clear old state if it's empty
  useEffect(() => {
    if (isInitialized && Array.isArray(nations) && nations.length === 0) {
      console.warn('useGameState: Nations array is empty after initialization - forcing reload');
      setIsInitialized(false);
    }
  }, [nations, isInitialized]);

  // Debug logging
  useEffect(() => {
    console.log('useGameState - Debug Info:', {
      provincesType: typeof provinces,
      provincesIsArray: Array.isArray(provinces),
      provincesLength: Array.isArray(provinces) ? provinces.length : 'N/A',
      nationsType: typeof nations,
      nationsIsArray: Array.isArray(nations),
      nationsLength: Array.isArray(nations) ? nations.length : 'N/A',
      gameStateType: typeof gameState,
      isInitialized
    });
  }, [provinces, nations, gameState, isInitialized]);

  // Immediate initialization with YAML data on first mount
  useEffect(() => {
    if (!isInitialized) {
      console.log('Immediate initialization with YAML data');
      
      const initializeData = async () => {
        try {
          console.log('Loading game data from modular regional files...');
          const gameData = await loadGameData();
          
          console.log('loadGameData returned:', {
            provinces: gameData.provinces?.length || 0,
            nations: gameData.nations?.length || 0,
            boundaries: gameData.boundaries?.features?.length || 0
          });
          
          if (Array.isArray(gameData.provinces) && gameData.provinces.length > 0 && 
              Array.isArray(gameData.nations) && gameData.nations.length > 0) {
            
            console.log(`Setting ${gameData.provinces.length} provinces and ${gameData.nations.length} nations`);
            const canadianProvinces = gameData.provinces.filter(p => p.country === 'Canada');
            console.log('Canadian provinces:', canadianProvinces.map(p => `${p.id}: ${p.name}`));
            console.log('Available nations:', gameData.nations.map(n => `${n.id}: ${n.name}`));
            
            setProvinces(gameData.provinces);
            setNations(gameData.nations);
            setIsInitialized(true);
            console.log('✓ Modular data initialization completed successfully');
            
            // Debug: Check if Canada nation exists
            const canadaNation = gameData.nations.find(n => n.id === 'CAN');
            if (canadaNation) {
              console.log('✓ Canada nation found:', canadaNation.name, 'with leader:', canadaNation.government?.leader);
            } else {
              console.error('❌ Canada nation not found in loaded data');
            }
          } else {
            console.error('❌ Failed to load provinces or nations from modular files');
            setIsInitialized(true);
          }
        } catch (error) {
          console.error('❌ Error during modular data initialization:', error);
          setIsInitialized(true); // Still mark as initialized to prevent infinite loading
        }
      };
      
      initializeData();
    }
  }, [isInitialized]);

  // Initialize data from YAML when component mounts - DISABLED FOR NOW
  /*
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('Starting data initialization...');
        
        console.log('Loading provinces...');
        const loadedProvinces = await getProvinces();
        console.log('getProvinces returned:', loadedProvinces?.length || 0, 'provinces');
        
        if (Array.isArray(loadedProvinces) && loadedProvinces.length > 0) {
          console.log(`✓ Setting ${loadedProvinces.length} provinces in state`);
          const canadianProvinces = loadedProvinces.filter(p => p.country === 'Canada');
          console.log(`Canadian provinces:`, canadianProvinces.map(p => p.name));
          setProvinces(loadedProvinces);
        } else {
          console.error('❌ No provinces returned from getProvinces()');
          setProvinces([]);
        }
        
        console.log('Loading nations...');
        const loadedNations = await getNations();
        console.log('getNations returned:', loadedNations?.length || 0, 'nations');
        
        if (Array.isArray(loadedNations) && loadedNations.length > 0) {
          console.log(`✓ Setting ${loadedNations.length} nations in state`);
          const canadaNation = loadedNations.find(n => n.id === 'CAN');
          if (canadaNation) {
            console.log(`✓ Canada found:`, canadaNation.name, 'Leader:', canadaNation.government?.leader);
          } else {
            console.warn('⚠ Canada not found in loaded nations');
          }
          setNations(loadedNations);
        } else {
          console.error('❌ No nations returned from getNations()');
          setNations([]);
        }
        
        console.log('Data initialization completed - setting initialized to true');
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing game data:', error);
        // Still mark as initialized to prevent infinite loading
        console.log('Setting initialized to true despite error');
        setIsInitialized(true);
      }
    };
    
    // Always initialize, but only once per mount
    if (!isInitialized) {
      console.log('Initialization needed - starting async data load');
      initializeData();
    } else {
      console.log('Already initialized, skipping data load');
    }
  }, [setProvinces, setNations, isInitialized, setIsInitialized]);
  */

  useEffect(() => {
    // Ensure currentDate is always a Date object (in case it was serialized as a string)
    const safeGameState = gameState || initialGameState;
    const stateWithDate = {
      ...safeGameState,
      currentDate: safeGameState.currentDate instanceof Date 
        ? safeGameState.currentDate 
        : new Date(safeGameState.currentDate || '1990-01-01')
    };
    setLocalGameState(stateWithDate);
  }, [gameState]);

  // Ensure all nations have properly initialized diplomacy arrays
  useEffect(() => {
    const safeNations = Array.isArray(nations) ? nations : [];
    if (safeNations.length > 0) {
      const needsUpdate = safeNations.some(nation => {
        if (!nation) return true;
        return !nation.diplomacy?.embargoes || 
               !nation.diplomacy?.sanctions ||
               !Array.isArray(nation.diplomacy.embargoes) ||
               !Array.isArray(nation.diplomacy.sanctions) ||
               !nation.tradeOffers ||
               !nation.tradeAgreements ||
               !nation.resourceStockpiles ||
               !nation.resourceProduction ||
               !nation.resourceConsumption;
      });
      
      if (needsUpdate) {
        const fixedNations = safeNations.map(nation => {
          if (!nation) {
            console.error('Found null/undefined nation in nations array');
            return null;
          }
          return {
            ...nation,
            diplomacy: {
              ...nation.diplomacy,
              embargoes: Array.isArray(nation.diplomacy?.embargoes) ? nation.diplomacy.embargoes : [],
              sanctions: Array.isArray(nation.diplomacy?.sanctions) ? nation.diplomacy.sanctions : []
            },
            military: {
              ...nation.military,
              readiness: nation.military?.readiness ?? 100
            },
            tradeOffers: Array.isArray(nation.tradeOffers) ? nation.tradeOffers : [],
            tradeAgreements: Array.isArray(nation.tradeAgreements) ? nation.tradeAgreements : [],
            resourceStockpiles: nation.resourceStockpiles || {},
            resourceProduction: nation.resourceProduction || {},
            resourceConsumption: nation.resourceConsumption || {},
            resourceShortages: nation.resourceShortages || {},
            resourceEfficiency: nation.resourceEfficiency || { overall: 1.0 }
          };
        }).filter(Boolean) as Nation[];
        
        console.log('Fixed nation arrays for', fixedNations.length, 'nations');
        setNations(fixedNations);
      }
    }
  }, [nations, setNations]);

  // Ensure all provinces have properly initialized features arrays
  useEffect(() => {
    const safeProvinces = Array.isArray(provinces) ? provinces : [];
    if (safeProvinces.length > 0) {
      const needsUpdate = safeProvinces.some(province => {
        if (!province) return true;
        return !Array.isArray(province.features) || 
               !Array.isArray(province.buildings) || 
               !Array.isArray(province.constructionProjects);
      });
      
      if (needsUpdate) {
        const fixedProvinces = safeProvinces.map(province => {
          if (!province) {
            console.error('Found null/undefined province in provinces array');
            return null;
          }
          return {
            ...province,
            features: Array.isArray(province.features) ? province.features : [],
            buildings: Array.isArray(province.buildings) ? province.buildings : [],
            constructionProjects: Array.isArray(province.constructionProjects) ? province.constructionProjects : []
          };
        }).filter(Boolean) as Province[];
        
        console.log('Fixed province arrays for', fixedProvinces.length, 'provinces');
        setProvinces(fixedProvinces);
      }
    }
  }, [provinces, setProvinces]);

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    const newState = { ...localGameState, ...updates };
    setLocalGameState(newState);
    setGameState(newState);
  }, [localGameState, setGameState]);

  const resetGameData = useCallback(() => {
    console.log('Resetting all game data...');
    // Clear the state completely to ensure fresh start
    setProvinces([]);
    setNations([]);
    setGameState(initialGameState);
    setIsInitialized(false);
    
    // Force clear localStorage as backup
    if (typeof window !== 'undefined') {
      console.log('Clearing any cached KV data...');
      // The useKV hook may be using localStorage or sessionStorage
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('provinces') || key.includes('nations') || key.includes('gameState')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn('Could not clear localStorage:', e);
      }
    }
  }, [setGameState]);

  const selectProvince = useCallback((provinceId: string | undefined) => {
    updateGameState({ selectedProvince: provinceId });
  }, [updateGameState]);

  const selectNation = useCallback((nationId: string) => {
    updateGameState({ selectedNation: nationId });
  }, [updateGameState]);

  const setMapOverlay = useCallback((overlay: MapOverlayType) => {
    updateGameState({ mapOverlay: overlay });
  }, [updateGameState]);

  const togglePause = useCallback(() => {
    updateGameState({ isPaused: !localGameState.isPaused });
  }, [localGameState.isPaused, updateGameState]);

  const setTimeSpeed = useCallback((speed: number) => {
    updateGameState({ timeSpeed: speed });
  }, [updateGameState]);

  const advanceTime = useCallback((days: number) => {
    // Ensure we're working with a proper Date object
    const currentDate = localGameState.currentDate instanceof Date 
      ? localGameState.currentDate 
      : new Date(localGameState.currentDate || '1990-01-01');
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    updateGameState({ currentDate: newDate });
  }, [localGameState.currentDate, updateGameState]);

  const getProvince = useCallback((id: string) => {
    const safeProvinces = Array.isArray(provinces) ? provinces : [];
    return safeProvinces.find(p => p && p.id === id);
  }, [provinces]);

  const getNation = useCallback((id: string) => {
    const safeNations = Array.isArray(nations) ? nations : [];
    return safeNations.find(n => n && n.id === id);
  }, [nations]);

  const getSelectedProvince = useCallback(() => {
    return localGameState.selectedProvince ? getProvince(localGameState.selectedProvince) : undefined;
  }, [localGameState.selectedProvince, getProvince]);

  const getSelectedNation = useCallback(() => {
    return getNation(localGameState.selectedNation);
  }, [localGameState.selectedNation, getNation]);

  const updateProvince = useCallback((provinceId: string, updates: Partial<Province>) => {
    setProvinces(currentProvinces => {
      const safeProvinces = Array.isArray(currentProvinces) ? currentProvinces : [];
      return safeProvinces.map(p => 
        p && p.id === provinceId ? { ...p, ...updates } : p
      );
    });
  }, [setProvinces]);

  const updateNation = useCallback((nationId: string, updates: Partial<Nation>) => {
    setNations(currentNations => {
      const safeNations = Array.isArray(currentNations) ? currentNations : [];
      return safeNations.map(n => 
        n && n.id === nationId ? { ...n, ...updates } : n
      );
    });
  }, [setNations]);

  const addEvent = useCallback((event: GameEvent) => {
    setEvents(currentEvents => [...currentEvents, event]);
    updateGameState({ 
      notifications: [...localGameState.notifications, event] 
    });
  }, [setEvents, localGameState.notifications, updateGameState]);

  const removeNotification = useCallback((eventId: string) => {
    updateGameState({
      notifications: localGameState.notifications.filter(n => n.id !== eventId)
    });
  }, [localGameState.notifications, updateGameState]);

  const startConstruction = useCallback((buildingId: string, provinceId: string) => {
    const building = getBuildingById(buildingId);
    const province = getProvince(provinceId);
    const nation = province ? getNation(localGameState.selectedNation) : null;
    
    if (!building || !province || !nation) {
      throw new Error('Invalid building, province, or nation');
    }
    
    // Validate building placement using features
    const validation = validateBuildingPlacement(buildingId, province, nation);
    if (!validation.valid) {
      throw new Error(validation.reason || 'Building placement not valid');
    }
    
    if (nation.economy.treasury < building.cost) {
      throw new Error('Insufficient funds');
    }
    
    // Create construction project
    const project: ConstructionProject = {
      id: `construction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      buildingId,
      provinceId,
      startDate: new Date(localGameState.currentDate).toISOString(),
      completionDate: new Date(new Date(localGameState.currentDate).getTime() + building.buildTime * 7 * 24 * 60 * 60 * 1000).toISOString(), // buildTime is in weeks
      remainingTime: building.buildTime,
      cost: building.cost,
      status: 'in_progress'
    };
    
    // Deduct cost from treasury
    updateNation(localGameState.selectedNation, {
      economy: {
        ...nation.economy,
        treasury: nation.economy.treasury - building.cost
      }
    });
    
    // Add construction project to province
    updateProvince(provinceId, {
      constructionProjects: [...(province.constructionProjects || []), project]
    });
  }, [getProvince, getNation, localGameState.selectedNation, localGameState.currentDate, updateNation, updateProvince]);

  const cancelConstruction = useCallback((projectId: string) => {
    // Find the project to cancel
    let foundProject: ConstructionProject | null = null;
    let provinceId: string | null = null;
    
    const safeProvinces = Array.isArray(provinces) ? provinces : [];
    for (const province of safeProvinces) {
      if (!province) continue;
      const project = (province.constructionProjects || []).find(p => p && p.id === projectId);
      if (project) {
        foundProject = project;
        provinceId = province.id;
        break;
      }
    }
    
    if (!foundProject || !provinceId) {
      throw new Error('Construction project not found');
    }
    
    const nation = getNation(localGameState.selectedNation);
    if (!nation) {
      throw new Error('Nation not found');
    }
    
    // Refund 50% of the cost
    const refund = Math.floor(foundProject.cost * 0.5);
    updateNation(localGameState.selectedNation, {
      economy: {
        ...nation.economy,
        treasury: nation.economy.treasury + refund
      }
    });
    
    // Remove the project from the province
    const province = getProvince(provinceId);
    if (province) {
      updateProvince(provinceId, {
        constructionProjects: (province.constructionProjects || []).filter(p => p.id !== projectId)
      });
    }
  }, [provinces, getNation, localGameState.selectedNation, updateNation, getProvince, updateProvince]);

  const processConstructionTick = useCallback(() => {
    // Process all construction projects
    const safeProvinces = Array.isArray(provinces) ? provinces : [];
    safeProvinces.forEach(province => {
      if (!province) return;
      
      const updatedProjects: ConstructionProject[] = [];
      const completedBuildings: any[] = [...(province.buildings || [])];
      
      (province.constructionProjects || []).forEach(project => {
        if (!project) return;
        
        if (project.status === 'in_progress') {
          const updatedProject = {
            ...project,
            remainingTime: project.remainingTime - 1
          };
          
          if (updatedProject.remainingTime <= 0) {
            // Construction completed
            const building = getBuildingById(project.buildingId);
            if (building) {
              completedBuildings.push({
                buildingId: project.buildingId,
                level: 1,
                constructedDate: new Date(localGameState.currentDate).toISOString(),
                effects: building.effects
              });
            }
          } else {
            updatedProjects.push(updatedProject);
          }
        } else {
          updatedProjects.push(project);
        }
      });
      
      // Update province if there were changes
      if (updatedProjects.length !== (province.constructionProjects || []).length || 
          completedBuildings.length !== (province.buildings || []).length) {
        updateProvince(province.id, {
          constructionProjects: updatedProjects,
          buildings: completedBuildings
        });
      }
    });
  }, [provinces, localGameState.currentDate, updateProvince]);

  return {
    gameState: localGameState,
    provinces: Array.isArray(provinces) ? provinces : [],
    nations: Array.isArray(nations) ? nations : [],
    events,
    isInitialized,
    setIsInitialized,
    selectProvince,
    selectNation,
    setMapOverlay,
    togglePause,
    setTimeSpeed,
    advanceTime,
    getProvince,
    getNation,
    getSelectedProvince,
    getSelectedNation,
    updateProvince,
    updateNation,
    addEvent,
    removeNotification,
    startConstruction,
    cancelConstruction,
    processConstructionTick,
    resetGameData
  };
}