"use client";

import { CodeforcesProblem, UserQuestion } from "@/types";
import { getRatingBadgeClass } from "@/utils/rating";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  Calendar,
  Award,
  Tag,
} from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "katex/dist/katex.min.css";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// import Editor from "@monaco-editor/react";
import Editor, { useMonaco } from "@monaco-editor/react";

export default function QuestionPage() {
  const monaco = useMonaco();

  const params = useParams();
  const router = useRouter();
  const questionId = params.questionId;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [question, setQuestion] = useState<UserQuestion>();
  const [formattedProblemStatement, setFormattedProblemStatement] =
    useState<CodeforcesProblem>();
  const [rawProblemStatement, setRawProblemStatement] =
    useState<CodeforcesProblem>();

  const [userCode, setUserCode] = useState<string>("");
  const [codeAnalysis, setCodeAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const [codeLanguage, setCodeLanguage] = useState<string>("javascript");

  const editorRef = useRef(null);

  const bookmarkToggle = async () => {
    if (!question) return;
    try {
      const response = await axios.patch(
        `/api/questions/${questionId}/bookmark`
      );
      if (response.status !== 200) {
        throw new Error(`Failed to toggle bookmark: ${response.status}`);
      }

      setQuestion((prev) => {
        if (!prev) return prev;
        return { ...prev, bookmarked: !prev.bookmarked };
      });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const handleCodeAnalysis = async (code: string) => {
    if (!question) return;

    try {
      setIsAnalyzing(true);
      const response = await axios.post(`/api/code-analyze`, {
        question: JSON.stringify(rawProblemStatement),
        code: code,
      });
      if (response.status !== 200) {
        throw new Error(`Failed to analyze code: ${response.status}`);
      }

      setCodeAnalysis(response.data.analysis);
    } catch (error) {
      console.error("Error analyzing code:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    const colors: Record<string, string> = {
      OK: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      WRONG_ANSWER: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      TIME_LIMIT_EXCEEDED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      RUNTIME_ERROR: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      COMPILATION_ERROR: "bg-red-500/10 text-red-400 border-red-500/20",
      MEMORY_LIMIT_EXCEEDED:
        "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return (
      colors[verdict] ||
      "bg-neutral-900/50 text-neutral-400 border-neutral-700/50"
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function getQuestion() {
      try {
        const res = await axios.get(`/api/questions/${questionId}`);
        if (res.status != 200) {
          throw new Error(`Error getting question details: ${questionId}`);
        }

        setQuestion(res.data.question);

        const rawString = res.data.question.question.problemStatement;
        const problemStatement = JSON.parse(rawString);

        const problemFormatted: CodeforcesProblem = {
          title: problemStatement.titleFormatted,
          timeLimit: problemStatement.timeLimit,
          memoryLimit: problemStatement.memoryLimit,
          statement: problemStatement.problemStatementFormatted,
          inputStatement: problemStatement.inputStatementFormatted,
          outputStatement: problemStatement.outputStatementFormatted,
          examples: problemStatement.examplesFormatted,
          note: problemStatement.noteFormatted,
        };
        const problemRaw: CodeforcesProblem = {
          title: problemStatement.titleRaw,
          timeLimit: problemStatement.timeLimit,
          memoryLimit: problemStatement.memoryLimit,
          statement: problemStatement.problemStatementRaw,
          inputStatement: problemStatement.inputStatementRaw,
          outputStatement: problemStatement.outputStatementRaw,
          examples: problemStatement.examplesRaw,
          note: problemStatement.noteRaw,
        };

        setFormattedProblemStatement(problemFormatted);
        setRawProblemStatement(problemRaw);
      } catch (err) {
        console.log(`Error fetching question: ${err}`);
      }
    }
    if (!questionId) return;
    async function run() {
      setIsLoading(true);
      try {
        await getQuestion();
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    run();
  }, [questionId]);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
  }

  function handleEditorChange(value, event) {
    // console.log("here is the current model value:", value);
    setUserCode(value || "");
  }

  if (!questionId) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] bg-black">
        <div className="w-20 flex flex-col items-center justify-start pt-8 border-r border-white/10"></div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full">
            <Card className="w-full max-w-md border-white/10 bg-neutral-950 text-white shadow-none">
              <CardContent className="p-8">
                <p className="text-rose-400 text-lg text-center">Invalid URL</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] bg-black max-h-full">
        <div className="w-20 flex flex-col items-center justify-start pt-8 border-r border-white/10"></div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-start justify-center min-h-full">
            <div className="w-full max-w-2xl px-4 sm:px-8 py-8">
              <div className="space-y-6">
                <Skeleton className="h-10 w-32 bg-white/5 rounded-lg" />
                <Card className="border-white/10 bg-neutral-950 text-white shadow-none">
                  <CardHeader>
                    <Skeleton className="h-8 w-3/4 bg-white/10 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 bg-white/10 rounded-lg" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-32 w-full bg-white/10 rounded-lg" />
                    <Skeleton className="h-24 w-full bg-white/10 rounded-lg" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] bg-black">
        <div className="w-20 flex flex-col items-center justify-start pt-8 border-r border-white/10"></div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full">
            <Card className="w-full max-w-md border-white/10 bg-neutral-950 text-white shadow-none">
              <CardContent className="p-8">
                <p className="text-neutral-400 text-lg text-center">
                  Question not found
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black">
      <div className="w-20 flex flex-col items-center justify-start pt-8 border-r border-white/10">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="text-neutral-400 hover:text-white hover:bg-white/10 transition-colors duration-150 ease-linear"
          title="Back to Dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center min-h-full py-8 space-y-6">
          <div className="w-full max-w-2xl px-4 sm:px-8">
            <Card className="overflow-hidden border-white/10 bg-neutral-950 text-white shadow-none">
              <CardHeader className="space-y-4 border-b border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        variant="outline"
                        className="capitalize bg-white/5 text-neutral-300 border-white/10 text-sm"
                      >
                        {question.question?.platform}
                      </Badge>
                      {question.question?.rating && (
                        <Badge
                          variant="outline"
                          className={`${getRatingBadgeClass(
                            Number(question.question.rating)
                          )} text-sm`}
                        >
                          <Award className="h-3 w-3 mr-1.5" />
                          {question.question.rating}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl text-white leading-tight font-semibold">
                      {question.question?.name}
                    </CardTitle>
                    <CardDescription className="text-neutral-400 text-sm sm:text-base">
                      Problem ID:{" "}
                      <span className="text-neutral-300 font-mono">
                        {question.question?.id}
                      </span>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={bookmarkToggle}
                    className={`shrink-0 transition-colors duration-150 ease-linear ${
                      question.bookmarked
                        ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                        : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                    }`}
                  >
                    <Bookmark
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      fill={question.bookmarked ? "currentColor" : "none"}
                    />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-6 bg-white/20 rounded-full" />
                    <h3 className="text-xs sm:text-sm uppercase font-semibold tracking-widest text-neutral-400">
                      Submission Verdict
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getVerdictColor(
                      question.verdict
                    )} text-base px-4 py-2 font-medium border`}
                  >
                    {question.verdict.replace(/_/g, " ")}
                  </Badge>
                </div>
                <Separator className="bg-white/10" />
                {question.question?.tags &&
                  question.question.tags.length > 0 && (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-6 bg-white/20 rounded-full" />
                          <h3 className="text-xs sm:text-sm uppercase font-semibold tracking-widest text-neutral-400">
                            Problem Tags
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {question.question.tags.map(
                            (tag: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="bg-white/5 text-neutral-300 border-white/10 text-xs sm:text-sm px-3 py-1 hover:bg-white/10 transition-colors"
                              >
                                <Tag className="h-3 w-3 mr-1.5" />
                                {tag}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                      <Separator className="bg-white/10" />
                    </>
                  )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Calendar className="h-4 w-4" />
                      <p className="text-xs sm:text-sm uppercase font-semibold tracking-widest">
                        Attempted On
                      </p>
                    </div>
                    <p className="text-lg sm:text-xl text-white font-medium">
                      {new Date(question.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <ExternalLink className="h-4 w-4" />
                      <p className="text-xs sm:text-sm uppercase font-semibold tracking-widest">
                        Problem Link
                      </p>
                    </div>
                    <Button
                      asChild
                      className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-colors duration-150 ease-linear"
                    >
                      <a
                        href={question.question?.link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open on {question.question?.platform}
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="w-full px-4 sm:px-8">
            <Card className="overflow-hidden border-white/10 bg-neutral-950 text-white shadow-none">
              <CardHeader className="border-b border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-2xl text-white font-semibold">
                    Description
                  </CardTitle>
                  {formattedProblemStatement && (
                    <div className="flex items-center gap-4 text-sm">
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-md"
                      >
                        Time-Limit: {formattedProblemStatement.timeLimit}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-md"
                      >
                        Memory-Limit: {formattedProblemStatement.memoryLimit}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-neutral-300 space-y-8 leading-relaxed">
                  {formattedProblemStatement ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-2">
                          <div className="h-1 w-6 bg-emerald-500/50 rounded-full" />
                          <h3 className="text-lg font-semibold text-white uppercase tracking-wide">
                            Problem Statement
                          </h3>
                        </div>
                        <div
                          className="prose prose-invert max-w-none pl-4 border-l-2 border-white/10"
                          dangerouslySetInnerHTML={{
                            __html: formattedProblemStatement.statement || "",
                          }}
                        />
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-2">
                          <div className="h-1 w-6 bg-blue-500/50 rounded-full" />
                          <h3 className="text-lg font-semibold text-white uppercase tracking-wide">
                            Input
                          </h3>
                        </div>
                        <div
                          className="prose prose-invert max-w-none pl-4 border-l-2 border-white/10"
                          dangerouslySetInnerHTML={{
                            __html:
                              formattedProblemStatement.inputStatement || "",
                          }}
                        />
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-2">
                          <div className="h-1 w-6 bg-amber-500/50 rounded-full" />
                          <h3 className="text-lg font-semibold text-white uppercase tracking-wide">
                            Output
                          </h3>
                        </div>
                        <div
                          className="prose prose-invert max-w-none pl-4 border-l-2 border-white/10"
                          dangerouslySetInnerHTML={{
                            __html:
                              formattedProblemStatement.outputStatement || "",
                          }}
                        />
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-2">
                          <div className="h-1 w-6 bg-purple-500/50 rounded-full" />
                          <h3 className="text-lg font-semibold text-white uppercase tracking-wide">
                            Examples
                          </h3>
                        </div>
                        <div
                          className="prose prose-invert max-w-none pl-4"
                          dangerouslySetInnerHTML={{
                            __html: formattedProblemStatement.examples || "",
                          }}
                        />
                      </div>
                      {formattedProblemStatement.note && (
                        <>
                          <Separator className="bg-white/10" />
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-2">
                              <div className="h-1 w-6 bg-rose-500/50 rounded-full" />
                              <h3 className="text-lg font-semibold text-white uppercase tracking-wide">
                                Note
                              </h3>
                            </div>
                            <div
                              className="prose prose-invert max-w-none pl-4 border-l-2 border-white/10"
                              dangerouslySetInnerHTML={{
                                __html: formattedProblemStatement.note || "",
                              }}
                            />
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <p>Loading problem details</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Code Analyzer and Analysis Cards - Side by Side with Fixed Height */}
          <div className="w-full px-4 sm:px-8">
            <div className="flex flex-col md:flex-row gap-6 md:h-200">
              {/* Code Analyzer Card */}
              <div className="w-full md:flex-4">
                <Card className="flex flex-col border-white/10 bg-neutral-950 text-white h-full">
                  <CardHeader className="border-b border-white/10">
                    <div className="w-full h-full flex justify-between">
                      <CardTitle className="text-2xl text-white font-semibold">
                        Code Analyzer
                      </CardTitle>
                      <CardAction>
                        <Select
                          onValueChange={(value) => setCodeLanguage(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="javascript" />
                          </SelectTrigger>
                          <SelectContent position="popper" align="end">
                            <SelectGroup>
                              {/* <SelectLabel>Fruits</SelectLabel> */}
                              <SelectItem value="cpp">C++</SelectItem>
                              <SelectItem value="python">Python</SelectItem>
                              <SelectItem value="java">Java</SelectItem>
                              <SelectItem value="javascript">
                                Javascript
                              </SelectItem>
                              <SelectItem value="typescript">
                                Typescript
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </CardAction>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col pt-6 space-y-4">
                    {/* <textarea
                      className="flex-1 w-full bg-neutral-900 border border-white/10 rounded-lg p-4 text-neutral-300 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors overflow-y-auto"
                      placeholder="Paste your code here for analysis..."
                      value={userCode}
                      onChange={(e) => setUserCode(e.target.value)}
                    /> */}
                    <Editor
                      // height="90vh"
                      // className="flex-1 w-full bg-neutral-900 border border-white/10 rounded-lg"
                      height="100%"
                      defaultLanguage="javascript"
                      language={codeLanguage}
                      defaultValue="// write your solution"
                      theme="vs-dark"
                      onMount={handleEditorDidMount}
                      onChange={handleEditorChange}
                    />
                    <div className="flex justify-end shrink-0">
                      <Button
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8 py-2 transition-colors"
                        onClick={() => handleCodeAnalysis(userCode)}
                      >
                        Analyze
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analysis Card */}
              <div className="w-full md:flex-[3] md:min-w-0">
                <Card className="flex flex-col overflow-hidden border-white/10 bg-neutral-950 text-white shadow-none h-full">
                  <CardHeader className="border-b border-white/10 shrink-0">
                    <CardTitle className="text-2xl text-white font-semibold">
                      Analysis
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-y-auto p-6 max-h-full">
                    <div
                      className="h-full overflow-y-auto pr-2 prose prose-invert max-w-none prose-pre:whitespace-pre-wrap prose-pre:break-words prose-code:break-words text-neutral-400"
                      style={{ overflowY: "auto", maxHeight: "100%" }}
                    >
                      {isAnalyzing ? (
                        <p className="text-neutral-500 text-lg">
                          Analyzing your code...
                        </p>
                      ) : (
                        <div className="h-full overflow-y-auto pr-2 prose prose-invert max-w-none prose-pre:whitespace-pre-wrap prose-pre:break-words prose-code:break-words text-neutral-400">
                          <Markdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[
                              [rehypeKatex, { output: "html", strict: false }],
                            ]}
                            components={{
                              code: ({ children }) => (
                                <code className="bg-gray-800/60 px-1 rounded text-gray-300 font-mono before:content-none after:content-none before:hidden after:hidden">
                                  {children}
                                </code>
                              ),
                              pre: ({ children }) => (
                                <pre className="bg-gray-800 rounded text-gray-300">
                                  {children}
                                </pre>
                              ),
                              span: ({
                                className = "",
                                children,
                                ...props
                              }) => {
                                const classList = className.split(/\s+/);
                                const isRootKatex =
                                  classList.includes("katex") &&
                                  !classList.some((c) =>
                                    c.startsWith("katex-")
                                  );
                                if (isRootKatex) {
                                  return (
                                    <code className="bg-gray-900/50 px-1 rounded text-gray-300 mx-0.5 inline-block before:content-none after:content-none before:hidden after:hidden">
                                      <span className={className} {...props}>
                                        {children}
                                      </span>
                                    </code>
                                  );
                                }
                                return (
                                  <span className={className} {...props}>
                                    {children}
                                  </span>
                                );
                              },
                            }}
                          >
                            {codeAnalysis ||
                              "Paste your code and click Analyze to see suggestions here."}
                          </Markdown>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
