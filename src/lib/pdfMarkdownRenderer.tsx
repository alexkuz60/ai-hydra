import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

interface MdStyles {
  fg: string;
  muted: string;
  primary: string;
  accent: string;
}

const s = StyleSheet.create({
  paragraph: { fontSize: 11, lineHeight: 1.55, marginBottom: 6 },
  heading2: { fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
  heading3: { fontSize: 12, fontWeight: 'bold', marginTop: 8, marginBottom: 3 },
  heading4: { fontSize: 11, fontWeight: 'bold', marginTop: 6, marginBottom: 2 },
  listItem: { flexDirection: 'row' as const, marginBottom: 3, paddingLeft: 8 },
  bullet: { width: 14, fontSize: 11 },
  listText: { flex: 1, fontSize: 11, lineHeight: 1.45 },
  bold: { fontWeight: 'bold' as const },
  hr: { borderBottomWidth: 1, marginVertical: 8 },
});

/** Render inline bold (**text**) */
function renderInline(text: string, color: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return <Text style={{ color }}>{text}</Text>;
  return (
    <Text style={{ color }}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <Text key={i} style={s.bold}>{part.slice(2, -2)}</Text>;
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

/** Parse markdown string into react-pdf elements */
export function renderMarkdownForPdf(content: string, colors: MdStyles) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();

    // Empty line
    if (!line.trim()) { i++; continue; }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      elements.push(<View key={i} style={[s.hr, { borderBottomColor: colors.muted }]} />);
      i++; continue;
    }

    // Headings
    if (line.startsWith('#### ')) {
      elements.push(
        <Text key={i} style={[s.heading4, { color: colors.fg }]}>{line.slice(5)}</Text>
      );
      i++; continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <Text key={i} style={[s.heading3, { color: colors.primary }]}>{line.slice(4)}</Text>
      );
      i++; continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <Text key={i} style={[s.heading2, { color: colors.primary }]}>{line.slice(3)}</Text>
      );
      i++; continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <Text key={i} style={[s.heading2, { color: colors.primary }]}>{line.slice(2)}</Text>
      );
      i++; continue;
    }

    // List items (-, *, numbered)
    const listMatch = line.match(/^\s*[-*•]\s+(.+)/) || line.match(/^\s*\d+[.)]\s+(.+)/);
    if (listMatch) {
      elements.push(
        <View key={i} style={s.listItem}>
          <Text style={[s.bullet, { color: colors.primary }]}>•</Text>
          <View style={s.listText}>{renderInline(listMatch[1], colors.fg)}</View>
        </View>
      );
      i++; continue;
    }

    // Regular paragraph — collect consecutive non-special lines
    let para = line;
    i++;
    while (i < lines.length) {
      const next = lines[i].trimEnd();
      if (!next.trim() || next.startsWith('#') || next.startsWith('---') ||
          next.match(/^\s*[-*•]\s+/) || next.match(/^\s*\d+[.)]\s+/)) break;
      para += ' ' + next.trim();
      i++;
    }
    elements.push(
      <View key={`p-${i}`} style={s.paragraph}>{renderInline(para, colors.fg)}</View>
    );
  }

  return <>{elements}</>;
}
