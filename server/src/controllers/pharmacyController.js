import Pharmacy from '../models/Pharmacy.js';

// Calculate distance in meters using Haversine formula
export function calculateHaversineDistance(lon1, lat1, lon2, lat2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}

/**
 * Normalizes medicine brand or query names by:
 * 1. Lowercasing & trimming
 * 2. Stripping punctuation
 * 3. Stripping dosage forms (tab, cap, syp, n/drop, drop, inj, gel, cream, etc.)
 * 4. Stripping strengths and units (500mg, 20mg, 600mg, 0.05%, ml, etc.)
 * 5. Stripping standalone strength numbers
 */
export function normalizeMedicineQuery(text) {
  if (!text || typeof text !== 'string') return '';

  let s = text.toLowerCase();

  // Standardize slashes, hyphens, and common punctuation into spaces
  s = s.replace(/[\/\-_.,()[\]{}:;+]/g, ' ');

  // Strip dosage forms
  s = s.replace(
    /\b(tab|tabs|tablet|tablets|cap|caps|capsule|capsules|syp|syrup|susp|suspension|n\s*drop|n\s*drops|drop|drops|nasal\s*drop|nasal\s*drops|eye\s*drop|eye\s*drops|inj|injection|infusion|iv|im|gel|cream|ointment|oint|spray|inhaler|inhalation|neb|nebulizer|respule|rotacap|supp|suppository|lotion|solution|soln|powder|sachet)\b/gi,
    ' '
  );

  // Strip strengths and units (e.g. 500mg, 20mg, 600mg, 0.05%, 10ml, etc.)
  s = s.replace(/\b\d+(\.\d+)?\s*(mg|mcg|ug|g|ml|l|iu|meq|%)\b/gi, ' ');

  // Strip standalone numbers that typically represent strength (e.g. 500, 600, 20, 40)
  s = s.replace(/\b\d+\b/g, ' ');

  // Strip non-alphanumeric punctuation and collapse whitespace
  s = s.replace(/[^a-z0-9\s]/gi, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Scores how well an inventory item matches a normalized target query (0-100)
 */
export function matchTargetToItem(targetClean, targetTokens, item) {
  if (!targetClean) return 0;

  const brandClean = normalizeMedicineQuery(item.brandName);
  const genericClean = normalizeMedicineQuery(item.genericName);

  // 1. Exact match on normalized brand name (e.g. "ardin" === "ardin")
  if (brandClean === targetClean) return 100;

  // 2. Exact match on normalized generic name (e.g. "paracetamol" === "paracetamol")
  if (genericClean === targetClean) return 95;

  const brandTokens = brandClean.split(' ').filter(Boolean);

  // 3. Multi-word exact containment (e.g. "napa extend")
  if (targetTokens.length > 1 && brandClean.includes(targetClean)) return 90;

  // 4. Single-word matches the primary token of brand name (e.g. "napa" in "napa extra")
  if (brandTokens.length > 0 && brandTokens[0] === targetClean) return 85;

  // 5. Stem / prefix match (e.g. "bilastin" matches "bilastine")
  if (
    (targetClean.length >= 4 && brandClean.startsWith(targetClean)) ||
    (brandClean.length >= 4 && targetClean.startsWith(brandClean)) ||
    (targetClean.length >= 4 && genericClean.startsWith(targetClean)) ||
    (genericClean.length >= 4 && targetClean.startsWith(genericClean))
  ) {
    return 80;
  }

  // 6. Substring containment: brand contains target or target contains brand
  if (
    (targetClean.length >= 4 && brandClean.includes(targetClean)) ||
    (brandClean.length >= 4 && targetClean.includes(brandClean))
  ) {
    return 75;
  }

  // 7. Generic substring match
  if (
    (targetClean.length >= 4 && genericClean.includes(targetClean)) ||
    (genericClean.length >= 4 && targetClean.includes(genericClean))
  ) {
    return 70;
  }

  // 8. Token overlap (any significant token >= 3 characters)
  if (
    targetTokens.some(
      (t) => t.length >= 3 && (brandTokens.includes(t) || genericClean.includes(t))
    )
  ) {
    return 60;
  }

  return 0;
}

export const getNearbyPharmacies = async (req, res) => {
  try {
    const {
      lat = 23.7461, // Default: Dhanmondi, Dhaka
      lng = 90.3756,
      maxDistance = 50000, // 50 km default radius to comfortably cover Dhaka & Savar hubs
      medicineNames = '',
      medicineIds = '',
    } = req.query;

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchDistance = maxDistance ? Number(maxDistance) : 50000;

    // Search query with 2dsphere nearSphere or fetch all active
    let pharmacies = [];
    try {
      pharmacies = await Pharmacy.find({
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [userLng, userLat],
            },
            $maxDistance: searchDistance,
          },
        },
        isOpen: true,
      }).lean();
    } catch (geoError) {
      console.warn('[PharmacyController] Fallback to Haversine sort due to geo query:', geoError.message);
      pharmacies = await Pharmacy.find({ isOpen: true }).lean();
    }

    // Parse requested target medicines
    const targetNames = medicineNames
      ? medicineNames
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean)
      : [];

    const parsedTargets = targetNames.map((raw) => {
      const clean = normalizeMedicineQuery(raw);
      const tokens = clean.split(' ').filter(Boolean);
      return { raw, clean, tokens };
    });

    const targetIds = medicineIds
      ? medicineIds
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    // Augment each pharmacy with distance and stock match metrics
    const results = pharmacies.map((pharmacy) => {
      const pLng = pharmacy.location?.coordinates?.[0] ?? 90.3756;
      const pLat = pharmacy.location?.coordinates?.[1] ?? 23.7461;
      const distance = calculateHaversineDistance(userLng, userLat, pLng, pLat);

      let matchedItems = [];
      let inStockCount = 0;

      if (targetIds.length > 0 || parsedTargets.length > 0) {
        const inventory = pharmacy.inventory || [];
        const matchedItemMap = new Map();

        // 1. Match target IDs directly first
        for (const targetId of targetIds) {
          const item = inventory.find(
            (i) => String(i.medicineId) === targetId || String(i._id) === targetId
          );
          if (item) {
            matchedItemMap.set(String(item.medicineId || item._id), item);
          }
        }

        // 2. Match each medicine query to the best matching inventory item
        //    Track per-query best match to annotate isGenericMatch + originalQuery
        const unmatchedQueries = [];

        for (const target of parsedTargets) {
          let bestItem = null;
          let bestScore = 0;

          for (const item of inventory) {
            const score = matchTargetToItem(target.clean, target.tokens, item);
            if (score > bestScore) {
              bestScore = score;
              bestItem = item;
            } else if (score === bestScore && score >= 60 && !bestItem?.inStock && item.inStock) {
              bestItem = item;
            }
          }

          if (bestItem && bestScore >= 60) {
            const itemKey = String(bestItem.medicineId || bestItem._id);
            // Determine if this was a generic/alt match (not an exact brand match)
            // Scores 100/85/90 = brand match; 95/80/75/70/60 = generic or fuzzy match
            const isGenericMatch = bestScore < 85;
            const existing = matchedItemMap.get(itemKey);
            if (!existing) {
              matchedItemMap.set(itemKey, {
                ...bestItem,
                isGenericMatch,
                originalQuery: target.raw,
              });
            }
          } else {
            // No match found for this query — track as unmatched
            unmatchedQueries.push(target.raw);
          }
        }

        matchedItems = Array.from(matchedItemMap.values());
        inStockCount = matchedItems.filter((i) => i.inStock).length;
      }

      const totalTargetMeds = Math.max(parsedTargets.length, targetIds.length);
      const matchPercentage =
        totalTargetMeds > 0
          ? Math.min(100, Math.round((inStockCount / totalTargetMeds) * 100))
          : 100;

      // Compute unmatched names from parsedTargets that have no matchedItem with their originalQuery
      const matchedOriginalQueries = new Set(
        matchedItems.map((i) => i.originalQuery).filter(Boolean)
      );
      const unmatchedNames = parsedTargets
        .filter((t) => !matchedOriginalQueries.has(t.raw))
        .map((t) => t.raw);

      return {
        ...pharmacy,
        distance, // in meters
        matchPercentage,
        inStockCount,
        totalTargetMeds,
        matchedItems,
        unmatchedNames,
      };
    });

    // Sort primarily by match percentage (desc) then distance (asc)
    results.sort((a, b) => {
      if (b.matchPercentage !== a.matchPercentage) {
        return b.matchPercentage - a.matchPercentage;
      }
      return a.distance - b.distance;
    });

    res.json({
      success: true,
      count: results.length,
      userLocation: { latitude: userLat, longitude: userLng },
      data: results,
    });
  } catch (error) {
    console.error('[PharmacyController Error]:', error);
    res.status(500).json({ message: error.message || 'Error fetching nearby pharmacies' });
  }
};

export const getPharmacyById = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }
    res.json({ success: true, data: pharmacy });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching pharmacy' });
  }
};

export const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params; // Pharmacy ID
    const { medicineId, inStock, quantity, unitPrice } = req.body;

    const pharmacy = await Pharmacy.findById(id);
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    const itemIndex = pharmacy.inventory.findIndex(
      (item) => String(item.medicineId) === String(medicineId)
    );

    if (itemIndex > -1) {
      if (typeof inStock === 'boolean') pharmacy.inventory[itemIndex].inStock = inStock;
      if (typeof quantity === 'number') pharmacy.inventory[itemIndex].quantity = quantity;
      if (typeof unitPrice === 'number') pharmacy.inventory[itemIndex].unitPrice = unitPrice;
      pharmacy.inventory[itemIndex].lastUpdated = new Date();
    } else {
      return res.status(404).json({ message: 'Item not found in pharmacy inventory' });
    }

    await pharmacy.save();

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      item: pharmacy.inventory[itemIndex],
    });
  } catch (error) {
    console.error('[UpdateInventory Error]:', error);
    res.status(500).json({ message: error.message || 'Failed to update inventory' });
  }
};
