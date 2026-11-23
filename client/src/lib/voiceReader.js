/**
 * Voice Read-Out System for Elderly Patients
 * Uses window.speechSynthesis with bilingual support (Bangla & English).
 * Articulates Brand name, generic, dosage breakdown, and meal instructions
 * at an elderly-friendly deliberate pace (0.85 rate).
 */

let speechInProgress = false;

export function isVoiceActive() {
  return typeof window !== 'undefined' && window.speechSynthesis?.speaking;
}

export function stopVoiceReadout() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    speechInProgress = false;
  }
}

export function speakMedicine(medicine, lang = 'bn') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[VoiceReader] Speech synthesis not supported in this browser.');
    return;
  }

  stopVoiceReadout();

  let textToSpeak = '';

  if (lang === 'bn' || medicine.instructionsBn) {
    const meal = medicine.mealInstruction?.toLowerCase().includes('before')
      ? 'খাবারের পূর্বে'
      : 'খাবারের পরে';
    const dosageBn = translateDosageToBengali(medicine.dosagePattern);

    textToSpeak = `${medicine.medicineName}। ${dosageBn}। ${medicine.instructionsBn || meal}। মেয়াদ ${medicine.duration || 'নির্দিষ্ট দিন'}।`;
  } else {
    const dosageExplain = explainDosagePatternEnglish(medicine.dosagePattern);
    textToSpeak = `Medicine: ${medicine.medicineName}. Generic: ${medicine.genericName || ''}. Take ${dosageExplain}, ${medicine.mealInstruction || 'after meals'}, for ${medicine.duration || 'seven days'}.`;
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.rate = 0.85; // Deliberate slower pace for seniors
  utterance.pitch = 1.0;
  utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US';

  utterance.onend = () => {
    speechInProgress = false;
  };
  utterance.onerror = () => {
    speechInProgress = false;
  };

  speechInProgress = true;
  window.speechSynthesis.speak(utterance);
}

export function speakPrescriptionList(medicines = [], lang = 'bn') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || medicines.length === 0) {
    return;
  }

  stopVoiceReadout();

  const intro =
    lang === 'bn'
      ? `আপনার প্রেসক্রিপশনে মোট ${medicines.length} টি ঔষধ রয়েছে। শুনুন:`
      : `Your prescription has ${medicines.length} medications. Listen carefully:`;

  const details = medicines
    .map((med, i) => {
      if (lang === 'bn') {
        const dosageBn = translateDosageToBengali(med.dosagePattern);
        return `ঔষধ নম্বর ${i + 1}: ${med.medicineName}। মাত্রা: ${dosageBn}। ${med.instructionsBn || med.mealInstruction || ''}।`;
      }
      const dosageEn = explainDosagePatternEnglish(med.dosagePattern);
      return `Medication ${i + 1}: ${med.medicineName}. Take ${dosageEn}, ${med.mealInstruction || 'after meals'}.`;
    })
    .join(' ');

  const fullText = `${intro} ${details}`;

  const utterance = new SpeechSynthesisUtterance(fullText);
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US';

  utterance.onend = () => {
    speechInProgress = false;
  };
  utterance.onerror = () => {
    speechInProgress = false;
  };

  speechInProgress = true;
  window.speechSynthesis.speak(utterance);
}

function translateDosageToBengali(pattern) {
  if (!pattern) return 'ডাক্তারের পরামর্শ অনুযায়ী সেবন করুন';
  const parts = pattern.split('+').map((s) => s.trim());
  if (parts.length === 3) {
    const [m, a, n] = parts;
    const partsText = [];
    if (m && m !== '0') partsText.push(`সকালে ${m} টি`);
    if (a && a !== '0') partsText.push(`দুপুরে ${a} টি`);
    if (n && n !== '0') partsText.push(`রাতে ${n} টি`);
    return partsText.join(', ');
  }
  return pattern;
}

function explainDosagePatternEnglish(pattern) {
  if (!pattern) return 'as directed by physician';
  const parts = pattern.split('+').map((s) => s.trim());
  if (parts.length === 3) {
    const [morning, afternoon, night] = parts;
    const items = [];
    if (morning && morning !== '0') items.push(`${morning} tablet in morning`);
    if (afternoon && afternoon !== '0') items.push(`${afternoon} in afternoon`);
    if (night && night !== '0') items.push(`${night} at night`);
    return items.join(', ') || 'as directed';
  }
  return pattern;
}
