import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Don't return password in query results by default
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['patient', 'pharmacy_owner', 'admin'],
      default: 'patient',
    },
    // Web Push Subscription for background notifications when tab is closed
    pushSubscription: {
      endpoint: { type: String, default: null },
      expirationTime: { type: Number, default: null },
      keys: {
        p256dh: { type: String, default: null },
        auth: { type: String, default: null },
      },
    },
    // User preferences for reminders & alarm
    preferences: {
      alarmSoundEnabled: { type: Boolean, default: true },
      alarmSoundUrl: { type: String, default: '/sounds/alarm.mp3' },
      snoozeIntervalMinutes: { type: Number, default: 10 },
      elderlyVoiceEnabled: { type: Boolean, default: false },
      language: { type: String, enum: ['en', 'bn'], default: 'en' },
    },
    // Optional patient home coordinates for default distance calculation
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
      address: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' }, { sparse: true });

const User = mongoose.model('User', userSchema);
export default User;
