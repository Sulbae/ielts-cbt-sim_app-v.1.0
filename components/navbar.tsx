'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { BookOpenCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <BookOpenCheck className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-lg tracking-tight text-gray-900">IELTS Simulator</span>
            </Link>
            
            {user && (
              <div className="hidden md:flex ml-8 space-x-1">
                <Link href="/writing">
                  <button className={`px-3 py-1.5 text-sm rounded-md ${pathname.startsWith('/writing') ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}>Writing Task 2</button>
                </Link>
                <Link href="/speaking">
                  <button className={`px-3 py-1.5 text-sm rounded-md ${pathname.startsWith('/speaking') ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}>Speaking Part 2</button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!loading && (
              user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 hidden sm:inline-block">
                    {user.displayName || user.email}
                  </span>
                  <button className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50" onClick={logout}>
                    Sign Out
                  </button>
                </div>
              ) : (
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700" onClick={signInWithGoogle}>
                  Sign In with Google
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
