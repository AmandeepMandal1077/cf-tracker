"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "katex/dist/katex.min.css";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface AnalysisCardProps {
  codeAnalysis: string;
  isAnalyzing: boolean;
}

export default function AnalysisCard({
  codeAnalysis,
  isAnalyzing,
}: AnalysisCardProps) {
  return (
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
          {isAnalyzing && !codeAnalysis ? (
            <p className="text-neutral-500 text-lg">Analyzing your code...</p>
          ) : (
            <div className="h-full overflow-y-auto pr-2 prose prose-invert max-w-none prose-pre:whitespace-pre-wrap prose-pre:break-words prose-code:break-words text-neutral-400">
              <Markdown
                remarkPlugins={
                  isAnalyzing ? [remarkGfm] : [remarkGfm, remarkMath]
                }
                rehypePlugins={
                  isAnalyzing
                    ? []
                    : [[rehypeKatex, { output: "html", strict: false }]]
                }
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
                  span: ({ className = "", children, ...props }) => {
                    const classList = className.split(/\s+/);
                    const isRootKatex =
                      classList.includes("katex") &&
                      !classList.some((c) => c.startsWith("katex-"));
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
  );
}
