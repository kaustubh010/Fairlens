'use client';

import Link from 'next/link';
import { Eye, FileText, BarChart3, Settings, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function Header({ onReset }: { onReset?: () => void }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-[rgba(0,0,0,0.8)] backdrop-blur-md backdrop-saturate-[180%] border-b border-white/10">
      <div className="container mx-auto">
        <div className="flex h-12 items-center justify-between px-4 lg:px-8 max-w-[1024px] mx-auto">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80" onClick={(e) => {
              if (onReset) {
                e.preventDefault();
                onReset();
              }
            }}>
              <Eye className="h-5 w-5 text-white/90" />
              <span className="text-[17px] font-semibold text-white/90 tracking-tight">FairLens</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" onClick={(e) => {
                if (onReset) {
                  e.preventDefault();
                  onReset();
                }
              }} className="text-[12px] text-white/80 hover:text-white transition-colors">
                Overview
              </Link>
              <Link href="/dashboard" className="text-[12px] text-white/80 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/?action=upload" className="text-[12px] text-white/80 hover:text-white transition-colors">
                Audit
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-xs text-white/70 hidden sm:inline-block">Hello, {user.name}</span>
                <button 
                  onClick={() => logout()}
                  className="text-[12px] text-white/80 hover:text-white transition-colors px-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-[12px] text-white/80 hover:text-white transition-colors px-2">
                  Sign In
                </Link>
                <Link href="/signup" className="text-[12px] text-white/80 hover:text-white transition-colors px-2">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
