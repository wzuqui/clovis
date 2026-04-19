'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MentionProfile } from '@/lib/useMentionDropdown';

interface Props {
  open: boolean;
  taRef: React.RefObject<HTMLTextAreaElement>;
  coords: { top: number; left: number; height: number };
  profiles: MentionProfile[];
  activeIndex: number;
  onSelect: (name: string) => void;
  anchor?: 'caret' | 'below';
}

export default function MentionDropdown({ open, taRef, coords, profiles, activeIndex, onSelect, anchor = 'caret' }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted || !taRef.current) return null;
  const rect = taRef.current.getBoundingClientRect();
  const top = anchor === 'below' ? rect.bottom + 4 : rect.top + coords.top + coords.height + 2;
  const left = anchor === 'below' ? rect.left : rect.left + coords.left;

  return createPortal(
    <div className="mention-dropdown" style={{ position: 'fixed', top, left }}>
      {profiles.map((p, i) => (
        <button
          key={p.id}
          type="button"
          className={`mention-item${i === activeIndex ? ' active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); onSelect(p.name!); }}
        >
          @{p.name}
        </button>
      ))}
    </div>,
    document.body
  );
}
