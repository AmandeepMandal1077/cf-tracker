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
Act as a code mentor. Analyze the code below based on the specific question. Return the response in React-compatible Markdown and do not include any Latex for maths [write verbose pronunciation if needed].

**Instructions:**

1.  **Header:** Start with a small disclaimer: *"Note: AI can make mistakes."* Immediately follow this with the estimated **Time Complexity** and **Space Complexity** of the current code.
2.  **Logic Analysis:** Identify the specific "pain points" and logical flaws. Explain *why* it isn't working, but **DO NOT provide the corrected code or full solution.**
3.  **Progress:** State how close this attempt is to the solution (e.g., "You have the right idea, but the base case is missing").
4.  **Edge Case:** Provide **one specific example input** where this code will fail or produce an unexpected result.
5.  **Technical Feedback:** Highlight syntactic errors or subtle algorithmic improvements (e.g., "Consider using a Map here instead of an Array for faster lookups"). **Ignore variable naming conventions.**

**Context:**
Code: ${code}
Question: ${question}
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
