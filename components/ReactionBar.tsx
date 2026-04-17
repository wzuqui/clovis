'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

const REACTIONS = [
  { type: 'like',  emoji: '❤️' },
  { type: 'laugh', emoji: '😂' },
  { type: 'fire',  emoji: '🔥' },
  { type: 'wow',   emoji: '🤯' },
];

interface ReactionBarProps {
  postId: string;
  allReactions: { type: string }[];
  userReactions: Set<string>;
  currentUserId?: string;
  onUpdate: () => void;
}

export default function ReactionBar({ postId, allReactions, userReactions, currentUserId, onUpdate }: ReactionBarProps) {
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(userReactions));
  const [counts, setCounts] = useState<Map<string, number>>(() => {
    const m = new Map<string, number>(REACTIONS.map(r => [r.type, 0]));
    allReactions.forEach(r => m.set(r.type, (m.get(r.type) ?? 0) + 1));
    return m;
  });
  const [loading, setLoading] = useState<string | null>(null);

  const toggle = async (type: string) => {
    if (!currentUserId || loading) return;
    const isActive = activeTypes.has(type);

    setActiveTypes(prev => {
      const next = new Set(prev);
      isActive ? next.delete(type) : next.add(type);
      return next;
    });
    setCounts(prev => {
      const next = new Map(prev);
      next.set(type, Math.max(0, (prev.get(type) ?? 0) + (isActive ? -1 : 1)));
      return next;
    });

    setLoading(type);
    const supabase = createClient();
    if (isActive) {
      await supabase.from('likes').delete()
        .eq('post_id', postId).eq('user_id', currentUserId).eq('type', type);
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: currentUserId, type });
    }
    setLoading(null);
    onUpdate();
  };

  return (
    <div className="reaction-bar">
      {REACTIONS.map(({ type, emoji }) => {
        const count = counts.get(type) ?? 0;
        const active = activeTypes.has(type);
        return (
          <button
            key={type}
            onClick={() => toggle(type)}
            disabled={!currentUserId || loading === type}
            title={!currentUserId ? 'entre para reagir' : active ? 'remover reação' : 'reagir'}
            className={`reaction-btn${active ? ' active' : ''}`}
          >
            <span className="reaction-emoji">{emoji}</span>
            {count > 0 && <span className="reaction-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
