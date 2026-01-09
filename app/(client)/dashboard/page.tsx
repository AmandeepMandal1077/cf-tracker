"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ratelimiter } from "@/lib/rate-limiter";
import { UserQuestion } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import QuestionCard from "@/components/questions/QuestionCard";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

const MAX_PER_PAGE_QUESTION = 9;
export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useUser();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<UserQuestion[]>([]);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

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
      const response = await axios.get(`/api/questions?page=${pageNumber}`);
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
      const response = await axios.get(`/api/questions?page=${pageNumber}`);
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

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      toast.loading("Syncing submissions...");
      await getUserQuestions();
      const response = await axios.get(`/api/questions/?page=${pageNumber}`);
      if (response.status !== 200) {
        throw new Error(
          `Failed to fetch questions after sync: ${response.status}`
        );
      }
      setQuestions(response.data.questions);
      setTotalQuestions(response.data.totalQuestions);
      setPageNumber(1);

      toast.dismiss();
      toast.success("Synced successfully!");
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to sync. Please try again.");
      console.error("Error syncing questions:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [pageNumber]);

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
        // await getUserQuestions();
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
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-neutral-600 hover:bg-neutral-700 text-white shrink-0"
                size="icon"
                aria-label="Sync submissions"
              >
                <RefreshCcw className="h-4 w-4" />
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
            <QuestionCard
              key={q.question?.id}
              question={q}
              onBookmarkToggle={bookmarkToggle}
              onRemove={handleQuestionRemove}
            />
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
