'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';

export interface MentionProfile { id: string; name: string | null; }

function getCaretCoords(el: HTMLTextAreaElement, pos: number) {
  const div = document.createElement('div');
  const style = window.getComputedStyle(el);
  const props = [
    'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
    'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent',
    'textDecoration', 'letterSpacing', 'wordSpacing', 'tabSize',
  ] as const;
  props.forEach(p => { (div.style as any)[p] = (style as any)[p]; });
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  div.style.top = '0';
  div.style.left = '-9999px';
  div.textContent = el.value.substring(0, pos);
  const span = document.createElement('span');
  span.textContent = '.';
  div.appendChild(span);
  document.body.appendChild(div);
  const top = span.offsetTop - el.scrollTop;
  const left = span.offsetLeft - el.scrollLeft;
  const height = parseInt(style.lineHeight) || parseInt(style.fontSize) * 1.4;
  document.body.removeChild(div);
  return { top, left, height };
}

export function useMentionDropdown(value: string, taRef: React.RefObject<HTMLTextAreaElement>) {
  const [profiles, setProfiles] = useState<MentionProfile[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; height: number }>({ top: 0, left: 0, height: 20 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detect = (newValue: string) => {
    const cursor = taRef.current?.selectionStart ?? newValue.length;
    const before = newValue.slice(0, cursor);
    const match = before.match(/@(\w{0,30})$/);
    if (match && taRef.current) {
      setQuery(match[1]);
      setActiveIndex(0);
      setCoords(getCaretCoords(taRef.current, match.index!));
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
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(10);
      setProfiles(data ?? []);
    }, 150);
  }, [query]);

  const buildInsert = (name: string): string => {
    const cursor = taRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const match = before.match(/@(\w*)$/);
    if (!match) return value;
    const start = match.index!;
    const tag = '@' + name.replace(/ /g, '_');
    return value.slice(0, start) + `${tag} ` + value.slice(cursor);
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

  return { open: query !== null && profiles.length > 0, profiles, activeIndex, query, coords, detect, buildInsert, close, handleKey };
}
