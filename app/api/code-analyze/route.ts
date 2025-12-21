import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!ai) {
    return new Response("AI client not configured", { status: 502 });
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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const result = response.text;

    console.log("AI Analysis Result:", result);
    return new Response(JSON.stringify({ analysis: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error.status === 429) {
      return new Response("Rate limit exceeded", { status: 429 });
    }
    return new Response(`Error analyzing code: ${error}`, { status: 500 });
  }
}
