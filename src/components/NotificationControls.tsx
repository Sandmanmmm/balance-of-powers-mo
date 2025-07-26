import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellSlash, 
  ClockCounterClockwise,
  Stack,
  Trash
} from '@phosphor-icons/react';
import { 
  snoozeNotifications, 
  toggleNotificationMute, 
  toggleGroupedNotifications,
  clearNotificationHistory
} from '../lib/resourceNotifications';

interface NotificationControlsProps {
  nationId: string;
}

export function NotificationControls({ nationId }: NotificationControlsProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [groupingEnabled, setGroupingEnabled] = useState(true);
  const [snoozedUntil, setSnoozedUntil] = useState<number>(0);

  const handleToggleMute = () => {
    toggleNotificationMute(nationId);
    setIsMuted(!isMuted);
  };

  const handleToggleGrouping = () => {
    toggleGroupedNotifications(nationId);
    setGroupingEnabled(!groupingEnabled);
  };

  const handleSnooze = (hours: number) => {
    const duration = hours * 60 * 60 * 1000;
    snoozeNotifications(nationId, duration);
    setSnoozedUntil(Date.now() + duration);
  };

  const handleClearHistory = () => {
    clearNotificationHistory(nationId);
    setIsMuted(false);
    setGroupingEnabled(true);
    setSnoozedUntil(0);
  };

  const isCurrentlySnoozed = snoozedUntil > Date.now();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {isMuted ? (
            <BellSlash className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          Alert Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mute Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">Resource Alerts</span>
            {isMuted && <Badge variant="secondary" className="text-xs">Muted</Badge>}
          </div>
          <Switch
            checked={!isMuted}
            onCheckedChange={handleToggleMute}
            disabled={isCurrentlySnoozed}
          />
        </div>

        {/* Snooze Status */}
        {isCurrentlySnoozed && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClockCounterClockwise className="w-4 h-4" />
            <span>Snoozed for {Math.ceil((snoozedUntil - Date.now()) / (60 * 60 * 1000))}h</span>
          </div>
        )}

        {/* Grouping Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stack className="w-4 h-4" />
            <span className="text-sm">Group Alerts</span>
          </div>
          <Switch
            checked={groupingEnabled}
            onCheckedChange={handleToggleGrouping}
            disabled={isMuted || isCurrentlySnoozed}
          />
        </div>

        {/* Quick Snooze Options */}
        {!isMuted && !isCurrentlySnoozed && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Quick Snooze</div>
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 4].map(hours => (
                <Button
                  key={hours}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSnooze(hours)}
                  className="text-xs"
                >
                  {hours}h
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Clear History */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearHistory}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          <Trash className="w-3 h-3 mr-1" />
          Clear Alert History
        </Button>
      </CardContent>
    </Card>
  );
}