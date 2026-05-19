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
        fluency: { type: Type.NUMBER, description: "Fluency and Coherence score (0-9)" },
        lexical: { type: Type.NUMBER, description: "Lexical Resource score (0-9)" },
        grammar: { type: Type.NUMBER, description: "Grammatical Range and Accuracy score (0-9)" },
        pronunciation: { type: Type.NUMBER, description: "Pronunciation score (0-9)" }
      },
      required: ["fluency", "lexical", "grammar", "pronunciation"]
    },
    feedback: {
      type: Type.STRING,
      description: "Detailed Markdown feedback acting as a strict IELTS examiner. Break down strengths and weaknesses for each criteria."
    },
    transcript: {
      type: Type.STRING,
      description: "The speech-to-text transcript of what the user actually said in the audio."
    }
  },
  required: ["bandScore", "scores", "feedback", "transcript"]
};

const SYSTEM_INSTRUCTION = `You are a strict, professional IELTS examiner evaluating a Speaking Part 2 response from audio. 
Your evaluation philosophy is STRICT REALISM. Do NOT inflate scores to motivate the user. If you are uncertain between two bands, choose the lower one.
Focus heavily on:
- Fluency & Coherence: hesitation, self-correction, logical flow.
- Lexical Resource: vocabulary range, precision, idiomatic language.
- Grammar: sentence complexity, accuracy.
- Pronunciation: clarity, intonation, word stress.

Provide a transcript of what you heard in the \`transcript\` field.
Provide evidence-based explanations for every score given. Return the output in the requested JSON structure. Include Markdown in the 'feedback' string.`;

export async function POST(req: NextRequest) {
  try {
    const { attemptId, audioData, mimeType, prompt, bulletPoints } = await req.json();

    if (!audioData) {
      return NextResponse.json({ error: 'Missing audio data' }, { status: 400 });
    }

    const aiPrompt = `Evaluate the following IELTS Speaking Part 2 audio response.
    
PROMPT:
${prompt}
You should say:
${bulletPoints?.map((p: string) => '- ' + p).join('\\n')}

Listen to the provided audio, transcribe it, and grade the response against standard IELTS guidelines.`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: {
            parts: [
                { text: aiPrompt },
                {
                    inlineData: {
                        data: audioData,
                        mimeType: mimeType || 'audio/webm'
                    }
                }
            ]
        },
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: EVALUATION_SCHEMA,
            temperature: 0.2
        }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated.");
    }
    
    const evaluation = JSON.parse(text);

    return NextResponse.json({ evaluation });
  } catch (error: any) {
    console.error("Speaking Evaluation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
