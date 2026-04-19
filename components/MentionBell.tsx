'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Mention {
  id: string;
  created_at: string;
  read_at: string | null;
  post_id: string | null;
  comment_id: string | null;
  mentioned_by: { name: string | null } | null;
}

export default function MentionBell({ userId }: { userId: string }) {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchMentions = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('mentions')
      .select('id, created_at, read_at, post_id, comment_id, mentioned_by:profiles!mentioned_by_user_id(name)')
      .eq('mentioned_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    const list = (data ?? []) as Mention[];
    setMentions(list);
    setUnread(list.filter(m => !m.read_at).length);
  };

  useEffect(() => {
    fetchMentions();
    const supabase = createClient();
    const channel = supabase
      .channel('mentions-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mentions', filter: `mentioned_user_id=eq.${userId}` }, () => {
        fetchMentions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const handleOpen = async () => {
    setOpen(v => !v);
    if (!open && unread > 0) {
      const supabase = createClient();
      await supabase.from('mentions').update({ read_at: new Date().toISOString() }).eq('mentioned_user_id', userId).is('read_at', null);
      setUnread(0);
      setMentions(m => m.map(x => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="bell-wrap" ref={wrapRef}>
      <button className="logout-btn" onClick={handleOpen} title="menções" style={{ position: 'relative' }}>
        <Bell size={15} />
        {unread > 0 && <span className="bell-badge">{unread}</span>}
      </button>
      {open && (
        <div className="bell-dropdown">
          {mentions.length === 0 ? (
            <div className="bell-item" style={{ color: 'var(--ink-dimmer)' }}>nenhuma menção ainda.</div>
          ) : mentions.map(m => (
            <div key={m.id} className="bell-item">
              <span className="bell-who">@{m.mentioned_by?.name ?? 'alguém'}</span>
              {' te marcou '}
              {m.post_id ? 'num post' : 'num comentário'}
              <span style={{ display: 'block', fontSize: 10, color: 'var(--ink-dimmer)', marginTop: 2 }}>
                {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
