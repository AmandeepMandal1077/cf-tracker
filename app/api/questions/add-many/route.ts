import prisma from "@/lib/prisma";
import { Question } from "@/types";
// import { getUserFaultySubmissions } from "@/lib/req-cf";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const faultySubs = body.questions;
    console.log("Faulty submissions fetched");

    if (!faultySubs) {
      return new Response("No faulty submissions found", { status: 404 });
    }

    faultySubs.sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds);
    const problemMap: Map<string, boolean> = new Map<string, boolean>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const faultySubsData: Question[] = [];

    faultySubs.forEach(async (sub) => {
      const problemId: string = sub.problem.contestId + "_" + sub.problem.index;
      if (problemMap.has(problemId)) {
        return;
      }
      problemMap.set(problemId, true);

      const obj = {
        id: problemId,
        platform: "codeforces",
        name: sub.problem.name,
        link: `https://codeforces.com/problemset/problem/${sub.problem.contestId}/${sub.problem.index}`,
        rating: sub.problem.rating,
        tags: sub.problem.tags,
        verdict: sub.verdict,
        createdAt: new Date(),
        userId: userId,
      };

      if (obj.verdict !== "OK") {
        faultySubsData.push(obj);
      } else {
        try {
          await prisma.userQuestions.delete({
            where: { userId_questionId: { userId, questionId: problemId } },
          });
        } catch (err) {}
      }
    });

    console.log(faultySubsData);

    const questionBankData = faultySubsData.map((item) => ({
      id: item.id,
      platform: item.platform,
      name: item.name,
      link: item.link,
      rating: item.rating,
      tags: item.tags,
    }));

    // TODO: update QuestionBank with faultySubsData
    await prisma.questionBank.createMany({
      data: questionBankData,
      skipDuplicates: true,
    });

    // TODO: sync with QuestionBank
    const userQuestionsData = faultySubsData.map((item) => ({
      userId: item.userId,
      questionId: item.id,
      bookmarked: false,
      createdAt: new Date(),
      verdict: item.verdict,
    }));

    await prisma.userQuestions.createMany({
      data: userQuestionsData,
      skipDuplicates: true,
    });
    return new Response("Faulty submissions added", { status: 200 });
  } catch (err: any) {
    console.error("Error in add-many:", err);
    const status = err?.status || err?.response?.status || 500;
    const detail =
      err?.response?.data?.comment || err?.response?.data || err?.message;
    const body = {
      error: "Failed to fetch faulty submissions",
      detail,
    };
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
