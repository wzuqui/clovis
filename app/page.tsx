'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';
import Header from '@/components/Header';
import PostForm from '@/components/PostForm';
import Timeline from '@/components/Timeline';
import ApprovalGate from '@/components/ApprovalGate';
import ReactionsChart from '@/components/ReactionsChart';
import SentimentChart from '@/components/SentimentChart';
import EditProfileModal from '@/components/EditProfileModal';
import Lightbox from '@/components/Lightbox';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [timelineKey, setTimelineKey] = useState(0);
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Timeout de segurança — nunca fica travado
    const timeout = setTimeout(() => setLoading(false), 5000);

    const loadUser = async (u: User | null) => {
      try {
        setUser(u);
        if (u) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', u.id)
            .single();
          setProfile(data as Profile | null);
          supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', u.id).then(({ error }) => {
            if (error) console.error('last_seen_at update failed:', error);
          });
        } else {
          setProfile(null);
        }
      } catch {
        // ignora erros
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };

    // Carga inicial via getUser (faz request direto, sem esperar eventos)
    supabase.auth.getUser().then(({ data: { user } }) => loadUser(user));

    // Escuta mudanças subsequentes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!loading) loadUser(session?.user ?? null);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
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

  if (user && profile && !profile.is_approved) {
    return <ApprovalGate onLogout={handleLogout} />;
  }

  const displayName = profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';
  const isAdmin = user?.email === 'willianluiszuqui@gmail.com';

  return (
    <div className="app">
      <div className="grid-bg" />
      <Lightbox />
      <Header user={user} profile={profile} isAdmin={isAdmin} onEditProfile={() => setShowEditProfile(true)} />
      {showEditProfile && user && profile && (
        <EditProfileModal
          profile={profile}
          userId={user.id}
          onClose={() => setShowEditProfile(false)}
          onSave={updated => setProfile(p => p ? { ...p, ...updated } : p)}
        />
      )}

      <div className="hero">
        <h1 className="hero-title">O que o <span style={{ color: 'var(--accent)' }}>Clóvis Code</span> fez pra te surpreender hoje?</h1>
        <p className="hero-sub">
          registre aqui — um log coletivo de pequenas maravilhas e pequenos desastres com o Claude Code.
        </p>
      </div>

      <div className="charts-row">
        <ReactionsChart />
        <SentimentChart />
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
        <span className="foot-sep">·</span>
        <a href="https://github.com/wzuqui/clovis" target="_blank" rel="noopener noreferrer" className="foot-link">github</a>
        <span className="foot-sep">·</span>
        <a href="https://github.com/wzuqui/clovis/issues" target="_blank" rel="noopener noreferrer" className="foot-link">reportar issue</a>
      </footer>
    </div>
  );
}
