import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Link,
} from '@react-pdf/renderer';
import { SPRZ_TAXONOMY } from './sprzTaxonomy';

// Register Roboto for Cyrillic
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 'normal' },
  ],
});

const COLORS = {
  primary: '#00BCD4',
  primaryDark: '#0097A7',
  dark: '#1a1a2e',
  darkCard: '#16213e',
  light: '#e0e0e0',
  muted: '#9e9e9e',
  white: '#ffffff',
  accent: '#7c3aed',
  success: '#22c55e',
  warning: '#f59e0b',
};

const s = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    backgroundColor: COLORS.dark,
    color: COLORS.light,
    padding: 40,
    fontSize: 10,
  },
  // Cover
  coverPage: {
    fontFamily: 'Roboto',
    backgroundColor: COLORS.dark,
    color: COLORS.white,
    padding: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverBadge: {
    backgroundColor: COLORS.primaryDark,
    color: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 11,
    marginBottom: 20,
    letterSpacing: 1,
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: 400,
  },
  coverSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 1.5,
  },
  coverDate: {
    fontSize: 10,
    color: COLORS.muted,
    position: 'absolute',
    bottom: 40,
    right: 60,
  },
  // Section page
  sectionTitle: {
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 16,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primaryDark,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.light,
    marginBottom: 8,
    marginTop: 12,
  },
  bodyText: {
    fontSize: 10,
    color: COLORS.light,
    lineHeight: 1.6,
    marginBottom: 6,
  },
  mutedText: {
    fontSize: 9,
    color: COLORS.muted,
    lineHeight: 1.5,
  },
  // Cards
  card: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  cardTitle: {
    fontSize: 12,
    color: COLORS.white,
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 9,
    color: COLORS.light,
    lineHeight: 1.5,
  },
  // Progress bar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#2d2d4e',
    borderRadius: 5,
    flex: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 10,
    minWidth: 36,
  },
  // Taxonomy tree
  taxonomyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  taxonomyActive: {
    backgroundColor: 'rgba(0, 188, 212, 0.12)',
    borderRadius: 4,
  },
  taxonomyIcon: {
    fontSize: 14,
    width: 22,
  },
  taxonomyLabel: {
    fontSize: 10,
    color: COLORS.light,
  },
  taxonomySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 30,
    paddingVertical: 2,
  },
  taxonomyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 6,
  },
  taxonomySub: {
    fontSize: 9,
    color: COLORS.muted,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: COLORS.muted,
  },
  // Conclusion
  conclusionCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 9,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
});

export interface SprzPdfData {
  title: string;
  goal: string;
  progress: number;
  status: string;
  typeIds: string[];
  subtypeIds: string[];
  createdAt: string;
  lang: 'ru' | 'en';
  approvalSections?: Array<{
    title: string;
    body: string;
    status: string;
    source: string;
    children?: Array<{ title: string; body: string; status: string }>;
  }>;
  sessions?: Array<{ title: string; description?: string; updatedAt: string }>;
  conclusions?: Array<{ content: string; isPinned: boolean; createdAt: string }>;
  publicUrl?: string;
}

function Footer({ pageNum, lang }: { pageNum: number; lang: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>AI Hydra • SPRS</Text>
      <Text>{pageNum}</Text>
    </View>
  );
}

function TaxonomyTree({ typeIds, subtypeIds, lang }: { typeIds: string[]; subtypeIds: string[]; lang: string }) {
  const isRu = lang === 'ru';
  return (
    <View>
      <Text style={s.sectionSubtitle}>{isRu ? 'Типизация проекта' : 'Project Classification'}</Text>
      {SPRZ_TAXONOMY.map(type => {
        const active = typeIds.includes(type.id);
        return (
          <View key={type.id}>
            <View style={[s.taxonomyRow, active && s.taxonomyActive]}>
              <Text style={s.taxonomyIcon}>{type.icon}</Text>
              <Text style={[s.taxonomyLabel, active && { color: COLORS.primary }]}>
                {isRu ? type.label.ru : type.label.en}
              </Text>
            </View>
            {active && type.subtypes.map(sub => {
              const subActive = subtypeIds.includes(sub.id);
              return (
                <View key={sub.id} style={s.taxonomySubRow}>
                  <View style={[s.taxonomyDot, { backgroundColor: subActive ? COLORS.primary : COLORS.muted }]} />
                  <Text style={[s.taxonomySub, subActive && { color: COLORS.light }]}>
                    {isRu ? sub.label.ru : sub.label.en}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'approved': return COLORS.success;
    case 'rejected': return '#ef4444';
    case 'rework': return COLORS.warning;
    default: return COLORS.muted;
  }
}

export function SprzPdfDocument({ data }: { data: SprzPdfData }) {
  const isRu = data.lang === 'ru';
  const typeLabels = data.typeIds
    .map(id => SPRZ_TAXONOMY.find(t => t.id === id))
    .filter(Boolean)
    .map(t => `${t!.icon} ${isRu ? t!.label.ru : t!.label.en}`)
    .join(' + ');

  const dateStr = new Date(data.createdAt).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <Document>
      {/* Page 1: Cover */}
      <Page size="A4" orientation="landscape" style={s.coverPage}>
        {typeLabels && <Text style={s.coverBadge}>{typeLabels}</Text>}
        <Text style={s.coverTitle}>{data.title}</Text>
        {data.goal && (
          <Text style={s.coverSubtitle}>{data.goal}</Text>
        )}
        <Text style={s.coverDate}>{dateStr}</Text>
      </Page>

      {/* Page 2: Goal + Progress + Taxonomy */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.sectionTitle}>
          {isRu ? 'Цель и прогресс' : 'Goal & Progress'}
        </Text>

        {data.goal && (
          <View style={s.card}>
            <Text style={s.cardTitle}>{isRu ? 'Цель проекта' : 'Project Goal'}</Text>
            <Text style={s.cardBody}>{data.goal}</Text>
          </View>
        )}

        <View style={s.progressContainer}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${Math.min(data.progress, 100)}%` }]} />
          </View>
          <Text style={s.progressLabel}>{Math.round(data.progress)}%</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 16 }}>
          <View style={[s.statusBadge, { backgroundColor: data.status === 'active' ? COLORS.success : COLORS.muted }]}>
            <Text style={{ color: COLORS.white, fontSize: 9 }}>
              {data.status === 'active' ? (isRu ? 'Активен' : 'Active') : data.status}
            </Text>
          </View>
        </View>

        <TaxonomyTree typeIds={data.typeIds} subtypeIds={data.subtypeIds} lang={data.lang} />
        <Footer pageNum={2} lang={data.lang} />
      </Page>

      {/* Page 3: Strategy sections */}
      {data.approvalSections && data.approvalSections.length > 0 && (
        <Page size="A4" orientation="landscape" style={s.page} wrap>
          <Text style={s.sectionTitle}>
            {isRu ? 'Стратегия' : 'Strategy'}
          </Text>
          {data.approvalSections.map((section, i) => (
            <View key={i} style={s.card} wrap={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.cardTitle}>{section.title}</Text>
                <View style={[s.statusBadge, { backgroundColor: statusColor(section.status) }]}>
                  <Text style={{ color: COLORS.white, fontSize: 8 }}>{section.status}</Text>
                </View>
              </View>
              {section.body && (
                <Text style={s.cardBody}>{section.body.slice(0, 400)}{section.body.length > 400 ? '...' : ''}</Text>
              )}
              {section.children && section.children.length > 0 && (
                <View style={{ marginTop: 6, paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: COLORS.muted }}>
                  {section.children.map((child, j) => (
                    <View key={j} style={{ marginBottom: 4 }}>
                      <Text style={{ fontSize: 9, color: COLORS.light }}>• {child.title}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
          <Footer pageNum={3} lang={data.lang} />
        </Page>
      )}

      {/* Page 4: Sessions / Stages */}
      {data.sessions && data.sessions.length > 0 && (
        <Page size="A4" orientation="landscape" style={s.page} wrap>
          <Text style={s.sectionTitle}>
            {isRu ? 'Этапы работы' : 'Work Stages'}
          </Text>
          {data.sessions.map((session, i) => (
            <View key={i} style={s.card} wrap={false}>
              <Text style={s.cardTitle}>{session.title}</Text>
              {session.description && (
                <Text style={s.cardBody}>{session.description.slice(0, 300)}</Text>
              )}
              <Text style={s.mutedText}>{session.updatedAt}</Text>
            </View>
          ))}
          <Footer pageNum={4} lang={data.lang} />
        </Page>
      )}

      {/* Page 5: Conclusions */}
      {data.conclusions && data.conclusions.length > 0 && (
        <Page size="A4" orientation="landscape" style={s.page} wrap>
          <Text style={s.sectionTitle}>
            {isRu ? 'Ключевые выводы' : 'Key Conclusions'}
          </Text>
          {data.conclusions.map((c, i) => (
            <View key={i} style={s.conclusionCard} wrap={false}>
              <Text style={s.cardBody}>{c.content.slice(0, 500)}{c.content.length > 500 ? '...' : ''}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={s.mutedText}>{c.createdAt}</Text>
                {c.isPinned && (
                  <Text style={{ fontSize: 8, color: COLORS.warning }}>📌 {isRu ? 'Закреплено' : 'Pinned'}</Text>
                )}
              </View>
            </View>
          ))}
          <Footer pageNum={5} lang={data.lang} />
        </Page>
      )}
    </Document>
  );
}
