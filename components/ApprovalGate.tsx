'use client';

import { createClient } from '@/lib/supabase';
import { LogOut, Terminal } from 'lucide-react';

export default function ApprovalGate({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="login-wrap">
      <div className="scanlines" />
      <div className="login-card">
        <div className="login-top">
          <span className="dot red" /><span className="dot yellow" /><span className="dot green" />
          <span className="login-top-title">clovis@anthropic ~ %</span>
        </div>
        <div className="login-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: 'var(--accent)' }}>
            <Terminal size={20} />
            <span style={{ fontWeight: 800, letterSpacing: '0.15em', fontSize: 15 }}>CLÓVIS</span>
          </div>

          <p style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--accent)', fontWeight: 700, marginBottom: 20 }}>
            [ ACESSO RESTRITO ]
          </p>

          <p style={{ color: 'var(--ink)', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
            &gt; sua conta está aguardando aprovação.
          </p>
          <p style={{ color: 'var(--ink-dim)', marginBottom: 8, fontSize: 13 }}>
            &gt; o admin será notificado em breve.
          </p>
          <p style={{ color: 'var(--ink-dimmer)', marginBottom: 28, fontSize: 13 }}>
            <span className="blink">▸</span> tente novamente mais tarde.
          </p>

          <button onClick={onLogout} className="login-btn" style={{ gap: 8 }}>
            <LogOut size={14} /> sair
          </button>
        </div>
      </div>
    </div>
  );
}
