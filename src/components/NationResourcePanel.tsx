import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Nation } from '../lib/types';
import { getResources, type Resource } from '../data/gameData';
import { getResourceShortageStatus } from '../lib/resourceNotifications';
import { calculateResourceShortageEffects, getShortageEffectDescription } from '../lib/resourceEffects';
import { Warning, TrendUp, TrendDown, Lightning, Shield, Users } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';

interface NationResourcePanelProps {
  nation: Nation;
}

export function NationResourcePanel({ nation }: NationResourcePanelProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shortageEffects, setShortageEffects] = useState<any[]>([]);
  const [effectDescriptions, setEffectDescriptions] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadResources = async () => {
      try {
        const resourcesData = await getResources();
        if (Array.isArray(resourcesData)) {
          setResources(resourcesData);
        } else {
          console.error('Resources data is not an array:', resourcesData);
          setResources([]);
        }
      } catch (error) {
        console.error('Failed to load resources:', error);
        setResources([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadResources();
  }, []);

  useEffect(() => {
    const loadShortageEffects = async () => {
      try {
        // Get resources first
        const resourcesList = await getResources();
        
        const effects = calculateResourceShortageEffects(nation, resourcesList);
        setShortageEffects(effects);
        
        // Load descriptions for each effect
        const descriptions: Record<string, string> = {};
        for (const effect of effects) {
          try {
            descriptions[effect.resourceId] = await getShortageEffectDescription(effect);
          } catch (error) {
            console.error(`Failed to get description for ${effect.resourceId}:`, error);
            descriptions[effect.resourceId] = 'Resource shortage effects';
          }
        }
        setEffectDescriptions(descriptions);
      } catch (error) {
        console.error('Failed to calculate shortage effects:', error);
        setShortageEffects([]);
        setEffectDescriptions({});
      }
    };
    loadShortageEffects();
  }, [nation]);

  const getResourcesByCategory = (category: string): Resource[] => {
    return resources?.filter(resource => resource.category === category) || [];
  };

  // Create a lookup object from the resources array for backward compatibility
  const resourcesData = (resources || []).reduce((acc, resource) => {
    acc[resource.id] = resource;
    return acc;
  }, {} as Record<string, Resource>);

  const stockpiles = nation.resourceStockpiles || {};
  const production = nation.resourceProduction || {};
  const consumption = nation.resourceConsumption || {};
  const shortages = nation.resourceShortages || {};

  const getResourceStatus = (resourceId: string) => {
    const stockpile = stockpiles[resourceId] || 0;
    const prod = production[resourceId] || 0;
    const cons = consumption[resourceId] || 0;
    const shortage = shortages[resourceId] || 0;
    const net = prod - cons;
    
    const { status, weeksOfSupply, severity, color } = getResourceShortageStatus(stockpile, prod, cons);
    
    return {
      stockpile,
      production: prod,
      consumption: cons,
      net,
      shortage,
      status,
      weeksOfSupply,
      severity,
      color
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'surplus': return 'bg-green-500';
      case 'stable': return 'bg-blue-500';
      case 'shortage': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'surplus': return 'Surplus';
      case 'stable': return 'Stable';
      case 'shortage': return 'Low';
      case 'critical': return 'Critical';
      default: return 'Unknown';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.round(num).toString();
  };

  const resourceCategories = [
    { id: 'strategic', name: 'Strategic', resources: getResourcesByCategory('strategic') },
    { id: 'industrial', name: 'Industrial', resources: getResourcesByCategory('industrial') },
    { id: 'infrastructure', name: 'Infrastructure', resources: getResourcesByCategory('infrastructure') },
    { id: 'basic', name: 'Basic Needs', resources: getResourcesByCategory('basic') },
    { id: 'technology', name: 'Technology', resources: getResourcesByCategory('technology') }
  ];

  // Calculate critical shortages for display
  const criticalShortages = Object.entries(shortages).filter(([, severity]) => severity > 0.3);
  const activeTradeAgreements = nation.tradeAgreements?.filter(a => a.status === 'active') || [];

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>📊 National Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading resources...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 National Resources
          <Badge variant="outline">{nation.name}</Badge>
          {criticalShortages.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              <Warning size={14} className="mr-1" />
              {criticalShortages.length} Critical
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="stockpiles">Stockpiles</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
            <TabsTrigger value="trade">Trade</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics Summary */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Lightning className="text-blue-500" size={20} />
                  <div>
                    <div className="text-sm text-muted-foreground">Efficiency</div>
                    <div className="font-bold">
                      {Math.round((nation.resourceEfficiency?.overall || 1) * 100)}%
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Shield className="text-green-500" size={20} />
                  <div>
                    <div className="text-sm text-muted-foreground">Military Readiness</div>
                    <div className="font-bold">
                      {Math.round(nation.military.readiness || 100)}%
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Users className="text-purple-500" size={20} />
                  <div>
                    <div className="text-sm text-muted-foreground">Trade Agreements</div>
                    <div className="font-bold">{activeTradeAgreements.length}</div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {(resourcesData && typeof resourcesData === 'object' ? Object.keys(resourcesData) : [])
                .filter(resourceId => resourcesData[resourceId])
                .map(resourceId => {
                  const resource = resourcesData[resourceId];
                  const status = getResourceStatus(resourceId);
                
                return (
                  <div key={resourceId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">📦</div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {resource.name}
                          {status.shortage > 0.3 && (
                            <Warning size={16} className="text-red-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatNumber(status.stockpile)} {resource.unit}
                          {status.consumption > 0 && (
                            <span className={status.color}>
                              {' • '}
                              {status.weeksOfSupply === Infinity ? '∞' : `${Math.round(status.weeksOfSupply)}w`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div className={`font-medium ${status.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {status.net >= 0 ? <TrendUp size={16} className="inline mr-1" /> : <TrendDown size={16} className="inline mr-1" />}
                          {status.net >= 0 ? '+' : ''}{formatNumber(status.net)}/week
                        </div>
                        <div className="text-muted-foreground">
                          {formatNumber(status.production)} - {formatNumber(status.consumption)}
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(status.status)} text-white`}>
                        {getStatusText(status.status)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="effects" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resource Shortage Effects</h3>
              
              {shortageEffects.length === 0 ? (
                <Card className="p-4">
                  <div className="text-center text-muted-foreground">
                    <Shield size={32} className="mx-auto mb-2" />
                    <p>No significant resource shortages affecting your nation.</p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  {shortageEffects.map((effect, index) => {
                    const resource = resourcesData[effect.resourceId];
                    const severity = effect.severity;
                    const severityColor = severity > 0.7 ? 'text-red-600' :
                                        severity > 0.4 ? 'text-yellow-600' :
                                        'text-blue-600';
                    
                    return (
                      <Card key={index} className="p-4">
                        <div className="flex items-start gap-3">
                          <Warning className={severityColor} size={20} />
                          <div className="flex-1">
                            <div className="font-semibold">{resource?.name} Shortage</div>
                            <div className="text-sm text-muted-foreground mb-2">
                              Severity: {Math.round(severity * 100)}%
                            </div>
                            <div className="text-sm">
                              {effectDescriptions[effect.resourceId] || 'Loading description...'}
                            </div>
                            
                            {/* Effect breakdown */}
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              {effect.effects.buildingEfficiency && (
                                <div className="flex justify-between">
                                  <span>Industrial Efficiency:</span>
                                  <span className="font-mono">
                                    {Math.round(effect.effects.buildingEfficiency * 100)}%
                                  </span>
                                </div>
                              )}
                              {effect.effects.militaryReadiness && (
                                <div className="flex justify-between">
                                  <span>Military Readiness:</span>
                                  <span className="font-mono">
                                    {Math.round(effect.effects.militaryReadiness * 100)}%
                                  </span>
                                </div>
                              )}
                              {effect.effects.provinceStability && (
                                <div className="flex justify-between">
                                  <span>Unrest Impact:</span>
                                  <span className="font-mono text-red-600">
                                    +{(effect.effects.provinceStability * severity).toFixed(1)}
                                  </span>
                                </div>
                              )}
                              {effect.effects.populationGrowth && (
                                <div className="flex justify-between">
                                  <span>Population Growth:</span>
                                  <span className="font-mono text-red-600">
                                    {(effect.effects.populationGrowth * 100).toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="trade" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Trade Status</h3>
                <Button variant="outline" size="sm">
                  Create Trade Offer
                </Button>
              </div>

              {/* Active Trade Agreements */}
              {activeTradeAgreements.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Active Trade Agreements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activeTradeAgreements.map(agreement => {
                      const partnerNationId = agreement.nations.find(id => id !== nation.id);
                      const terms = agreement.terms[nation.id];
                      
                      return (
                        <div key={agreement.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">Agreement with {partnerNationId}</div>
                            <Badge variant="outline">{agreement.duration}w remaining</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Exporting:</div>
                              {Object.entries(terms?.exports || {}).map(([resourceId, amount]) => (
                                <div key={resourceId} className="flex justify-between">
                                  <span>{resourcesData[resourceId]?.name}</span>
                                  <span className="font-mono">{formatNumber(amount)}/week</span>
                                </div>
                              ))}
                            </div>
                            
                            <div>
                              <div className="text-muted-foreground">Importing:</div>
                              {Object.entries(terms?.imports || {}).map(([resourceId, amount]) => (
                                <div key={resourceId} className="flex justify-between">
                                  <span>{resourcesData[resourceId]?.name}</span>
                                  <span className="font-mono text-green-600">+{formatNumber(amount)}/week</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Pending Trade Offers */}
              {nation.tradeOffers && nation.tradeOffers.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Pending Trade Offers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {nation.tradeOffers.filter(offer => offer.status === 'pending').map(offer => (
                      <div key={offer.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {offer.fromNation === nation.id ? `To: ${offer.toNation}` : `From: ${offer.fromNation}`}
                          </div>
                          <Badge variant="outline">
                            Expires {Math.ceil((new Date(offer.expiresDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000))}d
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Offering:</div>
                            {Object.entries(offer.offering).map(([resourceId, amount]) => (
                              <div key={resourceId} className="flex justify-between">
                                <span>{resourcesData[resourceId]?.name}</span>
                                <span className="font-mono">{formatNumber(amount)}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div>
                            <div className="text-muted-foreground">Requesting:</div>
                            {Object.entries(offer.requesting).map(([resourceId, amount]) => (
                              <div key={resourceId} className="flex justify-between">
                                <span>{resourcesData[resourceId]?.name}</span>
                                <span className="font-mono">{formatNumber(amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {offer.toNation === nation.id && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="default">Accept</Button>
                            <Button size="sm" variant="outline">Reject</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Embargoes */}
              {((nation.diplomacy?.embargoes?.length || 0) > 0 || (nation.diplomacy?.sanctions?.length || 0) > 0) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Trade Restrictions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(nation.diplomacy?.embargoes?.length || 0) > 0 && (
                      <div>
                        <div className="text-sm text-muted-foreground">Embargoing:</div>
                        <div className="flex flex-wrap gap-1">
                          {(nation.diplomacy?.embargoes || []).map(nationId => (
                            <Badge key={nationId} variant="destructive">{nationId}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(nation.diplomacy?.sanctions?.length || 0) > 0 && (
                      <div>
                        <div className="text-sm text-muted-foreground">Under sanctions from:</div>
                        <div className="flex flex-wrap gap-1">
                          {(nation.diplomacy?.sanctions || []).map(nationId => (
                            <Badge key={nationId} variant="destructive">{nationId}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="production" className="space-y-4">
            {resourceCategories
              .filter(category => {
                const categoryResources = category.resources.filter(resource => 
                  production[resource.id] > 0 || consumption[resource.id] > 0
                );
                return categoryResources.length > 0;
              })
              .map(category => {
                const categoryResources = category.resources.filter(resource => 
                  production[resource.id] > 0 || consumption[resource.id] > 0
                );
                
                return (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {categoryResources.map(resource => {
                      const status = getResourceStatus(resource.id);
                      const maxValue = Math.max(status.production, status.consumption, 1);
                      
                      return (
                        <div key={resource.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{resource.name}</span>
                            <span className={status.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                              Net: {status.net >= 0 ? '+' : ''}{formatNumber(status.net)}/week
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Production: {formatNumber(status.production)}</span>
                              <span>Consumption: {formatNumber(status.consumption)}</span>
                            </div>
                            <div className="flex gap-1">
                              <Progress value={(status.production / maxValue) * 100} className="flex-1 h-2 bg-green-100" />
                              <Progress value={(status.consumption / maxValue) * 100} className="flex-1 h-2 bg-red-100" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="stockpiles" className="space-y-4">
            {resourceCategories
              .filter(category => {
                const categoryResources = category.resources.filter(resource => 
                  stockpiles[resource.id] > 0
                );
                return categoryResources.length > 0;
              })
              .map(category => {
                const categoryResources = category.resources.filter(resource => 
                  stockpiles[resource.id] > 0
                );
                
                return (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {categoryResources.map(resource => {
                        const status = getResourceStatus(resource.id);
                        const weeksOfSupply = status.consumption > 0 ? status.stockpile / status.consumption : Infinity;
                        
                        return (
                          <div key={resource.id} className="p-3 border rounded-lg">
                            <div className="font-medium text-sm">{resource.name}</div>
                            <div className="text-lg font-bold">
                              {formatNumber(status.stockpile)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {resource.unit}
                            </div>
                            {status.consumption > 0 && (
                              <div className="text-xs mt-1">
                                <span className={`font-medium ${weeksOfSupply < 4 ? 'text-red-600' : weeksOfSupply < 8 ? 'text-yellow-600' : 'text-green-600'}`}>
                                  {weeksOfSupply === Infinity ? '∞' : `${Math.round(weeksOfSupply)}w`} supply
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}