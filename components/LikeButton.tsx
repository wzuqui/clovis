'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

interface LikeButtonProps {
  postId: string;
  likeCount: number;
  isLiked: boolean;
  currentUserId?: string;
  onUpdate: () => void;
}

export default function LikeButton({ postId, likeCount, isLiked, currentUserId, onUpdate }: LikeButtonProps) {
  const [liked, setLiked] = useState(isLiked);
  const [count, setCount] = useState(likeCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!currentUserId || loading) return;
    setLoading(true);

    const supabase = createClient();

    if (liked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
      setLiked(false);
      setCount((c) => c - 1);
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: currentUserId });
      setLiked(true);
      setCount((c) => c + 1);
    }

    setLoading(false);
    onUpdate();
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!currentUserId || loading}
      title={!currentUserId ? 'Entre para curtir' : liked ? 'Descurtir' : 'Curtir'}
      className={`flex items-center gap-1.5 transition-colors ${
        liked ? 'text-pink-400' : 'text-gray-400 hover:text-pink-400'
      } disabled:cursor-default`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform hover:scale-110"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className="text-sm tabular-nums">{count}</span>
    </button>
  );
}
