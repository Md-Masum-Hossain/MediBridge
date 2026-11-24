import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { searchMedicines, getMedicineById } from '../controllers/medicineController.js';
import {
  getNearbyPharmacies,
  getPharmacyById,
  updateInventoryItem,
} from '../controllers/pharmacyController.js';
import {
  parsePrescriptionImage,
  createPrescription,
  getUserPrescriptions,
  getPrescriptionById,
  logDoseAction,
  updateMedicineStatus,
  deleteMedicine,
} from '../controllers/prescriptionController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import Pharmacy from '../models/Pharmacy.js';
import User from '../models/User.js';

const router = express.Router();

// Health / Status
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MediBridge API',
    timestamp: new Date().toISOString(),
  });
});

// Authentication Routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', protect, getMe);

// Medicine Master Catalog Routes
router.get('/medicines/search', searchMedicines);
router.get('/medicines/:id', getMedicineById);

// Pharmacy & Geospatial Stock Routes
router.get('/pharmacies/nearby', getNearbyPharmacies);
router.get('/pharmacies/:id', getPharmacyById);
router.put('/pharmacies/:id/inventory', updateInventoryItem);

// Pharmacy Owner Stock Management (PATCH /api/pharmacies/stock)
router.patch('/pharmacies/stock', optionalAuth, async (req, res) => {
  try {
    const { pharmacyId, medicineId, brandName, inStock, quantity, unitPrice } = req.body;

    let pharmacy;
    if (pharmacyId) {
      pharmacy = await Pharmacy.findById(pharmacyId);
    } else if (req.user?._id) {
      pharmacy = await Pharmacy.findOne({ ownerId: req.user._id });
    }
    if (!pharmacy) {
      pharmacy = await Pharmacy.findOne();
    }

    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    const item = pharmacy.inventory.find(
      (i) =>
        String(i.medicineId) === String(medicineId) ||
        String(i._id) === String(medicineId) ||
        (brandName && i.brandName.toLowerCase() === brandName.toLowerCase())
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Medicine not found in inventory' });
    }

    if (typeof inStock === 'boolean') item.inStock = inStock;
    if (typeof quantity === 'number') item.quantity = quantity;
    if (typeof unitPrice === 'number') item.unitPrice = unitPrice;
    item.lastUpdated = new Date();

    await pharmacy.save();

    res.json({
      success: true,
      message: 'Stock status updated successfully',
      item,
      pharmacyId: pharmacy._id,
    });
  } catch (error) {
    console.error('[PatchStock Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update stock' });
  }
});

// Get Pharmacy for current owner
router.get('/pharmacies/owner/current', optionalAuth, async (req, res) => {
  try {
    const ownerId = req.query.ownerId || req.user?._id;
    let pharmacy;
    if (ownerId) {
      pharmacy = await Pharmacy.findOne({ ownerId }).lean();
    }
    if (!pharmacy) {
      pharmacy = await Pharmacy.findOne().lean(); // default fallback
    }
    res.json({ success: true, data: pharmacy });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Prescription Digitization & Tracking Routes
router.post('/prescriptions/scan', parsePrescriptionImage);
router.post('/prescriptions/parse', parsePrescriptionImage);
router.post('/prescriptions', optionalAuth, createPrescription);
router.get('/prescriptions', optionalAuth, getUserPrescriptions);
router.get('/prescriptions/:id', optionalAuth, getPrescriptionById);
router.post('/prescriptions/:prescriptionId/medicines/:medicineIndex/log', optionalAuth, logDoseAction);

// Stop / Resume & Remove Medication Routes
router.patch('/medications/:prescriptionId/:medicineIndex/status', optionalAuth, updateMedicineStatus);
router.delete('/medications/:prescriptionId/:medicineIndex', optionalAuth, deleteMedicine);

// Web Push Notification Routes
router.get('/notifications/vapid-key', (req, res) => {
  res.json({
    success: true,
    publicKey:
      process.env.VAPID_PUBLIC_KEY ||
      'BMAjPDhL_u9kBgHO_Ih6xdKAdNDU8fnpch7Gm-CCdhfCNOYoNKDuTrIlv0KOlU39CU_HxRByqKRTjRoFwzPoeNg',
  });
});

router.post('/notifications/subscribe', optionalAuth, async (req, res) => {
  try {
    const { subscription, userId, email } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription object' });
    }

    let user = req.user;
    if (!user && userId) {
      user = await User.findById(userId);
    }
    if (!user && email) {
      user = await User.findOne({ email });
    }
    if (!user) {
      user = await User.findOne({ email: 'patient@medibridge.com' });
    }

    if (user) {
      user.pushSubscription = subscription;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Subscribed to Web Push medication notifications successfully',
    });
  } catch (error) {
    console.error('[Notification Subscribe Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Subscription failed' });
  }
});

export default router;
