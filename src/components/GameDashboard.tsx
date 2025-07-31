import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  SkipForward,
  Calendar,
  Flag,
  TrendUp,
  TrendDown,
  Shield,
  Lightning,
  Users,
  CurrencyDollar,
  ChartBar,
  Globe,
  Package
} from '@phosphor-icons/react';
import { Nation, GameState } from '../lib/types';
import { NationOverviewPanel } from './NationOverviewPanel';
import { NationResourcePanel } from './NationResourcePanel';
import { NotificationControls } from './NotificationControls';
import { GameDataSummary } from './GameDataSummary';

interface GameDashboardProps {
  nation: Nation;
  gameState: GameState;
  onTogglePause: () => void;
  onSpeedChange: (speed: number) => void;
  onPolicyChange?: (policy: string, value: string) => void;
  onDecisionMake?: (decisionId: string, choiceIndex: number) => void;
}

function formatLargeNumber(num: number | undefined): string {
  if (num === undefined || num === null || isNaN(num)) return '$0';
  if (num >= 1000000000000) return `$${(num / 1000000000000).toFixed(1)}T`;
  if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  return `$${num.toLocaleString()}`;
}

function formatDate(date: Date | string): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

function getApprovalColor(approval: number | undefined): string {
  if (approval === undefined || approval === null || isNaN(approval)) return 'text-muted-foreground';
  if (approval > 70) return 'text-green-600';
  if (approval > 50) return 'text-blue-600';
  if (approval > 30) return 'text-yellow-600';
  return 'text-red-600';
}

function getStabilityColor(stability: number | undefined): string {
  if (stability === undefined || stability === null || isNaN(stability)) return 'text-muted-foreground';
  if (stability > 80) return 'text-green-600';
  if (stability > 60) return 'text-blue-600';
  if (stability > 40) return 'text-yellow-600';
  return 'text-red-600';
}

export function GameDashboard({ 
  nation, 
  gameState, 
  onTogglePause, 
  onSpeedChange,
  onPolicyChange,
  onDecisionMake
}: GameDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<'summary' | 'nation' | 'resources' | 'diplomacy' | 'system'>('summary');
  const speedOptions = [0.5, 1, 2, 4];
  const currentYear = new Date(gameState.currentDate).getFullYear();

  const tabs = [
    { id: 'summary', label: 'Summary', icon: ChartBar },
    { id: 'nation', label: 'Nation', icon: Flag },
    { id: 'resources', label: 'Resources', icon: Package },
    { id: 'diplomacy', label: 'Diplomacy', icon: Globe },
    { id: 'system', label: 'System', icon: Lightning }
  ];

  return (
    <div className="w-80 space-y-4">
      {/* Time Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Game Controls</CardTitle>
            <div className="flex items-center space-x-1">
              <Calendar size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formatDate(gameState.currentDate)}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Year {currentYear} • {gameState.isPaused ? 'Paused' : `${gameState.timeSpeed}x Speed`}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Play/Pause Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant={gameState.isPaused ? "default" : "secondary"}
              size="sm"
              onClick={onTogglePause}
              className="flex-1"
            >
              {gameState.isPaused ? (
                <>
                  <Play size={14} className="mr-1" />
                  Resume
                </>
              ) : (
                <>
                  <Pause size={14} className="mr-1" />
                  Pause
                </>
              )}
            </Button>
          </div>

          {/* Speed Controls */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Game Speed</div>
            <div className="grid grid-cols-4 gap-1">
              {speedOptions.map((speed) => (
                <Button
                  key={speed}
                  variant={gameState.timeSpeed === speed ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSpeedChange(speed)}
                  disabled={gameState.isPaused}
                >
                  {speed}x
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 p-1 bg-muted rounded-lg">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTab(tab.id as any)}
              className="flex-1"
              title={tab.label}
            >
              <Icon size={16} />
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        {selectedTab === 'summary' && (
          <div className="space-y-4">
            {/* Nation Overview Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{nation.flag}</span>
                  <div>
                    <CardTitle className="text-lg">{nation.name}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {nation.government.leader} • {nation.government.type}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Government Status */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Leader Approval</span>
                    <span className={`text-sm font-medium ${getApprovalColor(nation.government?.approval)}`}>
                      {(nation.government?.approval ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={nation.government?.approval ?? 0} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Political Stability</span>
                    <span className={`text-sm font-medium ${getStabilityColor(nation.government?.stability)}`}>
                      {(nation.government?.stability ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={nation.government?.stability ?? 0} className="h-2" />
                </div>

                <Separator />

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <CurrencyDollar size={14} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">GDP</span>
                    </div>
                    <div className="text-sm font-medium">
                      {formatLargeNumber(nation.economy?.gdp)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <TrendUp size={14} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Trade</span>
                    </div>
                    <div className={`text-sm font-medium ${
                      (nation.economy?.tradeBalance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(nation.economy?.tradeBalance ?? 0) >= 0 ? '+' : ''}
                      {formatLargeNumber(nation.economy?.tradeBalance)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <Shield size={14} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Military</span>
                    </div>
                    <div className="text-sm font-medium">
                      {(nation.military?.manpower ?? 0).toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <Lightning size={14} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Tech Level</span>
                    </div>
                    <div className="text-sm font-medium">
                      {(nation.technology?.level ?? 0).toFixed(1)}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Quick Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Debt Ratio</span>
                    <span className={`font-medium ${
                      (nation.economy?.debt ?? 0) / (nation.economy?.gdp ?? 1) > 0.8 ? 'text-red-600' : 'text-foreground'
                    }`}>
                      {(((nation.economy?.debt ?? 0) / (nation.economy?.gdp ?? 1)) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Inflation</span>
                    <span className={`font-medium ${
                      (nation.economy?.inflation ?? 0) > 4 ? 'text-red-600' : 
                      (nation.economy?.inflation ?? 0) > 2 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {(nation.economy?.inflation ?? 0).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Military Equipment</span>
                    <span className="font-medium">{nation.military?.equipment ?? 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Research */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Lightning size={18} className="mr-2" />
                  Technology Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Current Research</div>
                    {(nation.technology?.currentResearch ?? []).length > 0 ? (
                      <div className="space-y-2">
                        {(nation.technology?.currentResearch ?? []).map((tech, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">{tech}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No active research</div>
                    )}
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Completed Technologies</div>
                    {(nation.technology?.completedTech ?? []).length > 0 ? (
                      <div className="text-xs text-muted-foreground">
                        {(nation.technology?.completedTech ?? []).slice(-3).join(', ')}
                        {(nation.technology?.completedTech ?? []).length > 3 && ` +${(nation.technology?.completedTech ?? []).length - 3} more`}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">None completed</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Controls */}
            <NotificationControls nationId={nation.id} />
          </div>
        )}

        {selectedTab === 'nation' && (
          <NationOverviewPanel
            nation={nation}
            isPlayerNation={gameState.selectedNation === nation.id}
            onPolicyChange={onPolicyChange}
            onDecisionMake={onDecisionMake}
          />
        )}

        {selectedTab === 'resources' && (
          <NationResourcePanel nation={nation} />
        )}

        {selectedTab === 'diplomacy' && (
          <div className="space-y-4">
            {/* Diplomacy Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Flag size={18} className="mr-2" />
                  International Relations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(nation.diplomacy?.allies ?? []).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-600">Allies</div>
                    <div className="flex flex-wrap gap-1">
                      {(nation.diplomacy?.allies ?? []).map((ally, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {ally}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(nation.diplomacy?.enemies ?? []).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-red-600">Tensions</div>
                    <div className="flex flex-wrap gap-1">
                      {(nation.diplomacy?.enemies ?? []).map((enemy, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {enemy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(nation.diplomacy?.tradePartners ?? []).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-blue-600">Trade Partners</div>
                    <div className="flex flex-wrap gap-1">
                      {(nation.diplomacy?.tradePartners ?? []).slice(0, 4).map((partner, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {partner}
                        </Badge>
                      ))}
                      {(nation.diplomacy?.tradePartners ?? []).length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{(nation.diplomacy?.tradePartners ?? []).length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'system' && (
          <div className="space-y-4">
            <GameDataSummary />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}