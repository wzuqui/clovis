'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Terminal, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function Header({ user }: { user: User | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'anon';

  return (
    <header className="topbar">
      <div className="brand">
        <Terminal size={18} />
        <div className="brand-text">
          <span className="brand-name">CLÓVIS</span>
          <span className="brand-sub">// experiências com o Claude Code</span>
        </div>
      </div>

      {user ? (
        <div className="user-chip">
          <span className="chip-dot" />
          <span>@{displayName}</span>
          <button className="logout-btn" onClick={handleLogout} title="sair">
            <LogOut size={13} />
          </button>
        </div>
      ) : (
        <a href="/login" className="user-chip" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <span className="chip-dot" style={{ background: '#6b6254', boxShadow: 'none' }} />
          <span>entrar</span>
        </a>
      )}
    </header>
  );
}
