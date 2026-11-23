import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import MedicineMaster from './models/MedicineMaster.js';
import Pharmacy from './models/Pharmacy.js';
import User from './models/User.js';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * 60+ Common Bangladeshi Medicines
 * Includes real brand names, generics, strengths, dosage forms, manufacturers, and indicative prices
 */
export const BANGLADESH_MEDICINES = [
  // 1-10: Paracetamol & Analgesics / Antipyretics
  {
    brandName: 'Napa',
    genericName: 'Paracetamol',
    strength: '500 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Beximco Pharmaceuticals Ltd.',
    unitPrice: 1.20,
    packageSize: "10's strip",
    indications: ['Fever', 'Headache', 'Body ache', 'Toothache'],
  },
  {
    brandName: 'Napa Extra',
    genericName: 'Paracetamol + Caffeine',
    strength: '500 mg + 65 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Beximco Pharmaceuticals Ltd.',
    unitPrice: 3.00,
    packageSize: "10's strip",
    indications: ['Severe Headache', 'Migraine', 'Fever with fatigue', 'Backache'],
  },
  {
    brandName: 'Napa Extend',
    genericName: 'Paracetamol',
    strength: '665 mg',
    dosageForm: 'Modified Release Tablet',
    manufacturer: 'Beximco Pharmaceuticals Ltd.',
    unitPrice: 2.50,
    packageSize: "10's strip",
    indications: ['Persistent Joint Pain', 'Osteoarthritis Pain', 'Prolonged Fever'],
  },
  {
    brandName: 'Napa Rapid',
    genericName: 'Paracetamol (Actisorb)',
    strength: '500 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Beximco Pharmaceuticals Ltd.',
    unitPrice: 1.75,
    packageSize: "10's strip",
    indications: ['Fast Pain Relief', 'Acute Fever', 'Post-vaccination Pain'],
  },
  {
    brandName: 'Ace',
    genericName: 'Paracetamol',
    strength: '500 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 1.20,
    packageSize: "10's strip",
    indications: ['Fever', 'Mild to Moderate Pain', 'Sore Throat'],
  },
  {
    brandName: 'Ace Plus',
    genericName: 'Paracetamol + Caffeine',
    strength: '500 mg + 65 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 3.00,
    packageSize: "10's strip",
    indications: ['Migraine', 'Tension Headache', 'Dysmenorrhea', 'Fever'],
  },
  {
    brandName: 'Fast 500',
    genericName: 'Paracetamol',
    strength: '500 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Acme Laboratories Ltd.',
    unitPrice: 1.15,
    packageSize: "10's strip",
    indications: ['Fever', 'Pain Relief', 'Cold Symptoms'],
  },
  {
    brandName: 'Renova 500',
    genericName: 'Paracetamol',
    strength: '500 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Opsonin Pharma Ltd.',
    unitPrice: 1.20,
    packageSize: "10's strip",
    indications: ['Fever', 'Muscular Pain', 'Headache'],
  },
  {
    brandName: 'Clofenac',
    genericName: 'Diclofenac Sodium',
    strength: '50 mg',
    dosageForm: 'Enteric Coated Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 4.50,
    packageSize: "10's strip",
    indications: ['Arthritis', 'Acute Gout', 'Post-operative Pain', 'Inflammation'],
  },
  {
    brandName: 'Xenole',
    genericName: 'Naproxen Sodium + Esomeprazole',
    strength: '500 mg + 20 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 14.00,
    packageSize: "10's strip",
    indications: ['Ankylosing Spondylitis', 'Rheumatoid Arthritis', 'Osteoarthritis with GI risk'],
  },

  // 11-20: Gastric, PPIs, Antacids & GI
  {
    brandName: 'Seclo 20',
    genericName: 'Omeprazole',
    strength: '20 mg',
    dosageForm: 'Capsule',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 6.00,
    packageSize: "10's strip",
    indications: ['Gastric Ulcer', 'Duodenal Ulcer', 'Acid Reflux', 'GERD', 'Heartburn'],
  },
  {
    brandName: 'Seclo 40',
    genericName: 'Omeprazole',
    strength: '40 mg',
    dosageForm: 'Capsule',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 10.00,
    packageSize: "10's strip",
    indications: ['Severe GERD', 'Erosive Esophagitis', 'Zollinger-Ellison Syndrome'],
  },
  {
    brandName: 'Sergel 20',
    genericName: 'Esomeprazole Magnesium',
    strength: '20 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Incepta Pharmaceuticals Ltd.',
    unitPrice: 8.00,
    packageSize: "10's strip",
    indications: ['Acid Reflux', 'GERD', 'Healing of Erosive Esophagitis', 'H. pylori eradication'],
  },
  {
    brandName: 'Sergel 40',
    genericName: 'Esomeprazole Magnesium',
    strength: '40 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Incepta Pharmaceuticals Ltd.',
    unitPrice: 12.00,
    packageSize: "10's strip",
    indications: ['Severe GERD', 'Pathological Hypersecretory Conditions'],
  },
  {
    brandName: 'Maxpro 20',
    genericName: 'Esomeprazole Magnesium',
    strength: '20 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 8.00,
    packageSize: "10's strip",
    indications: ['GERD', 'Peptic Ulcer Disease', 'NSAID-associated Ulcer Prevention'],
  },
  {
    brandName: 'Maxpro 40',
    genericName: 'Esomeprazole Magnesium',
    strength: '40 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 12.00,
    packageSize: "10's strip",
    indications: ['Severe Erosive Esophagitis', 'Hyperacidity', 'Acid Hypersecretion'],
  },
  {
    brandName: 'Pantobex 20',
    genericName: 'Pantoprazole Sodium',
    strength: '20 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Beximco Pharmaceuticals Ltd.',
    unitPrice: 7.00,
    packageSize: "10's strip",
    indications: ['Peptic Ulcer', 'Gastroesophageal Reflux', 'Dyspepsia'],
  },
  {
    brandName: 'Pantobex 40',
    genericName: 'Pantoprazole Sodium',
    strength: '40 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Beximco Pharmaceuticals Ltd.',
    unitPrice: 11.00,
    packageSize: "10's strip",
    indications: ['Severe Peptic Ulcer', 'GERD', 'Zollinger-Ellison Syndrome'],
  },
  {
    brandName: 'Pantonix 20',
    genericName: 'Pantoprazole Sodium',
    strength: '20 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Incepta Pharmaceuticals Ltd.',
    unitPrice: 7.00,
    packageSize: "10's strip",
    indications: ['Gastric Acidity', 'Duodenal Ulcers', 'Esophagitis'],
  },
  {
    brandName: 'Finix 20',
    genericName: 'Rabeprazole Sodium',
    strength: '20 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Opsonin Pharma Ltd.',
    unitPrice: 8.00,
    packageSize: "10's strip",
    indications: ['GERD', 'Healing of Duodenal Ulcers', 'H. Pylori Infection'],
  },
  {
    brandName: 'Antacid Plus',
    genericName: 'Aluminium Hydroxide + Magnesium Hydroxide + Simethicone',
    strength: '200 mg + 200 mg + 25 mg / 5 ml',
    dosageForm: 'Suspension',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 95.00,
    packageSize: '200 ml bottle',
    indications: ['Immediate Acid Relief', 'Gas & Flatulence', 'Hyperacidity', 'Heartburn'],
  },
  {
    brandName: 'Entacyd Plus',
    genericName: 'Aluminium Hydroxide + Magnesium Hydroxide + Simethicone',
    strength: '250 mg + 400 mg + 30 mg',
    dosageForm: 'Chewable Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 2.50,
    packageSize: "10's strip",
    indications: ['Quick Heartburn Relief', 'Sour Stomach', 'Acid Indigestion'],
  },
  {
    brandName: 'Motigut 10',
    genericName: 'Domperidone',
    strength: '10 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 4.00,
    packageSize: "10's strip",
    indications: ['Nausea', 'Vomiting', 'Bloating', 'Delayed Gastric Emptying'],
  },
  {
    brandName: 'Deflux 10',
    genericName: 'Domperidone',
    strength: '10 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Beximco Pharmaceuticals Ltd.',
    unitPrice: 4.00,
    packageSize: "10's strip",
    indications: ['Nausea & Vomiting', 'Epigastric Sense of Fullness', 'Upper Abdominal Discomfort'],
  },

  // 25-35: Antihistamines & Respiratory (Allergies, Cough, Asthma)
  {
    brandName: 'Monas 10',
    genericName: 'Montelukast Sodium',
    strength: '10 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Acme Laboratories Ltd.',
    unitPrice: 17.00,
    packageSize: "10's strip",
    indications: ['Bronchial Asthma', 'Allergic Rhinitis', 'Exercise-Induced Bronchoconstriction'],
  },
  {
    brandName: 'Monas 5',
    genericName: 'Montelukast Sodium',
    strength: '5 mg',
    dosageForm: 'Chewable Tablet',
    manufacturer: 'Acme Laboratories Ltd.',
    unitPrice: 10.00,
    packageSize: "10's strip",
    indications: ['Pediatric Asthma', 'Seasonal Allergies', 'Nocturnal Cough'],
  },
  {
    brandName: 'Montene 10',
    genericName: 'Montelukast Sodium',
    strength: '10 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 17.50,
    packageSize: "10's strip",
    indications: ['Chronic Asthma Management', 'Daytime & Nighttime Allergic Symptoms'],
  },
  {
    brandName: 'Odmon 10',
    genericName: 'Montelukast Sodium',
    strength: '10 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Beximco Pharmaceuticals Ltd.',
    unitPrice: 17.00,
    packageSize: "10's strip",
    indications: ['Perennial Allergic Rhinitis', 'Asthma Maintenance'],
  },
  {
    brandName: 'Fexo 120',
    genericName: 'Fexofenadine Hydrochloride',
    strength: '120 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 10.00,
    packageSize: "10's strip",
    indications: ['Seasonal Allergic Rhinitis', 'Sneezing', 'Runny Nose', 'Itchy Eyes'],
  },
  {
    brandName: 'Fexo 180',
    genericName: 'Fexofenadine Hydrochloride',
    strength: '180 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 13.00,
    packageSize: "10's strip",
    indications: ['Chronic Idiopathic Urticaria', 'Severe Allergic Skin Conditions'],
  },
  {
    brandName: 'Alatrol 10',
    genericName: 'Cetirizine Dihydrochloride',
    strength: '10 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 3.50,
    packageSize: "10's strip",
    indications: ['Hay Fever', 'Allergic Rash', 'Itching', 'Cold Symptoms'],
  },
  {
    brandName: 'Histacin 4',
    genericName: 'Chlorpheniramine Maleate',
    strength: '4 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 0.50,
    packageSize: "20's strip",
    indications: ['Runny Nose', 'Common Cold', 'Watery Eyes', 'Allergic Sneezing'],
  },
  {
    brandName: 'Bilasten 20',
    genericName: 'Bilastine',
    strength: '20 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Incepta Pharmaceuticals Ltd.',
    unitPrice: 18.00,
    packageSize: "10's strip",
    indications: ['Non-sedating Allergy Relief', 'Allergic Rhinoconjunctivitis', 'Urticaria'],
  },
  {
    brandName: 'Tofen 1',
    genericName: 'Ketotifen Fumarate',
    strength: '1 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Beximco Pharmaceuticals Ltd.',
    unitPrice: 4.50,
    packageSize: "10's strip",
    indications: ['Bronchial Asthma Prophylaxis', 'Allergic Bronchitis', 'Rhinitis'],
  },
  {
    brandName: 'Tofen Syrup',
    genericName: 'Ketotifen Fumarate',
    strength: '1 mg / 5 ml',
    dosageForm: 'Syrup',
    manufacturer: 'Beximco Pharmaceuticals Ltd.',
    unitPrice: 65.00,
    packageSize: '100 ml bottle',
    indications: ['Pediatric Allergic Cough', 'Childhood Asthma Prophylaxis'],
  },
  {
    brandName: 'Adovas',
    genericName: 'Adhatoda vasica + Herbal Extract',
    strength: 'Herbal Cough Syrup',
    dosageForm: 'Syrup',
    manufacturer: 'Square Pharmaceuticals Ltd. (Herbal)',
    unitPrice: 85.00,
    packageSize: '100 ml bottle',
    indications: ['Dry Cough', 'Productive Cough', 'Sore Throat', 'Hoarseness'],
  },

  // 37-47: Antibiotics & Antiprotozoals
  {
    brandName: 'Azith 500',
    genericName: 'Azithromycin Dihydrate',
    strength: '500 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Beximco Pharmaceuticals Ltd.',
    unitPrice: 35.00,
    packageSize: "6's strip",
    indications: ['Respiratory Tract Infections', 'Tonsillitis', 'Skin Infections', 'Pneumonia'],
  },
  {
    brandName: 'Azithrocin 500',
    genericName: 'Azithromycin Dihydrate',
    strength: '500 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 35.00,
    packageSize: "6's strip",
    indications: ['Bronchitis', 'Sinusitis', 'Pharyngitis', 'Community Acquired Pneumonia'],
  },
  {
    brandName: 'Zithrin 500',
    genericName: 'Azithromycin Dihydrate',
    strength: '500 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Renata Limited',
    unitPrice: 35.00,
    packageSize: "6's strip",
    indications: ['Throat Infection', 'Ear Infection', 'Soft Tissue Infection'],
  },
  {
    brandName: 'Ciprocin 500',
    genericName: 'Ciprofloxacin Hydrochloride',
    strength: '500 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 15.00,
    packageSize: "10's strip",
    indications: ['Urinary Tract Infections (UTI)', 'Typhoid Fever', 'Infectious Diarrhea'],
  },
  {
    brandName: 'Neofloxin 500',
    genericName: 'Ciprofloxacin Hydrochloride',
    strength: '500 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Beximco Pharmaceuticals Ltd.',
    unitPrice: 15.00,
    packageSize: "10's strip",
    indications: ['Bacterial Infections', 'Prostatitis', 'Gastrointestinal Infections'],
  },
  {
    brandName: 'Moxaclav 625',
    genericName: 'Amoxicillin Trihydrate + Clavulanate Potassium',
    strength: '500 mg + 125 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 42.00,
    packageSize: "12's box",
    indications: ['Bacterial Sinusitis', 'Otitis Media', 'Dental Abscess', 'Skin Infections'],
  },
  {
    brandName: 'Cef-3 200',
    genericName: 'Cefixime Trihydrate',
    strength: '200 mg',
    dosageForm: 'Capsule',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 40.00,
    packageSize: "14's box",
    indications: ['Upper Respiratory Infection', 'Uncomplicated UTI', 'Typhoid Fever'],
  },
  {
    brandName: 'Triocim 200',
    genericName: 'Cefixime Trihydrate',
    strength: '200 mg',
    dosageForm: 'Capsule',
    manufacturer: 'Beximco Pharmaceuticals Ltd.',
    unitPrice: 40.00,
    packageSize: "14's box",
    indications: ['Bacterial Bronchitis', 'Gonococcal Infection', 'Pharyngitis'],
  },
  {
    brandName: 'Filmet 400',
    genericName: 'Metronidazole',
    strength: '400 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 2.20,
    packageSize: "10's strip",
    indications: ['Amebiasis', 'Giardiasis', 'Dental Infections', 'Anaerobic Infections'],
  },
  {
    brandName: 'Flamyd 400',
    genericName: 'Metronidazole',
    strength: '400 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Sanofi Bangladesh Ltd.',
    unitPrice: 2.50,
    packageSize: "10's strip",
    indications: ['Amebic Dysentery', 'Trichomoniasis', 'Post-surgical Prophylaxis'],
  },
  {
    brandName: 'Almex 400',
    genericName: 'Albendazole',
    strength: '400 mg',
    dosageForm: 'Chewable Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 5.00,
    packageSize: "2's strip",
    indications: ['Intestinal Worm Infestation', 'Ascariasis', 'Hookworm', 'Pinworm'],
  },

  // 48-58: Cardiovascular, Diabetes, CNS & Supplements
  {
    brandName: 'Bizoran 5/20',
    genericName: 'Amlodipine Besylate + Olmesartan Medoxomil',
    strength: '5 mg + 20 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 12.00,
    packageSize: "10's strip",
    indications: ['Essential Hypertension', 'Cardiovascular Risk Reduction'],
  },
  {
    brandName: 'Camlosart 5/20',
    genericName: 'Amlodipine Besylate + Olmesartan Medoxomil',
    strength: '5 mg + 20 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Incepta Pharmaceuticals Ltd.',
    unitPrice: 12.00,
    packageSize: "10's strip",
    indications: ['High Blood Pressure', 'Dual Combination Antihypertensive'],
  },
  {
    brandName: 'Amlocal 5',
    genericName: 'Amlodipine Besylate',
    strength: '5 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 5.00,
    packageSize: "10's strip",
    indications: ['Hypertension', 'Chronic Stable Angina', 'Vasospastic Angina'],
  },
  {
    brandName: 'Osartil 50',
    genericName: 'Losartan Potassium',
    strength: '50 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Incepta Pharmaceuticals Ltd.',
    unitPrice: 8.00,
    packageSize: "10's strip",
    indications: ['Hypertension', 'Diabetic Nephropathy Protection'],
  },
  {
    brandName: 'Angilock 50',
    genericName: 'Losartan Potassium',
    strength: '50 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 8.00,
    packageSize: "10's strip",
    indications: ['Hypertension', 'Stroke Reduction in Hypertensive Patients'],
  },
  {
    brandName: 'Compathan 500',
    genericName: 'Metformin Hydrochloride',
    strength: '500 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 4.00,
    packageSize: "10's strip",
    indications: ['Type 2 Diabetes Mellitus', 'Blood Glucose Regulation', 'Insulin Sensitivity'],
  },
  {
    brandName: 'Gluconor 500',
    genericName: 'Metformin Hydrochloride',
    strength: '500 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 4.00,
    packageSize: "10's strip",
    indications: ['Type 2 Diabetes Control', 'Glycemic Index Management'],
  },
  {
    brandName: 'Rosuva 10',
    genericName: 'Rosuvastatin Calcium',
    strength: '10 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 20.00,
    packageSize: "10's strip",
    indications: ['Hypercholesterolemia', 'Dyslipidemia', 'Cardiovascular Event Prevention'],
  },
  {
    brandName: 'Lipicon 10',
    genericName: 'Atorvastatin Calcium',
    strength: '10 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 15.00,
    packageSize: "10's strip",
    indications: ['High Cholesterol', 'Arterial Plaque Prevention'],
  },
  {
    brandName: 'Rivotril 0.5',
    genericName: 'Clonazepam',
    strength: '0.5 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Radiant Pharmaceuticals Ltd.',
    unitPrice: 7.00,
    packageSize: "10's strip",
    indications: ['Anxiety Disorders', 'Panic Attacks', 'Seizure Disorders', 'Sleep Disturbance'],
  },
  {
    brandName: 'Disopan 0.5',
    genericName: 'Clonazepam',
    strength: '0.5 mg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 7.00,
    packageSize: "10's strip",
    indications: ['Panic Disorder', 'Anxiety Tension', 'Myoclonus'],
  },
  {
    brandName: 'Calbo-D',
    genericName: 'Calcium Carbonate + Cholecalciferol (Vitamin D3)',
    strength: '500 mg + 200 IU',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 7.00,
    packageSize: "15's strip",
    indications: ['Osteoporosis Prevention', 'Calcium Deficiency', 'Bone Health during Pregnancy'],
  },
  {
    brandName: 'Coralcal-DX',
    genericName: 'Coral Calcium + Vitamin D3',
    strength: '500 mg + 200 IU',
    dosageForm: 'Tablet',
    manufacturer: 'Radiant Pharmaceuticals Ltd.',
    unitPrice: 12.00,
    packageSize: "15's strip",
    indications: ['Organic Calcium Supplementation', 'Bone Strength', 'Joint Mobility'],
  },
  {
    brandName: 'Neuro-B',
    genericName: 'Vitamin B1 + B6 + B12',
    strength: '100 mg + 200 mg + 200 mcg',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 8.00,
    packageSize: "10's strip",
    indications: ['Peripheral Neuropathy', 'Nerve Pain', 'Numbness in hands & feet', 'Lumbago'],
  },
  {
    brandName: 'B-50 Forte',
    genericName: 'Vitamin B-Complex High Potency',
    strength: 'Fortified Vitamin B Complex',
    dosageForm: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    unitPrice: 3.50,
    packageSize: "10's strip",
    indications: ['Vitamin Deficiency', 'General Weakness', 'Convalescence Support', 'Appetite Boost'],
  },
  {
    brandName: 'D-Rise 20000',
    genericName: 'Cholecalciferol (Vitamin D3)',
    strength: '20000 IU',
    dosageForm: 'Capsule',
    manufacturer: 'Acme Laboratories Ltd.',
    unitPrice: 40.00,
    packageSize: "4's strip",
    indications: ['Severe Vitamin D Deficiency', 'Osteomalacia', 'Immunity Enhancement'],
  },
];

/**
 * 4 Demo Pharmacies with realistic Dhaka, Bangladesh coordinates
 * Coordinates format: [longitude, latitude]
 */
export const DEMO_PHARMACIES_CONFIG = [
  {
    name: 'MediCare Express Dhanmondi',
    licenseNumber: 'DGDA-DHK-48291',
    contactPhone: '+880 1711-223344',
    contactEmail: 'dhanmondi@medicareexpress.com',
    ownerEmail: 'owner.dhanmondi@medibridge.com',
    address: {
      street: 'House 14, Road 7, Dhanmondi',
      city: 'Dhaka',
      postalCode: '1205',
      formattedAddress: 'Road 7, Dhanmondi, Dhaka 1205',
    },
    // Dhanmondi Lake area, Dhaka [longitude, latitude]
    location: {
      type: 'Point',
      coordinates: [90.3756, 23.7461],
    },
    operatingHours: { open: '08:00', close: '23:30', isOpen24Hours: false },
    rating: 4.9,
    isOpen: true,
  },
  {
    name: 'Green Life Pharmacy Uttara',
    licenseNumber: 'DGDA-DHK-81203',
    contactPhone: '+880 1819-334455',
    contactEmail: 'uttara@greenlifepharma.com',
    ownerEmail: 'owner.uttara@medibridge.com',
    address: {
      street: 'Plot 22, Sector 7, Jashimuddin Avenue',
      city: 'Dhaka',
      postalCode: '1230',
      formattedAddress: 'Sector 7, Uttara Model Town, Dhaka 1230',
    },
    // Uttara Sector 7, Dhaka [longitude, latitude]
    location: {
      type: 'Point',
      coordinates: [90.3984, 23.8732],
    },
    operatingHours: { open: '00:00', close: '23:59', isOpen24Hours: true },
    rating: 4.8,
    isOpen: true,
  },
  {
    name: 'Popular Pharma Care Mirpur',
    licenseNumber: 'DGDA-DHK-99432',
    contactPhone: '+880 1912-778899',
    contactEmail: 'mirpur@popularpharmacare.com',
    ownerEmail: 'owner.mirpur@medibridge.com',
    address: {
      street: 'Holding 8, Block C, Mirpur 10 Circle',
      city: 'Dhaka',
      postalCode: '1216',
      formattedAddress: 'Mirpur 10 Roundabout, Dhaka 1216',
    },
    // Mirpur 10 Circle, Dhaka [longitude, latitude]
    location: {
      type: 'Point',
      coordinates: [90.3688, 23.8071],
    },
    operatingHours: { open: '08:30', close: '23:00', isOpen24Hours: false },
    rating: 4.7,
    isOpen: true,
  },
  {
    name: 'Apex Health Pharmacy Mohammadpur',
    licenseNumber: 'DGDA-DHK-55104',
    contactPhone: '+880 1622-445566',
    contactEmail: 'mohammadpur@apexhealth.com',
    ownerEmail: 'owner.mohammadpur@medibridge.com',
    address: {
      street: 'House 5, Ring Road, Mohammadpur',
      city: 'Dhaka',
      postalCode: '1207',
      formattedAddress: 'Ring Road, Mohammadpur, Dhaka 1207',
    },
    // Mohammadpur Ring Road, Dhaka [longitude, latitude]
    location: {
      type: 'Point',
      coordinates: [90.3625, 23.7588],
    },
    operatingHours: { open: '08:00', close: '23:59', isOpen24Hours: false },
    rating: 4.85,
    isOpen: true,
  },
];

/**
 * Main database population function
 */
export async function seedDatabase() {
  await connectDB();

  console.log('============================================================');
  console.log('  MediBridge: Populating Bangladesh Medicine & Pharmacy Data');
  console.log('============================================================');

  // Step 1: Create or verify default users (Patient, Pharmacy Owners, Admin)
  console.log('\n[1/3] Seeding demo users...');
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);

  const demoUsers = [
    {
      name: 'Rahim Ahmed (Patient)',
      email: 'patient@medibridge.com',
      password: defaultPasswordHash,
      phone: '+880 1700-112233',
      role: 'patient',
      location: {
        type: 'Point',
        coordinates: [90.3742, 23.7465], // Dhanmondi, near MediCare Express
        address: 'Road 8A, Dhanmondi, Dhaka',
      },
    },
    {
      name: 'Admin User',
      email: 'admin@medibridge.com',
      password: defaultPasswordHash,
      phone: '+880 1700-999999',
      role: 'admin',
    },
    ...DEMO_PHARMACIES_CONFIG.map((p) => ({
      name: `${p.name} Manager`,
      email: p.ownerEmail,
      password: defaultPasswordHash,
      phone: p.contactPhone,
      role: 'pharmacy_owner',
      location: p.location,
    })),
  ];

  // Upsert users
  const createdUsers = {};
  for (const user of demoUsers) {
    let existing = await User.findOne({ email: user.email });
    if (!existing) {
      existing = await User.create(user);
    }
    createdUsers[user.email] = existing._id;
  }
  console.log(`✓ Seeded ${demoUsers.length} system users (Patient, Admin, 4 Pharmacy Owners)`);

  // Step 2: Seed MedicineMaster (50+ Bangladeshi Medicines)
  console.log('\n[2/3] Seeding MedicineMaster with 60+ authentic Bangladeshi medicines...');
  await MedicineMaster.deleteMany({});
  const insertedMedicines = await MedicineMaster.insertMany(BANGLADESH_MEDICINES);
  await MedicineMaster.syncIndexes();
  console.log(`✓ Successfully seeded ${insertedMedicines.length} medicines into MedicineMaster collection!`);

  // Step 3: Seed Demo Pharmacies with 70-80% live stock matching
  console.log('\n[3/3] Seeding 4 Demo Pharmacies in Dhaka with live inventory...');
  await Pharmacy.deleteMany({});

  const pharmaciesToInsert = DEMO_PHARMACIES_CONFIG.map((shopConfig) => {
    // Generate inventory across ALL 60+ medicines
    // 70-80% in stock, 20-30% marked out of stock for realistic testing
    let inStockCount = 0;
    const inventory = insertedMedicines.map((med) => {
      // Realistic baseline stock (~75%)
      let inStock = Math.random() < 0.75;

      // Ensure flagship branches carry key essentials and smaller branches demonstrate out-of-stock states
      if (shopConfig.name.includes('Dhanmondi')) {
        // Flagship central branch carries key demo essentials
        if (['Napa', 'Napa Extra', 'Seclo 20', 'Sergel 20', 'Monas 10', 'Fexo 120', 'Azith 500'].includes(med.brandName)) {
          inStock = true;
        }
      } else if (shopConfig.name.includes('Mohammadpur')) {
        // Mohammadpur tests out-of-stock scenario for specific items
        if (['Sergel 40', 'Azith 500'].includes(med.brandName)) {
          inStock = false;
        }
      }

      if (inStock) inStockCount++;

      const quantity = inStock ? Math.floor(Math.random() * 85) + 15 : 0; // 15 to 100 units
      const unitPrice = med.unitPrice || 10;

      return {
        medicineId: med._id,
        brandName: med.brandName,
        genericName: med.genericName,
        strength: med.strength,
        dosageForm: med.dosageForm,
        inStock,
        quantity,
        unitPrice,
        lastUpdated: new Date(),
      };
    });

    const stockPercentage = Math.round((inStockCount / insertedMedicines.length) * 100);
    console.log(
      `  - ${shopConfig.name}: ${inStockCount}/${insertedMedicines.length} items in stock (${stockPercentage}%)`
    );

    return {
      name: shopConfig.name,
      licenseNumber: shopConfig.licenseNumber,
      ownerId: createdUsers[shopConfig.ownerEmail] || null,
      contactPhone: shopConfig.contactPhone,
      contactEmail: shopConfig.contactEmail,
      address: shopConfig.address,
      location: shopConfig.location,
      operatingHours: shopConfig.operatingHours,
      rating: shopConfig.rating,
      isOpen: shopConfig.isOpen,
      inventory,
    };
  });

  const createdPharmacies = await Pharmacy.insertMany(pharmaciesToInsert);
  await Pharmacy.syncIndexes();
  console.log(`✓ Successfully seeded ${createdPharmacies.length} pharmacies with 2dsphere indexes!`);

  console.log('\n============================================================');
  console.log('✓ SEED COMPLETED SUCCESSFULLY!');
  console.log(`  - MedicineMaster: ${insertedMedicines.length} items`);
  console.log(`  - Pharmacies: ${createdPharmacies.length} active branches in Dhaka`);
  console.log('  - Stock availability: ~75% in stock across all shops');
  console.log('  - Test Patient: patient@medibridge.com / password123');
  console.log('============================================================\n');
}

// Auto-run if executed directly via CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}
