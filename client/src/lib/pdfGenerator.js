import { jsPDF } from 'jspdf';

export function generatePrescriptionPdf(prescription) {
  const doc = new jsPDF();

  // Header - Classic Clinical Editorial styling
  doc.setFillColor(11, 79, 74); // #0B4F4A Deep Emerald
  doc.rect(0, 0, 210, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('MediBridge - Digitized Prescription', 14, 18);

  // Meta Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);

  const dateStr = prescription.createdAt
    ? new Date(prescription.createdAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  doc.text(`Doctor: ${prescription.doctorInfo?.name || 'Practitioner'}`, 14, 38);
  doc.text(`Date: ${dateStr}`, 140, 38);
  doc.text(`Hospital / Clinic: ${prescription.doctorInfo?.hospitalOrClinic || 'N/A'}`, 14, 45);

  // Divider line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 50, 196, 50);

  // Medicine Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('Medicine (Brand & Generic)', 14, 60);
  doc.text('Dosage', 100, 60);
  doc.text('Instructions', 135, 60);
  doc.text('Duration', 170, 60);

  doc.line(14, 63, 196, 63);

  // Rows
  let y = 72;
  const medicines = prescription.medicines || [];

  medicines.forEach((med) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(`${med.medicineName} (${med.strength || ''})`, 14, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`${med.genericName || ''}`, 14, y + 4);

    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(`${med.dosagePattern}`, 100, y);
    doc.text(`${med.mealInstruction}`, 135, y);
    doc.text(`${med.duration || '7 days'}`, 170, y);

    // Row hairline separator
    doc.setDrawColor(240, 240, 240);
    doc.line(14, y + 8, 196, y + 8);

    y += 14;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Digitized via MediBridge Clinical AI. Please verify with your doctor or pharmacist.',
    14,
    285
  );

  doc.save(`Prescription_${dateStr.replace(/[/\\.]/g, '-')}.pdf`);
}
