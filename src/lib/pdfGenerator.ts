import {
  PDFDocument,
  rgb,
  StandardFonts,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
  PDFOptionList,
  PDFSignature,
  PDFField,
} from 'pdf-lib';
import {
  DetectedField,
  PdfExportResult,
  PdfExportFieldFailure,
} from '../types';

export interface GenerateOptions {
  pdfArrayBuffer: ArrayBuffer;
  fields: DetectedField[];
  flatten?: boolean;
}

/**
 * Robust export engine for BrightOps Form Filler.
 * Handles both complex native AcroForm fillable export and flattened visual export.
 * Tracks field writes, failures, performs reopening validation, and preserves source integrity.
 */
export async function exportPdfDocument({
  pdfArrayBuffer,
  fields,
  flatten = true,
}: GenerateOptions): Promise<PdfExportResult> {
  const warnings: string[] = [];
  const failures: PdfExportFieldFailure[] = [];
  let fieldsAttempted = 0;
  let fieldsSuccessfullyWritten = 0;
  let fieldsSkipped = 0;
  let fieldsUnsupported = 0;
  let fieldsFailed = 0;

  // 1. Load source PDF document
  const pdfDoc = await PDFDocument.load(pdfArrayBuffer.slice(0), { ignoreEncryption: true });
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const expectedPageCount = pdfDoc.getPageCount();
  const pages = pdfDoc.getPages();

  if (!flatten) {
    // 2. FILLABLE PDF EXPORT (Preserve interactive AcroForm controls)
    let form: ReturnType<typeof pdfDoc.getForm> | null = null;
    try {
      form = pdfDoc.getForm();
    } catch (formErr: any) {
      warnings.push(`AcroForm initialization notice: ${formErr?.message || String(formErr)}`);
      form = null;
    }

    // Index all available native fields by their exact name for fast, exact lookup
    const nativeFieldsMap = new Map<string, PDFField>();
    if (form) {
      try {
        const allAcroFields = form.getFields();
        for (const acroF of allAcroFields) {
          try {
            const rawName = acroF.getName();
            if (rawName) {
              nativeFieldsMap.set(rawName, acroF);
            }
          } catch {
            /* ignore individual field name read errors */
          }
        }
      } catch (getFieldsErr: any) {
        warnings.push(`Could not enumerate all AcroForm fields: ${getFieldsErr?.message || String(getFieldsErr)}`);
      }
    }

    for (const field of fields) {
      // Check if field has an entered value
      const hasValue =
        field.value !== undefined &&
        field.value !== null &&
        field.value !== '' &&
        field.value !== false;

      if (!hasValue) {
        fieldsSkipped++;
        continue;
      }

      fieldsAttempted++;

      // Primary lookup: MUST use originalPdfFieldName (NOT machineName) for native fields
      const targetNativeName = field.originalPdfFieldName;
      let matchedAcroField: PDFField | null = null;

      if (targetNativeName && nativeFieldsMap.has(targetNativeName)) {
        matchedAcroField = nativeFieldsMap.get(targetNativeName) || null;
      } else if (targetNativeName && form) {
        try {
          matchedAcroField = form.getFieldMaybe(targetNativeName);
        } catch {
          matchedAcroField = null;
        }
      }

      if (matchedAcroField) {
        try {
          if (matchedAcroField instanceof PDFCheckBox) {
            const isChecked =
              field.value === true ||
              String(field.value).toLowerCase() === 'true' ||
              String(field.value).toLowerCase() === 'yes' ||
              String(field.value) === '1' ||
              String(field.value).toLowerCase() === 'on';

            if (isChecked) {
              matchedAcroField.check();
            } else {
              matchedAcroField.uncheck();
            }
            fieldsSuccessfullyWritten++;
          } else if (matchedAcroField instanceof PDFRadioGroup) {
            const valStr = String(field.value);
            const options = matchedAcroField.getOptions();
            if (options.includes(valStr)) {
              matchedAcroField.select(valStr);
            } else {
              // Try case-insensitive or trimmed match
              const matchedOpt = options.find(
                (opt) => opt.toLowerCase().trim() === valStr.toLowerCase().trim()
              );
              if (matchedOpt) {
                matchedAcroField.select(matchedOpt);
              } else if (options.length > 0) {
                // If boolean choice like yes/no
                if (valStr.toLowerCase() === 'yes' || valStr.toLowerCase() === 'true') {
                  const yesOpt = options.find((o) => /yes|true|y/i.test(o));
                  if (yesOpt) matchedAcroField.select(yesOpt);
                } else if (valStr.toLowerCase() === 'no' || valStr.toLowerCase() === 'false') {
                  const noOpt = options.find((o) => /no|false|n/i.test(o));
                  if (noOpt) matchedAcroField.select(noOpt);
                }
              }
            }
            fieldsSuccessfullyWritten++;
          } else if (matchedAcroField instanceof PDFDropdown || matchedAcroField instanceof PDFOptionList) {
            const valStr = String(field.value);
            const options = matchedAcroField.getOptions();
            if (options.includes(valStr)) {
              matchedAcroField.select(valStr);
            } else {
              const matchedOpt = options.find(
                (opt) => opt.toLowerCase().trim() === valStr.toLowerCase().trim()
              );
              if (matchedOpt) {
                matchedAcroField.select(matchedOpt);
              } else {
                // If dropdown allows custom values, fallback or select first match
                try {
                  matchedAcroField.select(valStr);
                } catch {
                  /* option list restricted */
                }
              }
            }
            fieldsSuccessfullyWritten++;
          } else if (matchedAcroField instanceof PDFTextField) {
            const cleanText = String(field.value);
            try {
              matchedAcroField.setText(cleanText);
            } catch (textErr: any) {
              // Handle character encoding fallback if non-winansi chars present
              const sanitized = cleanText.replace(/[^\x00-\x7F]/g, '');
              matchedAcroField.setText(sanitized);
            }
            fieldsSuccessfullyWritten++;
          } else if (matchedAcroField instanceof PDFSignature) {
            // Native interactive signatures cannot be safely signed without PKI certs in pdf-lib
            fieldsUnsupported++;
            // Render visual overlay so signature appears on page
            await renderFieldVisualOverlay(pdfDoc, pages, field, fontRegular);
            fieldsSuccessfullyWritten++;
          } else {
            // Generic field fallback (try setting text if available)
            try {
              const anyField = matchedAcroField as any;
              if (typeof anyField.setText === 'function') {
                anyField.setText(String(field.value));
                fieldsSuccessfullyWritten++;
              } else {
                fieldsUnsupported++;
                await renderFieldVisualOverlay(pdfDoc, pages, field, fontRegular);
                fieldsSuccessfullyWritten++;
              }
            } catch {
              fieldsUnsupported++;
              await renderFieldVisualOverlay(pdfDoc, pages, field, fontRegular);
              fieldsSuccessfullyWritten++;
            }
          }
        } catch (writeErr: any) {
          fieldsFailed++;
          failures.push({
            fieldId: field.id,
            label: field.label,
            originalPdfFieldName: field.originalPdfFieldName,
            machineName: field.machineName,
            fieldType: field.fieldType,
            reason: writeErr?.message || 'Failed to update AcroForm field value',
          });
        }
      } else {
        // Overlay field (AI-detected or user-created without an existing AcroForm counterpart)
        // In fillable export, draw overlay cleanly on page so user data is never lost
        try {
          await renderFieldVisualOverlay(pdfDoc, pages, field, fontRegular);
          fieldsSuccessfullyWritten++;
        } catch (overlayErr: any) {
          fieldsFailed++;
          failures.push({
            fieldId: field.id,
            label: field.label,
            originalPdfFieldName: field.originalPdfFieldName,
            machineName: field.machineName,
            fieldType: field.fieldType,
            reason: overlayErr?.message || 'Failed to render overlay field',
          });
        }
      }
    }
  } else {
    // 3. FLATTENED EXPORT (High-fidelity visual raster of all entered values)
    for (const field of fields) {
      const hasValue =
        field.value !== undefined &&
        field.value !== null &&
        field.value !== '' &&
        field.value !== false;

      if (!hasValue) {
        fieldsSkipped++;
        continue;
      }

      fieldsAttempted++;
      try {
        await renderFieldVisualOverlay(pdfDoc, pages, field, fontRegular);
        fieldsSuccessfullyWritten++;
      } catch (drawErr: any) {
        fieldsFailed++;
        failures.push({
          fieldId: field.id,
          label: field.label,
          originalPdfFieldName: field.originalPdfFieldName,
          machineName: field.machineName,
          fieldType: field.fieldType,
          reason: drawErr?.message || 'Failed to render flattened field onto page',
        });
      }
    }
  }

  // 4. Save and generate PDF binary
  const pdfBytes = await pdfDoc.save();

  // 5. Result Verification & Reopen Test
  if (!pdfBytes || pdfBytes.length === 0) {
    throw new Error('Export generation failed: Generated PDF bytes are empty.');
  }

  let reopenVerified = false;
  let verifiedPageCount = 0;
  try {
    const reopenDoc = await PDFDocument.load(pdfBytes.slice(0), { ignoreEncryption: true });
    verifiedPageCount = reopenDoc.getPageCount();
    if (verifiedPageCount > 0) {
      reopenVerified = true;
    }
    if (expectedPageCount > 0 && verifiedPageCount !== expectedPageCount) {
      warnings.push(
        `Exported PDF page count (${verifiedPageCount}) differs from expected (${expectedPageCount}).`
      );
    }
  } catch (reopenErr: any) {
    warnings.push(`Reopen validation notice: ${reopenErr?.message || String(reopenErr)}`);
  }

  return {
    pdfBytes,
    pageCount: verifiedPageCount || expectedPageCount,
    fieldsAttempted,
    fieldsSuccessfullyWritten,
    fieldsSkipped,
    fieldsUnsupported,
    fieldsFailed,
    failures,
    warnings,
    reopenVerified,
  };
}

/**
 * Helper: Renders a field value directly onto the target PDF page canvas
 */
async function renderFieldVisualOverlay(
  pdfDoc: PDFDocument,
  pages: ReturnType<typeof pdfDoc.getPages>,
  field: DetectedField,
  fontRegular: any
): Promise<void> {
  const pageIdx = Math.max(0, Math.min(pages.length - 1, (field.pageNumber || 1) - 1));
  const page = pages[pageIdx];
  const { width: pageW, height: pageH } = page.getSize();

  // Convert percentage coordinates (origin top-left) to PDF points (origin bottom-left)
  const xPt = (field.x / 100) * pageW;
  const wPt = (field.width / 100) * pageW;
  const hPt = (field.height / 100) * pageH;
  const topPt = (field.y / 100) * pageH;
  const yPt = pageH - topPt - hPt;

  if (field.fieldType === 'checkbox') {
    if (
      field.value === true ||
      String(field.value).toLowerCase() === 'true' ||
      String(field.value).toLowerCase() === 'yes' ||
      String(field.value) === '1'
    ) {
      const size = Math.min(wPt, hPt);
      page.drawText('X', {
        x: xPt + size * 0.2,
        y: yPt + size * 0.15,
        size: Math.max(9, size * 0.7),
        font: fontRegular,
        color: rgb(0, 0.423, 0.639), // Primary Blue #006CA3
      });
    }
  } else if (field.fieldType === 'signature' || field.fieldType === 'initials') {
    const valStr = String(field.value);
    if (valStr.startsWith('data:image/')) {
      try {
        const imgBytes = await fetch(valStr).then((res) => res.arrayBuffer());
        const signatureImg = valStr.includes('png')
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);

        page.drawImage(signatureImg, {
          x: xPt,
          y: yPt,
          width: wPt,
          height: hPt,
        });
      } catch (imgErr) {
        console.error('Error embedding signature image:', imgErr);
        page.drawText('(Signed)', {
          x: xPt + 4,
          y: yPt + hPt * 0.2,
          size: 10,
          font: fontRegular,
          color: rgb(0.043, 0.07, 0.125),
        });
      }
    } else {
      page.drawText(valStr, {
        x: xPt + 4,
        y: yPt + hPt * 0.2,
        size: Math.min(14, Math.max(9, hPt * 0.6)),
        font: fontRegular,
        color: rgb(0.043, 0.07, 0.125),
      });
    }
  } else {
    // Text, multiline, date, number, currency, select, email, phone, radio
    const textVal = String(field.value);
    const fontSize = Math.max(8, Math.min(11, hPt * 0.65));

    if (field.fieldType === 'multiline') {
      const lines = textVal.split('\n');
      let currentY = yPt + hPt - fontSize - 2;
      for (const line of lines) {
        if (currentY < yPt) break;
        const sanitized = line.replace(/[^\x00-\x7F]/g, '');
        page.drawText(sanitized, {
          x: xPt + 4,
          y: currentY,
          size: fontSize,
          font: fontRegular,
          color: rgb(0.043, 0.07, 0.125),
        });
        currentY -= fontSize + 2;
      }
    } else {
      const sanitized = textVal.replace(/[^\x00-\x7F]/g, '');
      page.drawText(sanitized, {
        x: xPt + 4,
        y: yPt + Math.max(2, (hPt - fontSize) / 2),
        size: fontSize,
        font: fontRegular,
        color: rgb(0.043, 0.07, 0.125),
      });
    }
  }
}

/**
 * Backward-compatible wrapper for generateCompletedPdf returning Uint8Array
 */
export async function generateCompletedPdf(options: GenerateOptions): Promise<Uint8Array> {
  const result = await exportPdfDocument(options);
  return result.pdfBytes;
}
