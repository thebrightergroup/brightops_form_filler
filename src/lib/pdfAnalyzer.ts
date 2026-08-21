import { PDFDocument, PDFName, PDFDict, PDFArray } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { DetectedField, FieldType, FieldSource } from '../types';

// Set up PDF.js worker
if (typeof window !== 'undefined' || typeof self !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
}

export interface NativeParsingDetails {
  fields: DetectedField[];
  pageCount: number;
  acroFormPresent: boolean;
  rawFieldNodesCount: number;
  widgetAnnotationsCount: number;
  warningsAndErrors: string[];
}

/**
 * Extracts native AcroForm fields from a PDF buffer along with diagnostic details
 */
export async function extractNativePdfFieldsWithDiagnostics(
  pdfArrayBuffer: ArrayBuffer
): Promise<NativeParsingDetails> {
  const fields: DetectedField[] = [];
  const warningsAndErrors: string[] = [];
  let pageCount = 0;
  let acroFormPresent = false;
  let rawFieldNodesCount = 0;
  let widgetAnnotationsCount = 0;

  // 1. Try pdf-lib
  try {
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer.slice(0), { ignoreEncryption: true });
    pageCount = pdfDoc.getPageCount();

    // Check AcroForm presence in PDF catalog
    try {
      acroFormPresent = pdfDoc.catalog.has(PDFName.of('AcroForm'));
    } catch {
      acroFormPresent = false;
    }

    let form: ReturnType<typeof pdfDoc.getForm> | null = null;
    try {
      form = pdfDoc.getForm();
      acroFormPresent = true;
    } catch (e: any) {
      if (e?.message && !e.message.includes('has no AcroForm')) {
        warningsAndErrors.push(`pdf-lib getForm: ${e.message}`);
      }
    }

    if (form) {
      const acroFields = form.getFields();
      rawFieldNodesCount = acroFields.length;
      const pages = pdfDoc.getPages();

      for (let index = 0; index < acroFields.length; index++) {
        const field = acroFields[index];
        const rawName = field.getName();
        const displayLabel = cleanFieldLabel(rawName);
        const machineName = toMachineName(rawName);

        let fieldType: FieldType = 'text';
        let options: string[] | undefined = undefined;

        const constructorName = field.constructor.name;
        if (constructorName.includes('CheckBox')) {
          fieldType = 'checkbox';
        } else if (constructorName.includes('RadioGroup')) {
          fieldType = 'radio';
          try {
            const radio = form.getRadioGroup(rawName);
            options = radio.getOptions();
          } catch {
            /* ignore */
          }
        } else if (constructorName.includes('Dropdown') || constructorName.includes('OptionList')) {
          fieldType = 'select';
          try {
            const dropdown = form.getDropdown(rawName);
            options = dropdown.getOptions();
          } catch {
            /* ignore */
          }
        } else if (constructorName.includes('TextField')) {
          try {
            const textField = form.getTextField(rawName);
            if (textField.isMultiline()) {
              fieldType = 'multiline';
            } else if (rawName.toLowerCase().includes('date')) {
              fieldType = 'date';
            } else if (rawName.toLowerCase().includes('email')) {
              fieldType = 'email';
            } else if (rawName.toLowerCase().includes('phone') || rawName.toLowerCase().includes('mobile')) {
              fieldType = 'phone';
            } else if (
              rawName.toLowerCase().includes('amount') ||
              rawName.toLowerCase().includes('price') ||
              rawName.toLowerCase().includes('cost')
            ) {
              fieldType = 'currency';
            }
          } catch {
            /* ignore */
          }
        } else if (constructorName.includes('Signature')) {
          fieldType = 'signature';
        }

        let pageNum = 1;
        let xPct = 10;
        let yPct = 10 + (index % 15) * 5;
        let widthPct = 25;
        let heightPct = 3.5;

        const widgets = (field as unknown as { acroField: { getWidgets: () => PDFDict[] } }).acroField?.getWidgets() || [];
        widgetAnnotationsCount += widgets.length;

        if (widgets.length > 0) {
          const widget = widgets[0];
          const rect = widget.get(PDFName.of('Rect')) as PDFArray;
          const P = widget.get(PDFName.of('P')); // Page reference

          const rectAny = rect as unknown as { asArray?: () => { numberValue?: number }[]; array?: { numberValue?: number }[] };
          const rectItems = rectAny?.asArray ? rectAny.asArray() : rectAny?.array || [];

          if (rectItems && rectItems.length === 4) {
            const x1 = rectItems[0]?.numberValue || 0;
            const y1 = rectItems[1]?.numberValue || 0;
            const x2 = rectItems[2]?.numberValue || 0;
            const y2 = rectItems[3]?.numberValue || 0;

            if (P) {
              const matchedIndex = pages.findIndex((p) => p.ref === P);
              if (matchedIndex !== -1) {
                pageNum = matchedIndex + 1;
              }
            }

            const targetPage = pages[pageNum - 1] || pages[0];
            const pageW = targetPage ? targetPage.getWidth() : 595.28;
            const pageH = targetPage ? targetPage.getHeight() : 841.89;

            const left = Math.min(x1, x2);
            const topInPdf = Math.max(y1, y2);
            const w = Math.abs(x2 - x1);
            const h = Math.abs(y2 - y1);

            xPct = Math.max(0, Math.min(100, (left / pageW) * 100));
            yPct = Math.max(0, Math.min(100, ((pageH - topInPdf) / pageH) * 100));
            widthPct = Math.max(2, Math.min(100, (w / pageW) * 100));
            heightPct = Math.max(1.5, Math.min(100, (h / pageH) * 100));
          }
        }

        fields.push({
          id: `native-${index}-${Date.now()}`,
          label: displayLabel,
          machineName,
          fieldType,
          pageNumber: pageNum,
          x: Number(xPct.toFixed(2)),
          y: Number(yPct.toFixed(2)),
          width: Number(widthPct.toFixed(2)),
          height: Number(heightPct.toFixed(2)),
          confidence: 1.0,
          required: false,
          source: 'native_pdf',
          options,
          accepted: true,
        });
      }
    }
  } catch (err: any) {
    warningsAndErrors.push(`pdf-lib parse error: ${err?.message || String(err)}`);
  }

  // 2. Scan with pdfjsLib for verifying page count & fallback widget annotation scanning
  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfArrayBuffer.slice(0)) });
    const pdf = await loadingTask.promise;
    pageCount = Math.max(pageCount, pdf.numPages || 1);

    if (fields.length === 0) {
      let pdfjsWidgetCount = 0;
      for (let pNum = 1; pNum <= pdf.numPages; pNum++) {
        try {
          const page = await pdf.getPage(pNum);
          const annotations = await page.getAnnotations();
          const widgetAnns = annotations.filter(
            (a: any) => a.annotationType === 19 || a.subtype === 'Widget' || a.fieldName
          );

          if (widgetAnns.length > 0) {
            acroFormPresent = true;
            pdfjsWidgetCount += widgetAnns.length;

            widgetAnns.forEach((ann: any, idx: number) => {
              const rawName = ann.fieldName || ann.title || `field_p${pNum}_${idx}`;
              const displayLabel = cleanFieldLabel(rawName);
              const machineName = toMachineName(rawName);

              let fType: FieldType = 'text';
              if (ann.checkBox) fType = 'checkbox';
              else if (ann.radioButton) fType = 'radio';
              else if (ann.fieldType === 'Ch') fType = 'select';
              else if (ann.fieldType === 'Sig') fType = 'signature';

              let xPct = 10;
              let yPct = 10 + (idx % 15) * 5;
              let wPct = 25;
              let hPct = 3.5;

              if (ann.rect && ann.rect.length === 4) {
                const viewport = page.getViewport({ scale: 1.0 });
                const [x1, y1, x2, y2] = ann.rect;
                const left = Math.min(x1, x2);
                const topInPdf = Math.max(y1, y2);
                const w = Math.abs(x2 - x1);
                const h = Math.abs(y2 - y1);

                xPct = Math.max(0, Math.min(100, (left / viewport.width) * 100));
                yPct = Math.max(0, Math.min(100, ((viewport.height - topInPdf) / viewport.height) * 100));
                wPct = Math.max(2, Math.min(100, (w / viewport.width) * 100));
                hPct = Math.max(1.5, Math.min(100, (h / viewport.height) * 100));
              }

              fields.push({
                id: `native-pdfjs-p${pNum}-${idx}-${Date.now()}`,
                label: displayLabel,
                machineName,
                fieldType: fType,
                pageNumber: pNum,
                x: Number(xPct.toFixed(2)),
                y: Number(yPct.toFixed(2)),
                width: Number(wPct.toFixed(2)),
                height: Number(hPct.toFixed(2)),
                confidence: 1.0,
                required: false,
                source: 'native_pdf',
                accepted: true,
              });
            });
          }
        } catch {
          /* ignore page annotation errors */
        }
      }

      if (pdfjsWidgetCount > 0) {
        widgetAnnotationsCount = pdfjsWidgetCount;
        rawFieldNodesCount = fields.length;
      }
    }
  } catch (err: any) {
    warningsAndErrors.push(`pdfjs parse error: ${err?.message || String(err)}`);
  }

  return {
    fields,
    pageCount: Math.max(1, pageCount),
    acroFormPresent,
    rawFieldNodesCount,
    widgetAnnotationsCount: Math.max(widgetAnnotationsCount, fields.length),
    warningsAndErrors,
  };
}

/**
 * Extracts native AcroForm fields from a PDF buffer or URL using pdf-lib & pdfjsLib
 */
export async function extractNativePdfFields(pdfArrayBuffer: ArrayBuffer): Promise<DetectedField[]> {
  const result = await extractNativePdfFieldsWithDiagnostics(pdfArrayBuffer);
  return result.fields;
}

/**
 * Returns total number of pages in a PDF document buffer
 */
export async function getPdfPageCount(pdfArrayBuffer: ArrayBuffer): Promise<number> {
  try {
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer.slice(0), { ignoreEncryption: true });
    const count = pdfDoc.getPageCount();
    if (count > 0) return count;
  } catch (err: any) {
    console.warn('pdf-lib getPageCount notice:', err?.message);
  }

  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfArrayBuffer.slice(0)) });
    const pdf = await loadingTask.promise;
    return pdf.numPages || 1;
  } catch (err: any) {
    console.error('Error getting PDF page count:', err?.message);
    return 1;
  }
}


/**
 * Renders specified PDF page numbers to base64 images for Gemini AI analysis
 */
export async function renderPdfPagesToImages(
  pdfArrayBuffer: ArrayBuffer,
  pageNumbers: number[]
): Promise<{ pageNumber: number; imageBase64: string; textContent: string }[]> {
  const results: { pageNumber: number; imageBase64: string; textContent: string }[] = [];
  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfArrayBuffer.slice(0)) });
    const pdf = await loadingTask.promise;

    for (const pageNum of pageNumbers) {
      if (pageNum < 1 || pageNum > pdf.numPages) continue;

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport, canvas: canvas as unknown } as any).promise;

      const imageBase64 = canvas.toDataURL('image/png').split(',')[1];

      // Extract page text
      const textObj = await page.getTextContent();
      const pageText = textObj.items.map((item) => ('str' in item ? item.str : '')).join(' ');

      results.push({
        pageNumber: pageNum,
        imageBase64,
        textContent: pageText,
      });
    }
  } catch (err) {
    console.error('Error rendering PDF pages to image:', err);
  }
  return results;
}

/**
 * Utility to convert raw label strings into clean machine names
 */
export function toMachineName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'field_input';
}

/**
 * Clean up raw PDF AcroForm names like "topmostSubform[0].Page1[0].TextField1[0]"
 */
export function cleanFieldLabel(rawName: string): string {
  const parts = rawName.split(/[.[\]]/).filter(Boolean);
  const lastPart = parts[parts.length - 1] || rawName;

  // Replace underscores and camelCase
  const readable = lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\d+$/, '')
    .trim();

  if (!readable) return rawName;
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}
