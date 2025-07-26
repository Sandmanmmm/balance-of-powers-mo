import { Nation, ResourceShortageEffect } from './types';
import { resourcesData } from './gameData';
import { toast } from 'sonner';

interface ResourceNotificationState {
  resourceId: string;
  severity: number;
  lastNotified: number;
  type: 'shortage' | 'surplus' | 'critical';
  ticksInState: number; // How many ticks we've been in this state
  thresholdCrossed: boolean; // Has threshold been crossed for first time
}

interface NotificationSettings {
  muted: boolean;
  snoozedUntil: number;
  groupNotifications: boolean;
}

// Enhanced state tracking for notifications
const notificationState = new Map<string, Map<string, ResourceNotificationState>>();
const notificationSettings = new Map<string, NotificationSettings>();

type PendingNotification = {
  resourceId: string;
  type: 'shortage' | 'surplus' | 'critical';
  severity: number;
};

const pendingGroupedNotifications = new Map<string, Array<PendingNotification>>();

/**
 * Check and send resource shortage/surplus notifications with improved state tracking
 */
export function checkResourceNotifications(nation: Nation, gameDate: Date): void {
  if (!nation.resourceStockpiles || !nation.resourceProduction || !nation.resourceConsumption) {
    return;
  }

  // Safety check for resourcesData
  if (!resourcesData || typeof resourcesData !== 'object') {
    console.warn('Resource data not loaded, skipping notifications');
    return;
  }

  const now = gameDate.getTime();
  const nationNotifications = notificationState.get(nation.id) || new Map();
  const settings = getNotificationSettings(nation.id);
  
  // Check if notifications are muted or snoozed
  if (settings.muted || (settings.snoozedUntil > 0 && now < settings.snoozedUntil)) {
    return;
  }
  
  const pendingNotifications: Array<PendingNotification> = [];
  
  Object.keys(resourcesData || {}).forEach(resourceId => {
    if (!resourceId || !resourcesData || !resourcesData[resourceId]) return;
    
    const resource = resourcesData[resourceId];
    if (!resource) return;
    
    const stockpile = nation.resourceStockpiles?.[resourceId] || 0;
    const production = nation.resourceProduction?.[resourceId] || 0;
    const consumption = nation.resourceConsumption?.[resourceId] || 0;
    const net = production - consumption;
    
    // Calculate weeks of supply
    const weeksOfSupply = consumption > 0 ? stockpile / consumption : Infinity;
    
    // Calculate shortage severity
    let severity = 0;
    let notificationType: 'shortage' | 'surplus' | 'critical' = 'shortage';
    
    if (consumption > 0) {
      if (weeksOfSupply < 2) {
        severity = 1 - (weeksOfSupply / 2); // 0-1 scale
        notificationType = 'critical';
      } else if (weeksOfSupply < 8) {
        severity = 1 - (weeksOfSupply / 8); // 0-1 scale
        notificationType = 'shortage';
      } else if (net > consumption * 0.5 && stockpile > consumption * 16) {
        // Large surplus (net positive and 16+ weeks of stock)
        severity = Math.min(1, net / consumption);
        notificationType = 'surplus';
      }
    }
    
    const lastNotification = nationNotifications.get(resourceId);
    const shouldNotify = shouldSendNotificationEnhanced(
      severity, 
      notificationType, 
      lastNotification, 
      now,
      resourceId,
      nation.id
    );
    
    if (shouldNotify) {
      if (settings.groupNotifications && notificationType !== 'critical') {
        // Add to pending group notifications (non-critical only)
        pendingNotifications.push({
          resourceId,
          type: notificationType,
          severity
        });
      } else {
        // Send immediate notification for critical issues
        sendResourceNotification(nation, resource, severity, notificationType, stockpile, weeksOfSupply);
      }
      
      // Update notification tracking
      nationNotifications.set(resourceId, {
        resourceId,
        severity,
        lastNotified: now,
        type: notificationType,
        ticksInState: (lastNotification?.ticksInState || 0) + 1,
        thresholdCrossed: true
      });
    } else {
      // Update ticks in state even if not notifying
      if (lastNotification && lastNotification.type === notificationType) {
        nationNotifications.set(resourceId, {
          ...lastNotification,
          ticksInState: lastNotification.ticksInState + 1
        });
      }
    }
  });
  
  // Handle grouped notifications
  if (pendingNotifications.length > 0) {
    if (settings.groupNotifications && pendingNotifications.length > 1) {
      sendGroupedNotification(nation, pendingNotifications);
    } else {
      // Send individual notifications if only one or grouping disabled
      pendingNotifications.forEach(notif => {
        if (!notif || !notif.resourceId) return;
        const resource = resourcesData[notif.resourceId];
        if (!resource) return;
        const stockpile = nation.resourceStockpiles?.[notif.resourceId] || 0;
        const consumption = nation.resourceConsumption?.[notif.resourceId] || 0;
        const weeksOfSupply = consumption > 0 ? stockpile / consumption : Infinity;
        sendResourceNotification(nation, resource, notif.severity, notif.type, stockpile, weeksOfSupply);
      });
    }
  }
  
  notificationState.set(nation.id, nationNotifications);
}

/**
 * Enhanced notification logic with state tracking and grace periods
 */
function shouldSendNotificationEnhanced(
  severity: number,
  type: 'shortage' | 'surplus' | 'critical',
  lastNotification: ResourceNotificationState | undefined,
  currentTime: number,
  resourceId: string,
  nationId: string
): boolean {
  // Don't notify for minor issues
  if (severity < 0.3) return false;
  
  // Grace period: only alert if we've been in shortage state for 2+ ticks
  const GRACE_PERIOD_TICKS = 2;
  
  if (lastNotification) {
    // Check if we just entered this state (threshold crossing)
    const stateChanged = lastNotification.type !== type;
    
    if (stateChanged) {
      // State changed - reset threshold crossing and ticks
      lastNotification.thresholdCrossed = false;
      lastNotification.ticksInState = 1;
    }
    
    // For critical states, require grace period unless severity is extreme
    if (type === 'critical' && severity < 0.9) {
      if (lastNotification.ticksInState < GRACE_PERIOD_TICKS) {
        return false;
      }
    }
    
    // For regular shortages, always require grace period
    if (type === 'shortage' && lastNotification.ticksInState < GRACE_PERIOD_TICKS) {
      return false;
    }
    
    // Check cooldown periods
    const timeSinceLastNotification = currentTime - lastNotification.lastNotified;
    const cooldownPeriod = getCooldownPeriod(type);
    
    if (timeSinceLastNotification < cooldownPeriod) {
      return false;
    }
    
    // Only re-notify if severity has changed significantly (threshold crossing)
    if (!stateChanged) {
      const severityChange = Math.abs(severity - lastNotification.severity);
      if (severityChange < 0.3) return false;
    }
    
    // For repeated notifications of the same type, increase cooldown
    if (!stateChanged && lastNotification.thresholdCrossed) {
      const extendedCooldown = cooldownPeriod * Math.min(3, Math.floor(lastNotification.ticksInState / 5) + 1);
      if (timeSinceLastNotification < extendedCooldown) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Get cooldown period based on notification type
 */
function getCooldownPeriod(type: 'shortage' | 'surplus' | 'critical'): number {
  switch (type) {
    case 'critical':
      return 5 * 24 * 60 * 60 * 1000; // 5 days for critical
    case 'shortage':
      return 10 * 24 * 60 * 60 * 1000; // 10 days for shortage  
    case 'surplus':
      return 21 * 24 * 60 * 60 * 1000; // 3 weeks for surplus
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

/**
 * Get notification settings for a nation
 */
function getNotificationSettings(nationId: string): NotificationSettings {
  const existing = notificationSettings.get(nationId);
  if (existing) return existing;
  
  const defaultSettings: NotificationSettings = {
    muted: false,
    snoozedUntil: 0,
    groupNotifications: true
  };
  
  notificationSettings.set(nationId, defaultSettings);
  return defaultSettings;
}

/**
 * Send a grouped notification for multiple resource issues
 */
function sendGroupedNotification(
  nation: Nation,
  notifications: Array<PendingNotification>
): void {
  if (notifications.length === 0) return;
  
  // Group by type
  const grouped = notifications.reduce((acc, notif) => {
    if (!acc[notif.type]) acc[notif.type] = [];
    acc[notif.type].push(notif);
    return acc;
  }, {} as Record<string, typeof notifications>);
  
  const criticalCount = grouped.critical?.length || 0;
  const shortageCount = grouped.shortage?.length || 0;
  const surplusCount = grouped.surplus?.length || 0;
  
  let title = '';
  let description = '';
  let duration = 10000;
  
  if (criticalCount > 0) {
    title = `🚨 ${criticalCount} Critical Resource Alert${criticalCount > 1 ? 's' : ''}`;
    const criticalResources = (grouped.critical || []).map(n => resourcesData[n?.resourceId]?.name).filter(Boolean).join(', ');
    description = `Critical shortages detected: ${criticalResources}. Immediate action required!`;
    duration = 15000;
    
    toast.error(title, {
      description,
      duration,
      action: {
        label: 'View Resources',
        onClick: () => console.log('Opening resource panel')
      }
    });
  } else if (shortageCount > 1) {
    title = `⚠️ ${shortageCount} Resource Shortages`;
    const shortageResources = (grouped.shortage || []).map(n => resourcesData[n?.resourceId]?.name).filter(Boolean).join(', ');
    description = `Resources running low: ${shortageResources}. Consider increasing production or trade.`;
    
    toast.warning(title, {
      description,
      duration,
      action: {
        label: 'Snooze Alerts',
        onClick: () => snoozeNotifications(nation.id, 2 * 60 * 60 * 1000) // 2 hours
      }
    });
  } else if (surplusCount > 1) {
    title = `📈 ${surplusCount} Resource Surpluses`;
    const surplusResources = (grouped.surplus || []).map(n => resourcesData[n?.resourceId]?.name).filter(Boolean).join(', ');
    description = `Large stockpiles detected: ${surplusResources}. Consider exporting or reducing production.`;
    
    toast.success(title, {
      description,
      duration: 8000
    });
  }
}

/**
 * Send resource notification to player with enhanced actions
 */
function sendResourceNotification(
  nation: Nation,
  resource: any,
  severity: number,
  type: 'shortage' | 'surplus' | 'critical',
  stockpile: number,
  weeksOfSupply: number
): void {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.round(num).toString();
  };
  
  const severityText = severity > 0.8 ? 'Extreme' :
                      severity > 0.6 ? 'Severe' :
                      severity > 0.4 ? 'Moderate' :
                      'Minor';
  
  let title: string;
  let description: string;
  
  switch (type) {
    case 'critical':
      title = `🚨 Critical ${resource.name} Shortage`;
      description = `Only ${formatNumber(stockpile)} ${resource.unit} remaining (${Math.round(weeksOfSupply)} weeks supply). Immediate action required!`;
      
      toast.error(title, {
        description,
        duration: 15000,
        action: {
          label: 'View Resources',
          onClick: () => console.log('Opening resource panel for', resource.name)
        }
      });
      break;
      
    case 'shortage':
      title = `⚠️ ${resource.name} Running Low`;
      description = `${formatNumber(stockpile)} ${resource.unit} remaining (${Math.round(weeksOfSupply)} weeks supply). Consider increasing production or finding trade partners.`;
      
      toast.warning(title, {
        description,
        duration: 10000,
        action: {
          label: 'Snooze',
          onClick: () => snoozeNotifications(nation.id, 2 * 60 * 60 * 1000) // 2 hours
        }
      });
      break;
      
    case 'surplus':
      title = `📈 ${resource.name} Surplus`;
      description = `Large stockpile of ${formatNumber(stockpile)} ${resource.unit}. Consider exporting or reducing production.`;
      
      toast.success(title, {
        description,
        duration: 8000
      });
      break;
  }
}

/**
 * Snooze notifications for a nation
 */
export function snoozeNotifications(nationId: string, duration: number): void {
  const settings = getNotificationSettings(nationId);
  settings.snoozedUntil = Date.now() + duration;
  notificationSettings.set(nationId, settings);
  
  const hours = duration / (60 * 60 * 1000);
  toast.info(`🔕 Resource alerts snoozed for ${hours} hours`);
}

/**
 * Mute/unmute notifications for a nation
 */
export function toggleNotificationMute(nationId: string): void {
  const settings = getNotificationSettings(nationId);
  settings.muted = !settings.muted;
  notificationSettings.set(nationId, settings);
  
  toast.info(settings.muted ? '🔇 Resource alerts muted' : '🔊 Resource alerts enabled');
}

/**
 * Toggle grouped notifications
 */
export function toggleGroupedNotifications(nationId: string): void {
  const settings = getNotificationSettings(nationId);
  settings.groupNotifications = !settings.groupNotifications;
  notificationSettings.set(nationId, settings);
  
  toast.info(settings.groupNotifications ? '📄 Notifications will be grouped' : '📋 Individual notifications enabled');
}

/**
 * Clear notification history for a nation (useful for testing)
 */
export function clearNotificationHistory(nationId: string): void {
  notificationState.delete(nationId);
  notificationSettings.delete(nationId);
  toast.info('🧹 Notification history cleared');
}

/**
 * Send trade-related notifications
 */
export function sendTradeNotification(
  type: 'offer_received' | 'offer_accepted' | 'offer_rejected' | 'agreement_expired' | 'embargo_imposed',
  details: {
    fromNation?: string;
    toNation?: string;
    resources?: string[];
    reason?: string;
  }
): void {
  let title: string;
  let description: string;
  
  switch (type) {
    case 'offer_received':
      title = '📋 Trade Offer Received';
      description = `${details.fromNation} has sent a trade proposal involving ${details.resources?.join(', ')}.`;
      toast.info(title, {
        description,
        duration: 12000,
        action: {
          label: 'Review Offer',
          onClick: () => {
            console.log('Opening trade offers panel');
          }
        }
      });
      break;
      
    case 'offer_accepted':
      title = '✅ Trade Agreement Established';
      description = `${details.toNation} has accepted your trade offer. Agreement is now active.`;
      toast.success(title, {
        description,
        duration: 8000
      });
      break;
      
    case 'offer_rejected':
      title = '❌ Trade Offer Declined';
      description = `${details.toNation} has rejected your trade proposal${details.reason ? `: ${details.reason}` : '.'} `;
      toast.error(title, {
        description,
        duration: 8000
      });
      break;
      
    case 'agreement_expired':
      title = '⏰ Trade Agreement Expired';
      description = `Trade agreement with ${details.toNation} has expired. Resources will no longer be exchanged.`;
      toast.warning(title, {
        description,
        duration: 10000
      });
      break;
      
    case 'embargo_imposed':
      title = '🚫 Economic Embargo';
      description = `${details.fromNation} has imposed an embargo, blocking all trade. Existing agreements suspended.`;
      toast.error(title, {
        description,
        duration: 12000
      });
      break;
  }
}

/**
 * Get shortage status for UI display
 */
export function getResourceShortageStatus(
  stockpile: number,
  production: number,
  consumption: number
): {
  status: 'surplus' | 'stable' | 'shortage' | 'critical';
  weeksOfSupply: number;
  severity: number;
  color: string;
} {
  const net = production - consumption;
  const weeksOfSupply = consumption > 0 ? stockpile / consumption : Infinity;
  
  let status: 'surplus' | 'stable' | 'shortage' | 'critical';
  let severity = 0;
  let color = '';
  
  if (consumption === 0) {
    status = 'stable';
    color = 'text-blue-600';
  } else if (weeksOfSupply < 2) {
    status = 'critical';
    severity = 1 - (weeksOfSupply / 2);
    color = 'text-red-600';
  } else if (weeksOfSupply < 8) {
    status = 'shortage';
    severity = 1 - (weeksOfSupply / 8);
    color = 'text-yellow-600';
  } else if (net > consumption * 0.3 && stockpile > consumption * 12) {
    status = 'surplus';
    severity = Math.min(1, net / consumption);
    color = 'text-green-600';
  } else {
    status = 'stable';
    color = 'text-blue-600';
  }
  
  return { status, weeksOfSupply, severity, color };
}