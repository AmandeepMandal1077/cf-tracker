import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

const MAX_PER_PAGE_QUESTION = 20;
export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const pageNumber: number =
    parseInt(req.nextUrl.searchParams.get("page") || "1") || 1;
  let questions;
  try {
    // fetching from userQuestions
    questions = await prisma.userQuestions.findMany({
      where: { userId: userId },
      include: { question: true },
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * MAX_PER_PAGE_QUESTION,
      take: MAX_PER_PAGE_QUESTION,
    });
  } catch (err) {
    console.error("Error fetching questions:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
  return new Response(JSON.stringify({ questions }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
