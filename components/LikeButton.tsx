'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
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
      setLiked(false); setCount(c => c - 1);
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: currentUserId });
      setLiked(true); setCount(c => c + 1);
    }
    setLoading(false);
    onUpdate();
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!currentUserId || loading}
      title={!currentUserId ? 'entre para curtir' : liked ? 'descurtir' : 'curtir'}
      className={`like-btn ${liked ? 'liked' : ''}`}
    >
      <Heart size={14} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
      {count}
    </button>
  );
}
