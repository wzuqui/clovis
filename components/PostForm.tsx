'use client';

import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { uploadImage } from '@/lib/uploadImage';
import MarkdownEditor from './MarkdownEditor';

export default function PostForm({ onSuccess, userName }: { onSuccess: () => void; userName: string }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('posts').insert({ title: title.trim(), content: body.trim(), user_id: user.id });
      setTitle('');
      setBody('');
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="composer">
      <div className="composer-header">
        <span className="composer-tag">[ NOVO REGISTRO ]</span>
        <span className="composer-meta">assinando como <strong>@{userName}</strong></span>
      </div>

      <input
        className="title-input"
        placeholder="título — ex: o Clóvis refatorou 400 linhas e não quebrou nada"
        value={title}
        onChange={e => setTitle(e.target.value)}
        maxLength={140}
      />

      <MarkdownEditor
        value={body}
        onChange={setBody}
        onImageUpload={uploadImage}
      />

      <div className="composer-footer">
        <span className="hint"><Sparkles size={12} /> boa ou ruim, conta aí</span>
        <button
          className="publish-btn"
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !body.trim()}
        >
          {submitting ? 'publicando…' : 'publicar'} <Send size={13} />
        </button>
      </div>
    </section>
  );
}
