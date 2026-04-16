'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-700 animate-pulse rounded-lg" />,
});

const imageUploadSvg = (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export default function PostForm({ onSuccess }: { onSuccess: () => void }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const supabase = createClient();
    const ext = file.name.split('.').pop() || 'png';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from('post-images').upload(path, file);
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path);
    return publicUrl;
  }, []);

  // Handle image paste anywhere in the editor area
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files);
    const imageFile = files.find((f) => f.type.startsWith('image/'));
    if (!imageFile) return;

    e.preventDefault();
    setUploading(true);
    try {
      const url = await uploadImage(imageFile);
      setContent((prev) => `${prev}\n![image](${url})\n`);
    } catch (err) {
      console.error('Paste upload failed:', err);
    } finally {
      setUploading(false);
    }
  }, [uploadImage]);

  // Custom toolbar command for image upload via file dialog
  const imageCommand = {
    name: 'upload-image',
    keyCommand: 'upload-image',
    buttonProps: { 'aria-label': 'Inserir imagem', title: 'Inserir imagem (ou cole uma imagem)' },
    icon: imageUploadSvg,
    execute: (_: unknown, api: { replaceSelection: (text: string) => void }) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
          const url = await uploadImage(file);
          api.replaceSelection(`![image](${url})`);
        } catch (err) {
          console.error('Upload failed:', err);
        } finally {
          setUploading(false);
        }
      };
      input.click();
    },
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('posts').insert({
        content: content.trim(),
        user_id: user.id,
      });

      if (!error) {
        setContent('');
        onSuccess();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8" onPaste={handlePaste}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-300 text-sm font-medium">Compartilhe sua experiência</p>
        {uploading && (
          <span className="text-purple-400 text-xs flex items-center gap-1">
            <span className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin inline-block" />
            Enviando imagem...
          </span>
        )}
      </div>

      <div data-color-mode="dark">
        <MDEditor
          value={content}
          onChange={(v) => setContent(v || '')}
          height={280}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          extraCommands={[imageCommand as any]}
          preview="edit"
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-gray-500 text-xs">
          Suporta Markdown · Cole ou use o botão{' '}
          <span className="inline-flex items-center gap-1">
            {imageUploadSvg}
          </span>{' '}
          para imagens
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim() || uploading}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {submitting ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </div>
  );
}
