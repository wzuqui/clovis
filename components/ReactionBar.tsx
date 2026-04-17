'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';

const REACTIONS = [
  { type: 'like',  emoji: '❤️' },
  { type: 'laugh', emoji: '😂' },
  { type: 'fire',  emoji: '🔥' },
  { type: 'wow',   emoji: '🤯' },
  { type: 'poop',  emoji: '💩' },
];

interface ReactionBarProps {
  postId?: string;
  commentId?: string;
  allReactions: { type: string }[];
  userReactions: Set<string>;
  currentUserId?: string;
  onUpdate: () => void;
}

export default function ReactionBar({ postId, commentId, allReactions, userReactions, currentUserId, onUpdate }: ReactionBarProps) {
  const table = commentId ? 'comment_likes' : 'likes';
  const idCol = commentId ? 'comment_id'    : 'post_id';
  const idVal = (commentId ?? postId)!;
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(userReactions));
  const [counts, setCounts] = useState<Map<string, number>>(() => {
    const m = new Map<string, number>(REACTIONS.map(r => [r.type, 0]));
    allReactions.forEach(r => m.set(r.type, (m.get(r.type) ?? 0) + 1));
    return m;
  });
  const [loading, setLoading] = useState<string | null>(null);
  const [openType, setOpenType] = useState<string | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [loadingNames, setLoadingNames] = useState(false);
  const cache = useRef<Map<string, string[]>>(new Map());

  const toggle = async (type: string) => {
    if (!currentUserId || loading) return;
    const isActive = activeTypes.has(type);
    setActiveTypes(prev => { const n = new Set(prev); isActive ? n.delete(type) : n.add(type); return n; });
    setCounts(prev => { const n = new Map(prev); n.set(type, Math.max(0, (prev.get(type) ?? 0) + (isActive ? -1 : 1))); return n; });
    cache.current.delete(type);
    if (openType === type) setOpenType(null);

    setLoading(type);
    const supabase = createClient();
    if (isActive) {
      await supabase.from(table).delete().eq(idCol, idVal).eq('user_id', currentUserId).eq('type', type);
    } else {
      await supabase.from(table).insert({ [idCol]: idVal, user_id: currentUserId, type });
    }
    setLoading(null);
  };

  const showWho = async (type: string) => {
    if (openType === type) { setOpenType(null); return; }
    setOpenType(type);
    if (cache.current.has(type)) { setNames(cache.current.get(type)!); return; }
    setLoadingNames(true);
    const supabase = createClient();
    const { data } = await supabase.from(table).select('profiles(name)').eq(idCol, idVal).eq('type', type);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (data ?? []).map((r: any) => (Array.isArray(r.profiles) ? r.profiles[0]?.name : r.profiles?.name) || 'anon');
    cache.current.set(type, result);
    setNames(result);
    setLoadingNames(false);
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="reaction-bar">
        {REACTIONS.map(({ type, emoji }) => {
          const count = counts.get(type) ?? 0;
          const active = activeTypes.has(type);
          const open = openType === type;
          return (
            <div key={type} className={`reaction-pill${active ? ' active' : ''}${open ? ' open' : ''}`}>
              <button
                className="reaction-emoji-btn"
                onClick={() => toggle(type)}
                disabled={!currentUserId || loading === type}
                title={!currentUserId ? 'entre para reagir' : active ? 'remover reação' : 'reagir'}
              >
                <span className="reaction-emoji">{emoji}</span>
              </button>
              {count > 0 && (
                <button className="reaction-count-btn" onClick={() => showWho(type)}>
                  {count}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {openType && (
        <div className="reaction-who">
          <span className="reaction-who-emoji">
            {REACTIONS.find(r => r.type === openType)?.emoji}
          </span>
          {loadingNames
            ? <span style={{ color: 'var(--ink-dimmer)' }}>...</span>
            : <span>{names.join(', ')}</span>
          }
        </div>
      )}
    </div>
  );
}
