'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';

export interface MentionProfile { id: string; name: string | null; }

export function useMentionDropdown(value: string, taRef: React.RefObject<HTMLTextAreaElement>) {
  const [profiles, setProfiles] = useState<MentionProfile[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [anchorStart, setAnchorStart] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detect = (newValue: string) => {
    const cursor = taRef.current?.selectionStart ?? newValue.length;
    const before = newValue.slice(0, cursor);
    const match = before.match(/@(\w{0,30})$/);
    if (match) {
      setQuery(match[1]);
      setAnchorStart(match.index!);
      setActiveIndex(0);
    } else {
      setQuery(null);
      setProfiles([]);
    }
  };

  useEffect(() => {
    if (query === null) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, name')
        .ilike('name', `${query}%`)
        .limit(6);
      setProfiles(data ?? []);
    }, 150);
  }, [query]);

  const buildInsert = (name: string): string => {
    const cursor = taRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const match = before.match(/@(\w*)$/);
    if (!match) return value;
    const start = match.index!;
    return value.slice(0, start) + `@${name} ` + value.slice(cursor);
  };

  const close = () => { setQuery(null); setProfiles([]); };

  const handleKey = (e: React.KeyboardEvent, onInsert: (newVal: string) => void) => {
    if (query === null || profiles.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, profiles.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' || e.key === 'Tab') {
      const p = profiles[activeIndex];
      if (p?.name) { e.preventDefault(); onInsert(buildInsert(p.name)); close(); }
    } else if (e.key === 'Escape') { close(); }
  };

  return { open: query !== null && profiles.length > 0, profiles, activeIndex, query, detect, buildInsert, close, handleKey };
}
