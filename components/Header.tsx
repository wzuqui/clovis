'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export default function Header({ user }: { user: User | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <a href="/" className="text-2xl font-bold text-white hover:text-purple-300 transition-colors">
            Clóvis
          </a>
          <span className="text-xs bg-purple-600/80 text-purple-100 px-2 py-0.5 rounded-full font-medium">
            beta
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-gray-400 text-sm hidden sm:block truncate max-w-[200px]">
                {user.user_metadata?.full_name || user.user_metadata?.name || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
              >
                Sair
              </button>
            </>
          ) : (
            <a
              href="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
            >
              Entrar
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
