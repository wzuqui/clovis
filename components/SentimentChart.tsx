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

  const max = Math.max(...Array.from(counts.values()), 1);

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
      ) : (
        <div className="chart-rows">
          {SENTIMENTS.map(({ key, label, color }) => {
            const count = counts.get(key) ?? 0;
            const pct = (count / max) * 100;
            return (
              <div key={key} className="chart-row">
                <span className="chart-label">{label}</span>
                <div className="chart-bar-bg">
                  <div className="chart-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="chart-count">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
