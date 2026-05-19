import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const EVALUATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    bandScore: { type: Type.NUMBER, description: "Overall band score 0-9 in 0.5 increments" },
    scores: {
      type: Type.OBJECT,
      properties: {
        taskResponse: { type: Type.NUMBER, description: "Task Response score (0-9)" },
        coherence: { type: Type.NUMBER, description: "Coherence and Cohesion score (0-9)" },
        lexical: { type: Type.NUMBER, description: "Lexical Resource score (0-9)" },
        grammar: { type: Type.NUMBER, description: "Grammatical Range and Accuracy score (0-9)" }
      },
      required: ["taskResponse", "coherence", "lexical", "grammar"]
    },
    feedback: {
      type: Type.STRING,
      description: "Detailed Markdown feedback acting as a strict IELTS examiner. Explain why the score was given, and specific weaknesses."
    },
    sentenceCorrections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          corrected: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["original", "corrected", "explanation"]
      },
      description: "Array of up to 5 specific sentence corrections."
    }
  },
  required: ["bandScore", "scores", "feedback", "sentenceCorrections"]
};

const SYSTEM_INSTRUCTION = `You are a strict, professional IELTS examiner evaluating a Task 2 essay. 
Your evaluation philosophy is STRICT REALISM. Do NOT inflate scores to motivate the user. If you are uncertain between two bands, choose the lower one.
Focus heavily on identifying repetitive vocabulary, weak argument development, grammatical instability, and superficial coherence.
Provide evidence-based explanations for every score given.
Return the output in the requested JSON structure. Include Markdown in the 'feedback' string.`;

export async function POST(req: NextRequest) {
  try {
    const { essayId, content, prompt } = await req.json();

    if (!content || !prompt) {
      return NextResponse.json({ error: 'Missing content or prompt' }, { status: 400 });
    }

    const aiPrompt = `Evaluate the following IELTS Writing Task 2 essay.
    
PROMPT:
${prompt}

ESSAY:
${content}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: aiPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: EVALUATION_SCHEMA,
        temperature: 0.2 
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated.");
    }
    
    const evaluation = JSON.parse(text);

    return NextResponse.json({ evaluation });
  } catch (error: any) {
    console.error("Evaluation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
