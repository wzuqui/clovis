'use client';

import { useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Pencil, ImageIcon } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
  minHeight?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  autoFocus,
  onImageUpload,
  minHeight = 180,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [dragOver, setDragOver] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const insertAtCursor = useCallback((text: string) => {
    const ta = taRef.current;
    if (!ta) { onChange((value || '') + text); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    onChange(value.slice(0, start) + text + value.slice(end));
    setTimeout(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }, [value, onChange]);

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (!onImageUpload) return;
    try {
      const url = await onImageUpload(file);
      insertAtCursor(`\n![image](${url})\n`);
    } catch {
      console.error('Upload de imagem falhou');
    }
  }, [onImageUpload, insertAtCursor]);

  const onPaste = async (e: React.ClipboardEvent) => {
    const imageItem = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (file) await handleImageFile(file);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    for (const file of Array.from(e.dataTransfer.files)) await handleImageFile(file);
  };

  return (
    <div className="md-editor">
      <div className="md-tabs">
        <button className={`md-tab ${tab === 'write' ? 'active' : ''}`} onClick={() => setTab('write')} type="button">
          <Pencil size={12} /> escrever
        </button>
        <button className={`md-tab ${tab === 'preview' ? 'active' : ''}`} onClick={() => setTab('preview')} type="button">
          <Eye size={12} /> preview
        </button>
        <div className="md-tab-spacer" />
        {onImageUpload && (
          <button className="md-tool" onClick={() => fileRef.current?.click()} type="button" title="adicionar imagem">
            <ImageIcon size={12} /> imagem
          </button>
        )}
        <input
          ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={async (e) => {
            for (const f of Array.from(e.target.files || [])) await handleImageFile(f);
            e.target.value = '';
          }}
        />
      </div>

      {tab === 'write' ? (
        <div
          className={`md-textarea-wrap ${dragOver ? 'drag' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <textarea
            ref={taRef}
            autoFocus={autoFocus}
            className="md-textarea"
            style={{ minHeight }}
            placeholder={placeholder || 'conta aí o que rolou com o Clóvis Code...\n\ndica: cole uma imagem (Ctrl+V) ou arraste aqui\n\n**markdown** suportado: _itálico_, `código`, # títulos, - listas'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={onPaste}
            spellCheck
            lang="pt-BR"
          />
          {dragOver && <div className="drop-overlay">▾ solte a imagem aqui ▾</div>}
        </div>
      ) : (
        <div className="md-preview" style={{ minHeight }}>
          {value ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img({ src, alt }) { return <img className="md-img" src={src} alt={alt || ''} />; },
                a({ href, children }) { return <a className="md-link" href={href} target="_blank" rel="noopener noreferrer">{children}</a>; },
                pre({ children }) { return <pre className="md-pre">{children}</pre>; },
                code({ children, className }) {
                  return className
                    ? <code className={className}>{children}</code>
                    : <code className="md-code">{children}</code>;
                },
                blockquote({ children }) { return <blockquote className="md-quote">{children}</blockquote>; },
                ul({ children }) { return <ul className="md-ul">{children}</ul>; },
                p({ children }) { return <p className="md-p">{children}</p>; },
                h1({ children }) { return <h1 className="md-h1">{children}</h1>; },
                h2({ children }) { return <h2 className="md-h2">{children}</h2>; },
                h3({ children }) { return <h3 className="md-h3">{children}</h3>; },
              }}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <p className="md-p dim">nada para visualizar ainda...</p>
          )}
        </div>
      )}
    </div>
  );
}
