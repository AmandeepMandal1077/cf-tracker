"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Editor from "@monaco-editor/react";

interface CodeAnalyzerCardProps {
  userCode: string;
  codeLanguage: string;
  onCodeChange: (value: string | undefined) => void;
  onLanguageChange: (value: string) => void;
  onAnalyze: (code: string) => void;
}

export default function CodeAnalyzerCard({
  userCode,
  codeLanguage,
  onCodeChange,
  onLanguageChange,
  onAnalyze,
}: CodeAnalyzerCardProps) {
  const editorRef = useRef(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
  }

  function handleEditorChange(value: string | undefined) {
    onCodeChange(value);
  }

  return (
    <Card className="flex flex-col border-white/10 bg-neutral-950 text-white h-full">
      <CardHeader className="border-b border-white/10">
        <div className="w-full h-full flex justify-between">
          <CardTitle className="text-2xl text-white font-semibold">
            Code Analyzer
          </CardTitle>
          <CardAction>
            <Select onValueChange={onLanguageChange}>
              <SelectTrigger>
                <SelectValue placeholder="javascript" />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                <SelectGroup>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="javascript">Javascript</SelectItem>
                  <SelectItem value="typescript">Typescript</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-6 space-y-4">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={codeLanguage}
          options={{
            minimap: {
              enabled: false,
            },
          }}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
        />
        <div className="flex justify-end shrink-0">
          <Button
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8 py-2 transition-colors"
            onClick={() => onAnalyze(userCode)}
          >
            Analyze
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
