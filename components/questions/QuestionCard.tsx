"use client";

import { UserQuestion } from "@/types";
import { getRatingBadgeClass } from "@/utils/rating";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, ExternalLink, Eye, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useAppSelector } from "@/lib/hooks";
import { selectIsQuestionDeleting } from "@/lib/features/questions/questionSlice";

interface QuestionCardProps {
  question: UserQuestion;
  onBookmarkToggle: (questionId: string) => void;
  onRemove: (questionId: string) => void;
}

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

export default function QuestionCard({
  question: q,
  onBookmarkToggle,
  onRemove,
}: QuestionCardProps) {
  const router = useRouter();
  const isDeleting = useAppSelector((state) =>
    selectIsQuestionDeleting(state, q.questionId),
  );

  return (
    <Card className="border-white/10 bg-neutral-950 text-white shadow-none hover:border-white/20 transition-colors duration-150 ease-linear relative">
      {isDeleting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-lg">
          <Spinner className="h-8 w-8 text-white" />
        </div>
      )}
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg text-white line-clamp-2 leading-tight">
            {q.question?.name}
          </CardTitle>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => q.question?.id && onBookmarkToggle(q.question.id)}
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
              onClick={() => q.question?.id && onRemove(q.question.id)}
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
                Number(q.question.rating),
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
            className={`${getVerdictColor(q.verdict)} text-xs font-medium`}
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
              {q.question.tags.slice(0, 3).map((tag: string, idx: number) => (
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
              q.question?.id && router.push(`/questions/${q.question.id}`)
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
  );
}
