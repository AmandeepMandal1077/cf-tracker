import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

// const MAX_PER_PAGE_QUESTION = 9;
export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // const pageNumber: number =
  //   parseInt(req.nextUrl.searchParams.get("page") || "1") || 1;
  let questions;
  let totalQuestions;
  try {
    // fetching from userQuestions
    [questions, totalQuestions] = await prisma.$transaction([
      prisma.userQuestions.findMany({
        where: { userId: userId },
        include: { question: true },
        orderBy: { createdAt: "desc" },
        // skip: (pageNumber - 1) * MAX_PER_PAGE_QUESTION,
        // take: MAX_PER_PAGE_QUESTION,
      }),
      prisma.userQuestions.count({ where: { userId: userId } }),
    ]);
  } catch (err) {
    console.error("Error fetching questions:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
  return new Response(JSON.stringify({ questions, totalQuestions }), {
    status: 200,
  });
}
