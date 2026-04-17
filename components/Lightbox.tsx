'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Lightbox() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const open = (e: Event) => setSrc((e as CustomEvent<string>).detail);
    window.addEventListener('lightbox:open', open);
    return () => window.removeEventListener('lightbox:open', open);
  }, []);

  useEffect(() => {
    if (!src) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSrc(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [src]);

  if (!src) return null;

  return createPortal(
    <div className="lightbox-overlay" onClick={() => setSrc(null)}>
      <button className="lightbox-close" onClick={e => { e.stopPropagation(); setSrc(null); }}><X size={12} /> fechar</button>
      <img className="lightbox-img" src={src} alt="" onClick={e => e.stopPropagation()} />
    </div>,
    document.body
  );
}
