import mongoose from 'mongoose';

const medicineMasterSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      required: [true, 'Generic name is required'],
      trim: true,
      index: true,
    },
    strength: {
      type: String,
      trim: true,
      default: '', // e.g., "500 mg", "20 mg", "10 ml"
    },
    dosageForm: {
      type: String,
      trim: true,
      default: 'Tablet', // e.g., Tablet, Capsule, Syrup, Suspension, Injection, Ointment
      index: true,
    },
    manufacturer: {
      type: String,
      trim: true,
      default: '', // e.g., "Square Pharmaceuticals", "Beximco Pharma", "Incepta"
      index: true,
    },
    unitPrice: {
      type: Number,
      default: 0, // e.g., 8.00 BDT or currency units
    },
    packageSize: {
      type: String,
      default: '', // e.g., "10's strip", "100 ml bottle"
    },
    indications: {
      type: [String],
      default: [], // e.g., ["Fever", "Pain", "Headache"]
    },
    sideEffects: {
      type: [String],
      default: [],
    },
    contraindications: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for robust full-text and fuzzy search across brand, generic, and manufacturer
medicineMasterSchema.index(
  {
    brandName: 'text',
    genericName: 'text',
    manufacturer: 'text',
  },
  {
    weights: {
      brandName: 10,
      genericName: 6,
      manufacturer: 2,
    },
    name: 'MedicineSearchIndex',
  }
);

// Helper method for fuzzy / regex case-insensitive lookup
medicineMasterSchema.statics.findByFuzzyName = function (query) {
  const clean = query.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  return this.find({
    $or: [
      { brandName: { $regex: clean, $options: 'i' } },
      { genericName: { $regex: clean, $options: 'i' } },
    ],
  }).limit(10);
};

const MedicineMaster = mongoose.model('MedicineMaster', medicineMasterSchema);
export default MedicineMaster;
