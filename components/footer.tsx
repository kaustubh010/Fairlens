import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#f5f5f7] dark:bg-[#1d1d1f] py-12 border-t border-border mt-auto">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="max-w-xs">
            <h3 className="text-lg font-semibold mb-4 text-[#1d1d1f] dark:text-white">FairLens</h3>
            <p className="text-sm text-[#1d1d1f]/70 dark:text-white/70">
              See the bias before it sees people. Detect, measure, and remediate algorithmic discrimination.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h4 className="font-semibold mb-4 text-[#1d1d1f] dark:text-white">Product</h4>
              <ul className="space-y-2 text-sm text-[#1d1d1f]/70 dark:text-white/70">
                <li><Link href="/?action=upload" className="hover:underline">Start Audit</Link></li>
                <li><Link href="#" className="hover:underline">Documentation</Link></li>
                <li><Link href="#" className="hover:underline">Metrics Explained</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#1d1d1f] dark:text-white">Company</h4>
              <ul className="space-y-2 text-sm text-[#1d1d1f]/70 dark:text-white/70">
                <li><Link href="#" className="hover:underline">About</Link></li>
                <li><Link href="#" className="hover:underline">Privacy</Link></li>
                <li><Link href="#" className="hover:underline">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-black/10 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#1d1d1f]/50 dark:text-white/50">
            &copy; {new Date().getFullYear()} FairLens Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-[#1d1d1f]/50 dark:text-white/50">
            <Link href="#" className="hover:text-black dark:hover:text-white transition-colors">Privacy Policy</Link>
            <span>|</span>
            <Link href="#" className="hover:text-black dark:hover:text-white transition-colors">Terms of Use</Link>
            <span>|</span>
            <Link href="#" className="hover:text-black dark:hover:text-white transition-colors">Legal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
