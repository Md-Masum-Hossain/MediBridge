import { jsPDF } from 'jspdf';

/**
 * Generates a clean, production-grade Clinical Editorial Prescription PDF
 * Strictly adheres to 1px hairline rules, zero heavy dropshadows, and crisp typography.
 */
export function generatePrescriptionPdf(prescription) {
  if (!prescription) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // 1. Header Block - Deep Clinical Teal (#0B4F4A)
  doc.setFillColor(11, 79, 74);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('MediBridge Clinical Assistant', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 235, 233);
  doc.text('Digitized Prescription Summary', pageWidth - margin - 52, 18);

  // 2. Doctor & Encounter Metadata
  const doctor = prescription.doctorInfo || {};
  const dateStr = doctor.prescriptionDate
    ? new Date(doctor.prescriptionDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39); // #111827
  doc.text(doctor.name || 'Dr. Md. Rafiqul Islam, MBBS, FCPS', margin, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99); // #4B5563
  doc.text(doctor.specialization || 'Consultant, Internal Medicine', margin, 43);
  doc.text(doctor.hospitalOrClinic || 'Dhaka Medical Center, Bangladesh', margin, 48);

  doc.setFont('helvetica', 'bold');
  doc.text(`Date: ${dateStr}`, pageWidth - margin - 35, 38);

  // 3. Hairline Divider
  doc.setDrawColor(229, 231, 235); // #E5E7EB
  doc.setLineWidth(0.4);
  doc.line(margin, 52, pageWidth - margin, 52);

  // 4. Prescription Table Headers
  const yHeader = 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(11, 79, 74); // #0B4F4A
  doc.text('Medicine (Brand & Generic)', margin, yHeader);
  doc.text('Dosage', margin + 85, yHeader);
  doc.text('Timing / Instruction', margin + 115, yHeader);
  doc.text('Duration', margin + 155, yHeader);

  // Divider below header
  doc.setDrawColor(11, 79, 74);
  doc.setLineWidth(0.5);
  doc.line(margin, yHeader + 3, pageWidth - margin, yHeader + 3);

  // 5. Medicine Rows
  let y = yHeader + 11;
  const medicines = prescription.medicines || [];

  medicines.forEach((med, idx) => {
    // Page break protection
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    // Medicine Brand Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(`${idx + 1}. ${med.medicineName || 'Medicine'} ${med.strength ? `(${med.strength})` : ''}`, margin, y);

    // Generic Name & Form
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128); // #6B7280
    doc.text(
      `${med.genericName || 'Active Generic'} • ${med.dosageForm || 'Tablet'}`,
      margin + 4.5,
      y + 4.5
    );

    // Dosage Pattern
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(17, 24, 39);
    doc.text(med.dosagePattern || '1+0+1', margin + 85, y);

    // Meal Timing Instruction
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text(med.mealInstruction || 'After Meal', margin + 115, y);

    // Duration
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text(med.duration || '7 days', margin + 155, y);

    // Hairline divider under each row
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 8, pageWidth - margin, y + 8);

    y += 14;
  });

  // 6. Clinical Disclaimer & Footer
  const footerY = 282;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175); // #9CA3AF
  doc.text(
    'Notice: Digitized using MediBridge Clinical OCR. Always confirm dosage and instructions with your registered doctor or pharmacist.',
    margin,
    footerY
  );
  doc.text('Powered by MediBridge Healthcare Systems', pageWidth - margin - 58, footerY);

  const cleanFileName = `Prescription_${dateStr.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(cleanFileName);
}
