'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

const REACTIONS = [
  { type: 'like',  emoji: '❤️',  label: 'love' },
  { type: 'laugh', emoji: '😂',  label: 'rs' },
  { type: 'fire',  emoji: '🔥',  label: 'fire' },
  { type: 'wow',   emoji: '🤯',  label: 'uau' },
  { type: 'poop',  emoji: '💩',  label: 'merda' },
];

export default function ReactionsChart() {
  const [counts, setCounts] = useState<Map<string, number>>(
    new Map(REACTIONS.map(r => [r.type, 0]))
  );
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('likes').select('type');
      const m = new Map<string, number>(REACTIONS.map(r => [r.type, 0]));
      data?.forEach(({ type }: { type: string }) => m.set(type, (m.get(type) ?? 0) + 1));
      setCounts(m);
      setTotal(Array.from(m.values()).reduce((a, b) => a + b, 0));
      setLoading(false);
    };
    fetch();
  }, []);

  const max = Math.max(...Array.from(counts.values()), 1);

  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <span className="composer-tag">[ REAÇÕES DA COMUNIDADE ]</span>
        {!loading && <span style={{ fontSize: 11, color: 'var(--ink-dimmer)' }}>total · {total}</span>}
      </div>

      {loading ? (
        <div style={{ color: 'var(--ink-dimmer)', fontSize: 12, padding: '8px 0' }}>
          <span className="blink">▸</span> carregando...
        </div>
      ) : (
        <div className="chart-rows">
          {REACTIONS.map(({ type, emoji }) => {
            const count = counts.get(type) ?? 0;
            const pct = (count / max) * 100;
            return (
              <div key={type} className="chart-row">
                <span className="chart-emoji">{emoji}</span>
                <div className="chart-bar-bg">
                  <div className="chart-bar-fill" style={{ width: `${pct}%` }} />
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
