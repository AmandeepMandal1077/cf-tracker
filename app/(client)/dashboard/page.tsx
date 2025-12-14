"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ratelimiter } from "@/lib/rate-limiter";
import { UserQuestion } from "@/types";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, ExternalLink, Eye } from "lucide-react";

async function getUserQuestions() {
  try {
    if (!ratelimiter.empty()) {
      throw new Error("Rate Limited Client");
    }

    const res = await axios.get("api/user/handle");
    if (res.status !== 200) {
      throw new Error(`Failed to fetch user handle: ${res.status}`);
    }
    const { userHandle } = res.data;
    console.log("User handle:", res.data);
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

    const questions = response.data.result;
    await axios.post("/api/questions/add-many", {
      questions: questions,
    });
    return response.data.result;
  } catch (err) {
    console.error(`Error fetching user questions: ${err}`);
  }
}

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<UserQuestion[]>([]);

  // Only run API calls after Clerk user state is loaded and user is signed in
  useEffect(() => {
    setIsLoading(true);
    if (!isLoaded) return;
    if (!isSignedIn) {
      console.warn("User not signed in — skipping question fetch/add.");
      return;
    }
    async function fetchQuestions() {
      // setIsLoading(true);
      try {
        const response = await axios.get("/api/questions");
        if (response.status !== 200) {
          throw new Error(`Failed to fetch questions: ${response.status}`);
        }
        setQuestions(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    }
    const run = async () => {
      try {
        await getUserQuestions();
        await fetchQuestions();
      } catch (err) {
        console.warn("Error fetching questions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [isLoaded, isSignedIn]);

  const bookmarkToggle = async (questionId: string) => {
    try {
      const response = await axios.patch(
        `api/questions/${questionId}/bookmark`
      );
      if (response.status !== 200) {
        throw new Error(`Failed to toggle bookmark: ${response.status}`);
      }

      setQuestions((prevQuestions) => {
        if (!prevQuestions) return [];
        return prevQuestions.map((q) => {
          if (q.question?.id == questionId) {
            return { ...q, bookmarked: !q.bookmarked };
          }
          return q;
        });
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

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-8 py-8 scroll-smooth">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 bg-white/5" />
            <Skeleton className="h-6 w-96 bg-white/5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card
                key={i}
                className="bg-white/5 backdrop-blur-xl border-white/10"
              >
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 bg-white/10" />
                  <Skeleton className="h-4 w-1/2 bg-white/10" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full bg-white/10" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-8 py-8 scroll-smooth">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Problem Dashboard
          </h1>
          <p className="text-slate-400">
            Track your progress across {questions.length} problems
          </p>
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questions.map((q) => (
            <Card
              key={q.question?.id}
              className="group bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg text-white line-clamp-2 leading-tight">
                    {q.question?.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      q.question?.id && bookmarkToggle(q.question.id)
                    }
                    className={`shrink-0 ${
                      q.bookmarked
                        ? "text-yellow-400 hover:text-yellow-500"
                        : "text-slate-500 hover:text-slate-400"
                    }`}
                  >
                    <Bookmark
                      className="h-5 w-5"
                      fill={q.bookmarked ? "currentColor" : "none"}
                    />
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className="capitalize bg-blue-500/20 text-blue-400 border-blue-500/30"
                  >
                    {q.question?.platform}
                  </Badge>
                  {q.question?.rating && (
                    <Badge
                      variant="outline"
                      className={getRatingColor(Number(q.question.rating))}
                    >
                      {q.question.rating}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Verdict */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase font-semibold">
                    Verdict
                  </p>
                  <Badge
                    variant="outline"
                    className={`${getVerdictColor(
                      q.verdict
                    )} text-xs font-medium`}
                  >
                    {q.verdict.replace(/_/g, " ")}
                  </Badge>
                </div>

                {/* Tags */}
                {q.question?.tags && q.question.tags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 uppercase font-semibold">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {q.question.tags
                        .slice(0, 3)
                        .map((tag: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs bg-slate-800/50 text-slate-300 border-slate-700/50"
                          >
                            {tag}
                          </Badge>
                        ))}
                      {q.question.tags.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-slate-800/50 text-slate-400 border-slate-700/50"
                        >
                          +{q.question.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase font-semibold">
                    Attempted
                  </p>
                  <p className="text-sm text-slate-400">
                    {new Date(q.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      q.question?.id &&
                      router.push(`/questions/${q.question.id}`)
                    }
                    className="flex-1 bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 [&:hover]:text-blue-400"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 [&:hover]:text-emerald-400"
                  >
                    <a
                      href={q.question?.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Solve
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {questions.length === 0 && (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-slate-400 text-lg">
                No questions found. Start solving problems on Codeforces!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
