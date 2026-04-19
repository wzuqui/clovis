import React from 'react';

const MENTION_RE = /@\[([^\]]+)\]|@(\w+)/g;

export function highlightMentions(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, child => {
    if (typeof child !== 'string') return child;
    const parts: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    MENTION_RE.lastIndex = 0;
    while ((m = MENTION_RE.exec(child)) !== null) {
      if (m.index > last) parts.push(child.slice(last, m.index));
      const name = m[1] ?? m[2];
      parts.push(<span key={m.index} className="mention-hl">@{name}</span>);
      last = m.index + m[0].length;
    }
    if (last < child.length) parts.push(child.slice(last));
    return parts.length > 1 ? parts : child;
  });
}
