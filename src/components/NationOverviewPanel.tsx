import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Flag,
  Crown,
  TrendUp,
  TrendDown,
  Shield,
  Users,
  CurrencyDollar,
  Lightning,
  Scales,
  UserCheck,
  Globe,
  Gavel,
  Settings
} from '@phosphor-icons/react';
import { Nation, GameState } from '../lib/types';
import { toast } from 'sonner';

interface NationOverviewPanelProps {
  nation: Nation;
  gameState: GameState;
  isPlayerNation: boolean;
  onPolicyChange?: (policy: string, value: string) => void;
  onDecisionMake?: (decisionId: string, choiceIndex: number) => void;
}

interface Policy {
  id: string;
  name: string;
  category: string;
  current: string;
  options: Array<{
    value: string;
    label: string;
    description: string;
    cost?: number;
  }>;
}

interface Decision {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  requirements: string[];
  effects: string[];
  available: boolean;
}

function formatLargeNumber(num: number | undefined): string {
  if (num === undefined || num === null || isNaN(num)) return '$0';
  if (num >= 1000000000000) return `$${(num / 1000000000000).toFixed(1)}T`;
  if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  return `$${num.toLocaleString()}`;
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

// Sample policies data - in a real app this would come from game data
const samplePolicies: Policy[] = [
  {
    id: 'tax_rate',
    name: 'Income Tax Rate',
    category: 'Economic',
    current: 'moderate',
    options: [
      { value: 'low', label: 'Low (15%)', description: 'Stimulates growth, reduces revenue' },
      { value: 'moderate', label: 'Moderate (25%)', description: 'Balanced approach' },
      { value: 'high', label: 'High (35%)', description: 'Increases revenue, may slow growth' }
    ]
  },
  {
    id: 'military_doctrine',
    name: 'Military Doctrine',
    category: 'Military',
    current: 'defensive',
    options: [
      { value: 'defensive', label: 'Defensive', description: 'Focus on homeland security' },
      { value: 'balanced', label: 'Balanced', description: 'Mixed defensive and offensive capabilities' },
      { value: 'aggressive', label: 'Aggressive', description: 'Power projection capabilities', cost: 500000000 }
    ]
  },
  {
    id: 'research_priority',
    name: 'Research Priority',
    category: 'Technology',
    current: 'balanced',
    options: [
      { value: 'military', label: 'Military Tech', description: 'Focus on defense technology' },
      { value: 'economic', label: 'Economic Tech', description: 'Focus on productivity improvements' },
      { value: 'social', label: 'Social Tech', description: 'Focus on quality of life' },
      { value: 'balanced', label: 'Balanced', description: 'Equal investment across all areas' }
    ]
  }
];

// Sample decisions data - in a real app this would come from events.yaml
const sampleDecisions: Decision[] = [
  {
    id: 'infrastructure_investment',
    title: 'National Infrastructure Program',
    description: 'Launch a comprehensive infrastructure modernization program to improve roads, bridges, and digital networks.',
    category: 'Economic',
    cost: 250000000000,
    requirements: ['GDP > $1T', 'Debt ratio < 90%'],
    effects: ['+5% Economic Growth', '+2 Infrastructure Level', '+3% Approval'],
    available: true
  },
  {
    id: 'education_reform',
    title: 'Education System Reform',
    description: 'Modernize the education system with new curricula, teacher training, and technology integration.',
    category: 'Social',
    cost: 100000000000,
    requirements: ['Tech Level > 7.0'],
    effects: ['+0.5 Tech Level', '+10% Population Skills', '+5% Long-term Growth'],
    available: true
  },
  {
    id: 'green_energy_transition',
    title: 'Green Energy Transition',
    description: 'Accelerate the transition to renewable energy sources and reduce carbon emissions.',
    category: 'Environmental',
    cost: 500000000000,
    requirements: ['Renewable Energy Tech'],
    effects: ['-15% Carbon Emissions', '+3% International Approval', 'New Trade Opportunities'],
    available: false
  }
];

export function NationOverviewPanel({ 
  nation, 
  gameState, 
  isPlayerNation,
  onPolicyChange,
  onDecisionMake 
}: NationOverviewPanelProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'policies' | 'decisions'>('overview');
  
  const currentYear = new Date(gameState.currentDate).getFullYear();

  const handlePolicyChange = (policyId: string, value: string) => {
    if (!isPlayerNation) {
      toast.error("You can only modify your own nation's policies");
      return;
    }
    
    const policy = samplePolicies.find(p => p.id === policyId);
    const option = policy?.options.find(o => o.value === value);
    
    if (option?.cost) {
      toast.info(`Policy change will cost ${formatLargeNumber(option.cost)}`);
    }
    
    toast.success(`Changed ${policy?.name} to ${option?.label}`);
    onPolicyChange?.(policyId, value);
  };

  const handleDecisionExecute = (decisionId: string) => {
    if (!isPlayerNation) {
      toast.error("You can only make decisions for your own nation");
      return;
    }
    
    const decision = sampleDecisions.find(d => d.id === decisionId);
    if (!decision) return;
    
    if (!decision.available) {
      toast.error("This decision is not currently available");
      return;
    }
    
    toast.success(`Executing: ${decision.title}`);
    onDecisionMake?.(decisionId, 0);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Flag },
    { id: 'policies', label: 'Policies', icon: Settings },
    { id: 'decisions', label: 'Decisions', icon: Gavel }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{nation.flag}</span>
            <div>
              <CardTitle className="text-xl">{nation.name}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {nation.government.leader} • {nation.government.type} • {currentYear}
              </div>
              {!isPlayerNation && (
                <Badge variant="secondary" className="text-xs mt-1">
                  AI Controlled
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
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
            >
              <Icon size={14} className="mr-1" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-4">
            {/* Government Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Crown size={18} className="mr-2" />
                  Government
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Leader Approval</div>
                    <div className={`text-lg font-semibold ${getApprovalColor(nation.government?.approval)}`}>
                      {(nation.government?.approval ?? 0).toFixed(1)}%
                    </div>
                    <Progress value={nation.government?.approval ?? 0} className="h-2 mt-1" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Political Stability</div>
                    <div className={`text-lg font-semibold ${getStabilityColor(nation.government?.stability)}`}>
                      {(nation.government?.stability ?? 0).toFixed(1)}%
                    </div>
                    <Progress value={nation.government?.stability ?? 0} className="h-2 mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Economic Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <CurrencyDollar size={18} className="mr-2" />
                  Economy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">GDP</div>
                    <div className="text-lg font-semibold">
                      {formatLargeNumber(nation.economy?.gdp)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">National Debt</div>
                    <div className="text-lg font-semibold text-red-600">
                      {formatLargeNumber(nation.economy?.debt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Trade Balance</div>
                    <div className={`text-lg font-semibold ${
                      (nation.economy?.tradeBalance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(nation.economy?.tradeBalance ?? 0) >= 0 ? '+' : ''}
                      {formatLargeNumber(nation.economy?.tradeBalance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Inflation Rate</div>
                    <div className={`text-lg font-semibold ${
                      (nation.economy?.inflation ?? 0) > 4 ? 'text-red-600' : 
                      (nation.economy?.inflation ?? 0) > 2 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {(nation.economy?.inflation ?? 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Military Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Shield size={18} className="mr-2" />
                  Military
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Active Personnel</div>
                    <div className="text-lg font-semibold">
                      {(nation.military?.manpower ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Equipment Level</div>
                    <div className="text-lg font-semibold">
                      {nation.military?.equipment ?? 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Doctrine</div>
                    <div className="text-sm font-medium">
                      {nation.military?.doctrine}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Nuclear Capability</div>
                    <div className="text-sm font-medium">
                      {nation.military?.nuclearCapability ? (
                        <Badge variant="destructive">Nuclear Armed</Badge>
                      ) : (
                        <Badge variant="secondary">Conventional</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technology Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Lightning size={18} className="mr-2" />
                  Technology
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Tech Level</div>
                    <div className="text-lg font-semibold">
                      {(nation.technology?.level ?? 0).toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Research Points</div>
                    <div className="text-lg font-semibold">
                      {(nation.technology?.researchPoints ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Current Research</div>
                  <div className="space-y-1">
                    {(nation.technology?.currentResearch ?? []).map((tech, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">{tech}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Policies Tab */}
        {selectedTab === 'policies' && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              {isPlayerNation ? 'Adjust your nation\'s policies to shape its future.' : 'View this nation\'s current policies.'}
            </div>
            
            {samplePolicies.map(policy => (
              <Card key={policy.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{policy.name}</CardTitle>
                  <Badge variant="outline" className="w-fit">
                    {policy.category}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {isPlayerNation ? (
                    <Select 
                      value={policy.current} 
                      onValueChange={(value) => handlePolicyChange(policy.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {policy.options.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                              {option.cost && (
                                <div className="text-xs text-orange-600">Cost: {formatLargeNumber(option.cost)}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-muted rounded-md">
                      <div className="font-medium">
                        {policy.options.find(o => o.value === policy.current)?.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {policy.options.find(o => o.value === policy.current)?.description}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Decisions Tab */}
        {selectedTab === 'decisions' && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              {isPlayerNation ? 'Major decisions that will shape your nation\'s destiny.' : 'View potential decisions for this nation.'}
            </div>
            
            {sampleDecisions.map(decision => (
              <Card key={decision.id} className={!decision.available ? 'opacity-50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{decision.title}</CardTitle>
                      <Badge variant="outline" className="w-fit mt-1">
                        {decision.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">
                        Cost: {formatLargeNumber(decision.cost)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{decision.description}</p>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Requirements:</div>
                    <div className="space-y-1">
                      {decision.requirements.map((req, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${decision.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-xs">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Effects:</div>
                    <div className="space-y-1">
                      {decision.effects.map((effect, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <TrendUp size={12} className="text-green-500" />
                          <span className="text-xs">{effect}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {isPlayerNation && (
                    <Button 
                      onClick={() => handleDecisionExecute(decision.id)}
                      disabled={!decision.available}
                      className="w-full mt-3"
                    >
                      Execute Decision
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}