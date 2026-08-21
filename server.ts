import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Increase payload limit for base64 image streams
app.use(express.json({ limit: '25mb' }));

// Lazy initializer for Gemini client
let genAiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    genAiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAiInstance;
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

// AI Visual Form Detection API Endpoint
app.post('/api/analyze-pdf', async (req, res) => {
  try {
    const { pages } = req.body as {
      pages: { pageNumber: number; imageBase64: string; textContent?: string }[];
    };

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ error: 'No PDF page image data provided.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        fallback: true,
        message: 'Gemini API key not configured. Using native field detection.',
        detectedFields: [],
      });
    }

    const promptParts: (string | { inlineData: { mimeType: string; data: string } })[] = [
      `You are an expert Document Analysis AI for BrightOps Document Forms.
Analyse the provided PDF document page images and identify all visual form input areas that appear intended for user completion but are NOT native interactive form widgets.

Look for:
- Blank lines (e.g. "Name: _________")
- Labeled boxes, rectangles, or table cells intended for text
- Checkboxes, radio buttons, or Yes/No choice boxes
- Date lines (e.g. "Date: __/__/____")
- Multiline response boxes / comment boxes
- Signature lines or boxes (e.g. "Employee Signature: ________")
- Initials boxes
- Currency / Number input areas

CRITICAL COORDINATE INSTRUCTIONS:
Return x, y, width, height as percentages (0 to 100) relative to the top-left corner of each page:
- x: 0% is left edge, 100% is right edge
- y: 0% is TOP edge of page, 100% is BOTTOM edge
- width: percentage width of the input area (e.g., 25.5)
- height: percentage height of the input area (e.g., 3.2)

Give each field a clear label (displayLabel), a machine_name (e.g. "reporter_name"), appropriate fieldType, confidence score (0.0 to 1.0), and required boolean.`,
    ];

    pages.forEach((p) => {
      if (p.imageBase64) {
        promptParts.push({
          inlineData: {
            mimeType: 'image/png',
            data: p.imageBase64,
          },
        });
      }
      if (p.textContent) {
        promptParts.push(`Page ${p.pageNumber} OCR / Extracted Text snippet: ${p.textContent.slice(0, 500)}`);
      }
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptParts as unknown as string,
      config: {
        systemInstruction:
          'You extract structured form input field locations from document page images. Output strict valid JSON matching the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedFields: {
              type: Type.ARRAY,
              description: 'List of detected form input fields found on the page images.',
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: 'Display label e.g., "Full Name"' },
                  machineName: { type: Type.STRING, description: 'Identifier e.g., "full_name"' },
                  fieldType: {
                    type: Type.STRING,
                    description: 'One of: text, multiline, number, currency, date, email, phone, checkbox, radio, select, signature, initials',
                  },
                  pageNumber: { type: Type.INTEGER, description: '1-indexed page number' },
                  x: { type: Type.NUMBER, description: 'X position as percentage 0-100 from left' },
                  y: { type: Type.NUMBER, description: 'Y position as percentage 0-100 from top' },
                  width: { type: Type.NUMBER, description: 'Width as percentage 0-100' },
                  height: { type: Type.NUMBER, description: 'Height as percentage 0-100' },
                  confidence: { type: Type.NUMBER, description: 'Score between 0.0 and 1.0' },
                  required: { type: Type.BOOLEAN },
                  inferredPurpose: { type: Type.STRING },
                  surroundingText: { type: Type.STRING },
                },
                required: ['label', 'machineName', 'fieldType', 'pageNumber', 'x', 'y', 'width', 'height', 'confidence'],
              },
            },
            contextData: {
              type: Type.ARRAY,
              description: 'Key-value pairs of metadata or context values recognized from the document headers',
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING },
                  value: { type: Type.STRING },
                },
                required: ['key', 'value'],
              },
            },
          },
          required: ['detectedFields'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);

    res.json({
      success: true,
      detectedFields: parsed.detectedFields || [],
      contextData: parsed.contextData || [],
    });
  } catch (error) {
    console.error('Error in /api/analyze-pdf:', error);
    res.status(500).json({
      error: 'Failed to analyze document with AI.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// AI Contextual Form Check API
app.post('/api/check-form', async (req, res) => {
  try {
    const { documentTitle, fields } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        recommendations: [
          'Verify all required fields have labels.',
          'Ensure signature fields have corresponding date fields.',
        ],
      });
    }

    const fieldSummary = (fields || [])
      .map((f: { label: string; fieldType: string; required: boolean }) => `- ${f.label} (${f.fieldType}, ${f.required ? 'required' : 'optional'})`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Analyse the completeness and compliance of this form titled "${documentTitle || 'Document Form'}".
Current fields:
${fieldSummary}

Provide a JSON object containing:
1. "missingFields": array of field names that are standard for this type of document but seem missing (e.g. Signature Date, Reference Number).
2. "recommendations": array of brief compliance suggestions or usability improvements.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            missingFields: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['missingFields', 'recommendations'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err) {
    console.error('Error in /api/check-form:', err);
    res.status(500).json({ error: 'Failed to run AI form check.' });
  }
});

// Image OCR & Form Extraction Endpoint
app.post('/api/ocr-image', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        extractedText: 'OCR available with Gemini API key.',
        detectedFields: [],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'image/png',
            data: imageBase64,
          },
        },
        `You are an OCR and Document Analysis AI.
Perform high-accuracy Optical Character Recognition (OCR) on this document image.
Extract all visible text into "extractedText" maintaining original layout line breaks.
Also identify any form input areas (blank lines, text boxes, checkboxes, signature lines) with their label, machineName, fieldType, and percentage coordinates (x, y, width, height from 0 to 100).`,
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedText: { type: Type.STRING, description: 'Full OCR extracted text from the image' },
            detectedFields: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  machineName: { type: Type.STRING },
                  fieldType: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER },
                  confidence: { type: Type.NUMBER },
                },
                required: ['label', 'machineName', 'fieldType', 'x', 'y', 'width', 'height'],
              },
            },
          },
          required: ['extractedText', 'detectedFields'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      extractedText: parsed.extractedText || '',
      detectedFields: parsed.detectedFields || [],
    });
  } catch (err) {
    console.error('Error in /api/ocr-image:', err);
    res.status(500).json({ error: 'Failed to perform OCR on image.' });
  }
});

// Vite Middleware Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BrightOps Document Forms] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
