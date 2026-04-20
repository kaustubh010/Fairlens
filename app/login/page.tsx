import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7] dark:bg-black">
      <Header />
      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md bg-white dark:bg-[#1d1d1f] rounded-2xl shadow-[0_5px_30px_rgba(0,0,0,0.12)] p-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-2">Sign in to FairLens</h1>
          <p className="text-[#1d1d1f]/70 dark:text-white/70 text-sm mb-8">
            Access your AI bias audits and history.
          </p>
          
          <div className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-medium text-[#1d1d1f]/80 dark:text-white/80 mb-2">Email Address</label>
              <input 
                type="email" 
                className="w-full bg-[#f5f5f7] dark:bg-[#272729] border-none rounded-xl px-4 py-3 text-[#1d1d1f] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
                placeholder="name@company.com"
              />
            </div>
            <div className="text-left">
              <label className="block text-sm font-medium text-[#1d1d1f]/80 dark:text-white/80 mb-2">Password</label>
              <input 
                type="password" 
                className="w-full bg-[#f5f5f7] dark:bg-[#272729] border-none rounded-xl px-4 py-3 text-[#1d1d1f] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
                placeholder="••••••••"
              />
            </div>
            
            <Button className="w-full h-12 text-[17px] font-normal bg-[#0071e3] hover:bg-[#0071e3]/90 text-white rounded-xl mt-6 transition-all">
              Sign In
            </Button>
            
            <div className="mt-6 flex flex-col gap-3">
              <p className="text-sm text-[#1d1d1f]/70 dark:text-white/70">
                Don't have an Apple ID? <Link href="/signup" className="text-[#0066cc] dark:text-[#2997ff] hover:underline">Create yours now.</Link>
              </p>
              <Link href="/" className="inline-flex items-center justify-center text-sm text-[#0066cc] dark:text-[#2997ff] hover:underline">
                Back to Home <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
