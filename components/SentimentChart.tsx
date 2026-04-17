'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

const SENTIMENTS = [
  { key: 'positive', label: 'positivo', color: '#4ade80' },
  { key: 'neutral',  label: 'neutro',   color: '#a8a29e' },
  { key: 'negative', label: 'negativo', color: '#f87171' },
];

export default function SentimentChart() {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [{ data: posts }, { data: comments }] = await Promise.all([
        supabase.from('posts').select('sentiment').not('sentiment', 'is', null),
        supabase.from('comments').select('sentiment').not('sentiment', 'is', null),
      ]);
      const m = new Map<string, number>(SENTIMENTS.map(s => [s.key, 0]));
      for (const { sentiment } of [...(posts ?? []), ...(comments ?? [])]) {
        if (sentiment) m.set(sentiment, (m.get(sentiment) ?? 0) + 1);
      }
      setCounts(m);
      setTotal(Array.from(m.values()).reduce((a, b) => a + b, 0));
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <span className="composer-tag">[ SENTIMENTOS ]</span>
        {!loading && <span style={{ fontSize: 11, color: 'var(--ink-dimmer)' }}>total · {total}</span>}
      </div>

      {loading ? (
        <div style={{ color: 'var(--ink-dimmer)', fontSize: 12, padding: '8px 0' }}>
          <span className="blink">▸</span> carregando...
        </div>
      ) : total === 0 ? (
        <div style={{ color: 'var(--ink-dimmer)', fontSize: 12, padding: '8px 0' }}>nenhum dado ainda.</div>
      ) : (
        <>
          <div className="sentiment-stack">
            {SENTIMENTS.map(({ key, label, color }) => {
              const count = counts.get(key) ?? 0;
              const pct = (count / total) * 100;
              if (count === 0) return null;
              return (
                <div
                  key={key}
                  className="sentiment-segment"
                  style={{ width: `${pct}%`, background: color, opacity: hovered && hovered !== key ? 0.4 : 1 }}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  onTouchStart={e => { e.preventDefault(); setHovered(h => h === key ? null : key); }}
                  onClick={() => setHovered(h => h === key ? null : key)}
                >
                  {hovered === key && (
                    <div className="sentiment-tooltip">
                      {label} · {count} ({pct.toFixed(0)}%)
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sentiment-legend">
            {SENTIMENTS.map(({ key, label, color }) => {
              const count = counts.get(key) ?? 0;
              return (
                <span key={key} className="sentiment-legend-item">
                  <span className="sentiment-legend-dot" style={{ background: color }} />
                  {label}
                </span>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
