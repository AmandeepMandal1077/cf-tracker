import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  if (!ai) {
    return new Response(JSON.stringify({ error: "AI client not configured" }), {
      status: 502,
    });
  }

  const { code, question } = await req.json();

  const prompt = `
You are a concise, strict code mentor. Analyze the submitted Code **only** in direct relation to the Question provided. 

Rules:
1. **No full solutions** or corrected snippets.
2. **Be brief**: Limit each section to 2-3 concise sentences.
3. **Format**: React-compatible Markdown. Backticks for identifiers only. LaTeX ($...$) for all math/complexity.
4. **Sections (Strict Order)**: 
   # Disclaimer
   # Time/Space Complexity
   # Analysis (Directly address if/how the code solves the Question)
   # Progress
   # Edge Case
   # Technical Feedback
   # Hint (One high-level tip only)

Context: 
Question: ${question}
Code: ${code}
`;

  try {
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\n`));
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          send("start", { ok: true });

          for await (const chunk of stream) {
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (text) send("token", { text });
          }

          send("done", { ok: true });
        } catch (err: any) {
          send("error", { message: err?.message ?? "Stream error" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    if (error.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
      });
    }
    return new Response(
      JSON.stringify({ error: `Error analyzing code: ${error}` }),
      { status: 500 }
    );
  }
}
