'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Terminal, LogOut, Check, Users } from 'lucide-react';
import type { Profile } from '@/lib/types';

const ADMIN_EMAIL = 'willianluiszuqui@gmail.com';

export default function AdminPage() {
  const [pending, setPending] = useState<Profile[]>([]);
  const [approved, setApproved] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || user.email !== ADMIN_EMAIL) {
        router.replace('/');
        return;
      }

      await fetchUsers();
    };
    init();
  }, []);

  const fetchUsers = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const all = (data as Profile[]) || [];
    setPending(all.filter(p => !p.is_approved));
    setApproved(all.filter(p => p.is_approved));
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setApproving(id);
    const supabase = createClient();
    await supabase.from('profiles').update({ is_approved: true }).eq('id', id);
    await fetchUsers();
    setApproving(null);
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revogar acesso deste usuário?')) return;
    setApproving(id);
    const supabase = createClient();
    await supabase.from('profiles').update({ is_approved: false }).eq('id', id);
    await fetchUsers();
    setApproving(null);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--ink-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
      <span className="blink">▸</span>&nbsp;carregando...
    </div>
  );

  return (
    <div className="app">
      <div className="grid-bg" />

      <header className="topbar">
        <div className="brand">
          <Terminal size={18} />
          <div className="brand-text">
            <span className="brand-name">CLÓVIS</span>
            <span className="brand-sub">// painel admin</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/" style={{ fontSize: 12, color: 'var(--ink-dim)', textDecoration: 'none' }}>← voltar</a>
          <button className="logout-btn" onClick={handleLogout} title="sair"><LogOut size={13} /></button>
        </div>
      </header>

      <div className="main" style={{ paddingTop: 32 }}>
        {/* Pending */}
        <div className="timeline-header" style={{ marginBottom: 16 }}>
          <span className="line" />
          <span className="timeline-label">AGUARDANDO APROVAÇÃO · {pending.length}</span>
          <span className="line" />
        </div>

        {pending.length === 0 ? (
          <div className="empty" style={{ padding: '30px 0' }}>
            <p>&gt; nenhum usuário pendente.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
            {pending.map(p => (
              <div key={p.id} className="post" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border-lite)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, color: '#1a0f08', flexShrink: 0 }}>
                    {(p.name || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, color: 'var(--ink)', fontWeight: 600, fontSize: 13 }}>{p.name || 'sem nome'}</p>
                  <p style={{ margin: 0, color: 'var(--ink-dim)', fontSize: 11 }}>{p.email || '—'}</p>
                </div>
                <button
                  onClick={() => handleApprove(p.id)}
                  disabled={approving === p.id}
                  className="publish-btn small"
                  style={{ flexShrink: 0 }}
                >
                  {approving === p.id ? '...' : <><Check size={12} /> aprovar</>}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Approved */}
        <div className="timeline-header" style={{ marginBottom: 16 }}>
          <span className="line" />
          <span className="timeline-label"><Users size={10} style={{ display: 'inline' }} /> APROVADOS · {approved.length}</span>
          <span className="line" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {approved.map(p => (
            <div key={p.id} className="post" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              {p.avatar_url ? (
                <img src={p.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border-lite)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: '#1a0f08', flexShrink: 0 }}>
                  {(p.name || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, color: 'var(--ink)', fontSize: 13 }}>{p.name || 'sem nome'}</p>
                <p style={{ margin: 0, color: 'var(--ink-dim)', fontSize: 11 }}>{p.email || '—'}</p>
              </div>
              <span style={{ fontSize: 10, color: '#4ade80', letterSpacing: '0.1em' }}>✓ aprovado</span>
              {p.email !== ADMIN_EMAIL && (
                <button
                  onClick={() => handleRevoke(p.id)}
                  disabled={approving === p.id}
                  className="icon-btn danger"
                  title="revogar acesso"
                  style={{ flexShrink: 0, fontSize: 11 }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
