"use client";

import * as React from "react";
import { useSignUp, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import axios from "axios";
import AuthShell from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function Page() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useUser();
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [userHandle, setUserHandle] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [verifyingSubmit, setVerifyingSubmit] = React.useState(false);
  const [error, setError] = React.useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await axios.get(
        `https://codeforces.com/api/user.info?handles=${userHandle}&checkHistoricHandles=true`
      );
      if (res.status !== 200 || res.data?.status !== "OK") {
        throw new Error(`Could not find User Handle`);
      }

      // Create sign-up and use the returned object for subsequent calls
      await signUp.create({
        emailAddress,
        password,
        unsafeMetadata: { userHandle },
      });

      // Use the returned signUpAttempt object to prepare verification
      // This ensures we're using the fresh object, not a stale reference
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setVerifying(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      // Handle specific errors
      if (err.message && err.message.includes("User Handle")) {
        setError("Invalid Codeforces handle. Please check and try again.");
      } else if (err.errors && err.errors.length > 0) {
        const errorMessage = err.errors[0].message;
        if (errorMessage.includes("email") && errorMessage.includes("taken")) {
          setError("This email is already registered. Please sign in instead.");
        } else if (errorMessage.includes("password")) {
          setError("Password must be at least 8 characters long.");
        } else {
          setError(errorMessage);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setVerifyingSubmit(true);
    setError("");
    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (signUpAttempt.status === "complete") {
        await setActive({
          session: signUpAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              router.push("/sign-up/tasks");
              return;
            }
            router.push("/");
          },
        });
      } else {
        console.error("Sign-up attempt not complete:", signUpAttempt);
        setError("Verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      if (err.errors && err.errors.length > 0) {
        setError(
          err.errors[0].message ||
            "Invalid verification code. Please try again."
        );
      } else {
        setError("Invalid verification code. Please try again.");
      }
    } finally {
      setVerifyingSubmit(false);
    }
  };

  if (isSignedIn) {
    router.push("/");
    return null;
  }
  if (verifying) {
    return (
      <AuthShell>
        <CardHeader className="px-6">
          <CardTitle className="text-xl">Verify your email</CardTitle>
          <CardDescription className="text-white/60">
            Enter the 6-digit code sent to your inbox.
          </CardDescription>
        </CardHeader>
        {error && (
          <div className="px-6 py-3 mx-6 mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleVerify} className="mt-2 space-y-4">
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
              required
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
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription className="text-white/60">
          Solid, quiet, and fast — no distractions.
        </CardDescription>
      </CardHeader>
      {error && (
        <div className="px-6 py-3 mx-6 mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="mt-2 space-y-5">
        <div className="space-y-2">
          <label htmlFor="userhandle" className="text-sm text-white/70">
            Codeforces handle
          </label>
          <Input
            id="userhandle"
            name="userhandle"
            value={userHandle}
            onChange={(e) => setUserHandle(e.target.value)}
            placeholder="Codeforces handle"
            className="bg-black"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm text-white/70">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            name="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="you@example.com"
            className="bg-black"
            required
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
            required
          />
        </div>

        {/* Clerk bot protection container */}
        <div id="clerk-captcha" />

        <Button
          type="submit"
          className="w-full bg-white/90 text-black hover:bg-white transition-colors duration-150 ease-linear"
          disabled={submitting}
        >
          {submitting ? "Continuing…" : "Continue"}
        </Button>

        <div className="text-sm text-white/60">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-white hover:text-white/90 transition-colors duration-150 ease-linear"
          >
            Sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
