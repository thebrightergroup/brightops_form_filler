import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { TemplateRecord, DetectedField } from '../types';

/**
 * Creates a real, multi-page vector PDF buffer for testing native & AI form detection.
 */
export async function createSamplePdf(type: 'whs' | 'hr' | 'po'): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const form = pdfDoc.getForm();

  if (type === 'whs') {
    const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
    const { height } = page1.getSize();

    // Header Banner
    page1.drawRectangle({
      x: 0,
      y: height - 60,
      width: 595.28,
      height: 60,
      color: rgb(0.043, 0.07, 0.125), // #0B1220
    });

    page1.drawText('BRIGHTOPS WORKPLACE HEALTH & SAFETY', {
      x: 30,
      y: height - 38,
      size: 16,
      font: fontBold,
      color: rgb(0.95, 0.97, 0.99),
    });

    page1.drawText('INCIDENT & HAZARD REPORT FORM', {
      x: 30,
      y: height - 52,
      size: 10,
      font: fontRegular,
      color: rgb(0.588, 0.82, 0.949),
    });

    // Section 1: Incident Details
    let y = height - 90;
    page1.drawText('1. GENERAL INFORMATION', {
      x: 30,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0, 0.423, 0.639),
    });

    y -= 25;
    page1.drawText('Report Date:', { x: 30, y: y + 5, size: 10, font: fontRegular });
    const dateField = form.createTextField('report_date');
    dateField.addToPage(page1, { x: 110, y: y, width: 150, height: 20 });
    dateField.setText(new Date().toISOString().split('T')[0]);

    page1.drawText('Incident Reference #:', { x: 280, y: y + 5, size: 10, font: fontRegular });
    const refField = form.createTextField('incident_ref');
    refField.addToPage(page1, { x: 400, y: y, width: 160, height: 20 });
    refField.setText('INC-2026-0841');

    y -= 35;
    page1.drawText('Reporter Name:', { x: 30, y: y + 5, size: 10, font: fontRegular });
    const nameField = form.createTextField('reporter_name');
    nameField.addToPage(page1, { x: 110, y: y, width: 170, height: 20 });

    page1.drawText('Contact Email:', { x: 300, y: y + 5, size: 10, font: fontRegular });
    const emailField = form.createTextField('reporter_email');
    emailField.addToPage(page1, { x: 390, y: y, width: 170, height: 20 });

    y -= 35;
    page1.drawText('Work Site / Facility Location:', { x: 30, y: y + 5, size: 10, font: fontRegular });
    page1.drawRectangle({ x: 180, y: y - 2, width: 380, height: 22, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1 });
    // AI target line for location

    y -= 45;
    page1.drawText('2. INCIDENT CATEGORY (Select all that apply)', {
      x: 30,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0, 0.423, 0.639),
    });

    y -= 25;
    const cb1 = form.createCheckBox('type_injury');
    cb1.addToPage(page1, { x: 30, y, width: 16, height: 16 });
    page1.drawText('Personal Injury / Illness', { x: 55, y: y + 3, size: 10, font: fontRegular });

    const cb2 = form.createCheckBox('type_nearmiss');
    cb2.addToPage(page1, { x: 210, y, width: 16, height: 16 });
    page1.drawText('Near Miss / Unsafe Condition', { x: 235, y: y + 3, size: 10, font: fontRegular });

    const cb3 = form.createCheckBox('type_property');
    cb3.addToPage(page1, { x: 420, y, width: 16, height: 16 });
    page1.drawText('Property Damage', { x: 445, y: y + 3, size: 10, font: fontRegular });

    y -= 45;
    page1.drawText('3. DESCRIPTION OF INCIDENT', {
      x: 30,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0, 0.423, 0.639),
    });

    y -= 100;
    const descField = form.createTextField('description');
    descField.enableMultiline();
    descField.addToPage(page1, { x: 30, y, width: 530, height: 90 });

    y -= 45;
    page1.drawText('4. IMMEDIATE CORRECTIVE ACTIONS TAKEN', {
      x: 30,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0, 0.423, 0.639),
    });

    y -= 80;
    page1.drawRectangle({ x: 30, y, width: 530, height: 70, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    page1.drawText('(Please summarize any immediate hazard controls applied line by line)', {
      x: 35,
      y: y + 52,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    y -= 50;
    page1.drawText('5. SIGN-OFF & AUTHORISATION', {
      x: 30,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0, 0.423, 0.639),
    });

    y -= 35;
    page1.drawText('Reporter Signature: _______________________', { x: 30, y: y + 5, size: 10, font: fontRegular });
    page1.drawText('Date: _________________', { x: 380, y: y + 5, size: 10, font: fontRegular });

    y -= 35;
    page1.drawText('WHS Officer Signature: _____________________', { x: 30, y: y + 5, size: 10, font: fontRegular });
    page1.drawText('Initials: _________', { x: 380, y: y + 5, size: 10, font: fontRegular });

  } else if (type === 'hr') {
    const page1 = pdfDoc.addPage([595.28, 841.89]);
    const { height } = page1.getSize();

    page1.drawRectangle({
      x: 0,
      y: height - 60,
      width: 595.28,
      height: 60,
      color: rgb(0.043, 0.07, 0.125),
    });

    page1.drawText('BRIGHTOPS HUMAN RESOURCES', {
      x: 30,
      y: height - 38,
      size: 16,
      font: fontBold,
      color: rgb(0.95, 0.97, 0.99),
    });

    page1.drawText('EMPLOYEE ONBOARDING & PERSONAL DETAILS FORM', {
      x: 30,
      y: height - 52,
      size: 10,
      font: fontRegular,
      color: rgb(0.588, 0.82, 0.949),
    });

    let y = height - 90;
    page1.drawText('PERSONAL INFORMATION', { x: 30, y, size: 12, font: fontBold, color: rgb(0, 0.423, 0.639) });

    y -= 30;
    page1.drawText('Full Name:', { x: 30, y: y + 5, size: 10, font: fontRegular });
    const fnField = form.createTextField('full_name');
    fnField.addToPage(page1, { x: 100, y, width: 200, height: 20 });

    page1.drawText('Date of Birth:', { x: 320, y: y + 5, size: 10, font: fontRegular });
    const dobField = form.createTextField('date_of_birth');
    dobField.addToPage(page1, { x: 400, y, width: 160, height: 20 });

    y -= 35;
    page1.drawText('Email Address:', { x: 30, y: y + 5, size: 10, font: fontRegular });
    const emField = form.createTextField('email_address');
    emField.addToPage(page1, { x: 120, y, width: 200, height: 20 });

    page1.drawText('Mobile Phone:', { x: 330, y: y + 5, size: 10, font: fontRegular });
    const phField = form.createTextField('phone_number');
    phField.addToPage(page1, { x: 410, y, width: 150, height: 20 });

    y -= 35;
    page1.drawText('Residential Address:', { x: 30, y: y + 5, size: 10, font: fontRegular });
    page1.drawLine({ start: { x: 140, y }, end: { x: 560, y }, thickness: 1, color: rgb(0.6, 0.6, 0.6) });

    y -= 45;
    page1.drawText('EMPLOYMENT STATUS', { x: 30, y, size: 12, font: fontBold, color: rgb(0, 0.423, 0.639) });

    y -= 25;
    const fullTimeCb = form.createCheckBox('emp_fulltime');
    fullTimeCb.addToPage(page1, { x: 30, y, width: 16, height: 16 });
    page1.drawText('Full Time', { x: 55, y: y + 3, size: 10, font: fontRegular });

    const partTimeCb = form.createCheckBox('emp_parttime');
    partTimeCb.addToPage(page1, { x: 160, y, width: 16, height: 16 });
    page1.drawText('Part Time', { x: 185, y: y + 3, size: 10, font: fontRegular });

    const casualCb = form.createCheckBox('emp_casual');
    casualCb.addToPage(page1, { x: 280, y, width: 16, height: 16 });
    page1.drawText('Casual / Contractor', { x: 305, y: y + 3, size: 10, font: fontRegular });

    y -= 45;
    page1.drawText('EMERGENCY CONTACT DETAILS', { x: 30, y, size: 12, font: fontBold, color: rgb(0, 0.423, 0.639) });

    y -= 30;
    page1.drawText('Contact Name: _______________________', { x: 30, y: y + 5, size: 10, font: fontRegular });
    page1.drawText('Relationship: _________________', { x: 330, y: y + 5, size: 10, font: fontRegular });

    y -= 30;
    page1.drawText('Contact Phone: _______________________', { x: 30, y: y + 5, size: 10, font: fontRegular });

    y -= 60;
    page1.drawText('DECLARATION & SIGNATURE', { x: 30, y, size: 12, font: fontBold, color: rgb(0, 0.423, 0.639) });

    y -= 20;
    page1.drawText('I declare that the information provided above is true and accurate.', { x: 30, y, size: 9, font: fontRegular });

    y -= 40;
    page1.drawText('Employee Signature: _______________________', { x: 30, y: y + 5, size: 10, font: fontRegular });
    page1.drawText('Date: _________________', { x: 380, y: y + 5, size: 10, font: fontRegular });

  } else {
    // Purchase Order
    const page1 = pdfDoc.addPage([595.28, 841.89]);
    const { height } = page1.getSize();

    page1.drawRectangle({
      x: 0,
      y: height - 60,
      width: 595.28,
      height: 60,
      color: rgb(0.043, 0.07, 0.125),
    });

    page1.drawText('BRIGHTOPS OPERATIONS', {
      x: 30,
      y: height - 38,
      size: 16,
      font: fontBold,
      color: rgb(0.95, 0.97, 0.99),
    });

    page1.drawText('PURCHASE ORDER & REQUISITION FORM', {
      x: 30,
      y: height - 52,
      size: 10,
      font: fontRegular,
      color: rgb(0.588, 0.82, 0.949),
    });

    let y = height - 90;
    page1.drawText('PO Number:', { x: 30, y: y + 5, size: 10, font: fontRegular });
    const poField = form.createTextField('po_number');
    poField.addToPage(page1, { x: 100, y, width: 140, height: 20 });
    poField.setText('PO-2026-992');

    page1.drawText('Vendor Name:', { x: 270, y: y + 5, size: 10, font: fontRegular });
    const vendorField = form.createTextField('vendor_name');
    vendorField.addToPage(page1, { x: 350, y, width: 210, height: 20 });

    y -= 45;
    page1.drawText('REQUISITION ITEMS', { x: 30, y, size: 12, font: fontBold, color: rgb(0, 0.423, 0.639) });

    y -= 30;
    page1.drawRectangle({ x: 30, y: y - 100, width: 530, height: 120, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1 });
    page1.drawText('Item Description', { x: 40, y: y + 5, size: 10, font: fontBold });
    page1.drawText('Qty', { x: 320, y: y + 5, size: 10, font: fontBold });
    page1.drawText('Unit Price ($)', { x: 380, y: y + 5, size: 10, font: fontBold });
    page1.drawText('Total ($)', { x: 480, y: y + 5, size: 10, font: fontBold });

    y -= 30;
    const item1 = form.createTextField('item_1_desc');
    item1.addToPage(page1, { x: 40, y, width: 260, height: 18 });
    const qty1 = form.createTextField('item_1_qty');
    qty1.addToPage(page1, { x: 320, y, width: 50, height: 18 });
    const price1 = form.createTextField('item_1_price');
    price1.addToPage(page1, { x: 380, y, width: 80, height: 18 });

    y -= 30;
    page1.drawText('Total Order Amount ($):', { x: 320, y: y + 5, size: 10, font: fontBold });
    const totalField = form.createTextField('total_amount');
    totalField.addToPage(page1, { x: 450, y, width: 110, height: 20 });

    y -= 50;
    page1.drawText('APPROVAL AUTHORISATION', { x: 30, y, size: 12, font: fontBold, color: rgb(0, 0.423, 0.639) });

    y -= 35;
    page1.drawText('Approved By Name: _______________________', { x: 30, y: y + 5, size: 10, font: fontRegular });
    page1.drawText('Approval Date: _________________', { x: 350, y: y + 5, size: 10, font: fontRegular });

    y -= 35;
    page1.drawText('Authorising Signature: ____________________', { x: 30, y: y + 5, size: 10, font: fontRegular });
    page1.drawText('Initials: _________', { x: 380, y: y + 5, size: 10, font: fontRegular });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

export const SAMPLE_TEMPLATES: TemplateRecord[] = [
  {
    id: 'tmpl-whs',
    name: 'WHS Incident & Hazard Report',
    description: 'Standard operational safety report form with native fields, checkboxes, description box and signature line.',
    category: 'WHS & Safety',
    fields: [],
    samplePdfUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-hr',
    name: 'Employee Onboarding & Details',
    description: 'HR detail collection form including contact information, employment status radios, emergency contact and declaration.',
    category: 'HR & Onboarding',
    fields: [],
    samplePdfUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-po',
    name: 'Purchase Order & Requisition',
    description: 'Procurement requisition form with itemized fields, currency totals, vendor name and approval sign-off.',
    category: 'Finance & Procurement',
    fields: [],
    samplePdfUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
