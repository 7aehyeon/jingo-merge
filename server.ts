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
          text: `이 이수증/수료증 PDF 파일의 텍스트와 레이아웃을 극도로 정밀하게 분석하여 다음 정보를 추출해줘:
1. certNumber: 이수번호 혹은 등록번호
   - 보통 왼쪽 상단 또는 주변에 '제 경남교연-2026-443709 호'나 '제 2026-1234호'처럼 기재되어 있습니다.
   - 앞의 '제 '와 뒤의 ' 호'를 뺀 핵심 일련번호/식별자(예: "경남교연-2026-443709" 또는 "2026-1234")만 깔끔하게 추출해야 합니다. '제'나 '호'가 포함되지 않도록 알맹이만 정확히 반환해주세요.
2. certDate: 이수 완료일자 혹은 수료 날짜 (형식: "YYYY-MM-DD")
   - 이수증 하단 부근에 독립적으로 크게 적혀 있는 이수 완료/발급 날짜(예: "2026년 5월 21일")를 최우선으로 찾으세요.
   - 중간의 연수 기간(예: 2026.03.23.~2026.05.21.)이 있는 경우, 시작일이 아니라 반드시 **연수 마감일 또는 하단에 표기된 최종 수료일**이어야 합니다.
   - 날짜를 분석한 뒤 반드시 "YYYY-MM-DD" (예: "2026-05-21") 표준형식으로 변환하여 반환해주세요.
3. hours: 총 이수 시간 (정수 숫자값)
   - '이수시간 : 25시간 (1500분)'처럼 '시간'과 '분'이 모두 적혀있는 경우, 절대 괄호 안의 분(1500)을 선택하지 마세요.
   - 반드시 '시간' 단위를 의미하는 앞의 정수 숫자값(예: 25)만 추출해야 합니다. (분 단위를 반환하면 절대 안 됨!)
4. userName: 이수증에 수혜자로 표기된 교직원 성명 (예: "박재현")
5. trainingTitle: 연수 과정명 혹은 과정 이름 (예: "(교원)2026년 법정의무연수 꾸러미 과정 I, II (통합)")`
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            certNumber: { 
              type: Type.STRING, 
              description: "이수번호 또는 수료번호. '제 경남교연-2026-443709 호' 형태인 경우 '제'와 '호'를 제거한 핵심 식별자만 추출 (예: 경남교연-2026-443709)" 
            },
            certDate: { 
              type: Type.STRING, 
              description: "수료일 또는 이수완료일 (형식: YYYY-MM-DD, 연수 기간의 마감일 또는 하단 발급일자 기준)" 
            },
            hours: { 
              type: Type.INTEGER, 
              description: "총 이수시간. '25시간 (1500분)'과 같이 분이 병기된 경우 절대 괄호를 쓰지 말고 오직 '시간' 단위의 정수 숫자만 추출 (예: 25)" 
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
