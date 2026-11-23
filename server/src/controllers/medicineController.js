import MedicineMaster from '../models/MedicineMaster.js';

export const searchMedicines = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || !q.trim()) {
      const allMeds = await MedicineMaster.find({ isActive: true })
        .limit(Number(limit))
        .sort({ brandName: 1 });
      return res.json({ success: true, count: allMeds.length, data: allMeds });
    }

    const cleanQuery = q.trim();

    // 1. First attempt full-text search
    let results = await MedicineMaster.find(
      { $text: { $search: cleanQuery }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(Number(limit));

    // 2. Fallback to regex search across brandName, genericName, and manufacturer
    if (!results || results.length === 0) {
      const regex = new RegExp(cleanQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      results = await MedicineMaster.find({
        isActive: true,
        $or: [
          { brandName: { $regex: regex } },
          { genericName: { $regex: regex } },
          { manufacturer: { $regex: regex } },
          { indications: { $in: [regex] } },
        ],
      }).limit(Number(limit));
    }

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('[MedicineController Error]:', error);
    res.status(500).json({ message: error.message || 'Error searching medicines' });
  }
};

export const getMedicineById = async (req, res) => {
  try {
    const medicine = await MedicineMaster.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching medicine' });
  }
};
