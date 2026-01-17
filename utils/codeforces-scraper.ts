import {
  codeforcesDescriptionFormat,
  codeforcesInputFormat,
} from "./cf-formatter";
import { CodeforcesProblem } from "@/types";

import chromium from "@sparticuz/chromium";
import puppeteerCore from "puppeteer-core";

// Get Chrome executable path based on environment
const getExecutablePath = async () => {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    return await chromium.executablePath();
  }

  // Local development - try common Chrome paths
  const possiblePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.CHROME_PATH || "",
  ];

  for (const path of possiblePaths) {
    if (path) {
      try {
        const fs = await import("fs");
        if (fs.existsSync(path)) {
          return path;
        }
      } catch {
        continue;
      }
    }
  }

  // Fallback to chromium
  try {
    return await chromium.executablePath();
  } catch {
    return null;
  }
};

const launchBrowser = async () => {
  const isProd = process.env.NODE_ENV === "production";

  const executablePath = await getExecutablePath();

  if (!executablePath) {
    throw new Error("No browser executable found");
  }

  const options = {
    args: isProd
      ? chromium.args
      : [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-blink-features=AutomationControlled",
        ],
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: true,
    ignoreHTTPSErrors: true,
  };

  return await puppeteerCore.launch(options);
};

const getUpSolveQuestionsFromContest = async (handle: string) => {
  const browser = await launchBrowser();
  // const browser = await puppeteer.launch({
  //   headless: false,
  // });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    );

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    const userUrl = `https://codeforces.com/contests/with/${handle}`;
    await page.goto(userUrl, { waitUntil: "domcontentloaded", timeout: 0 });

    await page.waitForSelector(".user-contests-table");

    const contestLinks = await page.evaluate(() => {
      const rows = document.querySelectorAll(
        ".user-contests-table > tbody > tr > td:nth-child(4) > a",
      );
      return Array.from(rows as NodeListOf<HTMLAnchorElement>).map(
        (rank) => rank.href,
      );
    });

    await browser.close();
    const out = [];
    for (const contestLink of contestLinks) {
      try {
        const contestId = contestLink.split("/")?.at(-4);
        const res = await fetch(
          `https://codeforces.com/api/contest.standings?contestId=${contestId!}&handles=${handle}&showUnofficial=true`,
        );

        const resJson = await res.json();

        if (resJson.status !== "OK") {
          console.error(`Failed to fetch standings for contest ${contestId}`);
          break;
        }

        // const allProblems = resJson.result.problems.map(
        //   (p) => `${contestId}_${p.index}`
        // );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allProblems = resJson.result.problems.map((p: any) => {
          return {
            questionId: `${contestId}_${p.index}`,
            verdict: "Unattempted",
            bookmarked: false,
            createdAt: new Date(p.creationTimeSeconds * 1000),
            question: {
              rating: parseInt(p.rating) || null,
              name: p.name,
              tags: p.tags || [],
              link: `https://codeforces.com/problemset/problem/${contestId}/${p.index}`,
            },
          };
        });
        const problemRes = resJson.result.rows?.at(0)?.problemResults;
        if (!problemRes) {
          console.warn(`No problem results for contest ${contestId}`);
          continue;
        }
        let solvedFound = false;
        let toSolve = [];
        for (let i = problemRes.length - 1; i >= 0; --i) {
          if (problemRes[i].points > 0 && solvedFound === false) {
            solvedFound = true;
            if (i + 1 < problemRes.length) {
              toSolve.push(allProblems[i + 1]);
            }
          } else if (solvedFound && problemRes[i].points === 0) {
            toSolve.push(allProblems[i]);
          }
        }

        const upSolved = resJson.result.rows?.at(1)?.problemResults;
        if (upSolved) {
          for (let i = upSolved.length - 1; i >= 0; --i) {
            if (upSolved[i].points > 0) {
              const id = allProblems[i].questionId;
              toSolve = toSolve.filter((q) => q.questionId !== id);
            }
          }
        }
        out.push(...toSolve);
        await new Promise((res) => setTimeout(res, 2000));
      } catch (error) {
        console.error(`Error processing contest ${contestLink}:`, error);
      }
    }

    return out;
  } catch (err) {
    console.error("Error in getUpSolveQuestionsFromContest:", err);
    return [];
  } finally {
    if (browser.connected) {
      await browser.close();
    }
  }
};

const getQuestionInfo = async (url: string) => {
  const browser = await launchBrowser();

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  );

  await page.setJavaScriptEnabled(false);
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
          document.createTextNode("$$$^" + el.textContent + "$$$"),
        );
      });

      child.querySelectorAll(".lower-index").forEach((el) => {
        el.replaceWith(
          document.createTextNode("$$$_" + el.textContent + "$$$"),
        );
      });

      child.querySelectorAll("img").forEach((el) => {
        el.classList.add("bg-white");
      });

      if (index == 1 || index == 5) {
        child
          .querySelectorAll(".MathJax, .MathJax_Preview, .section-title")
          .forEach((el) => el.remove());
        return child.innerHTML;
      }
      return (child as HTMLElement).innerText;
    });
    return fullStatement;
  });

  if (!result || result.length < 4) {
    throw new Error(
      `Unexpected DOM structure: got ${
        result?.length || 0
      } elements instead of at least 4`,
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

  return problemDetails;
};

export { getQuestionInfo, getUpSolveQuestionsFromContest };
