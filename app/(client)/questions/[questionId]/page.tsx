"use client";

import { UserQuestion } from "@/types";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default function QuestionPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.questionId;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [question, setQuestion] = useState<UserQuestion>();

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

  const getVerdictColor = (verdict: string) => {
    const colors: Record<string, string> = {
      OK: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      WRONG_ANSWER: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      TIME_LIMIT_EXCEEDED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      RUNTIME_ERROR: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      COMPILATION_ERROR: "bg-red-500/20 text-red-400 border-red-500/30",
      MEMORY_LIMIT_EXCEEDED:
        "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    return colors[verdict] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getRatingColor = (rating: number | null) => {
    if (!rating) return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    if (rating < 1200) return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    if (rating < 1400)
      return "bg-green-500/20 text-green-400 border-green-500/30";
    if (rating < 1600) return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    if (rating < 1900) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (rating < 2100)
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    if (rating < 2300)
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  useEffect(() => {
    async function getQuestion() {
      try {
        const res = await axios.get(`/api/questions/${questionId}`);
        if (res.status != 200) {
          throw new Error(`Error getting question details: ${questionId}`);
        }

        setQuestion(res.data.question);
      } catch (err) {
        console.error(`Error fetching question: ${err}`);
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
      <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center scroll-smooth">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-8">
            <p className="text-rose-400 text-lg">Invalid URL</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 px-8 py-8 scroll-smooth">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32 bg-white/5" />
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <Skeleton className="h-8 w-3/4 bg-white/10" />
              <Skeleton className="h-4 w-1/2 bg-white/10" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-32 w-full bg-white/10" />
              <Skeleton className="h-24 w-full bg-white/10" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center scroll-smooth">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-8">
            <p className="text-slate-400 text-lg">Question not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 px-8 py-8 scroll-smooth">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="text-slate-400 hover:text-white hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Main Card */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    variant="outline"
                    className="capitalize bg-blue-500/20 text-blue-400 border-blue-500/30"
                  >
                    {question.question?.platform}
                  </Badge>
                  {question.question?.rating && (
                    <Badge
                      variant="outline"
                      className={getRatingColor(
                        Number(question.question.rating)
                      )}
                    >
                      <Award className="h-3 w-3 mr-1" />
                      {question.question.rating}
                    </Badge>
                  )}
                  {!question.question?.rating && (
                    <Badge
                      variant="outline"
                      className="bg-gray-500/20 text-gray-400 border-gray-500/30"
                    >
                      Unrated
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-3xl text-white leading-tight">
                  {question.question?.name}
                </CardTitle>
                <CardDescription className="text-slate-400 text-base">
                  Problem ID: {question.question?.id}
                </CardDescription>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={bookmarkToggle}
                className={`shrink-0 ${
                  question.bookmarked
                    ? "text-yellow-400 hover:text-yellow-500"
                    : "text-slate-500 hover:text-slate-400"
                } hover:bg-white/5`}
              >
                <Bookmark
                  className="h-6 w-6"
                  fill={question.bookmarked ? "currentColor" : "none"}
                />
              </Button>
            </div>
          </CardHeader>

          <Separator className="bg-white/10" />

          <CardContent className="space-y-6 pt-6">
            {/* Verdict Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="h-5 w-1 bg-blue-500 rounded-full" />
                <h3 className="text-sm uppercase font-semibold tracking-wide">
                  Submission Verdict
                </h3>
              </div>
              <Badge
                variant="outline"
                className={`${getVerdictColor(
                  question.verdict
                )} text-base px-4 py-2 font-medium`}
              >
                {question.verdict.replace(/_/g, " ")}
              </Badge>
            </div>

            <Separator className="bg-white/10" />

            {/* Tags Section */}
            {question.question?.tags && question.question.tags.length > 0 && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="h-5 w-1 bg-purple-500 rounded-full" />
                    <h3 className="text-sm uppercase font-semibold tracking-wide">
                      Problem Tags
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {question.question.tags.map((tag: string, idx: number) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="bg-slate-800/50 text-slate-300 border-slate-700/50 text-sm px-3 py-1"
                      >
                        <Tag className="h-3 w-3 mr-1.5" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator className="bg-white/10" />
              </>
            )}

            {/* Metadata Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <p className="text-sm uppercase font-semibold tracking-wide">
                    Attempted On
                  </p>
                </div>
                <p className="text-lg text-white font-medium">
                  {new Date(question.createdAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-slate-400">
                  {new Date(question.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <ExternalLink className="h-4 w-4" />
                  <p className="text-sm uppercase font-semibold tracking-wide">
                    Problem Link
                  </p>
                </div>
                <Button
                  asChild
                  className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50"
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
    </div>
  );
}
