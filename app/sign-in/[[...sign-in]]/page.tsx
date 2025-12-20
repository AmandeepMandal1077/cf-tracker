"use client";

import * as React from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { EmailCodeFactor } from "@clerk/types";
import AuthShell from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [showEmailCode, setShowEmailCode] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [verifyingSubmit, setVerifyingSubmit] = React.useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (!isLoaded) return;

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === "complete") {
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) console.log(session?.currentTask);
            router.push("/");
          },
        });
      } else if (signInAttempt.status === "needs_second_factor") {
        // Check if email_code is a valid second factor
        // This is required when Client Trust is enabled and the user
        // is signing in from a new device.
        // See https://clerk.com/docs/guides/secure/client-trust
        const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
          (factor): factor is EmailCodeFactor =>
            factor.strategy === "email_code"
        );

        if (emailCodeFactor) {
          await signIn.prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor.emailAddressId,
          });
          setShowEmailCode(true);
        }
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setSubmitting(false);
    }
  };
  const handleEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingSubmit(true);
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code,
      });

      if (signInAttempt.status === "complete") {
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) console.log(session?.currentTask);
            router.push("/");
          },
        });
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setVerifyingSubmit(false);
    }
  };

  if (showEmailCode) {
    return (
      <AuthShell>
        <CardHeader className="px-6">
          <CardTitle className="text-xl">Verify your email</CardTitle>
          <CardDescription className="text-white/60">
            Enter the 6-digit code sent to your inbox.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleEmailCode} className="mt-2 space-y-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm text-white/70">
              Verification code
            </label>
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              id="code"
              name="code"
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="bg-black"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-white/90 text-black hover:bg-white transition-colors duration-150 ease-linear"
            disabled={verifyingSubmit}
          >
            {verifyingSubmit ? "Verifying…" : "Verify"}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <CardHeader className="px-6">
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription className="text-white/60">
          Solid, quiet, and fast — no distractions.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="mt-2 space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm text-white/70">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="bg-black"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm text-white/70">
            Password
          </label>
          <Input
            id="password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-black"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-white/90 text-black hover:bg-white transition-colors duration-150 ease-linear"
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Continue"}
        </Button>

        <div className="text-sm text-white/60">
          {"Don't have an account?"}{" "}
          <Link
            href="/sign-up"
            className="text-white hover:text-white/90 transition-colors duration-150 ease-linear"
          >
            Sign up
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
