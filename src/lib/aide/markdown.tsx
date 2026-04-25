import React from "react";

/**
 * Tiny markdown renderer (no deps) — supports:
 *  - # / ## / ### headings
 *  - bold (**), italic (*), inline code (`)
 *  - bullet lists (- ), numbered lists (1.)
 *  - tables ( | a | b | )
 *  - blockquotes (>)
 *  - horizontal rule (---)
 *  - paragraphs separated by blank lines
 */

function inline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let rest = text;
  let key = 0;
  const patterns: { rx: RegExp; render: (m: RegExpExecArray) => React.ReactNode }[] = [
    { rx: /\*\*(.+?)\*\*/, render: (m) => <strong key={key++}>{m[1]}</strong> },
    { rx: /`([^`]+)`/, render: (m) => <code key={key++} className="px-1 py-0.5 rounded bg-muted text-[0.92em]">{m[1]}</code> },
    { rx: /\*(.+?)\*/, render: (m) => <em key={key++}>{m[1]}</em> },
  ];
  while (rest.length) {
    let bestIdx = -1;
    let bestPat: typeof patterns[number] | null = null;
    let bestMatch: RegExpExecArray | null = null;
    for (const p of patterns) {
      const m = p.rx.exec(rest);
      if (m && (bestIdx === -1 || m.index < bestIdx)) {
        bestIdx = m.index; bestPat = p; bestMatch = m;
      }
    }
    if (!bestPat || !bestMatch) { parts.push(rest); break; }
    if (bestIdx > 0) parts.push(rest.slice(0, bestIdx));
    parts.push(bestPat.render(bestMatch));
    rest = rest.slice(bestIdx + bestMatch[0].length);
  }
  return parts;
}

export function MarkdownView({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank
    if (!line.trim()) { i++; continue; }

    // Heading
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      const cls = level === 1 ? "text-2xl font-bold mt-6 mb-3"
        : level === 2 ? "text-xl font-bold mt-5 mb-2 text-primary"
        : level === 3 ? "text-lg font-semibold mt-4 mb-2"
        : "text-base font-semibold mt-3 mb-1";
      const Tag = (`h${level}` as unknown) as keyof JSX.IntrinsicElements;
      out.push(React.createElement(Tag, { key: key++, className: cls }, inline(text)));
      i++; continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      out.push(<hr key={key++} className="my-4 border-border" />);
      i++; continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const block: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        block.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(
        <blockquote key={key++} className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-3">
          {inline(block.join(" "))}
        </blockquote>
      );
      continue;
    }

    // Table
    if (line.includes("|") && lines[i + 1]?.match(/^\s*\|?[\s\-:|]+\|?\s*$/)) {
      const header = line.split("|").map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1 || arr.length === 1);
      const cells = (l: string) => l.split("|").map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1 || arr.length === 1);
      const headerCells = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(cells(lines[i])); i++;
      }
      out.push(
        <div key={key++} className="my-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-muted/60">{headerCells.map((h, j) => <th key={j} className="border border-border px-3 py-2 text-left font-semibold">{inline(h)}</th>)}</tr></thead>
            <tbody>{rows.map((r, ri) => <tr key={ri} className="even:bg-muted/30">{r.map((c, ci) => <td key={ci} className="border border-border px-3 py-2 align-top">{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }

    // Bullet list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, "")); i++;
      }
      out.push(<ul key={key++} className="list-disc pl-6 my-2 space-y-1">{items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>);
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++;
      }
      out.push(<ol key={key++} className="list-decimal pl-6 my-2 space-y-1">{items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ol>);
      continue;
    }

    // Paragraph (gather until blank line)
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>|\s*[-*]\s|\s*\d+\.\s|---+$)/.test(lines[i]) && !lines[i].includes("|")) {
      para.push(lines[i]); i++;
    }
    out.push(<p key={key++} className="my-2 leading-relaxed">{inline(para.join(" "))}</p>);
  }

  return <div className="text-sm">{out}</div>;
}