import { Nation, ResourceShortageEffect } from './types';
import { resourcesData } from './gameData';
import { toast } from 'sonner';

interface ShortageNotification {
  resourceId: string;
  severity: number;
  lastNotified: number;
  type: 'shortage' | 'surplus' | 'critical';
}

// Global state for tracking notifications
const notificationState = new Map<string, Map<string, ShortageNotification>>();

/**
 * Check and send resource shortage/surplus notifications
 */
export function checkResourceNotifications(nation: Nation, gameDate: Date): void {
  if (!nation.resourceStockpiles || !nation.resourceProduction || !nation.resourceConsumption) {
    return;
  }

  const now = gameDate.getTime();
  const nationNotifications = notificationState.get(nation.id) || new Map();
  
  Object.keys(resourcesData).forEach(resourceId => {
    const resource = resourcesData[resourceId];
    const stockpile = nation.resourceStockpiles[resourceId] || 0;
    const production = nation.resourceProduction[resourceId] || 0;
    const consumption = nation.resourceConsumption[resourceId] || 0;
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
    const shouldNotify = shouldSendNotification(
      severity, 
      notificationType, 
      lastNotification, 
      now
    );
    
    if (shouldNotify) {
      sendResourceNotification(nation, resource, severity, notificationType, stockpile, weeksOfSupply);
      
      // Update notification tracking
      nationNotifications.set(resourceId, {
        resourceId,
        severity,
        lastNotified: now,
        type: notificationType
      });
    }
  });
  
  notificationState.set(nation.id, nationNotifications);
}

/**
 * Determine if a notification should be sent
 */
function shouldSendNotification(
  severity: number,
  type: 'shortage' | 'surplus' | 'critical',
  lastNotification: ShortageNotification | undefined,
  currentTime: number
): boolean {
  // Always notify for critical shortages
  if (type === 'critical' && severity > 0.7) {
    const timeSinceLastCritical = lastNotification ? currentTime - lastNotification.lastNotified : Infinity;
    return timeSinceLastCritical > 7 * 24 * 60 * 60 * 1000; // Once per week for critical
  }
  
  // Don't notify for minor issues
  if (severity < 0.3) return false;
  
  // Don't re-notify too frequently
  if (lastNotification) {
    const timeSinceLastNotification = currentTime - lastNotification.lastNotified;
    const minInterval = type === 'critical' ? 7 * 24 * 60 * 60 * 1000 : // 1 week for critical
                       type === 'shortage' ? 14 * 24 * 60 * 60 * 1000 : // 2 weeks for shortage  
                       28 * 24 * 60 * 60 * 1000; // 4 weeks for surplus
    
    if (timeSinceLastNotification < minInterval) return false;
    
    // Only re-notify if severity has changed significantly
    const severityChange = Math.abs(severity - lastNotification.severity);
    if (severityChange < 0.2) return false;
  }
  
  return true;
}

/**
 * Send resource notification to player
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
  let icon: string;
  
  switch (type) {
    case 'critical':
      title = `🚨 Critical ${resource.name} Shortage`;
      description = `Only ${formatNumber(stockpile)} ${resource.unit} remaining (${Math.round(weeksOfSupply)} weeks supply). Immediate action required!`;
      icon = '🚨';
      
      toast.error(title, {
        description,
        duration: 15000,
        action: {
          label: 'View Resources',
          onClick: () => {
            // Could trigger opening resource panel
            console.log('Opening resource panel for', resource.name);
          }
        }
      });
      break;
      
    case 'shortage':
      title = `⚠️ ${resource.name} Running Low`;
      description = `${formatNumber(stockpile)} ${resource.unit} remaining (${Math.round(weeksOfSupply)} weeks supply). Consider increasing production or finding trade partners.`;
      icon = '⚠️';
      
      toast.warning(title, {
        description,
        duration: 10000
      });
      break;
      
    case 'surplus':
      title = `📈 ${resource.name} Surplus`;
      description = `Large stockpile of ${formatNumber(stockpile)} ${resource.unit}. Consider exporting or reducing production.`;
      icon = '📈';
      
      toast.success(title, {
        description,
        duration: 8000
      });
      break;
  }
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