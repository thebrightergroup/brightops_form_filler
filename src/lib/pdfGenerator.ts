import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DetectedField } from '../types';

interface GenerateOptions {
  pdfArrayBuffer: ArrayBuffer;
  fields: DetectedField[];
  flatten?: boolean;
}

/**
 * Takes the original PDF buffer + fields with entered values and generates a completed PDF
 */
export async function generateCompletedPdf({
  pdfArrayBuffer,
  fields,
  flatten = true,
}: GenerateOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfArrayBuffer.slice(0), { ignoreEncryption: true });
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  if (!flatten) {
    // Fill native AcroForm fields where applicable
    try {
      const form = pdfDoc.getForm();
      fields.forEach((field) => {
        if (!field.value) return;
        try {
          if (field.fieldType === 'checkbox') {
            const cb = form.getCheckBox(field.machineName);
            if (field.value === true || field.value === 'true') {
              cb.check();
            } else {
              cb.uncheck();
            }
          } else if (field.fieldType === 'text' || field.fieldType === 'multiline' || field.fieldType === 'date' || field.fieldType === 'email' || field.fieldType === 'phone') {
            const tf = form.getTextField(field.machineName);
            tf.setText(String(field.value));
          }
        } catch {
          /* ignore missing native fields */
        }
      });
    } catch {
      /* ignore */
    }
  } else {
    // Flatten mode: draw values directly onto original PDF pages
    for (const field of fields) {
      if (field.value === undefined || field.value === null || field.value === '' || field.value === false) {
        continue;
      }

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
        if (field.value === true || field.value === 'true') {
          // Draw checkmark X or tick
          const size = Math.min(wPt, hPt);
          page.drawText('X', {
            x: xPt + size * 0.2,
            y: yPt + size * 0.15,
            size: Math.max(10, size * 0.7),
            font: fontRegular,
            color: rgb(0, 0.423, 0.639), // Primary Blue #006CA3
          });
        }
      } else if (field.fieldType === 'signature' || field.fieldType === 'initials') {
        const valStr = String(field.value);
        if (valStr.startsWith('data:image/')) {
          // Embed signature image PNG/JPEG
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
          } catch (e) {
            console.error('Error embedding signature image:', e);
          }
        } else {
          // Typed signature text
          page.drawText(valStr, {
            x: xPt + 4,
            y: yPt + hPt * 0.2,
            size: Math.min(14, hPt * 0.6),
            font: fontRegular,
            color: rgb(0.043, 0.07, 0.125),
          });
        }
      } else {
        // Standard text, date, multiline, select, email, phone, number, currency
        const textVal = String(field.value);
        const fontSize = Math.max(8, Math.min(12, hPt * 0.65));

        if (field.fieldType === 'multiline') {
          // Simple multiline wrapping
          const lines = textVal.split('\n');
          let currentY = yPt + hPt - fontSize - 2;
          for (const line of lines) {
            if (currentY < yPt) break;
            page.drawText(line, {
              x: xPt + 4,
              y: currentY,
              size: fontSize,
              font: fontRegular,
              color: rgb(0.043, 0.07, 0.125),
            });
            currentY -= fontSize + 2;
          }
        } else {
          page.drawText(textVal, {
            x: xPt + 4,
            y: yPt + Math.max(2, (hPt - fontSize) / 2),
            size: fontSize,
            font: fontRegular,
            color: rgb(0.043, 0.07, 0.125),
          });
        }
      }
    }
  }

  return await pdfDoc.save();
}
