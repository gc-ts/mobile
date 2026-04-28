import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, spacing } from '../styles/theme';

function renderInline(text, style, strongStyle) {
  const parts = String(text ?? '').split(/\*\*(.*?)\*\*/g);

  return (
    <Text style={style}>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <Text key={`${part}-${index}`} style={strongStyle}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}

function renderTableRow(line, colors, key) {
  const cells = line
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean);

  if (cells.length === 0 || cells.every((cell) => /^-+$/.test(cell))) {
    return null;
  }

  return (
    <View
      key={key}
      style={[
        styles.tableRow,
        {
          backgroundColor: colors.bg2,
          borderColor: colors.line,
        },
      ]}
    >
      {cells.map((cell, index) => (
        <Text
          key={`${cell}-${index}`}
          style={[
            styles.tableCell,
            {
              color: colors.ink2,
              borderRightColor: index === cells.length - 1 ? 'transparent' : colors.line,
            },
          ]}
        >
          {cell}
        </Text>
      ))}
    </View>
  );
}

export default function MarkdownContent({ content, colors }) {
  const lines = String(content ?? '').split('\n');

  return (
    <View style={styles.root}>
      {lines.map((line, index) => {
        if (line.startsWith('# ')) {
          return (
            <Text key={index} style={[styles.h1, { color: colors.ink }]}>
              {line.slice(2)}
            </Text>
          );
        }

        if (line.startsWith('## ')) {
          return (
            <Text
              key={index}
              style={[
                styles.h2,
                {
                  color: colors.ink,
                  borderBottomColor: colors.line,
                },
              ]}
            >
              {line.slice(3)}
            </Text>
          );
        }

        if (line.startsWith('### ')) {
          return (
            <Text key={index} style={[styles.h3, { color: colors.ink }]}>
              {line.slice(4)}
            </Text>
          );
        }

        if (line.startsWith('> ')) {
          return (
            <View
              key={index}
              style={[
                styles.blockquote,
                {
                  borderLeftColor: colors.moss,
                  backgroundColor: colors.bg2,
                },
              ]}
            >
              {renderInline(
                line.slice(2),
                [styles.blockquoteText, { color: colors.ink2 }],
                [styles.strong, { color: colors.ink }]
              )}
            </View>
          );
        }

        if (line.startsWith('|')) {
          return renderTableRow(line, colors, index);
        }

        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <View key={index} style={styles.listRow}>
              <Text style={[styles.bullet, { color: colors.moss }]}>•</Text>
              <View style={styles.listContent}>
                {renderInline(
                  line.slice(2),
                  [styles.body, { color: colors.ink2 }],
                  [styles.strong, { color: colors.ink }]
                )}
              </View>
            </View>
          );
        }

        if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+)\.\s(.*)$/);

          return (
            <View key={index} style={styles.listRow}>
              <Text style={[styles.bulletNumber, { color: colors.moss }]}>
                {match?.[1]}.
              </Text>
              <View style={styles.listContent}>
                {renderInline(
                  match?.[2] ?? '',
                  [styles.body, { color: colors.ink2 }],
                  [styles.strong, { color: colors.ink }]
                )}
              </View>
            </View>
          );
        }

        if (line.trim() === '') {
          return <View key={index} style={styles.spacer} />;
        }

        return (
          <View key={index}>
            {renderInline(
              line,
              [styles.body, { color: colors.ink2 }],
              [styles.strong, { color: colors.ink }]
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  h1: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Inter_700Bold',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  h2: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: 'Inter_700Bold',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
  },
  h3: {
    fontSize: 17,
    lineHeight: 23,
    fontFamily: 'Inter_600SemiBold',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: 'Inter_400Regular',
  },
  strong: {
    fontFamily: 'Inter_700Bold',
  },
  blockquote: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  blockquoteText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  listContent: {
    flex: 1,
  },
  bullet: {
    width: 18,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  bulletNumber: {
    minWidth: 24,
    fontSize: 14,
    lineHeight: 23,
    fontFamily: 'Inter_700Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginVertical: 2,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRightWidth: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Inter_500Medium',
  },
  spacer: {
    height: 6,
  },
});
