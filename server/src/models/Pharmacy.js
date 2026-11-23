import mongoose from 'mongoose';

const stockItemSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicineMaster',
    required: true,
    index: true,
  },
  brandName: {
    type: String,
    required: true,
    trim: true,
  },
  genericName: {
    type: String,
    trim: true,
    default: '',
  },
  strength: {
    type: String,
    default: '',
  },
  dosageForm: {
    type: String,
    default: 'Tablet',
  },
  inStock: {
    type: Boolean,
    default: true,
    index: true,
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  unitPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const pharmacySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pharmacy name is required'],
      trim: true,
      index: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
      default: '',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      formattedAddress: { type: String, required: true },
    },
    // GeoJSON Point for MongoDB 2dsphere proximity searches
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] Note: GeoJSON order is [lng, lat]!
        required: [true, 'Coordinates [lng, lat] are required for 2dsphere indexing'],
        validate: {
          validator: function (coords) {
            return (
              Array.isArray(coords) &&
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 && // longitude
              coords[1] >= -90 &&
              coords[1] <= 90 // latitude
            );
          },
          message: 'Coordinates must be valid [longitude, latitude] pairs',
        },
      },
    },
    operatingHours: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '23:00' },
      isOpen24Hours: { type: Boolean, default: false },
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    // Live stock catalog managed via /pharmacy-portal
    inventory: [stockItemSchema],
  },
  {
    timestamps: true,
  }
);

// CRITICAL: 2dsphere index for proximity geospatial queries
pharmacySchema.index({ location: '2dsphere' });
pharmacySchema.index({ 'inventory.medicineId': 1, 'inventory.inStock': 1 });

// Helper static method for finding pharmacies within maxDistance (meters) of coordinates
pharmacySchema.statics.findNearbyWithStock = async function ({
  longitude,
  latitude,
  maxDistanceMeters = 5000,
  medicineIds = [],
}) {
  const geoQuery = {
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        $maxDistance: maxDistanceMeters,
      },
    },
    isOpen: true,
  };

  return this.find(geoQuery).lean();
};

const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);
export default Pharmacy;
