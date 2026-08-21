import { PDFDocument } from 'pdf-lib';

/**
 * Converts any image File (PNG, JPG, WEBP, BMP, etc.) into a standard A4 PDF document ArrayBuffer
 */
export async function convertImageToPdf(imageFile: File): Promise<{ pdfArrayBuffer: ArrayBuffer; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;

        // Load image into an HTMLImageElement to support all browser-renderable formats (WEBP, BMP, GIF, etc.)
        const img = new Image();
        img.onload = async () => {
          // Convert image to JPEG data URL via HTML5 Canvas
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to create canvas context for image conversion.'));
            return;
          }

          // Fill white background for transparent PNGs/GIFs
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const jpegBytes = await fetch(jpegDataUrl).then((res) => res.arrayBuffer());

          // Create PDF document using pdf-lib
          const pdfDoc = await PDFDocument.create();
          const embeddedImg = await pdfDoc.embedJpg(jpegBytes);

          // Standard A4 dimensions in PDF points (595.28 x 841.89)
          const a4Width = 595.28;
          const a4Height = 841.89;

          // Scale image proportionally to fit within A4 margins (30pt padding)
          const margin = 30;
          const maxWidth = a4Width - margin * 2;
          const maxHeight = a4Height - margin * 2;

          const imgWidth = embeddedImg.width;
          const imgHeight = embeddedImg.height;

          const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);
          const scaledW = imgWidth * scale;
          const scaledH = imgHeight * scale;

          // Center on A4 page
          const x = (a4Width - scaledW) / 2;
          const y = (a4Height - scaledH) / 2;

          const page = pdfDoc.addPage([a4Width, a4Height]);
          page.drawImage(embeddedImg, {
            x,
            y,
            width: scaledW,
            height: scaledH,
          });

          const pdfBytes = await pdfDoc.save();
          const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          const pdfBlobUrl = URL.createObjectURL(pdfBlob);

          resolve({
            pdfArrayBuffer: pdfBytes.buffer as ArrayBuffer,
            dataUrl: pdfBlobUrl,
          });
        };

        img.onerror = () => {
          reject(new Error('Failed to load image file into browser.'));
        };

        img.src = dataUrl;
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}
