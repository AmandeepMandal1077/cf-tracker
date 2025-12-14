import { auth } from "@clerk/nextjs/server";
import { ratelimiter } from "./rate-limiter";
import axios from "axios";
import prisma from "./prisma";

export async function getUsrInfo() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userHandle: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const userHandle = user.userHandle;
  if (!userHandle) {
    throw new Error("User handle not set");
  }
  if (ratelimiter.empty()) {
    const result = await ratelimiter.schedule(async () => {
      try {
        const response = await axios.get(
          `https://codeforces.com/api/user.info?handles=${encodeURIComponent(
            userHandle
          )}`
        );

        if (response.data.status !== "OK") {
          const msg = `Codeforces returned non-OK status: ${response.data.status}`;
          console.error(msg, response.data);
          throw new Error(msg);
        }
        return response.data.result[0];
      } catch (err: any) {
        if (err.response) {
          console.error(
            "Codeforces API error:",
            err.response.status,
            err.response.data
          );
          const detail =
            err.response.data?.comment || JSON.stringify(err.response.data);
          throw new Error(
            `Codeforces user.info failed (${err.response.status}): ${detail}`
          );
        } else {
          console.error("Error fetching user info from Codeforces:", err);
        }
        throw err;
      }
    });

    return result;
  } else {
    console.log("Rate limiter in effect, skipping API call");
  }
}

export async function getUserSubmissions() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userHandle: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const userHandle = user.userHandle;

  if (!userHandle) {
    throw new Error("User handle not set");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let faultySubs: any[] = [];
  if (ratelimiter.empty()) {
    faultySubs = await ratelimiter.schedule(async () => {
      try {
        const response = await axios.get(
          `https://codeforces.com/api/user.status?handle=${encodeURIComponent(
            userHandle
          )}`
        );

        if (response.data.status !== "OK") {
          const msg = `Codeforces returned non-OK status for user.status: ${response.data.status}`;
          console.error(msg, response.data);
          throw new Error(msg);
        }

        return response.data.result;
      } catch (err: any) {
        if (err.response) {
          console.error(
            "Codeforces API error (user.status):",
            err.response.status,
            err.response.data
          );
          const detail =
            err.response.data?.comment || JSON.stringify(err.response.data);
          throw new Error(
            `Codeforces user.status failed (${err.response.status}): ${detail}`
          );
        } else {
          console.error(
            "Error fetching user submissions from Codeforces:",
            err
          );
        }
        throw err;
      }
    });
  } else {
    console.log("Rate limiter in effect, skipping API call");
  }

  return faultySubs;
}

export async function fetchQuestionDetailsViaURL(questionUrl: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  let problemId: { contestId: string; index: string };
  const segs = questionUrl.split("/");
  if (segs.length < 1 || segs[2] !== "codeforces.com") {
    throw new Error("Invalid question URL");
  }

  if (segs.includes("problemset")) {
    problemId = {
      contestId: segs[segs.length - 2],
      index: segs[segs.length - 1],
    };
  } else if (segs.includes("contest")) {
    problemId = {
      contestId: segs[segs.length - 3],
      index: segs[segs.length - 1],
    };
  } else {
    throw new Error("Invalid question URL");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let questionDetails: any = {};
  if (ratelimiter.empty()) {
    await ratelimiter.schedule(async () => {
      try {
        const response = await axios.get(
          `https://codeforces.com/api/contest.standings?contestId=${problemId.contestId}&count=1`
        );

        if (response.data.status != "OK") {
          throw new Error("Error fetching problem info from Codeforces");
        }

        const problems = response.data.result.problems;
        for (const problem of problems) {
          if (problem.index === problemId.index) {
            questionDetails = problem;
            break;
          }
        }
      } catch (err) {
        console.error("Error fetching problem info from Codeforces:", err);
        throw err;
      }
    });
  } else {
    console.log("Rate limiter in effect, skipping API call");
  }
  return questionDetails;
}

export async function getQuestionDetails(questionId: string) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const question = await prisma.userQuestions.findUnique({
      where: { userId_questionId: { userId, questionId } },
      include: {
        question: true,
      },
    });

    if (!question) {
      return new Response("Question not found", { status: 404 });
    }

    return new Response(JSON.stringify(question), { status: 200 });
  } catch (err) {
    console.error("Error fetching question details:", err);
    return new Response(`Error fetching question: ${err}`, { status: 500 });
  }
}
