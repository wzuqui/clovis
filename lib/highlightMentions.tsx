import React from 'react';

export function highlightMentions(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, child => {
    if (typeof child !== 'string') return child;
    const parts = child.split(/(@\w+)/g);
    if (parts.length <= 1) return child;
    return parts.map((part, i) =>
      /^@\w+$/.test(part)
        ? <span key={i} className="mention-hl">@{part.slice(1).replace(/_/g, ' ')}</span>
        : part
    );
  });
}
