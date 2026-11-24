import Prescription from '../models/Prescription.js';
import MedicineMaster from '../models/MedicineMaster.js';
import User from '../models/User.js';

/**
 * Intelligent helper to map dosage patterns (1+0+1, 1+1+1, 0+0+1, 1+0+0) to scheduled times
 */
function getTimingsFromPattern(pattern) {
  const defaultMorning = '08:00';
  const defaultAfternoon = '13:30';
  const defaultNight = '20:30';

  if (!pattern) return [defaultMorning, defaultNight];

  const parts = pattern.split('+').map((p) => p.trim());
  const timings = [];

  if (parts[0] && parts[0] !== '0') timings.push(defaultMorning);
  if (parts[1] && parts[1] !== '0') timings.push(defaultAfternoon);
  if (parts[2] && parts[2] !== '0') timings.push(defaultNight);

  return timings.length > 0 ? timings : [defaultMorning, defaultNight];
}

/**
 * Helper to match an extracted medicine name to the MedicineMaster collection
 */
async function matchMedicineMaster(name) {
  if (!name) return null;
  const clean = name.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const match = await MedicineMaster.findOne({
    $or: [
      { brandName: { $regex: new RegExp(`^${clean}`, 'i') } },
      { brandName: { $regex: clean, $options: 'i' } },
      { genericName: { $regex: clean, $options: 'i' } },
    ],
  });
  return match;
}

const OCR_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-3.1-pro-preview',
  'gemini-3.6-flash',
];

/**
 * Helper to call Gemini Vision generateContent with a 25-second AbortController timeout
 */
async function callGeminiModel(model, requestBody, apiKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn(`[Gemini OCR] Model ${model} timed out after 25s.`);
    } else {
      console.warn(`[Gemini OCR] Model ${model} fetch error:`, err.message);
    }
    return null;
  }
}

/**
 * Sequential model waterfall:
 * Loops through OCR_MODELS trying each once with 25s timeout. If 503, 429, 404, or timeout,
 * immediately moves to the next model without sleeping.
 */
async function callGeminiWaterfall(requestBody, apiKey) {
  for (const model of OCR_MODELS) {
    console.log(`[Gemini OCR] Trying waterfall model: ${model}...`);
    const res = await callGeminiModel(model, requestBody, apiKey);

    if (res && res.ok) {
      console.log(`[Gemini OCR] Success with model: ${model}`);
      return res;
    }

    if (res) {
      const status = res.status;
      const errText = await res.text().catch(() => '');
      console.warn(`[Gemini OCR] Model ${model} returned HTTP ${status}:`, errText);
    }
  }

  return null;
}

export const parsePrescriptionImage = async (req, res) => {
  try {
    const { imageBase64, rawText } = req.body;

    let extractedData = null;

    // Check if Gemini API Key is configured
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
      return res.status(503).json({
        success: false,
        message: 'AI prescription scanning is not configured. Please contact support.',
      });
    }

    if (!imageBase64 && !rawText) {
      return res.status(400).json({
        success: false,
        message: 'No prescription image or text provided.',
      });
    }

    if (imageBase64 || rawText) {
      try {
        const prompt = `You are a medical transcription assistant reviewing a prescription from Bangladesh.
Transcribe ONLY the exact text that is visibly written or printed in this prescription image.
Do NOT guess, invent, or add any medicine names, dosages, doctor information, or any other detail that is not clearly visible in the image.
If a field is illegible or absent, return an empty string "" for that field. If no medicines are legible, return an empty medicines array [].

Extract into STRICT JSON format:
{
  "doctorInfo": {
    "name": "exact doctor name as written, or empty string",
    "specialization": "exact specialization as written, or empty string",
    "hospitalOrClinic": "exact clinic/hospital name as written, or empty string",
    "prescriptionDate": "YYYY-MM-DD if visible, or empty string"
  },
  "medicines": [
    {
      "medicineName": "exact brand name as written in the prescription",
      "genericName": "generic name if written, otherwise empty string",
      "strength": "exact strength as written (e.g. 500mg), or empty string",
      "dosageForm": "Tablet / Capsule / Syrup / Injection / etc., or empty string",
      "dosagePattern": "pattern as written (e.g. 1+0+1), or empty string",
      "mealInstruction": "After Meal / Before Meal / With Meal as written, or empty string",
      "duration": "duration as written (e.g. 7 days), or empty string",
      "durationDays": 0,
      "instructionsBn": "Bengali instruction if written, otherwise empty string"
    }
  ]
}
Return ONLY valid raw JSON without markdown backticks or any other text.`;

        const requestBody = {
          contents: [
            {
              parts: [
                { text: prompt },
                ...(imageBase64
                  ? [
                      {
                        inline_data: {
                          mime_type: 'image/jpeg',
                          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                        },
                      },
                    ]
                  : []),
                ...(rawText ? [{ text: `Prescription text:\n${rawText}` }] : []),
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        };

        const geminiRes = await callGeminiWaterfall(requestBody, apiKey);

        if (!geminiRes || !geminiRes.ok) {
          console.error('[Gemini OCR] All waterfall models failed.');
          return res.status(503).json({
            success: false,
            message: 'Scan failed',
          });
        }

        const geminiJson = await geminiRes.json();
        const rawReply = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawReply) {
          return res.status(503).json({
            success: false,
            message: 'Scan failed',
          });
        }

        const cleanJsonStr = rawReply.replace(/```json/g, '').replace(/```/g, '').trim();
        extractedData = JSON.parse(cleanJsonStr);
      } catch (geminiError) {
        console.error('[Gemini OCR Error]:', geminiError.message);
        return res.status(503).json({
          success: false,
          message: 'Scan failed',
        });
      }
    }

    // Enhance extracted medicines with MedicineMaster catalog data
    for (const med of extractedData.medicines) {
      const masterRecord = await matchMedicineMaster(med.medicineName);
      if (masterRecord) {
        med.medicineMasterId = masterRecord._id;
        med.genericName = masterRecord.genericName || med.genericName;
        med.strength = masterRecord.strength || med.strength;
        med.dosageForm = masterRecord.dosageForm || med.dosageForm;
        med.manufacturer = masterRecord.manufacturer || '';
        med.unitPrice = masterRecord.unitPrice || 0;
      }
      med.timings = getTimingsFromPattern(med.dosagePattern);
      med.frequencyPerDay = med.timings.length;
      med.isActive = true;
    }

    res.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('[Prescription OCR Error]:', error);
    res.status(500).json({ message: error.message || 'Prescription OCR failed' });
  }
};

export const createPrescription = async (req, res) => {
  try {
    const { doctorInfo, medicines, notes, image } = req.body;

    // Use authenticated user ID or demo patient ID as default
    let userId = req.user?._id;
    if (!userId) {
      const demoPatient = await User.findOne({ email: 'patient@medibridge.com' });
      userId = demoPatient?._id;
    }

    const prescription = await Prescription.create({
      userId,
      doctorInfo: doctorInfo || {},
      medicines: medicines || [],
      notes: notes || '',
      image: image || {},
      status: 'completed',
    });

    res.status(201).json({
      success: true,
      message: 'Prescription digitized and saved successfully',
      data: prescription,
    });
  } catch (error) {
    console.error('[CreatePrescription Error]:', error);
    res.status(500).json({ message: error.message || 'Failed to save prescription' });
  }
};

export const getUserPrescriptions = async (req, res) => {
  try {
    let userId = req.user?._id;
    if (!userId) {
      const demoPatient = await User.findOne({ email: 'patient@medibridge.com' });
      userId = demoPatient?._id;
    }

    const prescriptions = await Prescription.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    console.error('[GetPrescriptions Error]:', error);
    res.status(500).json({ message: error.message || 'Failed to load prescriptions' });
  }
};

export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch prescription' });
  }
};

/**
 * PATCH /api/medications/:prescriptionId/:medicineIndex/status
 * Toggles or sets a medicine's status ('active' | 'stopped').
 * When stopped, clears daily timings to disable reminder scheduling.
 */
export const updateMedicineStatus = async (req, res) => {
  try {
    const { prescriptionId, medicineIndex } = req.params;
    // Optionally accept an explicit { status } in body; otherwise toggle.
    const { status: explicitStatus } = req.body;

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const med = prescription.medicines[Number(medicineIndex)];
    if (!med) {
      return res.status(404).json({ message: 'Medicine not found at given index' });
    }

    // Determine new status
    if (explicitStatus === 'active' || explicitStatus === 'stopped') {
      med.status = explicitStatus;
    } else {
      // Toggle
      med.status = med.status === 'stopped' ? 'active' : 'stopped';
    }

    // When stopped, disable in-app reminder timings; when re-activated keep them intact.
    if (med.status === 'stopped') {
      med.isActive = false;
    } else {
      med.isActive = true;
    }

    await prescription.save();

    res.json({
      success: true,
      message: `Medicine status set to '${med.status}'`,
      medicine: med,
      prescription,
    });
  } catch (error) {
    console.error('[UpdateMedicineStatus Error]:', error);
    res.status(500).json({ message: error.message || 'Failed to update medicine status' });
  }
};

/**
 * DELETE /api/medications/:prescriptionId/:medicineIndex
 * Permanently removes a medicine subdocument from the prescription.
 */
export const deleteMedicine = async (req, res) => {
  try {
    const { prescriptionId, medicineIndex } = req.params;
    const idx = Number(medicineIndex);

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    if (idx < 0 || idx >= prescription.medicines.length) {
      return res.status(404).json({ message: 'Medicine not found at given index' });
    }

    prescription.medicines.splice(idx, 1);
    await prescription.save();

    res.json({
      success: true,
      message: 'Medicine removed from prescription',
      prescription,
    });
  } catch (error) {
    console.error('[DeleteMedicine Error]:', error);
    res.status(500).json({ message: error.message || 'Failed to delete medicine' });
  }
};

export const logDoseAction = async (req, res) => {
  try {
    const { prescriptionId, medicineIndex } = req.params;
    const { status, scheduledTime, note } = req.body; // status: 'taken' | 'snoozed' | 'missed'

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const med = prescription.medicines[medicineIndex];
    if (!med) {
      return res.status(404).json({ message: 'Medicine item not found' });
    }

    med.takenLog.push({
      scheduledTime: scheduledTime || new Date().toISOString(),
      status: status || 'taken',
      actionTimestamp: new Date(),
      note: note || '',
    });

    await prescription.save();

    res.json({
      success: true,
      message: `Dose marked as ${status}`,
      prescription,
    });
  } catch (error) {
    console.error('[LogDose Error]:', error);
    res.status(500).json({ message: error.message || 'Failed to log dose' });
  }
};
