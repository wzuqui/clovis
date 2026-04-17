'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Comment } from '@/lib/types';
import ReactionBar from './ReactionBar';

export default function CommentSection({ postId, currentUserId, onUpdate, initialCount = 0 }: {
  postId: string;
  currentUserId?: string;
  onUpdate: () => void;
  initialCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userRxMap, setUserRxMap] = useState<Map<string, Set<string>>>(new Map());
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('comments').select('*, profiles(*), comment_likes(type), sentiment')
      .eq('post_id', postId).order('created_at', { ascending: true });
    const fetched = data || [];
    setComments(fetched);

    if (currentUserId && fetched.length > 0) {
      const { data: myRx } = await supabase
        .from('comment_likes')
        .select('comment_id, type')
        .in('comment_id', fetched.map(c => c.id))
        .eq('user_id', currentUserId);
      const m = new Map<string, Set<string>>();
      for (const r of myRx ?? []) {
        if (!m.has(r.comment_id)) m.set(r.comment_id, new Set());
        m.get(r.comment_id)!.add(r.type);
      }
      setUserRxMap(m);
    }
  };

  useEffect(() => { if (open) fetchComments(); }, [open, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !currentUserId) return;
    setLoading(true);
    const supabase = createClient();
    const { data: inserted } = await supabase.from('comments').insert({ post_id: postId, user_id: currentUserId, content: text.trim() }).select('id').single();
    if (inserted?.id) {
      fetch('/api/analyze-sentiment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.trim(), id: inserted.id, table: 'comments' }) }).catch(() => {});
    }
    setText('');
    await fetchComments();
    onUpdate();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('comments').delete().eq('id', id);
    await fetchComments();
    onUpdate();
  };

  const count = open ? comments.length : initialCount;

  return (
    <div className="comments">
      <button className="comments-toggle" onClick={() => setOpen(v => !v)}>
        <MessageCircle size={14} />
        {count} {count === 1 ? 'comentário' : 'comentários'}
        <span className="caret">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="comments-body">
          {count === 0 && <p className="comments-empty">&gt; nenhum comentário ainda. seja o primeiro.</p>}
          {comments.map(c => (
            <div key={c.id} className="comment">
              <div className="comment-head">
                <span className="comment-author">@{c.profiles?.name || 'anon'}</span>
                {c.profiles?.last_seen_at && Date.now() - new Date(c.profiles.last_seen_at).getTime() < 3 * 60 * 1000 && (
                  <span className="presence-dot" title="online agora" />
                )}
                <span className="comment-time">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                </span>
                {c.sentiment && <span className={`sentiment-badge sentiment-${c.sentiment}`}>{c.sentiment === 'positive' ? 'positivo' : c.sentiment === 'negative' ? 'negativo' : 'neutro'}</span>}
                {c.user_id === currentUserId && (
                  <button className="comment-del" onClick={() => handleDelete(c.id)} title="apagar">
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
              <p className="comment-text">{c.content}</p>
              <ReactionBar
                commentId={c.id}
                allReactions={c.comment_likes ?? []}
                userReactions={userRxMap.get(c.id) ?? new Set()}
                currentUserId={currentUserId}
                onUpdate={fetchComments}
              />
            </div>
          ))}

          {currentUserId ? (
            <form className="comment-input-row" onSubmit={handleSubmit}>
              <input
                className="comment-input"
                placeholder="adicionar comentário…"
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <button type="submit" className="comment-send" disabled={loading || !text.trim()}>
                <Send size={12} />
              </button>
            </form>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--ink-dimmer)', marginTop: 10 }}>
              <a href="/login" style={{ color: 'var(--accent)' }}>entre</a> para comentar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
