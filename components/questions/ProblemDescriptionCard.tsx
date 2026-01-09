"use client";

import { CodeforcesProblem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProblemDescriptionCardProps {
  problemStatement: CodeforcesProblem;
}

export default function ProblemDescriptionCard({
  problemStatement,
}: ProblemDescriptionCardProps) {
  return (
    <Card className="overflow-hidden border-white/10 bg-neutral-950 text-white shadow-none">
      <CardHeader className="border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-2xl text-white font-semibold">
            Description
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-md"
            >
              Time-Limit: {problemStatement.timeLimit}
            </Badge>
            <Badge
              variant="outline"
              className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-md"
            >
              Memory-Limit: {problemStatement.memoryLimit}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-neutral-300 space-y-8 leading-relaxed">
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
                __html: problemStatement.statement || "",
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
                __html: problemStatement.inputStatement || "",
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
                __html: problemStatement.outputStatement || "",
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
                __html: problemStatement.examples || "",
              }}
            />
          </div>
          {problemStatement.note && (
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
                    __html: problemStatement.note || "",
                  }}
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
