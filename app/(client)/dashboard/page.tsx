"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ratelimiter } from "@/lib/rate-limiter";
import { UserQuestion } from "@/types";
import { getRatingBadgeClass } from "@/utils/rating";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Bookmark, ExternalLink, Eye, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppShell from "@/components/layouts/app-shell";
import { toast } from "sonner";

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

const MAX_PER_PAGE_QUESTION = 2;
export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<UserQuestion[]>([]);

  const [newQuestionLink, setNewQuestionLink] = useState<string>();
  const [isAddingQuestion, setIsAdding] = useState<boolean>(false);
  const [pageNumber, setPageNumber] = useState<number>(1);

  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const totalPages = Math.ceil(totalQuestions / MAX_PER_PAGE_QUESTION);

  const handleQuestionRemove = useCallback(async (questionId: string) => {
    try {
      const res = await axios.delete(`/api/questions/${questionId}/remove`);

      if (res.status !== 200) {
        throw new Error("Error removing question");
      }

      toast.success("Question removed successfully!");

      // Refetch questions to update UI
      const response = await axios.get("/api/questions");
      if (response.status === 200) {
        setQuestions(response.data.questions);
      }

      return true;
    } catch (err) {
      toast.error("Failed to remove question. Please try again.");
      throw new Error("Error removing question");
    }
  }, []);

  const handleQuestionAdd = useCallback(async () => {
    setIsAdding(true);
    try {
      toast.loading("Adding question...");

      const res = await axios.put(`/api/questions/add`, {
        questionUrl: newQuestionLink,
      });

      if (res.status !== 200) {
        throw new Error("Error adding new question");
      }

      toast.dismiss();
      toast.success("Question added successfully!");
      setNewQuestionLink("");

      // Refetch questions to update UI
      const response = await axios.get("/api/questions");
      if (response.status === 200) {
        setQuestions(response.data.questions);
      }

      return true;
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to add question. Please try again.");
      throw new Error("Error adding new question");
    } finally {
      setIsAdding(false);
    }
  }, [newQuestionLink]);

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
        //fetch all questions of current page
        const response = await axios.get(`/api/questions/?page=${pageNumber}`);
        if (response.status !== 200) {
          throw new Error(`Failed to fetch questions: ${response.status}`);
        }
        setQuestions(response.data.questions);
        setTotalQuestions(response.data.totalQuestions);
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
  }, [isLoaded, isSignedIn, pageNumber, setPageNumber]);

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
    return (
      colors[verdict] ||
      "bg-neutral-900/50 text-neutral-400 border-neutral-700/50"
    );
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 bg-white/5 rounded-lg" />
            <Skeleton className="h-6 w-96 bg-white/5 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card
                key={i}
                className="border-white/10 bg-neutral-950 text-white shadow-none"
              >
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 bg-white/10 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 bg-white/10 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full bg-white/10 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Problem Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Enter problem URL..."
                value={newQuestionLink}
                onChange={(e) => setNewQuestionLink(e.target.value)}
                className="w-80"
              />
              <Button
                onClick={handleQuestionAdd}
                disabled={isAddingQuestion || !newQuestionLink}
                className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-neutral-400">
            Track your progress across {questions.length} problems
          </p>
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questions.map((q) => (
            <Card
              key={q.question?.id}
              className="border-white/10 bg-neutral-950 text-white shadow-none hover:border-white/20 transition-colors duration-150 ease-linear"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg text-white line-clamp-2 leading-tight">
                    {q.question?.name}
                  </CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        q.question?.id && bookmarkToggle(q.question.id)
                      }
                      className={`transition-colors ${
                        q.bookmarked
                          ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                          : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                      }`}
                    >
                      <Bookmark
                        className="h-5 w-5"
                        fill={q.bookmarked ? "currentColor" : "none"}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        q.question?.id && handleQuestionRemove(q.question.id)
                      }
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className="capitalize bg-white/5 text-neutral-300 border-white/10 text-xs sm:text-sm"
                  >
                    {q.question?.platform}
                  </Badge>
                  {q.question?.rating && (
                    <Badge
                      variant="outline"
                      className={`${getRatingBadgeClass(
                        Number(q.question.rating)
                      )} text-xs sm:text-sm`}
                    >
                      {q.question.rating}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Verdict */}
                <div className="space-y-2">
                  <p className="text-xs text-neutral-400 uppercase font-semibold tracking-widest">
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
                    <p className="text-xs text-neutral-400 uppercase font-semibold tracking-widest">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {q.question.tags
                        .slice(0, 3)
                        .map((tag: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10 transition-colors"
                          >
                            {tag}
                          </Badge>
                        ))}
                      {q.question.tags.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-white/5 text-neutral-400 border-white/10"
                        >
                          +{q.question.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div className="space-y-1">
                  <p className="text-xs text-neutral-400 uppercase font-semibold tracking-widest">
                    Attempted
                  </p>
                  <p className="text-sm text-neutral-300">
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
                    className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-colors"
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

        {/* pagination */}
        {totalPages <= 5 ? (
          <div>
            <Pagination>
              <PaginationContent>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (i) => (
                    <PaginationItem key={i}>
                      <PaginationLink href="#" onClick={() => setPageNumber(i)}>
                        {i}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
              </PaginationContent>
            </Pagination>
          </div>
        ) : (
          <div>
            <Pagination>
              <PaginationContent>
                {/* previous page */}
                {pageNumber > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={() => setPageNumber(pageNumber - 1)}
                    ></PaginationPrevious>
                  </PaginationItem>
                )}
                {/* 1st page */}
                <PaginationItem>
                  <PaginationLink href="#" onClick={() => setPageNumber(1)}>
                    1
                  </PaginationLink>
                </PaginationItem>

                {pageNumber > 3 ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem>
                    <PaginationLink href="#" onClick={() => setPageNumber(2)}>
                      2
                    </PaginationLink>
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={() =>
                      setPageNumber(
                        Math.min(totalPages - 3, Math.max(3, pageNumber))
                      )
                    }
                  >
                    {Math.min(totalPages - 3, Math.max(3, pageNumber))}
                  </PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={() =>
                      setPageNumber(
                        Math.min(totalPages - 2, Math.max(4, pageNumber + 1))
                      )
                    }
                  >
                    {Math.min(totalPages - 2, Math.max(4, pageNumber + 1))}
                  </PaginationLink>
                </PaginationItem>

                {pageNumber < totalPages - 2 ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={() => setPageNumber(totalPages - 1)}
                    >
                      {totalPages - 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink onClick={() => setPageNumber(totalPages)}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
                {/* next page */}
                {pageNumber < totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      // href="#"
                      className="cursor-pointer"
                      onClick={() =>
                        setPageNumber((prev) => Math.min(totalPages, prev + 1))
                      }
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Empty State */}
        {questions.length === 0 && (
          <Card className="border-white/10 bg-neutral-950 text-white shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-neutral-400 text-lg">
                No questions found. Start solving problems on Codeforces!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
