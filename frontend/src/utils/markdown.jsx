import React from 'react';

/**
 * Lightweight safe markdown renderer for conversational AI answers and mentor chat.
 */
export function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 space-y-1.5 pl-5 list-disc text-slate-300">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">{parseInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${index}`} className="my-3 p-3.5 bg-dark-950/80 border border-slate-700/60 rounded-xl overflow-x-auto text-xs font-mono text-cyan-300">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Unordered lists
    const listMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (listMatch) {
      listItems.push(listMatch[2]);
      return;
    } else {
      flushList();
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h4-${index}`} className="text-base font-bold text-white mt-4 mb-2 flex items-center gap-2">
          {parseInline(line.slice(4))}
        </h4>
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-lg font-extrabold text-cyan-300 mt-5 mb-2.5">
          {parseInline(line.slice(3))}
        </h3>
      );
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h2-${index}`} className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mt-6 mb-3">
          {parseInline(line.slice(2))}
        </h2>
      );
      return;
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={`spacer-${index}`} className="h-2" />);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${index}`} className="text-slate-300 leading-relaxed my-1.5">
        {parseInline(line)}
      </p>
    );
  });

  flushList();
  return elements;
}

function parseInline(text) {
  if (!text) return '';
  // Split tokens by bold, code, and links
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    // Inline code `code`
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Link [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    let firstMatch = null;
    let type = null;

    if (boldMatch && (!firstMatch || boldMatch.index < firstMatch.index)) {
      firstMatch = boldMatch;
      type = 'bold';
    }
    if (codeMatch && (!firstMatch || codeMatch.index < firstMatch.index)) {
      firstMatch = codeMatch;
      type = 'code';
    }
    if (linkMatch && (!firstMatch || linkMatch.index < firstMatch.index)) {
      firstMatch = linkMatch;
      type = 'link';
    }

    if (!firstMatch) {
      parts.push(remaining);
      break;
    }

    if (firstMatch.index > 0) {
      parts.push(remaining.substring(0, firstMatch.index));
    }

    if (type === 'bold') {
      parts.push(<strong key={key++} className="font-semibold text-white">{firstMatch[1]}</strong>);
    } else if (type === 'code') {
      parts.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-dark-800 text-cyan-300 font-mono text-xs border border-slate-700/50">{firstMatch[1]}</code>);
    } else if (type === 'link') {
      parts.push(
        <a key={key++} href={firstMatch[2]} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline font-medium">
          {firstMatch[1]} ↗
        </a>
      );
    }

    remaining = remaining.substring(firstMatch.index + firstMatch[0].length);
  }

  return parts;
}
