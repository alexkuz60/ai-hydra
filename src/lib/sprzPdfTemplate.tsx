import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { SPRZ_TAXONOMY } from './sprzTaxonomy';

// Register Roboto with weight variants for Cyrillic
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Roboto-Medium.ttf', fontWeight: 500 },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
  ],
});

/* ── Color themes ── */
export type PdfTheme = 'dark' | 'light';

interface ThemeColors {
  bg: string; bgCard: string; fg: string; fgStrong: string; muted: string;
  primary: string; primaryDark: string; accent: string;
  success: string; warning: string; danger: string;
  trackBg: string; activeHighlight: string; cardBorder: string; sectionBorder: string;
}

const THEMES: Record<PdfTheme, ThemeColors> = {
  dark: {
    bg: '#1a1a2e',
    bgCard: '#111a35',
    fg: '#ffffff',
    fgStrong: '#ffffff',
    muted: '#d0d0d0',
    primary: '#00BCD4',
    primaryDark: '#0097A7',
    accent: '#7c3aed',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    trackBg: '#2d2d4e',
    activeHighlight: 'rgba(0, 188, 212, 0.12)',
    cardBorder: '#00BCD4',
    sectionBorder: '#0097A7',
  },
  light: {
    bg: '#ffffff',
    bgCard: '#f8f9fb',
    fg: '#000000',
    fgStrong: '#000000',
    muted: '#333333',
    primary: '#0097A7',
    primaryDark: '#00796B',
    accent: '#6d28d9',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    trackBg: '#e2e2e2',
    activeHighlight: 'rgba(0, 151, 167, 0.08)',
    cardBorder: '#0097A7',
    sectionBorder: '#0097A7',
  },
};

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    page: {
      fontFamily: 'Roboto',
      backgroundColor: c.bg,
      color: c.fg,
      padding: 40,
      fontSize: 10,
    },
    coverPage: {
      fontFamily: 'Roboto',
      backgroundColor: c.bg,
      color: c.fgStrong,
      padding: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    coverBadge: {
      backgroundColor: c.primaryDark,
      color: '#ffffff',
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 500,
      marginBottom: 20,
      letterSpacing: 1,
    },
    coverTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: c.primary,
      textAlign: 'center',
      marginBottom: 12,
      maxWidth: 400,
    },
    coverSubtitle: {
      fontSize: 14,
      fontWeight: 500,
      color: c.muted,
      textAlign: 'center',
      maxWidth: 380,
      lineHeight: 1.5,
    },
    coverDate: {
      fontSize: 10,
      color: c.muted,
      position: 'absolute',
      bottom: 40,
      right: 60,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.primary,
      marginBottom: 16,
      paddingBottom: 6,
      borderBottomWidth: 2,
      borderBottomColor: c.sectionBorder,
    },
    sectionSubtitle: {
      fontSize: 13,
      fontWeight: 500,
      color: c.fgStrong,
      marginBottom: 8,
      marginTop: 12,
    },
    bodyText: {
      fontSize: 10,
      fontWeight: 500,
      color: c.fgStrong,
      lineHeight: 1.6,
      marginBottom: 6,
    },
    mutedText: {
      fontSize: 9,
      color: c.muted,
      lineHeight: 1.5,
    },
    card: {
      backgroundColor: c.bgCard,
      borderRadius: 8,
      padding: 14,
      marginBottom: 10,
      borderLeftWidth: 3,
      borderLeftColor: c.cardBorder,
      position: 'relative',
      zIndex: 1,
    },
    cardTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: c.fgStrong,
      marginBottom: 4,
    },
    cardBody: {
      fontSize: 10,
      fontWeight: 'bold',
      color: c.fgStrong,
      lineHeight: 1.5,
      position: 'relative',
      zIndex: 2,
      opacity: 1,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
    },
    progressTrack: {
      height: 10,
      backgroundColor: c.trackBg,
      borderRadius: 5,
      flex: 1,
      overflow: 'hidden',
    },
    progressFill: {
      height: 10,
      backgroundColor: c.primary,
      borderRadius: 5,
    },
    progressLabel: {
      fontSize: 12,
      fontWeight: 'bold',
      color: c.primary,
      marginLeft: 10,
      minWidth: 36,
    },
    taxonomyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    taxonomyActive: {
      backgroundColor: c.activeHighlight,
      borderRadius: 4,
    },
    taxonomyIcon: {
      fontSize: 10,
      fontWeight: 'bold',
      width: 28,
      color: c.muted,
    },
    taxonomyLabel: {
      fontSize: 10,
      fontWeight: 500,
      color: c.fg,
    },
    taxonomySubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 36,
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
      color: c.muted,
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 40,
      right: 40,
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontSize: 8,
      color: c.muted,
    },
    conclusionCard: {
      backgroundColor: c.bgCard,
      borderRadius: 6,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: c.accent,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      fontSize: 9,
      fontWeight: 500,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
  });
}

export interface SprzPdfData {
  title: string;
  goal: string;
  progress: number;
  status: string;
  typeIds: string[];
  subtypeIds: string[];
  createdAt: string;
  lang: 'ru' | 'en';
  theme?: PdfTheme;
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

/* ── Sub-components ── */

function Footer({ s }: { s: ReturnType<typeof makeStyles> }) {
  return (
    <View style={s.footer} fixed>
      <Text>AI Hydra • SPRS</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

const PDF_TYPE_ICONS: Record<string, string> = {
  science: '[S]',
  technology: '[T]',
  vibe_coding: '[V]',
  society: '[C]',
  design: '[D]',
  business: '[B]',
  creativity: '[A]',
};

function TaxonomyTree({ typeIds, subtypeIds, lang, s, c }: {
  typeIds: string[]; subtypeIds: string[]; lang: string;
  s: ReturnType<typeof makeStyles>; c: ThemeColors;
}) {
  const isRu = lang === 'ru';
  return (
    <View>
      <Text style={s.sectionSubtitle}>{isRu ? 'Типизация проекта' : 'Project Classification'}</Text>
      {SPRZ_TAXONOMY.map(type => {
        const active = typeIds.includes(type.id);
        return (
          <View key={type.id}>
            <View style={[s.taxonomyRow, active && s.taxonomyActive]}>
              <Text style={[s.taxonomyIcon, active && { color: c.primary }]}>
                {PDF_TYPE_ICONS[type.id] || '[-]'}
              </Text>
              <Text style={[s.taxonomyLabel, active && { color: c.primary }]}>
                {isRu ? type.label.ru : type.label.en}
              </Text>
            </View>
            {active && type.subtypes.map(sub => {
              const subActive = subtypeIds.includes(sub.id);
              return (
                <View key={sub.id} style={s.taxonomySubRow}>
                  <View style={[s.taxonomyDot, { backgroundColor: subActive ? c.primary : c.muted }]} />
                  <Text style={[s.taxonomySub, subActive && { color: c.fg }]}>
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

function statusColor(status: string, c: ThemeColors) {
  switch (status) {
    case 'approved': return c.success;
    case 'rejected': return c.danger;
    case 'rework': return c.warning;
    default: return c.muted;
  }
}

/* ── Main document ── */

export function SprzPdfDocument({ data }: { data: SprzPdfData }) {
  const theme = data.theme || 'dark';
  const c = THEMES[theme];
  const s = makeStyles(c);
  const isRu = data.lang === 'ru';

  const typeLabels = data.typeIds
    .map(id => SPRZ_TAXONOMY.find(t => t.id === id))
    .filter(Boolean)
    .map(t => `${PDF_TYPE_ICONS[t!.id] || ''} ${isRu ? t!.label.ru : t!.label.en}`)
    .join(' + ');

  const dateStr = new Date(data.createdAt).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <Document>
      {/* Cover */}
      <Page size="A4" orientation="landscape" style={s.coverPage}>
        {typeLabels && <Text style={s.coverBadge}>{typeLabels}</Text>}
        <Text style={s.coverTitle}>{data.title}</Text>
        {data.goal && <Text style={s.coverSubtitle}>{data.goal}</Text>}
        <Text style={s.coverDate}>{dateStr}</Text>
      </Page>

      {/* Goal + Progress + Taxonomy */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.sectionTitle}>{isRu ? 'Цель и прогресс' : 'Goal & Progress'}</Text>
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
          <View style={[s.statusBadge, { backgroundColor: data.status === 'active' ? c.success : c.muted }]}>
            <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: 500 }}>
              {data.status === 'active' ? (isRu ? 'Активен' : 'Active') : data.status}
            </Text>
          </View>
        </View>
        <TaxonomyTree typeIds={data.typeIds} subtypeIds={data.subtypeIds} lang={data.lang} s={s} c={c} />
        <Footer s={s} />
      </Page>

      {/* Strategy */}
      {data.approvalSections && data.approvalSections.length > 0 && (
        <Page size="A4" orientation="landscape" style={s.page} wrap>
          <Text style={s.sectionTitle}>{isRu ? 'Стратегия' : 'Strategy'}</Text>
          {data.approvalSections.map((section, i) => (
            <View key={i} style={s.card} wrap={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.cardTitle}>{section.title}</Text>
                <View style={[s.statusBadge, { backgroundColor: statusColor(section.status, c) }]}>
                  <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: 500 }}>{section.status}</Text>
                </View>
              </View>
              {section.body && (
                <Text style={s.cardBody}>{section.body.slice(0, 400)}{section.body.length > 400 ? '...' : ''}</Text>
              )}
              {section.children && section.children.length > 0 && (
                <View style={{ marginTop: 6, paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: c.muted }}>
                  {section.children.map((child, j) => (
                    <View key={j} style={{ marginBottom: 4 }}>
                      <Text style={{ fontSize: 9, fontWeight: 500, color: c.fg }}>• {child.title}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
          <Footer s={s} />
        </Page>
      )}

      {/* Sessions */}
      {data.sessions && data.sessions.length > 0 && (
        <Page size="A4" orientation="landscape" style={s.page} wrap>
          <Text style={s.sectionTitle}>{isRu ? 'Этапы работы' : 'Work Stages'}</Text>
          {data.sessions.map((session, i) => (
            <View key={i} style={s.card} wrap={false}>
              <Text style={s.cardTitle}>{session.title}</Text>
              {session.description && (
                <Text style={s.cardBody}>{session.description.slice(0, 300)}</Text>
              )}
              <Text style={s.mutedText}>{session.updatedAt}</Text>
            </View>
          ))}
          <Footer s={s} />
        </Page>
      )}

      {/* Conclusions */}
      {data.conclusions && data.conclusions.length > 0 && (
        <Page size="A4" orientation="landscape" style={s.page} wrap>
          <Text style={s.sectionTitle}>{isRu ? 'Ключевые выводы' : 'Key Conclusions'}</Text>
          {data.conclusions.map((cc, i) => (
            <View key={i} style={s.conclusionCard} wrap={false}>
              <Text style={s.cardBody}>{cc.content.slice(0, 500)}{cc.content.length > 500 ? '...' : ''}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={s.mutedText}>{cc.createdAt}</Text>
                {cc.isPinned && (
                  <Text style={{ fontSize: 8, fontWeight: 'bold', color: c.warning }}>[*] {isRu ? 'Закреплено' : 'Pinned'}</Text>
                )}
              </View>
            </View>
          ))}
          <Footer s={s} />
        </Page>
      )}
    </Document>
  );
}
