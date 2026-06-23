import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body limit to handle PDF base64 payloads
app.use(express.json({ limit: '20mb' }));

// Shared Gemini client setup
// Note: We use dynamic check or process.env.GEMINI_API_KEY. We also include the aistudio-build header.
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } else {
    console.warn("⚠️ GEMINI_API_KEY is not defined in the environment.");
  }
} catch (err) {
  console.error("Failed to initialize GoogleGenAI:", err);
}

// REST API endpoint for PDF extraction using Gemini
app.post('/api/parse-pdf', async (req, res) => {
  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: "Missing fileBase64 parameter." });
    }

    if (!ai) {
      return res.status(503).json({ 
        error: "Gemini API client is not initialized server-side. Please set the GEMINI_API_KEY in Settings > Secrets." 
      });
    }

    // Clean base64 header if present (e.g. data:application/pdf;base64,...)
    const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, "");

    console.log(`[ParsePDF] Received parsing request for ${fileName || 'unnamed.pdf'}. Triggering Gemini model...`);

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: cleanBase64,
          },
        },
        {
          text: `이 이수증/수료증 PDF 파일의 텍스트와 레이아웃을 정확하게 분석하여 다음 정보를 추출해줘:
1. certNumber: 이수번호 혹은 등록번호 (예: 제 2026-1234호, 제 1234호 등 파일에 쓰여있는 그대로 추출)
2. certDate: 이수 날짜 혹은 수료 날짜 (파일에 표기된 가장 최종 이수/수료 년월일을 발견해 "YYYY-MM-DD" 표준 형식으로 서식화)
3. hours: 이수 시간 혹은 연수 시간 (예: 15시간, 30시간인 경우 숫자만 또는 시간 기재, 숫자를 기본 추천하며 없을 시 0)
4. userName: 이수증에 수혜자로 표기된 성명 (성명, 이름)
5. trainingTitle: 연수 과정명 혹은 과정 이름`
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            certNumber: { 
              type: Type.STRING, 
              description: "이수번호 또는 수료번호 (예: 제 2026-105-001호)" 
            },
            certDate: { 
              type: Type.STRING, 
              description: "수료일 또는 이수완료일 (형식: YYYY-MM-DD)" 
            },
            hours: { 
              type: Type.INTEGER, 
              description: "총 이수시간 (정수 숫자값)" 
            },
            userName: { 
              type: Type.STRING, 
              description: "이수자 성명" 
            },
            trainingTitle: { 
              type: Type.STRING, 
              description: "연수 과정 이름" 
            },
          },
          required: ['certNumber', 'certDate'],
        }
      }
    });

    const parsedText = response.text;
    console.log("[ParsePDF] Gemini Response text:", parsedText);

    if (!parsedText) {
      throw new Error("Empty response received from Gemini.");
    }

    const parsedData = JSON.parse(parsedText);
    res.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("[ParsePDF] Error parsing PDF via Gemini:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to parse PDF via Gemini API." 
    });
  }
});

// Start integration with Vite in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Jinju High School Training App] Server running on http://localhost:${PORT}`);
  });
}

startServer();
