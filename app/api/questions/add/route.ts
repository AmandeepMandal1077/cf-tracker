import prisma from "@/lib/prisma";
import { fetchQuestionDetailsViaURL } from "@/lib/req-cf";
import { auth } from "@clerk/nextjs/server";

export async function PUT(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const body = await req.json();
  const { questionUrl } = body;

  try {
    const problemDetails = await fetchQuestionDetailsViaURL(questionUrl);
    if (!problemDetails) {
      return new Response(JSON.stringify({ error: "Invalid Question URL" }), {
        status: 400,
      });
    }
    const problemId = problemDetails.contestId + "_" + problemDetails.index;
    let question;
    try {
      question = await prisma.userQuestions.create({
        data: {
          user: {
            connect: { id: userId },
          },
          bookmarked: true,
          createdAt: new Date(),
          verdict: "Unattempted",
          question: {
            connectOrCreate: {
              where: { id: problemId },
              create: {
                id: problemId,
                platform: "codeforces",
                name: problemDetails.name,
                link: `https://codeforces.com/problemset/problem/${problemDetails.contestId}/${problemDetails.index}`,
                rating: problemDetails.rating,
                tags: problemDetails.tags,
              },
            },
          },
        },
        include: {
          question: true,
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Question already exists" }),
        { status: 406 }
      );
    }
    return new Response(JSON.stringify({ question }), { status: 200 });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Error fetching question: ${err}` }),
      { status: 500 }
    );
  }
}
