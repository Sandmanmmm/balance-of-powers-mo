import { Nation, TradeOffer, TradeAgreement } from './types';
import { resourcesData } from './gameData';

/**
 * Create a new trade offer between nations
 */
export function createTradeOffer(
  fromNation: Nation,
  toNationId: string,
  offering: Record<string, number>,
  requesting: Record<string, number>,
  duration: number = 52 // Default 1 year
): TradeOffer {
  const now = new Date();
  const expiresDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 1 week expiry

  return {
    id: `trade_${fromNation.id}_${toNationId}_${Date.now()}`,
    fromNation: fromNation.id,
    toNation: toNationId,
    offering,
    requesting,
    duration,
    status: 'pending',
    createdDate: now,
    expiresDate
  };
}

/**
 * Calculate the economic value of a trade offer
 */
export function calculateTradeValue(
  offering: Record<string, number>,
  requesting: Record<string, number>
): { offeringValue: number; requestingValue: number; fairness: number } {
  const offeringValue = Object.entries(offering).reduce((sum, [resourceId, amount]) => {
    const resource = resourcesData[resourceId];
    return sum + (resource ? resource.base_price * amount : 0);
  }, 0);

  const requestingValue = Object.entries(requesting).reduce((sum, [resourceId, amount]) => {
    const resource = resourcesData[resourceId];
    return sum + (resource ? resource.base_price * amount : 0);
  }, 0);

  const fairness = requestingValue > 0 ? offeringValue / requestingValue : 1;

  return { offeringValue, requestingValue, fairness };
}

/**
 * Evaluate if a nation can fulfill a trade offer
 */
export function canFulfillTradeOffer(nation: Nation, offer: TradeOffer): {
  canFulfill: boolean;
  missingResources: Record<string, number>;
} {
  const missingResources: Record<string, number> = {};
  let canFulfill = true;

  const resourcesNeeded = offer.fromNation === nation.id ? offer.offering : offer.requesting;

  Object.entries(resourcesNeeded).forEach(([resourceId, amount]) => {
    const available = nation.resourceStockpiles[resourceId] || 0;
    if (available < amount) {
      missingResources[resourceId] = amount - available;
      canFulfill = false;
    }
  });

  return { canFulfill, missingResources };
}

/**
 * Accept a trade offer and create a trade agreement
 */
export function acceptTradeOffer(
  offer: TradeOffer,
  acceptingNation: Nation
): TradeAgreement {
  const now = new Date();

  return {
    id: `agreement_${offer.id}`,
    nations: [offer.fromNation, offer.toNation],
    terms: {
      [offer.fromNation]: {
        exports: offer.offering,
        imports: offer.requesting
      },
      [offer.toNation]: {
        exports: offer.requesting,
        imports: offer.offering
      }
    },
    duration: offer.duration,
    status: 'active',
    startDate: now,
    value: calculateTradeValue(offer.offering, offer.requesting).offeringValue
  };
}

/**
 * Execute trade agreement for one tick
 */
export function executeTradeAgreement(
  agreement: TradeAgreement,
  nations: Nation[]
): { success: boolean; updates: { nationId: string; updates: Partial<Nation> }[] } {
  const updates: { nationId: string; updates: Partial<Nation> }[] = [];
  let success = true;

  const [nation1Id, nation2Id] = agreement.nations;
  const nation1 = nations.find(n => n.id === nation1Id);
  const nation2 = nations.find(n => n.id === nation2Id);

  if (!nation1 || !nation2) {
    return { success: false, updates: [] };
  }

  // Check if both nations are under embargo
  const nation1Embargoed = nation1.diplomacy.embargoes.includes(nation2Id);
  const nation2Embargoed = nation2.diplomacy.embargoes.includes(nation1Id);

  if (nation1Embargoed || nation2Embargoed) {
    // Trade blocked by embargo
    return { success: false, updates: [] };
  }

  // Execute trade for nation 1
  const nation1Terms = agreement.terms[nation1Id];
  if (nation1Terms) {
    const nation1Updates: Partial<Nation> = {
      resourceStockpiles: { ...nation1.resourceStockpiles }
    };

    // Check if nation1 can export
    let canExport = true;
    Object.entries(nation1Terms.exports).forEach(([resourceId, amount]) => {
      const available = nation1.resourceStockpiles[resourceId] || 0;
      if (available < amount) {
        canExport = false;
      }
    });

    if (canExport) {
      // Execute exports (remove from stockpiles)
      Object.entries(nation1Terms.exports).forEach(([resourceId, amount]) => {
        nation1Updates.resourceStockpiles![resourceId] = 
          (nation1.resourceStockpiles[resourceId] || 0) - amount;
      });

      // Execute imports (add to stockpiles)
      Object.entries(nation1Terms.imports).forEach(([resourceId, amount]) => {
        nation1Updates.resourceStockpiles![resourceId] = 
          (nation1.resourceStockpiles[resourceId] || 0) + amount;
      });

      updates.push({ nationId: nation1Id, updates: nation1Updates });
    } else {
      success = false;
    }
  }

  // Execute trade for nation 2
  const nation2Terms = agreement.terms[nation2Id];
  if (nation2Terms && success) {
    const nation2Updates: Partial<Nation> = {
      resourceStockpiles: { ...nation2.resourceStockpiles }
    };

    // Check if nation2 can export
    let canExport = true;
    Object.entries(nation2Terms.exports).forEach(([resourceId, amount]) => {
      const available = nation2.resourceStockpiles[resourceId] || 0;
      if (available < amount) {
        canExport = false;
      }
    });

    if (canExport) {
      // Execute exports (remove from stockpiles)
      Object.entries(nation2Terms.exports).forEach(([resourceId, amount]) => {
        nation2Updates.resourceStockpiles![resourceId] = 
          (nation2.resourceStockpiles[resourceId] || 0) - amount;
      });

      // Execute imports (add to stockpiles)
      Object.entries(nation2Terms.imports).forEach(([resourceId, amount]) => {
        nation2Updates.resourceStockpiles![resourceId] = 
          (nation2.resourceStockpiles[resourceId] || 0) + amount;
      });

      updates.push({ nationId: nation2Id, updates: nation2Updates });
    } else {
      success = false;
    }
  }

  return { success, updates };
}

/**
 * Apply embargo between nations
 */
export function applyEmbargo(
  embargoingNation: Nation,
  targetNationId: string
): Partial<Nation> {
  const embargoes = [...(embargoingNation.diplomacy.embargoes || [])];
  if (!embargoes.includes(targetNationId)) {
    embargoes.push(targetNationId);
  }

  return {
    diplomacy: {
      ...embargoingNation.diplomacy,
      embargoes
    }
  };
}

/**
 * Remove embargo between nations
 */
export function removeEmbargo(
  embargoingNation: Nation,
  targetNationId: string
): Partial<Nation> {
  const embargoes = (embargoingNation.diplomacy.embargoes || [])
    .filter(id => id !== targetNationId);

  return {
    diplomacy: {
      ...embargoingNation.diplomacy,
      embargoes
    }
  };
}

/**
 * Generate AI trade offers based on resource needs
 */
export function generateAITradeOffer(
  nation: Nation,
  potentialPartners: Nation[]
): TradeOffer | null {
  const shortages = nation.resourceShortages || {};
  const surpluses: Record<string, number> = {};

  // Identify surpluses (production > consumption + buffer)
  Object.entries(nation.resourceProduction || {}).forEach(([resourceId, production]) => {
    const consumption = nation.resourceConsumption?.[resourceId] || 0;
    const stockpile = nation.resourceStockpiles?.[resourceId] || 0;
    const buffer = consumption * 8; // 8 weeks buffer

    if (stockpile > buffer && production > consumption * 1.2) {
      surpluses[resourceId] = stockpile - buffer;
    }
  });

  // Find a partner who has what we need and needs what we have
  for (const partner of potentialPartners) {
    // Skip enemies and embargoed nations
    if (nation.diplomacy.enemies.includes(partner.id) ||
        nation.diplomacy.embargoes.includes(partner.id) ||
        partner.diplomacy.embargoes.includes(nation.id)) {
      continue;
    }

    const partnerShortages = partner.resourceShortages || {};
    const partnerSurpluses: Record<string, number> = {};

    // Calculate partner surpluses
    Object.entries(partner.resourceProduction || {}).forEach(([resourceId, production]) => {
      const consumption = partner.resourceConsumption?.[resourceId] || 0;
      const stockpile = partner.resourceStockpiles?.[resourceId] || 0;
      const buffer = consumption * 8;

      if (stockpile > buffer && production > consumption * 1.2) {
        partnerSurpluses[resourceId] = Math.min(stockpile - buffer, production * 4); // Max 4 weeks of production
      }
    });

    // Find mutual beneficial trade
    const offering: Record<string, number> = {};
    const requesting: Record<string, number> = {};

    // What we can offer (our surpluses that they need)
    Object.entries(surpluses).forEach(([resourceId, available]) => {
      if (partnerShortages[resourceId] > 0.2) { // Significant shortage
        offering[resourceId] = Math.min(available * 0.5, available); // Offer up to 50% of surplus
      }
    });

    // What we request (their surpluses that we need)
    Object.entries(partnerSurpluses).forEach(([resourceId, available]) => {
      if (shortages[resourceId] > 0.2) { // We have significant shortage
        requesting[resourceId] = Math.min(available * 0.5, available);
      }
    });

    // Create trade offer if both sides have something to offer
    if (Object.keys(offering).length > 0 && Object.keys(requesting).length > 0) {
      const tradeValue = calculateTradeValue(offering, requesting);
      
      // Only proceed if trade is reasonably fair (0.7 to 1.4 ratio)
      if (tradeValue.fairness >= 0.7 && tradeValue.fairness <= 1.4) {
        return createTradeOffer(nation, partner.id, offering, requesting, 26); // 6 months
      }
    }
  }

  return null;
}

/**
 * AI evaluation of incoming trade offers
 */
export function evaluateTradeOfferAI(
  nation: Nation,
  offer: TradeOffer
): { shouldAccept: boolean; priority: number; reason: string } {
  const shortages = nation.resourceShortages || {};
  const isReceiving = offer.toNation === nation.id;
  const resourcesOffered = isReceiving ? offer.offering : offer.requesting;
  const resourcesRequested = isReceiving ? offer.requesting : offer.offering;

  let priority = 0;
  let shouldAccept = true;
  let reason = '';

  // Check if we can fulfill our side
  const fulfillment = canFulfillTradeOffer(nation, offer);
  if (!fulfillment.canFulfill) {
    return { 
      shouldAccept: false, 
      priority: 0, 
      reason: `Cannot fulfill trade requirements: missing ${Object.keys(fulfillment.missingResources).join(', ')}` 
    };
  }

  // Calculate how much this trade helps with shortages
  Object.entries(resourcesOffered).forEach(([resourceId, amount]) => {
    const shortage = shortages[resourceId] || 0;
    if (shortage > 0.2) {
      priority += shortage * amount * 0.1; // Higher priority for critical shortages
    }
  });

  // Calculate cost of what we're giving up
  Object.entries(resourcesRequested).forEach(([resourceId, amount]) => {
    const stockpile = nation.resourceStockpiles[resourceId] || 0;
    const consumption = nation.resourceConsumption?.[resourceId] || 0;
    const weeksOfSupply = consumption > 0 ? stockpile / consumption : Infinity;

    if (weeksOfSupply < 12) { // Less than 3 months supply
      priority -= amount * 0.1; // Penalize giving up scarce resources
    }
  });

  // Diplomatic considerations
  const offeringNationId = isReceiving ? offer.fromNation : offer.toNation;
  if (nation.diplomacy.allies.includes(offeringNationId)) {
    priority += 0.5; // Favor allies
    reason = 'Trade with ally';
  } else if (nation.diplomacy.enemies.includes(offeringNationId)) {
    shouldAccept = false;
    reason = 'Cannot trade with enemy';
  } else {
    reason = 'Neutral trade evaluation';
  }

  // Economic fairness check
  const tradeValue = calculateTradeValue(offer.offering, offer.requesting);
  if (tradeValue.fairness < 0.5 || tradeValue.fairness > 2.0) {
    shouldAccept = false;
    reason = 'Trade terms too unfavorable';
  }

  shouldAccept = shouldAccept && priority > 0;
  
  return { shouldAccept, priority, reason };
}