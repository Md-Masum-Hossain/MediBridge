import mongoose from 'mongoose';

const prescriptionItemSchema = new mongoose.Schema({
  medicineMasterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicineMaster',
    default: null,
  },
  medicineName: {
    type: String,
    required: [true, 'Medicine name is required'],
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
  // Exact clinical dosage pattern: e.g., '1+0+1', '0+1+0', '1+1+1', '1+0+0'
  dosagePattern: {
    type: String,
    required: [true, 'Dosage pattern is required (e.g., 1+0+1)'],
    trim: true,
  },
  // Meal instructions: e.g., 'Before Meal', 'After Meal', 'With Meal'
  mealInstruction: {
    type: String,
    enum: ['Before Meal', 'After Meal', 'With Meal', 'Empty Stomach', 'At Bedtime', 'As Needed', 'Other'],
    default: 'After Meal',
  },
  duration: {
    type: String,
    default: '7 days', // Human-readable string
  },
  durationDays: {
    type: Number,
    default: 7,
  },
  frequencyPerDay: {
    type: Number,
    default: 2,
  },
  // Scheduled daily reminder times (24h format, e.g. ['08:00', '20:00'])
  timings: {
    type: [String],
    default: ['08:00', '20:00'],
  },
  instructionsBn: {
    type: String,
    default: '', // Bengali instruction for elderly-friendly audio / UI readout
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Adherence log tracking whether dosage was taken, snoozed, or missed
  takenLog: [
    {
      scheduledTime: { type: String, required: true }, // e.g. "2026-11-22 08:00"
      status: {
        type: String,
        enum: ['pending', 'taken', 'snoozed', 'missed'],
        default: 'pending',
      },
      actionTimestamp: { type: Date },
      note: { type: String, default: '' },
    },
  ],
});

const prescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Doctor / Clinic metadata if visible in scan
    doctorInfo: {
      name: { type: String, default: 'Unknown Doctor' },
      specialization: { type: String, default: '' },
      hospitalOrClinic: { type: String, default: '' },
      prescriptionDate: { type: Date, default: Date.now },
    },
    // Original prescription image details
    image: {
      url: { type: String, default: '' },
      originalName: { type: String, default: '' },
      fileSizeBytes: { type: Number, default: 0 },
      mimeType: { type: String, default: 'image/jpeg' },
    },
    // Extracted and structured medicines
    medicines: [prescriptionItemSchema],
    // Processing status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'archived'],
      default: 'pending',
      index: true,
    },
    // Raw JSON from Gemini Vision AI for audit / recovery
    rawAiOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

prescriptionSchema.index({ userId: 1, createdAt: -1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
