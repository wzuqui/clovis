'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import PostCard from './PostCard';
import type { Post } from '@/lib/types';

export default function Timeline({ currentUserId }: { currentUserId?: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(*), likes(count), comments(count)')
      .order('created_at', { ascending: false });
    setPosts((data as Post[]) || []);

    if (currentUserId) {
      const { data: ul } = await supabase.from('likes').select('post_id').eq('user_id', currentUserId);
      setLikedPostIds(new Set(ul?.map(l => l.post_id) || []));
    } else {
      setLikedPostIds(new Set());
    }
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, [currentUserId]);

  if (loading) return (
    <div style={{ color: 'var(--ink-dim)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
      <span className="blink">▸</span> carregando registros...
    </div>
  );

  return (
    <>
      <div className="timeline-header">
        <span className="line" />
        <span className="timeline-label">
          TIMELINE · {posts.length} {posts.length === 1 ? 'REGISTRO' : 'REGISTROS'}
        </span>
        <span className="line" />
      </div>

      {posts.length === 0 ? (
        <div className="empty">
          <p>&gt; nenhum registro ainda.</p>
          <p className="dim">seja a primeira pessoa a contar uma história.</p>
        </div>
      ) : (
        <div className="timeline">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              isLiked={likedPostIds.has(post.id)}
              onUpdate={fetchPosts}
            />
          ))}
        </div>
      )}
    </>
  );
}
