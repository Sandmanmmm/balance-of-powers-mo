import { useState, useEffect } from 'react';
import { Province, Nation, Building, ConstructionProject } from '@/lib/types';
import { getBuildings, getAvailableBuildings } from '@/lib/gameData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Clock, Coins, Hammer, CheckCircle2, AlertCircle, Building2 } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ConstructionPanelProps {
  province: Province;
  nation: Nation;
  onStartConstruction: (buildingId: string, provinceId: string) => void;
  onCancelConstruction: (projectId: string) => void;
  isPlayerControlled: boolean;
}

export function ConstructionPanel({ 
  province, 
  nation, 
  onStartConstruction, 
  onCancelConstruction,
  isPlayerControlled 
}: ConstructionPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availableBuildings, setAvailableBuildings] = useState<Building[]>([]);
  const [allBuildings, setAllBuildings] = useState<Building[]>([]);
  
  // Refresh building data when province changes
  useEffect(() => {
    const updateBuildings = async () => {
      const buildings = getBuildings();
      setAllBuildings(buildings);
      
      if (province && nation) {
        const available = getAvailableBuildings(province, nation, nation.technology.completedTech);
        setAvailableBuildings(available);
      }
    };
    
    updateBuildings();
  }, [province?.id, nation?.id]); // Re-run when province or nation changes
  
  // Filter buildings by category
  const filteredBuildings = selectedCategory === 'all' 
    ? availableBuildings 
    : availableBuildings.filter(building => building.category === selectedCategory);
  
  // Get building categories for tabs from all buildings
  const categories = Array.from(new Set(allBuildings.map(b => b.category)));
  
  const handleConstructBuilding = (building: Building) => {
    if (!isPlayerControlled) {
      toast.error("You can only build in provinces you control");
      return;
    }
    
    if (nation.economy.treasury < building.cost) {
      toast.error(`Insufficient funds. Need ${building.cost.toLocaleString()} but only have ${nation.economy.treasury.toLocaleString()}`);
      return;
    }
    
    // Check if already building this type
    const existingProject = province.constructionProjects.find(p => p.buildingId === building.id && p.status === 'in_progress');
    if (existingProject) {
      toast.error(`Already constructing ${building.name} in this province`);
      return;
    }
    
    onStartConstruction(building.id, province.id);
    toast.success(`Started construction of ${building.name}`);
  };

  const formatTimeRemaining = (ticks: number) => {
    const weeks = Math.ceil(ticks);
    if (weeks < 52) {
      return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    }
    const years = Math.floor(weeks / 52);
    const remainingWeeks = weeks % 52;
    return `${years}y${remainingWeeks > 0 ? ` ${remainingWeeks}w` : ''}`;
  };

  const formatCost = (cost: number) => {
    if (cost >= 1e9) return `$${(cost / 1e9).toFixed(1)}B`;
    if (cost >= 1e6) return `$${(cost / 1e6).toFixed(1)}M`;
    if (cost >= 1e3) return `$${(cost / 1e3).toFixed(1)}K`;
    return `$${cost}`;
  };

  const canAfford = (cost: number) => nation.economy.treasury >= cost;

  return (
    <div className="space-y-4">
      {/* Province Header */}
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Construction - {province.name}</h3>
        {!isPlayerControlled && (
          <Badge variant="secondary">View Only</Badge>
        )}
      </div>

      {/* Current Buildings */}
      {province.buildings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Existing Buildings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {province.buildings.map((building, index) => {
                const buildingData = allBuildings.find(b => b.id === building.buildingId);
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <div className="flex items-center gap-2">
                      <span>{buildingData?.icon || '🏗️'}</span>
                      <span>{buildingData?.name || 'Unknown Building'}</span>
                      {building.level > 1 && (
                        <Badge variant="outline" className="text-xs">
                          Lv.{building.level}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Construction Projects */}
      {province.constructionProjects.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Hammer className="w-4 h-4 text-orange-600" />
              Under Construction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {province.constructionProjects
                .filter(project => project.status === 'in_progress')
                .map((project) => {
                  const building = allBuildings.find(b => b.id === project.buildingId);
                  const progress = ((building?.buildTime || 0) - project.remainingTime) / (building?.buildTime || 1) * 100;
                  
                  return (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{building?.icon || '🏗️'}</span>
                          <span className="font-medium">{building?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTimeRemaining(project.remainingTime)}
                        </div>
                      </div>
                      <Progress value={progress} className="h-2" />
                      {isPlayerControlled && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCancelConstruction(project.id)}
                          className="h-6 text-xs"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Buildings */}
      {isPlayerControlled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available Buildings</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="w-4 h-4" />
              Treasury: {formatCost(nation.economy.treasury)}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid grid-cols-6 w-full mb-4">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="extraction" className="text-xs">Extract</TabsTrigger>
                <TabsTrigger value="energy" className="text-xs">Energy</TabsTrigger>
                <TabsTrigger value="industrial" className="text-xs">Industry</TabsTrigger>
                <TabsTrigger value="technology" className="text-xs">Tech</TabsTrigger>
                <TabsTrigger value="agriculture" className="text-xs">Food</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {filteredBuildings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium">No available buildings for this province</p>
                      <div className="text-xs space-y-1 mt-3 bg-muted p-3 rounded-md">
                        <p><span className="font-medium">Province features:</span> {province.features?.length ? province.features.join(', ') : 'none'}</p>
                        <p><span className="font-medium">Infrastructure level:</span> {province.infrastructure.roads}/5</p>
                        <p><span className="font-medium">Category filter:</span> {selectedCategory === 'all' ? 'All categories' : selectedCategory}</p>
                        <div className="mt-2 text-left">
                          <p className="font-medium mb-1">Try:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Selecting "All" category</li>
                            <li>Building infrastructure first</li>
                            <li>Researching new technologies</li>
                            <li>Selecting a province with different features</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    filteredBuildings.map((building) => {
                      const affordable = canAfford(building.cost);
                      
                      return (
                        <Card key={building.id} className={`p-3 ${!affordable ? 'opacity-60' : ''}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{building.icon}</span>
                                <div>
                                  <div className="font-medium text-sm">{building.name}</div>
                                  <Badge variant="outline" className="text-xs">
                                    {building.category}
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {building.description}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Coins className="w-3 h-3" />
                                  {formatCost(building.cost)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTimeRemaining(building.buildTime)}
                                </div>
                              </div>
                              
                              {/* Requirements */}
                              {((building.requiresFeatures && building.requiresFeatures.length > 0) || Object.keys(building.requirements || {}).length > 0) && (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground">Requirements:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {/* Feature Requirements */}
                                    {building.requiresFeatures && building.requiresFeatures.map((feature) => {
                                      const hasFeature = province.features?.includes(feature) || false;
                                      return (
                                        <Badge 
                                          key={feature} 
                                          variant={hasFeature ? "secondary" : "destructive"} 
                                          className="text-xs"
                                        >
                                          {feature.replace(/_/g, ' ')} {hasFeature ? '✓' : '✗'}
                                        </Badge>
                                      );
                                    })}
                                    {building.requiresFeatures && building.requiresFeatures.length > 0 && (
                                      <Badge variant="outline" className="text-xs opacity-70">
                                        requires any one ↑
                                      </Badge>
                                    )}
                                    
                                    {/* Infrastructure Requirements */}
                                    {building.requirements && building.requirements.infrastructure && (
                                      <Badge 
                                        variant={province.infrastructure.roads >= building.requirements.infrastructure ? "secondary" : "destructive"}
                                        className="text-xs"
                                      >
                                        Infrastructure {building.requirements.infrastructure} {province.infrastructure.roads >= building.requirements.infrastructure ? '✓' : '✗'}
                                      </Badge>
                                    )}
                                    
                                    {/* Technology Requirements */}
                                    {building.requirements && building.requirements.technology && (
                                      <Badge 
                                        variant={nation.technology.completedTech.includes(building.requirements.technology) ? "secondary" : "destructive"}
                                        className="text-xs"
                                      >
                                        {building.requirements.technology} {nation.technology.completedTech.includes(building.requirements.technology) ? '✓' : '✗'}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Resource Production/Consumption */}
                              <div className="space-y-2">
                                {(Object.keys(building.produces || {}).length > 0 || Object.keys(building.consumes || {}).length > 0) && (
                                  <div className="space-y-1">
                                    {Object.keys(building.produces || {}).length > 0 && (
                                      <div>
                                        <div className="text-xs font-medium text-green-600 mb-1">Produces:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {Object.entries(building.produces || {}).map(([resource, amount]) => (
                                            <Badge key={resource} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                              +{amount} {resource}/week
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {Object.keys(building.consumes || {}).length > 0 && (
                                      <div>
                                        <div className="text-xs font-medium text-red-600 mb-1">Consumes:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {Object.entries(building.consumes || {}).map(([resource, amount]) => (
                                            <Badge key={resource} variant="secondary" className="text-xs bg-red-100 text-red-800">
                                              -{amount} {resource}/week
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Other Improvements */}
                                {Object.keys(building.improves || {}).length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-blue-600 mb-1">Improves:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(building.improves || {}).map(([effect, value]) => (
                                        <Badge key={effect} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                          {effect}: +{value}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => handleConstructBuilding(building)}
                              disabled={!affordable}
                              className="shrink-0"
                            >
                              Build
                            </Button>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}