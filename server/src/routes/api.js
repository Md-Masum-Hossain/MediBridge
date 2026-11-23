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
} from '../controllers/prescriptionController.js';
import { protect } from '../middleware/auth.js';

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

// Prescription Digitization & Tracking Routes
router.post('/prescriptions/parse', parsePrescriptionImage);
router.post('/prescriptions', createPrescription);
router.get('/prescriptions', getUserPrescriptions);
router.get('/prescriptions/:id', getPrescriptionById);
router.post('/prescriptions/:prescriptionId/medicines/:medicineIndex/log', logDoseAction);

export default router;
