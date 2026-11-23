// Backward-compatible runner for seedMedicines.js delegating to seed.js
import { seedDatabase } from '../seed.js';

seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Seed Error]:', err);
    process.exit(1);
  });
