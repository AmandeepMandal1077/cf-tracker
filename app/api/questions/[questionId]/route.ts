import prisma from "@/lib/prisma";
import { codeforcesDescriptionFormat } from "@/utils/cf-formatter";
import { auth } from "@clerk/nextjs/server";

// import puppeteer from "puppeteer-extra";
import puppeteer from "puppeteer";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";
// puppeteer.use(StealthPlugin());

const scrape = async (url: string) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Do not reference server-side code inside page.evaluate
  const raw = await page.evaluate(() => {
    const getTextContent = (elements: NodeListOf<Element>) => {
      const parts: string[] = [];
      elements.forEach((p) => {
        p.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = (node.textContent || "").trim();
            if (text) parts.push(text);
          } else if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as HTMLElement).tagName === "SCRIPT"
          ) {
            const el = node as HTMLScriptElement;
            const inner = (el.innerHTML || "").trim();
            const type = (el.getAttribute("type") || "").toLowerCase();
            if (type.startsWith("math/tex")) {
              const isDisplay = type.includes("mode=display");
              // Wrap MathJax content so remark-math can detect it
              parts.push(isDisplay ? `$$${inner}$$` : `$${inner}$`);
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            // For inline elements that may hold pure text (e.g., <span>) pick their text
            const text = (node.textContent || "").trim();
            if (text) parts.push(text);
          }
        });
        parts.push("\n");
      });

      // Join with single spaces to keep words separated
      return parts.join(" ");
    };

    const titleEl = document.querySelector(".title");
    const title = titleEl ? (titleEl as HTMLElement).innerHTML : "";

    const timeLimitEl = document.querySelector(".time-limit");
    const timeLimit =
      timeLimitEl && timeLimitEl.childNodes[1]
        ? (timeLimitEl.childNodes[1].textContent || "").trim()
        : "";

    const memoryLimitEl = document.querySelector(".memory-limit");
    const memoryLimit =
      memoryLimitEl && memoryLimitEl.childNodes[1]
        ? (memoryLimitEl.childNodes[1].textContent || "").trim()
        : "";

    const problemSpecification = document.querySelectorAll(
      ".problem-statement > :nth-child(2) p"
    );
    const problemStatement = getTextContent(problemSpecification);

    const inputSpecification = document.querySelectorAll(
      ".input-specification p"
    );
    const inputStatement = getTextContent(inputSpecification);

    const outputSpecification = document.querySelectorAll(
      ".output-specification p"
    );
    const outputStatement = getTextContent(outputSpecification);

    const inputTestSpecification = document.querySelectorAll(".input pre div");
    const outputTestSpecification =
      document.querySelectorAll(".output pre div");

    const inputTests: string[] = [];
    inputTestSpecification.forEach((test) => {
      inputTests.push((test.textContent || "").trim());
      inputTests.push("\n");
    });

    const outputTests: string[] = [];
    outputTestSpecification.forEach((test) => {
      outputTests.push((test.textContent || "").trim());
      outputTests.push("\n");
    });

    return {
      titleRaw: title,
      timeLimit,
      memoryLimit,
      problemStatementRaw: problemStatement,
      inputStatementRaw: inputStatement,
      outputStatementRaw: outputStatement,
      inputTests: inputTests.join(""),
      outputTests: outputTests.join(""),
    };
  });

  await browser.close();

  // Apply formatting on the server side
  const problemDetails = {
    titleRaw: raw.titleRaw,
    titleFormatted: await codeforcesDescriptionFormat(raw.titleRaw),
    timeLimit: raw.timeLimit,
    memoryLimit: raw.memoryLimit,
    problemStatementRaw: raw.problemStatementRaw,
    problemStatementFormatted: await codeforcesDescriptionFormat(
      raw.problemStatementRaw
    ),
    inputStatementRaw: raw.inputStatementRaw,
    inputStatementFormatted: await codeforcesDescriptionFormat(
      raw.inputStatementRaw
    ),
    outputStatementRaw: raw.outputStatementRaw,
    outputStatementFormatted: await codeforcesDescriptionFormat(
      raw.outputStatementRaw
    ),
    inputTests: codeforcesDescriptionFormat(raw.inputTests),
    outputTests: codeforcesDescriptionFormat(raw.outputTests),
  };

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
