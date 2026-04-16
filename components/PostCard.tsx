'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Post } from '@/lib/types';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import EditPostModal from './EditPostModal';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  isLiked: boolean;
  onUpdate: () => void;
}

export default function PostCard({ post, currentUserId, isLiked, onUpdate }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);

  const name = post.profiles?.name || 'Anônimo';
  const avatarUrl = post.profiles?.avatar_url;
  const initials = name.charAt(0).toUpperCase();
  const isAuthor = currentUserId === post.user_id;
  const commentCount = post.comments?.[0]?.count ?? 0;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const wasEdited = post.updated_at !== post.created_at;

  return (
    <article className="bg-gray-800 border border-gray-700 rounded-xl p-6 transition-colors hover:border-gray-600">
      {/* Author row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">{initials}</span>
            )}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{name}</p>
            <p className="text-gray-400 text-xs">
              {timeAgo}
              {wasEdited && <span className="ml-1 text-gray-500">(editado)</span>}
            </p>
          </div>
        </div>

        {isAuthor && (
          <button
            onClick={() => setEditing(true)}
            className="text-gray-400 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-gray-700"
          >
            Editar
          </button>
        )}
      </div>

      {/* Markdown content */}
      <div className="prose prose-invert prose-sm max-w-none mb-4">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img({ src, alt }) {
              return (
                <img
                  src={src}
                  alt={alt || ''}
                  className="max-w-full rounded-lg my-2 max-h-[500px] object-contain"
                  loading="lazy"
                />
              );
            },
            a({ href, children }) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                  {children}
                </a>
              );
            },
            pre({ children }) {
              return (
                <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto my-2 text-sm">
                  {children}
                </pre>
              );
            },
            code({ children, className }) {
              const isBlock = Boolean(className);
              if (isBlock) return <code className={className}>{children}</code>;
              return (
                <code className="bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono text-pink-300">
                  {children}
                </code>
              );
            },
            blockquote({ children }) {
              return (
                <blockquote className="border-l-4 border-purple-500 pl-4 my-2 text-gray-400 italic">
                  {children}
                </blockquote>
              );
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-5 pt-4 border-t border-gray-700">
        <LikeButton
          postId={post.id}
          likeCount={post.likes?.[0]?.count ?? 0}
          isLiked={isLiked}
          currentUserId={currentUserId}
          onUpdate={onUpdate}
        />

        <button
          onClick={() => setShowComments((v) => !v)}
          className={`flex items-center gap-1.5 transition-colors ${
            showComments ? 'text-blue-400' : 'text-gray-400 hover:text-blue-400'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-sm tabular-nums">{commentCount}</span>
        </button>
      </div>

      {showComments && (
        <CommentSection
          postId={post.id}
          currentUserId={currentUserId}
          onUpdate={onUpdate}
        />
      )}

      {editing && (
        <EditPostModal
          post={post}
          onClose={() => setEditing(false)}
          onUpdate={() => { setEditing(false); onUpdate(); }}
        />
      )}
    </article>
  );
}
