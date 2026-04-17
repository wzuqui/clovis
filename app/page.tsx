'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import PostForm from '@/components/PostForm';
import Timeline from '@/components/Timeline';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [timelineKey, setTimelineKey] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => { setUser(user); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--ink-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
      <span className="blink">▸</span>&nbsp;inicializando...
    </div>
  );

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  return (
    <div className="app">
      <div className="grid-bg" />
      <Header user={user} />

      <div className="hero">
        <h1 className="hero-title">O que o Clóvis Code fez pra te surpreender hoje?</h1>
        <p className="hero-sub">
          registre aqui — um log coletivo de pequenas maravilhas e pequenos desastres com o Claude Code.
        </p>
      </div>

      <main className="main">
        {user ? (
          <PostForm onSuccess={() => setTimelineKey(k => k + 1)} userName={displayName} />
        ) : (
          <div className="gate">
            <p className="gate-text">&gt; identifique-se para registrar sua experiência</p>
            <a href="/login" className="publish-btn" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              entrar →
            </a>
          </div>
        )}

        <Timeline key={timelineKey} currentUserId={user?.id} />
      </main>

      <footer className="foot">
        <span>clovis v2.0</span>
        <span className="foot-sep">·</span>
        <span>feito com 🧡 por quem também se surpreende</span>
      </footer>
    </div>
  );
}
