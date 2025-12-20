import prisma from "@/lib/prisma";
import { CodeforcesProblem } from "@/types";
import { codeforcesDescriptionFormat } from "@/utils/cf-formatter";
import { auth } from "@clerk/nextjs/server";

import puppeteer from "puppeteer";
// import puppeteer from "puppeteer-extra";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";

// puppeteer.use(StealthPlugin());

const scrape = async (url: string) => {
  console.log("called");
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setJavaScriptEnabled(false);
  await page.goto(url, { waitUntil: "networkidle2" });

  await page.waitForSelector(".problem-statement", { timeout: 30000 });

  const result = await page.evaluate(() => {
    const problem = document.querySelector(".problem-statement");
    if (!problem) throw new Error("Problem statement not found");
    const fullStatement = Array.from(problem.children).map(
      (child) => (child as HTMLElement).innerText
    );
    return fullStatement;
  });

  if (!result || result.length < 4) {
    throw new Error(
      `Unexpected DOM structure: got ${
        result?.length || 0
      } elements instead of at least 4`
    );
  }

  if (result[4]) {
    result[4] = result[4]
      .replaceAll("input\nCopy", "input\n")
      .replaceAll("output\nCopy", "output\n");
  }

  let [metadata, problem, input, output, examples, note] = result;

  if (!metadata) {
    throw new Error("Metadata element not found");
  }

  let [title, timeLimit, memoryLimit] = metadata.split("\n");
  timeLimit = timeLimit?.replace("time limit per test", "").trim() || "";
  memoryLimit = memoryLimit?.replace("memory limit per test", "").trim() || "";

  input = input?.replace("Input", "").trim() || "";
  output = output?.replace("Output", "").trim() || "";
  examples = examples?.replace("Example\n", "").trim() || "";
  examples = examples?.replace("Examples\n", "").trim() || "";
  note = note?.replace("Note\n", "").trim() || "";

  const obj: CodeforcesProblem = {
    title,
    timeLimit,
    memoryLimit,
    statement: problem,
    inputStatement: input,
    outputStatement: output,
    examples,
    note,
  };

  for (const key in obj) {
    const typedKey = key as keyof CodeforcesProblem;
    if (obj[typedKey]) {
      obj[typedKey] = obj[typedKey]!.trim();
      obj[typedKey] = obj[typedKey]!.replaceAll("\n\n", "\n");
    }
  }

  await page.close();
  await browser.close();

  // Apply formatting on the server side
  const problemDetails = {
    titleRaw: obj.title,
    titleFormatted: codeforcesDescriptionFormat(obj.title),
    timeLimit: obj.timeLimit,
    memoryLimit: obj.memoryLimit,
    problemStatementRaw: obj.statement,
    problemStatementFormatted: codeforcesDescriptionFormat(obj.statement),
    inputStatementRaw: obj.inputStatement,
    inputStatementFormatted: codeforcesDescriptionFormat(obj.inputStatement),
    outputStatementRaw: obj.outputStatement,
    outputStatementFormatted: codeforcesDescriptionFormat(obj.outputStatement),
    examplesRaw: obj.examples,
    examplesFormatted: codeforcesDescriptionFormat(obj.examples),
    noteRaw: obj.note,
    noteFormatted: codeforcesDescriptionFormat(obj.note),
  };

  console.log(problemDetails);
  return problemDetails;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { questionId } = await params;
  const url = `https://codeforces.com/problemset/problem/${questionId.replace(
    "_",
    "/"
  )}`;

  //Need optimization
  try {
    let question = await prisma.userQuestions.findUnique({
      where: { userId_questionId: { userId, questionId } },
      include: {
        question: true,
      },
    });

    if (!question) {
      return new Response("no question", { status: 500 });
    }

    if (!question?.question.problemStatement) {
      const problemDetails = await scrape(url);
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

    return new Response(JSON.stringify({ question }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(`Error fetching question: ${err}`, { status: 500 });
  }
}
