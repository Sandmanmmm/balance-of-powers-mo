import { useState } from 'react';
import { Nation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Crown, 
  Coins, 
  TrendUp, 
  Shield, 
  Atom, 
  Users,
  Flag,
  Settings,
  FileText,
  AlertTriangle
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface NationOverviewPanelProps {
  nation: Nation;
  isPlayerNation: boolean;
  onPolicyChange?: (policy: string, value: string) => void;
  onDecisionMake?: (decisionId: string, choiceIndex: number) => void;
}

interface Policy {
  id: string;
  name: string;
  category: string;
  currentValue: string;
  options: Array<{ value: string; label: string; description: string; effects?: string[] }>;
}

interface Decision {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  choices: Array<{ 
    text: string; 
    description: string; 
    effects: string[];
    cost?: number;
  }>;
  requirements?: string[];
  timeLimit?: string;
}

export function NationOverviewPanel({ 
  nation, 
  isPlayerNation, 
  onPolicyChange, 
  onDecisionMake 
}: NationOverviewPanelProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock policies - in a real game, these would come from game data
  const policies: Policy[] = [
    {
      id: 'tax_policy',
      name: 'Tax Level',
      category: 'Economic',
      currentValue: 'moderate',
      options: [
        { value: 'low', label: 'Low (15%)', description: 'Stimulates growth, reduces revenue', effects: ['+GDP Growth', '-Government Revenue'] },
        { value: 'moderate', label: 'Moderate (25%)', description: 'Balanced approach', effects: ['Balanced'] },
        { value: 'high', label: 'High (35%)', description: 'Increases revenue, may reduce growth', effects: ['+Government Revenue', '-GDP Growth'] }
      ]
    },
    {
      id: 'military_doctrine',
      name: 'Military Doctrine',
      category: 'Military',
      currentValue: 'balanced',
      options: [
        { value: 'defensive', label: 'Defensive', description: 'Focus on homeland defense', effects: ['+Fortification', '-Power Projection'] },
        { value: 'balanced', label: 'Balanced', description: 'Mixed approach', effects: ['Balanced Forces'] },
        { value: 'offensive', label: 'Offensive', description: 'Power projection capability', effects: ['+Power Projection', '-Stability'] }
      ]
    },
    {
      id: 'research_priority',
      name: 'Research Priority',
      category: 'Technology',
      currentValue: 'civilian',
      options: [
        { value: 'military', label: 'Military Tech', description: 'Prioritize defense research', effects: ['+Military Research', '+Equipment'] },
        { value: 'civilian', label: 'Civilian Tech', description: 'Focus on economic growth', effects: ['+Civilian Research', '+GDP'] },
        { value: 'dual_use', label: 'Dual-Use', description: 'Mixed research approach', effects: ['Balanced Research'] }
      ]
    },
    {
      id: 'trade_policy',
      name: 'Trade Policy',
      category: 'Economic',
      currentValue: 'free_trade',
      options: [
        { value: 'protectionist', label: 'Protectionist', description: 'Protect domestic industries', effects: ['+Domestic Industry', '-International Relations'] },
        { value: 'free_trade', label: 'Free Trade', description: 'Open borders for trade', effects: ['+Trade Revenue', '+International Relations'] },
        { value: 'selective', label: 'Selective', description: 'Strategic trade partnerships', effects: ['Balanced Trade'] }
      ]
    }
  ];

  // Mock decisions - in a real game, these would be generated based on game state
  const decisions: Decision[] = [
    {
      id: 'infrastructure_investment',
      title: 'National Infrastructure Program',
      description: 'A comprehensive plan to modernize the nation\'s infrastructure, including roads, internet, and utilities.',
      category: 'Economic',
      urgency: 'medium',
      choices: [
        {
          text: 'Major Investment',
          description: 'Commit significant resources to rapid modernization',
          effects: ['+2 Infrastructure nationwide', '+Economic Growth', '+Debt'],
          cost: 500000000000
        },
        {
          text: 'Moderate Investment',
          description: 'Balanced approach to infrastructure improvement',
          effects: ['+1 Infrastructure nationwide', '+Minor Economic Growth'],
          cost: 200000000000
        },
        {
          text: 'Delay Program',
          description: 'Postpone infrastructure investment',
          effects: ['-Public Approval', 'No Cost']
        }
      ],
      timeLimit: '6 months'
    },
    {
      id: 'research_breakthrough',
      title: 'Quantum Computing Breakthrough',
      description: 'Our scientists have made a significant breakthrough in quantum computing. How should we proceed?',
      category: 'Technology',
      urgency: 'high',
      choices: [
        {
          text: 'Military Application',
          description: 'Focus on military and security applications',
          effects: ['+Military Technology', '+National Security', '-International Relations']
        },
        {
          text: 'Civilian Use',
          description: 'Commercialize for civilian applications',
          effects: ['+Economic Growth', '+Technology Level', '+International Cooperation']
        },
        {
          text: 'International Sharing',
          description: 'Share research with allies',
          effects: ['+International Relations', '+Research Cooperation', '-Military Advantage']
        }
      ],
      requirements: ['Advanced Computing research completed'],
      timeLimit: '3 months'
    }
  ];

  const formatCurrency = (amount: number) => {
    if (amount >= 1e12) return `$${(amount / 1e12).toFixed(1)}T`;
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    return `$${amount.toLocaleString()}`;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const handlePolicyChange = (policyId: string, newValue: string) => {
    if (!isPlayerNation) {
      toast.error("You can only change policies for your own nation");
      return;
    }
    
    onPolicyChange?.(policyId, newValue);
    toast.success("Policy updated successfully");
  };

  const handleDecisionMake = (decisionId: string, choiceIndex: number) => {
    if (!isPlayerNation) {
      toast.error("You can only make decisions for your own nation");
      return;
    }
    
    const decision = decisions.find(d => d.id === decisionId);
    const choice = decision?.choices[choiceIndex];
    
    if (choice?.cost && nation.economy.treasury < choice.cost) {
      toast.error(`Insufficient funds. Need ${formatCurrency(choice.cost)} but only have ${formatCurrency(nation.economy.treasury)}`);
      return;
    }
    
    onDecisionMake?.(decisionId, choiceIndex);
    toast.success(`Decision "${decision?.title}" executed`);
  };

  return (
    <div className="space-y-4">
      {/* Nation Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{nation.flag}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{nation.name}</h2>
            {isPlayerNation && (
              <Badge variant="default">Your Nation</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Crown className="w-4 h-4" />
            <span>{nation.government.leader}</span>
            <Badge variant="outline" className="text-xs">
              {nation.government.type}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Coins className="w-4 h-4 text-green-600" />
                  Treasury
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{formatCurrency(nation.economy.treasury)}</div>
                <div className="text-xs text-muted-foreground">
                  GDP: {formatCurrency(nation.economy.gdp)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{nation.government.approval.toFixed(1)}%</div>
                <Progress value={nation.government.approval} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  Military
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{nation.military.equipment}%</div>
                <div className="text-xs text-muted-foreground">
                  Equipment Level
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Atom className="w-4 h-4 text-purple-600" />
                  Technology
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">Level {nation.technology.level.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">
                  {nation.technology.researchPoints} RP
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Research */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Current Research</CardTitle>
            </CardHeader>
            <CardContent>
              {nation.technology.currentResearch.length > 0 ? (
                <div className="space-y-2">
                  {nation.technology.currentResearch.map((tech, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Atom className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">{tech}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No active research</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5" />
            <h3 className="text-lg font-semibold">National Policies</h3>
            {!isPlayerNation && (
              <Badge variant="secondary">View Only</Badge>
            )}
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {policies.map((policy) => (
                <Card key={policy.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{policy.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {policy.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Select
                        value={policy.currentValue}
                        onValueChange={(value) => handlePolicyChange(policy.id, value)}
                        disabled={!isPlayerNation}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {policy.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Current Policy Effects */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium">Current Effects:</div>
                        <div className="flex flex-wrap gap-1">
                          {policy.options
                            .find(opt => opt.value === policy.currentValue)
                            ?.effects?.map((effect, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {effect}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5" />
            <h3 className="text-lg font-semibold">National Decisions</h3>
            {!isPlayerNation && (
              <Badge variant="secondary">View Only</Badge>
            )}
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {decisions.map((decision) => (
                <Card key={decision.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{decision.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getUrgencyColor(decision.urgency)}`} />
                        <Badge variant="outline" className="text-xs">
                          {decision.category}
                        </Badge>
                      </div>
                    </div>
                    {decision.timeLimit && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertTriangle className="w-3 h-3" />
                        Time limit: {decision.timeLimit}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {decision.description}
                      </p>
                      
                      {decision.requirements && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium">Requirements:</div>
                          <div className="text-xs text-muted-foreground">
                            {decision.requirements.join(', ')}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="text-xs font-medium">Available Choices:</div>
                        {decision.choices.map((choice, index) => (
                          <Card key={index} className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-sm">{choice.text}</div>
                                {choice.cost && (
                                  <Badge variant="outline" className="text-xs">
                                    {formatCurrency(choice.cost)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {choice.description}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {choice.effects.map((effect, effectIndex) => (
                                  <Badge key={effectIndex} variant="secondary" className="text-xs">
                                    {effect}
                                  </Badge>
                                ))}
                              </div>
                              {isPlayerNation && (
                                <Button
                                  size="sm"
                                  onClick={() => handleDecisionMake(decision.id, index)}
                                  disabled={choice.cost ? nation.economy.treasury < choice.cost : false}
                                  className="w-full"
                                >
                                  Choose This Option
                                </Button>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Economic Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>GDP</span>
                  <span className="font-mono">{formatCurrency(nation.economy.gdp)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Debt</span>
                  <span className="font-mono">{formatCurrency(nation.economy.debt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Inflation</span>
                  <span className="font-mono">{nation.economy.inflation.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Trade Balance</span>
                  <span className="font-mono">{formatCurrency(nation.economy.tradeBalance)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Military Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Manpower</span>
                  <span className="font-mono">{nation.military.manpower.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Equipment Level</span>
                  <span className="font-mono">{nation.military.equipment}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Doctrine</span>
                  <span className="font-mono">{nation.military.doctrine}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Nuclear Capability</span>
                  <span className="font-mono">{nation.military.nuclearCapability ? 'Yes' : 'No'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Diplomacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <div className="text-xs font-medium">Allies:</div>
                  <div className="flex flex-wrap gap-1">
                    {nation.diplomacy.allies.map((ally, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {ally}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium">Trade Partners:</div>
                  <div className="flex flex-wrap gap-1">
                    {nation.diplomacy.tradePartners.slice(0, 5).map((partner, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {partner}
                      </Badge>
                    ))}
                    {nation.diplomacy.tradePartners.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{nation.diplomacy.tradePartners.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}