import {
  codeforcesDescriptionFormat,
  codeforcesInputFormat,
} from "./cf-formatter";
import { CodeforcesProblem } from "@/types";

import puppeteer from "puppeteer";
// import puppeteer from "puppeteer-extra";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";
// puppeteer.use(StealthPlugin());

const getUpSolveQuestionsFromContest = async (handle: string) => {
  // const browser = await puppeteer.launch({
  //   headless: true,
  //   args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  // });
  const browser = await puppeteer.launch({
    headless: false,
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
    );

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    const userUrl = `https://codeforces.com/contests/with/${handle}`;
    await page.goto(userUrl, { waitUntil: "domcontentloaded", timeout: 0 });

    await page.waitForSelector(".user-contests-table");

    const contestLinks = await page.evaluate(() => {
      const rows = document.querySelectorAll(
        ".user-contests-table > tbody > tr > td:nth-child(4) > a"
      );
      return Array.from(rows as NodeListOf<HTMLAnchorElement>).map(
        (rank) => rank.href
      );
    });

    browser.close();
    // console.log(contestLinks);
    const out = [];
    for (const contestLink of contestLinks) {
      const contestId = contestLink.split("/")?.at(-4);

      const res = await fetch(
        `https://codeforces.com/api/contest.standings?contestId=${contestId}&handles=${handle}&showUnofficial=true`
      );

      const resJson = await res.json();

      if (resJson.status !== "OK") {
        console.log(`Failed to fetch standings for contest ${contestId}`);
        break;
      }

      const allProblems = resJson.result.problems.map(
        (p) => `${contestId}_${p.index}`
      );
      // console.log(resJson.result.rows[0]);
      const problemRes = resJson.result.rows?.at(0)?.problemResults;
      if (!problemRes) {
        console.error(`No problem results for contest ${contestId}`);
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
            const id = allProblems[i];
            toSolve = toSolve.filter((i) => i !== id);
          }
        }
      }
      out.push(...toSolve);
      await new Promise((res) => setTimeout(res, 2000));
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
  // console.log("Upsolve List:", JSON.stringify(out, null, 2));
};

const getQuestionInfo = async (url: string) => {
  const browser = await puppeteer.launch({
    // headless: true,
    headless: false,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
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

  console.log(problemDetails);
  return problemDetails;
};

export { getQuestionInfo, getUpSolveQuestionsFromContest };
