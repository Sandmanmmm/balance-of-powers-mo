import { useState, useEffect, useCallback } from 'react';
import { useKV } from './useKV';
import { GameState, Province, Nation, GameEvent, MapOverlayType, ConstructionProject, Building } from '../lib/types';
import { getProvinces, getNations, sampleEvents, getBuildingById } from '../lib/gameData';
import { validateBuildingPlacement } from './useSimulationEngine';

const initialGameState: GameState = {
  currentDate: new Date('1990-01-01'),
  timeSpeed: 1,
  isPaused: false,
  selectedNation: 'USA',
  mapOverlay: 'political',
  notifications: []
};

export function useGameState() {
  const [gameState, setGameState] = useKV('gameState', initialGameState);
  const [provinces, setProvinces] = useKV('provinces', []);
  const [nations, setNations] = useKV('nations', []);
  const [events, setEvents] = useKV('events', sampleEvents);
  
  const [localGameState, setLocalGameState] = useState<GameState>(gameState || initialGameState);

  // Initialize data from YAML when component mounts
  useEffect(() => {
    const initializeData = async () => {
      const safeProvinces = Array.isArray(provinces) ? provinces : [];
      if (safeProvinces.length === 0) {
        const loadedProvinces = getProvinces();
        if (Array.isArray(loadedProvinces) && loadedProvinces.length > 0) {
          setProvinces(loadedProvinces);
        }
      }
      
      const safeNations = Array.isArray(nations) ? nations : [];
      if (safeNations.length === 0) {
        const loadedNations = getNations();
        if (Array.isArray(loadedNations) && loadedNations.length > 0) {
          setNations(loadedNations);
        }
      }
    };
    
    initializeData();
  }, [Array.isArray(provinces) ? provinces.length : 0, Array.isArray(nations) ? nations.length : 0, setProvinces, setNations]);

  useEffect(() => {
    // Ensure currentDate is always a Date object (in case it was serialized as a string)
    const safeGameState = gameState || initialGameState;
    const stateWithDate = {
      ...safeGameState,
      currentDate: new Date(safeGameState.currentDate)
    };
    setLocalGameState(stateWithDate);
  }, [gameState]);

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
    const currentDate = new Date(localGameState.currentDate);
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
      startDate: new Date(localGameState.currentDate),
      completionDate: new Date(new Date(localGameState.currentDate).getTime() + building.buildTime * 7 * 24 * 60 * 60 * 1000), // buildTime is in weeks
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
                constructedDate: new Date(localGameState.currentDate),
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
    provinces,
    nations,
    events,
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
    processConstructionTick
  };
}