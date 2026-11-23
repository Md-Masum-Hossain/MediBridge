// Elderly-friendly speech synthesis supporting English and Bengali text

export function speakMedicineInstructions(medicine, lang = 'en') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[VoiceReader] Speech synthesis not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  let textToSpeak = '';

  if (lang === 'bn' && medicine.instructionsBn) {
    textToSpeak = `${medicine.medicineName}। ${medicine.instructionsBn}। মাত্রা: ${medicine.dosagePattern}`;
  } else {
    // English phrasing: clear, slower rate for seniors
    const dosageExplain = explainDosagePattern(medicine.dosagePattern);
    textToSpeak = `Medicine: ${medicine.medicineName}. Generic: ${medicine.genericName || ''}. Take ${dosageExplain}, ${medicine.mealInstruction || 'after meals'}, for ${medicine.duration || 'seven days'}.`;
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.rate = 0.88; // Slightly slower, deliberate pace for elderly listeners
  utterance.pitch = 1.0;
  utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US';

  window.speechSynthesis.speak(utterance);
}

export function stopVoiceReadout() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function explainDosagePattern(pattern) {
  if (!pattern) return 'as directed';
  const parts = pattern.split('+').map((s) => s.trim());
  if (parts.length === 3) {
    const [morning, afternoon, night] = parts;
    return `${morning} tablet in morning, ${afternoon} in afternoon, and ${night} at night`;
  }
  return pattern;
}
