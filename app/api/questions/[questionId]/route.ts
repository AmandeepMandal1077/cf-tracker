import prisma from "@/lib/prisma";
import { CodeforcesProblem } from "@/types";
import {
  codeforcesDescriptionFormat,
  codeforcesInputFormat,
} from "@/utils/cf-formatter";
import { auth } from "@clerk/nextjs/server";

import puppeteer from "puppeteer";
// import puppeteer from "puppeteer-extra";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";

// puppeteer.use(StealthPlugin());

const scrape = async (url: string) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
  );

  // await page.setJavaScriptEnabled(false);
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  await page.goto(url, { waitUntil: ["domcontentloaded", "networkidle2"] });

  await page.waitForSelector(".problem-statement");

  const result = await page.evaluate(() => {
    const problem = document.querySelector(".problem-statement");
    if (!problem) throw new Error("Problem statement not found");
    const fullStatement = Array.from(problem.children).map((child, index) => {
      child.querySelectorAll(".upper-index").forEach((el) => {
        el.replaceWith(
          document.createTextNode("$$$^" + el.textContent + "$$$")
        );
      });

      child.querySelectorAll(".lower-index").forEach((el) => {
        el.replaceWith(
          document.createTextNode("$$$_" + el.textContent + "$$$")
        );
      });

      child.querySelectorAll("img").forEach((el) => {
        el.classList.add("bg-white");
      });

      if (index == 1 || index == 5) {
        // const statement = traverse(child);
        child
          .querySelectorAll(".MathJax, .MathJax_Preview, .section-title")
          .forEach((el) => el.remove());
        return child.innerHTML;
      }
      return (child as HTMLElement).innerText;
    });
    // console.log(fullStatement);
    return fullStatement;

    // const fullStatement: Array<string> = traverse(problem);
    // return fullStatement;
  });

  if (!result || result.length < 4) {
    throw new Error(
      `Unexpected DOM structure: got ${
        result?.length || 0
      } elements instead of at least 4`
    );
  }

  // console.log(result);

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
    examplesFormatted: codeforcesInputFormat(obj.examples),
    noteRaw: obj.note,
    noteFormatted: codeforcesDescriptionFormat(obj.note),
  };

  // console.log(problemDetails);
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
      let problemDetails: any;
      try {
        problemDetails = await scrape(url);
      } catch (err) {
        return new Response(`Error scraping question: ${err}`, {
          status: 500,
        });
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

    return new Response(JSON.stringify({ question }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(`Error fetching question: ${err}`, { status: 500 });
  }
}
