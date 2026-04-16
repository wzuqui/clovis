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
      .select(`
        *,
        profiles(*),
        likes(count),
        comments(count)
      `)
      .order('created_at', { ascending: false });

    setPosts((data as Post[]) || []);

    if (currentUserId) {
      const { data: userLikes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', currentUserId);
      setLikedPostIds(new Set(userLikes?.map((l) => l.post_id) || []));
    } else {
      setLikedPostIds(new Set());
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [currentUserId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-6 animate-pulse">
            <div className="flex gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-700 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-gray-700 rounded w-1/4" />
                <div className="h-3 bg-gray-700 rounded w-1/6" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-700 rounded w-4/5" />
              <div className="h-3 bg-gray-700 rounded w-3/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <div className="text-6xl mb-4">🤖</div>
        <p className="text-lg font-medium text-gray-400">Nenhuma surpresa compartilhada ainda.</p>
        <p className="text-sm mt-1">Seja o primeiro a contar o que o Clóvis aprontou!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-sm">{posts.length} {posts.length === 1 ? 'experiência' : 'experiências'} compartilhadas</p>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          isLiked={likedPostIds.has(post.id)}
          onUpdate={fetchPosts}
        />
      ))}
    </div>
  );
}
