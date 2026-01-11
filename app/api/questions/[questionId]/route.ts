import prisma from "@/lib/prisma";
import { getQuestionInfo } from "@/utils/codeforces-scraper";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { questionId } = await params;
  const url = `https://codeforces.com/problemset/problem/${questionId.replace(
    "_",
    "/"
  )}`;

  // Need optimization
  try {
    let question = await prisma.userQuestions.findUnique({
      where: { userId_questionId: { userId, questionId } },
      include: {
        question: true,
      },
    });

    if (!question) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
      });
    }

    if (!question?.question.problemStatement) {
      let problemDetails: any;
      try {
        problemDetails = await getQuestionInfo(url);
      } catch (err) {
        return new Response(
          JSON.stringify({ error: `Error scraping question: ${err}` }),
          { status: 500 }
        );
      }
      await prisma.questionBank.update({
        where: { id: questionId },
        data: {
          problemStatement: JSON.stringify(problemDetails),
        },
      });

      question = await prisma.userQuestions.findUnique({
        where: { userId_questionId: { userId, questionId } },
        include: {
          question: true,
        },
      });
    }

    return new Response(JSON.stringify({ question }), { status: 200 });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Error fetching question: ${err}` }),
      { status: 500 }
    );
  }
}
