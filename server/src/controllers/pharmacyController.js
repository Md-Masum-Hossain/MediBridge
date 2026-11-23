import Pharmacy from '../models/Pharmacy.js';

// Calculate distance in meters using Haversine formula
function calculateHaversineDistance(lon1, lat1, lon2, lat2) {
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

export const getNearbyPharmacies = async (req, res) => {
  try {
    const {
      lat = 23.7461, // Default: Dhanmondi, Dhaka
      lng = 90.3756,
      maxDistance = 25000, // 25 km max search radius
      medicineNames = '',
      medicineIds = '',
    } = req.query;

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

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
            $maxDistance: Number(maxDistance),
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
          .map((n) => n.trim().toLowerCase())
          .filter(Boolean)
      : [];
    const targetIds = medicineIds
      ? medicineIds
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    // Augment each pharmacy with distance and stock match metrics
    const results = pharmacies.map((pharmacy) => {
      const pLng = pharmacy.location?.coordinates?.[0] || 90.37;
      const pLat = pharmacy.location?.coordinates?.[1] || 23.74;
      const distance = calculateHaversineDistance(userLng, userLat, pLng, pLat);

      let matchedItems = [];
      let inStockCount = 0;

      if (targetNames.length > 0 || targetIds.length > 0) {
        matchedItems = (pharmacy.inventory || []).filter((item) => {
          const matchId = targetIds.includes(String(item.medicineId));
          const matchName = targetNames.some(
            (name) =>
              item.brandName.toLowerCase().includes(name) ||
              item.genericName.toLowerCase().includes(name)
          );
          return matchId || matchName;
        });

        inStockCount = matchedItems.filter((i) => i.inStock).length;
      }

      const totalTargetMeds = Math.max(targetNames.length, targetIds.length);
      const matchPercentage =
        totalTargetMeds > 0 ? Math.round((inStockCount / totalTargetMeds) * 100) : 100;

      return {
        ...pharmacy,
        distance, // in meters
        matchPercentage,
        inStockCount,
        totalTargetMeds,
        matchedItems,
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
