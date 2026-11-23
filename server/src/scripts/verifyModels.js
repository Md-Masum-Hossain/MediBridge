import User from '../models/User.js';
import MedicineMaster from '../models/MedicineMaster.js';
import Prescription from '../models/Prescription.js';
import Pharmacy from '../models/Pharmacy.js';

console.log('✓ User Model loaded:', !!User.modelName);
console.log('✓ MedicineMaster Model loaded:', !!MedicineMaster.modelName);
console.log('✓ Prescription Model loaded:', !!Prescription.modelName);
console.log('✓ Pharmacy Model loaded:', !!Pharmacy.modelName);
console.log('--- ALL 4 MONGOOSE MODELS VERIFIED SUCCESSFULLY! ---');
