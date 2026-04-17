'use client';

import { useState } from 'react';
import { Edit3, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase';
import { uploadImage } from '@/lib/uploadImage';
import type { Post } from '@/lib/types';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import MarkdownEditor from './MarkdownEditor';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  isLiked: boolean;
  onUpdate: () => void;
}

export default function PostCard({ post, currentUserId, isLiked, onUpdate }: PostCardProps) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.content);
  const [saving, setSaving] = useState(false);

  const isMine = currentUserId === post.user_id;
  const name = post.profiles?.name || 'anon';
  const shortId = post.id.slice(-5).toUpperCase();
  const wasEdited = post.updated_at !== post.created_at;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR });

  const saveEdit = async () => {
    if (!editBody.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('posts').update({ content: editBody.trim() }).eq('id', post.id);
    setSaving(false);
    setEditing(false);
    onUpdate();
  };

  const deletePost = async () => {
    if (!confirm('apagar este post? essa ação não pode ser desfeita.')) return;
    const supabase = createClient();
    await supabase.from('posts').delete().eq('id', post.id);
    onUpdate();
  };

  return (
    <article className="post">
      <div className="post-header">
        <div className="post-meta">
          {post.profiles?.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt={name}
              style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--border-lite)', flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: '#1a0f08', flexShrink: 0 }}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="post-id">#{shortId}</span>
          <span className="post-author">@{name}</span>
          <span>{timeAgo}</span>
          {wasEdited && <span className="post-edited">• editado</span>}
        </div>
        {isMine && !editing && (
          <div className="post-actions-top">
            <button className="icon-btn" onClick={() => setEditing(true)} title="editar"><Edit3 size={13} /></button>
            <button className="icon-btn danger" onClick={deletePost} title="apagar"><Trash2 size={13} /></button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="edit-mode">
          <MarkdownEditor value={editBody} onChange={setEditBody} onImageUpload={uploadImage} autoFocus minHeight={200} />
          <div className="edit-actions">
            <button className="btn-ghost" onClick={() => { setEditBody(post.content); setEditing(false); }}>
              <X size={12} /> cancelar
            </button>
            <button className="publish-btn small" onClick={saveEdit} disabled={saving}>
              {saving ? 'salvando…' : 'salvar'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {post.title && <h2 className="post-title">{post.title}</h2>}
          <div className="md-preview" style={{ minHeight: 0, padding: 0 }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img({ src, alt }) { return <img className="md-img" src={src} alt={alt || ''} />; },
                a({ href, children }) { return <a className="md-link" href={href} target="_blank" rel="noopener noreferrer">{children}</a>; },
                pre({ children }) { return <pre className="md-pre">{children}</pre>; },
                code({ children, className }) {
                  return className ? <code className={className}>{children}</code> : <code className="md-code">{children}</code>;
                },
                blockquote({ children }) { return <blockquote className="md-quote">{children}</blockquote>; },
                ul({ children }) { return <ul className="md-ul">{children}</ul>; },
                p({ children }) { return <p className="md-p">{children}</p>; },
                h1({ children }) { return <h1 className="md-h1">{children}</h1>; },
                h2({ children }) { return <h2 className="md-h2">{children}</h2>; },
                h3({ children }) { return <h3 className="md-h3">{children}</h3>; },
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </>
      )}

      <div className="post-footer">
        <LikeButton
          postId={post.id}
          likeCount={post.likes?.[0]?.count ?? 0}
          isLiked={isLiked}
          currentUserId={currentUserId}
          onUpdate={onUpdate}
        />
        <CommentSection postId={post.id} currentUserId={currentUserId} onUpdate={onUpdate} initialCount={post.comments?.[0]?.count ?? 0} />
      </div>
    </article>
  );
}
