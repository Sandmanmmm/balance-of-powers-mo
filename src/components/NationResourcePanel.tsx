import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Nation } from '../lib/types';
import { resourcesData, getResourcesByCategory } from '../lib/gameData';

interface NationResourcePanelProps {
  nation: Nation;
}

export function NationResourcePanel({ nation }: NationResourcePanelProps) {
  const stockpiles = nation.resourceStockpiles || {};
  const production = nation.resourceProduction || {};
  const consumption = nation.resourceConsumption || {};

  const getResourceStatus = (resourceId: string) => {
    const stockpile = stockpiles[resourceId] || 0;
    const prod = production[resourceId] || 0;
    const cons = consumption[resourceId] || 0;
    const net = prod - cons;
    
    return {
      stockpile,
      production: prod,
      consumption: cons,
      net,
      status: net >= 0 ? 'surplus' : stockpile > cons * 4 ? 'stable' : stockpile > cons ? 'shortage' : 'critical'
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 National Resources
          <Badge variant="outline">{nation.name}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="stockpiles">Stockpiles</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {Object.keys(resourcesData).map(resourceId => {
                const resource = resourcesData[resourceId];
                const status = getResourceStatus(resourceId);
                
                return (
                  <div key={resourceId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">📦</div>
                      <div>
                        <div className="font-medium">{resource.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatNumber(status.stockpile)} {resource.unit}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div className={`font-medium ${status.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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

          <TabsContent value="production" className="space-y-4">
            {resourceCategories.map(category => {
              const categoryResources = category.resources.filter(resource => 
                production[resource.id] > 0 || consumption[resource.id] > 0
              );
              
              if (categoryResources.length === 0) return null;
              
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
            {resourceCategories.map(category => {
              const categoryResources = category.resources.filter(resource => 
                stockpiles[resource.id] > 0
              );
              
              if (categoryResources.length === 0) return null;
              
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