'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/');
    });
  }, []);

  const handleGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push('/');
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } },
      });
      if (error) setError(error.message);
      else setMessage('Verifique seu email para confirmar o cadastro!');
    }
    setLoading(false);
  };

  return (
    <div className="login-wrap">
      <div className="scanlines" />
      <div className="login-card">
        <div className="login-top">
          <span className="dot red" /><span className="dot yellow" /><span className="dot green" />
          <span className="login-top-title">clovis@anthropic ~ %</span>
        </div>
        <div className="login-body">
          <div className="ascii-logo">{`   ___  _    _____  _  _  ___  ___
  / __|| |  |_   _|| || ||_ _|/ __|
 | (__ | |__  | |  | __ | | | \\__ \\
  \\___||____| |_|  |_||_||___||___/`}</div>
          <p className="login-tag">&gt; O que o Clóvis Code fez pra te surpreender hoje?</p>
          <p className="login-sub"><span className="blink">▸</span> identifique-se para continuar</p>

          <button onClick={handleGitHub} className="login-github">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            Entrar com GitHub
          </button>

          <div className="login-divider">ou com email</div>

          <div className="login-tabs">
            {(['login', 'signup'] as const).map(t => (
              <button key={t} className={`login-tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setError(''); setMessage(''); }}>
                {t === 'login' ? 'entrar' : 'cadastrar'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {tab === 'signup' && (
              <div className="login-field">
                <label className="login-label">nome</label>
                <div className="login-input-row">
                  <span className="prompt">$</span>
                  <input className="login-input" value={name} onChange={e => setName(e.target.value)} placeholder="seu nome" required />
                </div>
              </div>
            )}
            <div className="login-field">
              <label className="login-label">email</label>
              <div className="login-input-row">
                <span className="prompt">$</span>
                <input className="login-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
            </div>
            <div className="login-field">
              <label className="login-label">senha</label>
              <div className="login-input-row">
                <span className="prompt">$</span>
                <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
            </div>
            {error && <p className="login-error">&gt; erro: {error}</p>}
            {message && <p className="login-success">&gt; {message}</p>}
            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'aguarde...' : tab === 'login' ? 'entrar' : 'criar conta'} <span>→</span>
            </button>
          </form>

          <p className="login-hint">login simples — só pra assinar seus posts</p>
        </div>
      </div>
    </div>
  );
}
