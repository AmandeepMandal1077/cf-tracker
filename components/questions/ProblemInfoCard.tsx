"use client";

import { UserQuestion } from "@/types";
import { getRatingBadgeClass } from "@/utils/rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bookmark, ExternalLink, Calendar, Award, Tag } from "lucide-react";

interface ProblemInfoCardProps {
  question: UserQuestion;
  onBookmarkToggle: () => void;
}

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

export default function ProblemInfoCard({
  question,
  onBookmarkToggle,
}: ProblemInfoCardProps) {
  return (
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
            onClick={onBookmarkToggle}
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
        {question.question?.tags && question.question.tags.length > 0 && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-1 w-6 bg-white/20 rounded-full" />
                <h3 className="text-xs sm:text-sm uppercase font-semibold tracking-widest text-neutral-400">
                  Problem Tags
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {question.question.tags.map((tag: string, idx: number) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-white/5 text-neutral-300 border-white/10 text-xs sm:text-sm px-3 py-1 hover:bg-white/10 transition-colors"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-neutral-400">
              <Calendar className="h-4 w-4" />
              <p className="text-xs sm:text-sm uppercase font-semibold tracking-widest">
                Attempted On
              </p>
            </div>
            <p className="text-lg sm:text-xl text-white font-medium">
              {new Date(question.createdAt).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
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
  );
}
