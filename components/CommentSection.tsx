'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Comment } from '@/lib/types';

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  onUpdate: () => void;
}

export default function CommentSection({ postId, currentUserId, onUpdate }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments(data || []);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !currentUserId) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from('comments').insert({
      post_id: postId,
      user_id: currentUserId,
      content: text.trim(),
    });
    setText('');
    await fetchComments();
    onUpdate();
    setLoading(false);
  };

  const handleDelete = async (commentId: string) => {
    const supabase = createClient();
    await supabase.from('comments').delete().eq('id', commentId);
    await fetchComments();
    onUpdate();
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-700">
      <div className="space-y-3 mb-4">
        {comments.length === 0 && (
          <p className="text-gray-500 text-sm">Nenhum comentário ainda.</p>
        )}
        {comments.map((c) => {
          const initials = (c.profiles?.name || 'A').charAt(0).toUpperCase();
          return (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {c.profiles?.avatar_url ? (
                  <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-bold">{initials}</span>
                )}
              </div>
              <div className="flex-1 bg-gray-700/60 rounded-lg px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-white text-sm font-medium">
                    {c.profiles?.name || 'Anônimo'}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-gray-500 text-xs">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                    {currentUserId === c.user_id && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-gray-300 text-sm mt-0.5">{c.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Adicionar comentário..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? '...' : 'Enviar'}
          </button>
        </form>
      ) : (
        <p className="text-gray-500 text-sm">
          <a href="/login" className="text-purple-400 hover:underline">Entre</a> para comentar.
        </p>
      )}
    </div>
  );
}
