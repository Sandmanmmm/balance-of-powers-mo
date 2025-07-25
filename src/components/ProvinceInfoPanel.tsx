import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  TrendUp, 
  Shield, 
  Lightning, 
  CarProfile,
  WifiHigh,
  Heart,
  GraduationCap,
  Warning,
  Hammer
} from '@phosphor-icons/react';
import { Province, Nation } from '../lib/types';
import { cn } from '../lib/utils';
import { ConstructionPanel } from './ConstructionPanel';

interface ProvinceInfoPanelProps {
  province: Province;
  nation?: Nation;
  onStartConstruction?: (buildingId: string, provinceId: string) => void;
  onCancelConstruction?: (projectId: string) => void;
  isPlayerControlled?: boolean;
}

function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatCurrency(num: number | undefined): string {
  if (num === undefined || num === null || isNaN(num)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

function getUnrestColor(unrest: number | undefined): string {
  if (unrest === undefined || unrest === null || isNaN(unrest)) return 'text-muted-foreground';
  if (unrest > 8) return 'text-red-600';
  if (unrest > 6) return 'text-orange-600';
  if (unrest > 4) return 'text-yellow-600';
  if (unrest > 2) return 'text-blue-600';
  return 'text-green-600';
}

function getUnrestLabel(unrest: number | undefined): string {
  if (unrest === undefined || unrest === null || isNaN(unrest)) return 'Unknown';
  if (unrest > 8) return 'Critical';
  if (unrest > 6) return 'High';
  if (unrest > 4) return 'Moderate';
  if (unrest > 2) return 'Low';
  return 'Stable';
}

export function ProvinceInfoPanel({ 
  province, 
  nation, 
  onStartConstruction, 
  onCancelConstruction, 
  isPlayerControlled = false 
}: ProvinceInfoPanelProps) {
  const dominantParty = Object.entries(province.politics?.partySupport || {})
    .reduce((a, b) => a[1] > b[1] ? a : b, ['Unknown', 0]);

  const dominantEthnicGroup = (province.population?.ethnicGroups || [])
    .reduce((a, b) => a.percent > b.percent ? a : b, { group: 'Unknown', percent: 0 });

  return (
    <Card className="w-80 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{province.name}</CardTitle>
          <Badge variant="outline">{province.country}</Badge>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Users size={14} />
          <span>{formatNumber(province.population?.total)} people</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 text-xs">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="politics">Politics</TabsTrigger>
            <TabsTrigger value="economy">Economy</TabsTrigger>
            <TabsTrigger value="military">Military</TabsTrigger>
            <TabsTrigger value="construction">
              <Hammer size={12} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Unrest Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stability</span>
                <div className="flex items-center space-x-2">
                  <Warning 
                    size={14} 
                    className={cn(getUnrestColor(province.unrest))} 
                  />
                  <span className={cn("text-sm font-medium", getUnrestColor(province.unrest))}>
                    {getUnrestLabel(province.unrest)}
                  </span>
                </div>
              </div>
              <Progress 
                value={Math.max(0, 100 - (province.unrest ?? 0) * 10)} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                Unrest Level: {(province.unrest ?? 0).toFixed(1)}/10
              </div>
            </div>

            <Separator />

            {/* Demographics */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Demographics</h4>
              <div className="space-y-1">
                {(province.population?.ethnicGroups || []).map((group, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span>{group.group}</span>
                    <span className="font-medium">{group.percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Infrastructure */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Infrastructure</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <CarProfile size={12} />
                    <span className="text-xs">Roads</span>
                  </div>
                  <Progress value={(province.infrastructure?.roads ?? 0) * 20} className="h-1" />
                  <div className="text-xs text-muted-foreground">
                    Level {province.infrastructure?.roads ?? 0}/5
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <WifiHigh size={12} />
                    <span className="text-xs">Internet</span>
                  </div>
                  <Progress value={(province.infrastructure?.internet ?? 0) * 20} className="h-1" />
                  <div className="text-xs text-muted-foreground">
                    Level {province.infrastructure?.internet ?? 0}/5
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <Heart size={12} />
                    <span className="text-xs">Healthcare</span>
                  </div>
                  <Progress value={(province.infrastructure?.healthcare ?? 0) * 20} className="h-1" />
                  <div className="text-xs text-muted-foreground">
                    Level {province.infrastructure?.healthcare ?? 0}/5
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <GraduationCap size={12} />
                    <span className="text-xs">Education</span>
                  </div>
                  <Progress value={(province.infrastructure?.education ?? 0) * 20} className="h-1" />
                  <div className="text-xs text-muted-foreground">
                    Level {province.infrastructure?.education ?? 0}/5
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="politics" className="space-y-4">
            {/* Governor Approval */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Governor Approval</span>
                <span className="text-sm font-bold">{(province.politics?.governorApproval ?? 0).toFixed(1)}%</span>
              </div>
              <Progress value={province.politics?.governorApproval ?? 0} className="h-2" />
            </div>

            <Separator />

            {/* Party Support */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Party Support</h4>
              <div className="space-y-2">
                {Object.entries(province.politics?.partySupport || {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([party, support]) => (
                    <div key={party} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className={party === dominantParty[0] ? "font-medium" : ""}>
                          {party}
                        </span>
                        <span className="font-medium">{support.toFixed(1)}%</span>
                      </div>
                      <Progress value={support} className="h-1" />
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="economy" className="space-y-4">
            {/* Economic Indicators */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">GDP per Capita</span>
                <div className="text-sm font-medium">
                  {formatCurrency(province.economy?.gdpPerCapita)}
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Unemployment</span>
                <div className="text-sm font-medium">
                  {(province.economy?.unemployment ?? 0).toFixed(1)}%
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Inflation</span>
                <div className="text-sm font-medium">
                  {(province.economy?.inflation ?? 0).toFixed(1)}%
                </div>
              </div>
            </div>

            <Separator />

            {/* Resource Output */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Resource Output</h4>
              <div className="space-y-2">
                {Object.entries(province.resourceOutput || {}).map(([resource, amount]) => (
                  <div key={resource} className="flex justify-between text-xs">
                    <span className="capitalize">{resource}</span>
                    <span className="font-medium">{formatNumber(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="military" className="space-y-4">
            {/* Military Status */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Fortification Level</span>
                <span className="text-sm font-bold">
                  {(province.military?.fortificationLevel ?? 0)}/5
                </span>
              </div>
              <Progress value={(province.military?.fortificationLevel ?? 0) * 20} className="h-2" />
            </div>

            <Separator />

            {/* Stationed Units */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Stationed Units</h4>
              {(province.military?.stationedUnits || []).length > 0 ? (
                <div className="space-y-1">
                  {(province.military?.stationedUnits || []).map((unit, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Shield size={12} className="text-muted-foreground" />
                      <span className="text-xs">{typeof unit === 'string' ? unit : unit.id}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No units stationed</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="construction" className="space-y-4">
            {nation && onStartConstruction && onCancelConstruction ? (
              <ConstructionPanel
                province={province}
                nation={nation}
                onStartConstruction={onStartConstruction}
                onCancelConstruction={onCancelConstruction}
                isPlayerControlled={isPlayerControlled}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Hammer className="w-8 h-8 mx-auto mb-2" />
                <p>Construction data unavailable</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}