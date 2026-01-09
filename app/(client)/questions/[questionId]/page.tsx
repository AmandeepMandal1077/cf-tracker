"use client";

import { CodeforcesProblem, UserQuestion } from "@/types";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ProblemInfoCard from "@/components/questions/ProblemInfoCard";
import ProblemDescriptionCard from "@/components/questions/ProblemDescriptionCard";
import CodeAnalyzerCard from "@/components/questions/CodeAnalyzerCard";
import AnalysisCard from "@/components/questions/AnalysisCard";

export default function QuestionPage() {
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
            <ProblemInfoCard
              question={question}
              onBookmarkToggle={bookmarkToggle}
            />
          </div>

          <div className="w-full px-4 sm:px-8">
            {formattedProblemStatement ? (
              <ProblemDescriptionCard
                problemStatement={formattedProblemStatement}
              />
            ) : (
              <Card className="overflow-hidden border-white/10 bg-neutral-950 text-white shadow-none">
                <CardContent className="pt-6">
                  <p className="text-neutral-300">Loading problem details...</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Code Analyzer and Analysis Cards - Side by Side with Fixed Height */}
          <div className="w-full px-4 sm:px-8">
            <div className="flex flex-col md:flex-row gap-6 md:h-200">
              <div className="w-full md:flex-4">
                <CodeAnalyzerCard
                  userCode={userCode}
                  codeLanguage={codeLanguage}
                  onCodeChange={(value) => setUserCode(value || "")}
                  onLanguageChange={setCodeLanguage}
                  onAnalyze={handleCodeAnalysis}
                />
              </div>
              <div className="w-full md:flex-[3] md:min-w-0">
                <AnalysisCard
                  codeAnalysis={codeAnalysis}
                  isAnalyzing={isAnalyzing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
