"use client";

import axios from "axios";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { ratelimiter } from "@/lib/rate-limiter";
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
import { Plus, RefreshCcw, Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import AppShell from "@/components/layouts/app-shell";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { Spinner } from "@/components/ui/spinner";
import {
  addQuestionToStoreFront,
  markQuestionAsDeleting,
  removeQuestionFromStore,
  selectQuestions,
  setQuestionsInStore,
  toggleBookmarkInQuestion,
} from "@/lib/features/questions/questionSlice";
import { useAppSelector } from "@/lib/hooks";

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
        userHandle,
      )}`,
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

function DashboardContent() {
  const { isLoaded, isSignedIn } = useUser();
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageNumber = parseInt(searchParams.get("page") || "1", 10);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredQuestions, setFilteredQuestions] = useState<typeof questions>(
    [],
  );
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const totalPages = Math.ceil(totalQuestions / MAX_PER_PAGE_QUESTION);

  const [filteredTotalPages, setFilteredTotalPages] =
    useState<number>(totalPages);

  const questions = useAppSelector(selectQuestions);
  const [newQuestionLink, setNewQuestionLink] = useState<string>("");
  const [isAddingQuestion, setIsAdding] = useState<boolean>(false);

  const setPageNumber = (page: number) => {
    router.push(`/dashboard?page=${page}`);
  };

  const handleQuestionRemove = useCallback(
    async (questionId: string) => {
      try {
        dispatch(markQuestionAsDeleting(questionId));
        const res = await axios.delete(`/api/questions/${questionId}/remove`);

        if (res.status !== 200) {
          throw new Error("Error removing question");
        }

        toast.success("Question removed successfully!");
        dispatch(removeQuestionFromStore(questionId));
        setTotalQuestions((prev) => prev - 1);

        return true;
      } catch (err) {
        toast.error("Failed to remove question. Please try again.");
        throw new Error("Error removing question");
      }
    },
    [pageNumber, dispatch],
  );

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
      setTotalQuestions((prev) => prev + 1);
      setPageNumber(1);
      dispatch(addQuestionToStoreFront(res.data.question));

      return true;
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to add question. Please try again.");
      throw new Error("Error adding new question");
    } finally {
      setIsAdding(false);
    }
  }, [newQuestionLink, pageNumber, dispatch]);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      toast.loading("Syncing submissions...");
      await getUserQuestions();
      const response = await axios.get(`/api/questions/?page=${pageNumber}`);
      if (response.status !== 200) {
        throw new Error(
          `Failed to fetch questions after sync: ${response.status}`,
        );
      }
      dispatch(setQuestionsInStore(response.data.questions));
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
  }, [pageNumber, dispatch]);

  //searchQuery
  useEffect(() => {
    const id = setTimeout(() => {
      const filtered = questions.filter((q) => {
        return (
          q.question?.name
            .toLowerCase()
            .startsWith(searchQuery.toLowerCase()) || searchQuery === ""
        );
      });
      setFilteredQuestions(filtered);
      setFilteredTotalPages(Math.ceil(filtered.length / MAX_PER_PAGE_QUESTION));
      if (searchQuery !== "") {
        setPageNumber(1);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery, questions]);

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
        // setQuestions(response.data.questions);
        dispatch(setQuestionsInStore(response.data.questions));
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
  }, [isLoaded, isSignedIn, pageNumber]);

  const bookmarkToggle = async (questionId: string) => {
    dispatch(toggleBookmarkInQuestion(questionId));
    try {
      const response = await axios.patch(
        `api/questions/${questionId}/bookmark`,
      );
      if (response.status !== 200) {
        throw new Error(`Failed to toggle bookmark: ${response.status}`);
      }
    } catch (error) {
      dispatch(toggleBookmarkInQuestion(questionId));
      toast.error("Connection failed. Bookmark not saved.");
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
            {[...Array(9)].map((_, i) => (
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
      {isSyncing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            className="flex flex-col items-center gap-4 text-center"
            role="status"
            aria-live="assertive"
          >
            <Spinner className="h-12 w-12 text-white" />
            <div className="space-y-1">
              <p className="text-white text-lg font-semibold">
                Syncing questions
              </p>
              <p className="text-neutral-200">
                Please wait while we are syncing. Do not refresh the page.
              </p>
              <p className="text-neutral-200">This may take a few minutes</p>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Problem Dashboard
            </h1>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
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
              {totalQuestions > 0 && (
                <Button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="bg-neutral-600 hover:bg-neutral-700 text-white shrink-0"
                  size="icon"
                  aria-label="Sync submissions"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-neutral-400">
            Track your progress across {questions.length} problems
          </p>
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuestions
            .slice(
              (pageNumber - 1) * MAX_PER_PAGE_QUESTION,
              pageNumber * MAX_PER_PAGE_QUESTION,
            )
            .map((q) => (
              <QuestionCard
                key={q.question?.id}
                question={q}
                onBookmarkToggle={bookmarkToggle}
                onRemove={handleQuestionRemove}
              />
            ))}
        </div>

        {/* No filtered results */}
        {filteredQuestions.length === 0 && questions.length > 0 && (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <p className="text-neutral-400 text-xl">No questions found</p>
            <p className="text-neutral-500 text-sm">
              Try adjusting your search filters
            </p>
          </div>
        )}

        {/* pagination */}
        {filteredTotalPages <= 5 ? (
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
                {Array.from(
                  { length: filteredTotalPages },
                  (_, i) => i + 1,
                ).map((i) => (
                  <PaginationItem key={i}>
                    <PaginationLink href="#" onClick={() => setPageNumber(i)}>
                      {i}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {/* next page */}
                {pageNumber < filteredTotalPages && (
                  <PaginationItem>
                    <PaginationNext
                      // href="#"
                      className="cursor-pointer"
                      onClick={() =>
                        setPageNumber(
                          Math.min(filteredTotalPages, pageNumber + 1),
                        )
                      }
                    />
                  </PaginationItem>
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
                        Math.min(
                          filteredTotalPages - 3,
                          Math.max(3, pageNumber),
                        ),
                      )
                    }
                  >
                    {Math.min(filteredTotalPages - 3, Math.max(3, pageNumber))}
                  </PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={() =>
                      setPageNumber(
                        Math.min(
                          filteredTotalPages - 2,
                          Math.max(4, pageNumber + 1),
                        ),
                      )
                    }
                  >
                    {Math.min(
                      filteredTotalPages - 2,
                      Math.max(4, pageNumber + 1),
                    )}
                  </PaginationLink>
                </PaginationItem>

                {pageNumber < filteredTotalPages - 2 ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={() => setPageNumber(filteredTotalPages - 1)}
                    >
                      {filteredTotalPages - 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={() => setPageNumber(filteredTotalPages)}
                  >
                    {filteredTotalPages}
                  </PaginationLink>
                </PaginationItem>
                {/* next page */}
                {pageNumber < filteredTotalPages && (
                  <PaginationItem>
                    <PaginationNext
                      // href="#"
                      className="cursor-pointer"
                      onClick={() =>
                        setPageNumber(
                          Math.min(filteredTotalPages, pageNumber + 1),
                        )
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
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <p className="text-neutral-400 text-xl">No questions found</p>
            <div className="flex flex-col items-center gap-3">
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-white hover:bg-white/80 text-black px-8 py-6 text-lg"
              >
                <RefreshCcw className="h-5 w-5 mr-2" />
                Sync Now
              </Button>
              <p className="text-neutral-500 text-sm">
                Try Syncing to see new Questions
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="space-y-8">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64 bg-white/5 rounded-lg" />
              <Skeleton className="h-6 w-96 bg-white/5 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
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
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
