import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import MarkdownContent from '../../components/MarkdownContent';
import { useTheme } from '../../contexts/ThemeContext';
import { articles } from '../../data/forumData';
import { radius, spacing } from '../../styles/theme';

function getPreview(content) {
  return (
    content
      .split('\n')
      .find((line) => line.startsWith('## '))
      ?.slice(3) || 'Подробный материал для сотрудников'
  );
}

export default function ArticleScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { articleId } = route.params;
  const article = articles.find((item) => item.id === articleId);

  if (!article) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.ink }}>Статья не найдена</Text>
      </SafeAreaView>
    );
  }

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {article.categoryLabel}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <View style={s.catTag}>
            <Text style={s.catTagText}>{article.categoryLabel}</Text>
          </View>
          <Text style={s.kicker}>База знаний</Text>
          <Text style={s.title}>{article.title}</Text>
          <Text style={s.preview}>{getPreview(article.content)}</Text>
        </View>

        <View style={s.bodyCard}>
          <MarkdownContent content={article.content} colors={colors} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.paper,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      paddingTop: Platform.OS === 'android' ? spacing.xxxl : spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: {
      fontSize: 24,
      color: colors.moss,
      fontWeight: '600',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '600',
      color: colors.ink,
      fontFamily: 'Inter_600SemiBold',
    },
    content: {
      padding: spacing.lg,
      gap: spacing.md,
      paddingBottom: spacing.xxxl,
    },
    heroCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    catTag: {
      alignSelf: 'flex-start',
      backgroundColor: colors.moss + '22',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    catTagText: {
      fontSize: 12,
      color: colors.moss,
      fontFamily: 'Inter_600SemiBold',
    },
    kicker: {
      fontSize: 11,
      color: colors.ink3,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontFamily: 'Inter_500Medium',
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.ink,
      fontFamily: 'Inter_700Bold',
      lineHeight: 30,
    },
    preview: {
      fontSize: 14,
      color: colors.ink2,
      fontFamily: 'Inter_400Regular',
      lineHeight: 20,
    },
    bodyCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
  });
