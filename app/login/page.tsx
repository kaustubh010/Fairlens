"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loginWithGoogle } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7] dark:bg-black">
      <Header />
      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md bg-white dark:bg-[#1d1d1f] rounded-2xl shadow-[0_5px_30px_rgba(0,0,0,0.12)] p-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-2">
            Sign in to FairLens
          </h1>
          <p className="text-[#1d1d1f]/70 dark:text-white/70 text-sm mb-8">
            Access your AI bias audits and history.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-medium text-[#1d1d1f]/80 dark:text-white/80 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f5f5f7] dark:bg-[#272729] border-none rounded-xl px-4 py-3 text-[#1d1d1f] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
                placeholder="name@company.com"
                required
              />
            </div>
            <div className="text-left">
              <label className="block text-sm font-medium text-[#1d1d1f]/80 dark:text-white/80 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f5f5f7] dark:bg-[#272729] border-none rounded-xl px-4 py-3 text-[#1d1d1f] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-[17px] font-normal bg-[#0071e3] hover:bg-[#0071e3]/90 text-white rounded-xl mt-6 transition-all"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="h-[1px] flex-1 bg-[#1d1d1f]/10 dark:bg-white/10"></div>
            <span className="text-xs text-[#1d1d1f]/50 dark:text-white/50 font-medium uppercase tracking-wider">
              or
            </span>
            <div className="h-[1px] flex-1 bg-[#1d1d1f]/10 dark:bg-white/10"></div>
          </div>

          <Button
            onClick={() => loginWithGoogle()}
            variant="outline"
            className="w-full h-12 text-[17px] font-normal border-[#1d1d1f]/10 dark:border-white/10 bg-white dark:bg-[#1d1d1f] hover:bg-[#f5f5f7] dark:hover:bg-[#272729] text-[#1d1d1f] dark:text-white rounded-xl mt-6 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="mt-8 flex flex-col gap-3">
            <p className="text-sm text-[#1d1d1f]/70 dark:text-white/70">
              Don't have an ID?{" "}
              <Link
                href="/signup"
                className="text-[#0066cc] dark:text-[#2997ff] hover:underline"
              >
                Create yours now.
              </Link>
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center text-sm text-[#0066cc] dark:text-[#2997ff] hover:underline"
            >
              Back to Home <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
