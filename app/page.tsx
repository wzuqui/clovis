'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';
import Header from '@/components/Header';
import PostForm from '@/components/PostForm';
import Timeline from '@/components/Timeline';
import ApprovalGate from '@/components/ApprovalGate';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [timelineKey, setTimelineKey] = useState(0);

  const fetchProfile = async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data as Profile | null);
  };

  useEffect(() => {
    const supabase = createClient();

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) await fetchProfile(user.id);
      } catch {
        // auth ou profile falhou — segue sem crash
      } finally {
        setLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await fetchProfile(u.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--ink-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
      <span className="blink">▸</span>&nbsp;inicializando...
    </div>
  );

  // Logged in but not approved
  if (user && profile && !profile.is_approved) {
    return <ApprovalGate onLogout={handleLogout} />;
  }

  const displayName = profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';
  const isAdmin = user?.email === 'willianluiszuqui@gmail.com';

  return (
    <div className="app">
      <div className="grid-bg" />
      <Header user={user} isAdmin={isAdmin} />

      <div className="hero">
        <h1 className="hero-title">O que o Clóvis Code fez pra te surpreender hoje?</h1>
        <p className="hero-sub">
          registre aqui — um log coletivo de pequenas maravilhas e pequenos desastres com o Claude Code.
        </p>
      </div>

      <main className="main">
        {user && profile?.is_approved ? (
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
