import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { articles, categories, topics } from '../../data/forumData';
import { radius, spacing } from '../../styles/theme';

const SORT_OPTIONS = [
  { key: 'new', label: 'Новые' },
  { key: 'popular', label: 'Популярные' },
  { key: 'old', label: 'Старые' },
];

const VIEW_OPTIONS = [
  { key: 'topics', label: 'Обсуждения' },
  { key: 'articles', label: 'База знаний' },
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

function getArticlePreview(content) {
  return (
    content
      .split('\n')
      .find((line) => line.startsWith('## '))
      ?.slice(3) || 'Подробный материал для сотрудников'
  );
}

export default function ForumScreen({ navigation }) {
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState(null);
  const [sort, setSort] = useState('new');
  const [view, setView] = useState('topics');

  const filteredTopics = topics
    .filter((topic) => !activeCategory || topic.category === activeCategory)
    .sort((a, b) => {
      if (sort === 'popular') return b.likes - a.likes;
      if (sort === 'old') return new Date(a.date) - new Date(b.date);
      return new Date(b.date) - new Date(a.date);
    });

  const pinnedTopics = filteredTopics.filter((topic) => topic.pinned);
  const regularTopics = filteredTopics.filter((topic) => !topic.pinned);
  const sortedTopics = [...pinnedTopics, ...regularTopics];
  const filteredArticles = articles.filter((article) => !activeCategory || article.category === activeCategory);

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Форум</Text>
        <Text style={s.subtitle}>Обсуждения команды и внутренняя база знаний</Text>
      </View>

      <View style={s.modeRow}>
        {VIEW_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[s.modeChip, view === option.key && s.modeChipActive]}
            onPress={() => setView(option.key)}
          >
            <Text style={[s.modeText, view === option.key && s.modeTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.metricsRow}>
        <View style={s.metricCard}>
          <Text style={s.metricValue}>{topics.length}</Text>
          <Text style={s.metricLabel}>Тем</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricValue}>{articles.length}</Text>
          <Text style={s.metricLabel}>Материалов</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricValue}>{categories.length}</Text>
          <Text style={s.metricLabel}>Категорий</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.categories}
      >
        <TouchableOpacity
          style={[s.catChip, !activeCategory && s.catChipActive]}
          onPress={() => setActiveCategory(null)}
        >
          <Text style={[s.catText, !activeCategory && s.catTextActive]}>Все</Text>
        </TouchableOpacity>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[s.catChip, activeCategory === category.id && s.catChipActive]}
            onPress={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
          >
            <Text style={s.catEmoji}>{category.emoji}</Text>
            <Text style={[s.catText, activeCategory === category.id && s.catTextActive]}>
              {category.label}
            </Text>
            <View style={s.catBadge}>
              <Text style={s.catBadgeText}>{category.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {view === 'topics' ? (
        <>
          <View style={s.sortRow}>
            <Text style={s.sortLabel}>Сортировка:</Text>
            <View style={s.sortBtns}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[s.sortBtn, sort === option.key && s.sortBtnActive]}
                  onPress={() => setSort(option.key)}
                >
                  <Text style={[s.sortText, sort === option.key && s.sortTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <FlatList
            data={sortedTopics}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.topicCard}
                onPress={() => navigation.navigate('Topic', { topicId: item.id })}
              >
                <View style={s.topicTop}>
                  <View style={s.topicMeta}>
                    {item.pinned && (
                      <View style={s.pinnedBadge}>
                        <Text style={s.pinnedText}>📌 Закреплено</Text>
                      </View>
                    )}
                    <View style={[s.catTag, { backgroundColor: colors.bg2 }]}>
                      <Text style={s.catTagText}>{item.categoryLabel}</Text>
                    </View>
                  </View>
                  <Text style={s.topicDate}>{formatDate(item.date)}</Text>
                </View>

                <Text style={s.topicTitle}>{item.title}</Text>
                <Text style={s.topicExcerpt} numberOfLines={2}>
                  {item.excerpt}
                </Text>

                <View style={s.topicFooter}>
                  <View style={s.authorRow}>
                    <View style={s.authorAvatar}>
                      <Text style={s.authorInitials}>{item.authorInitials}</Text>
                    </View>
                    <Text style={s.authorName}>{item.author}</Text>
                  </View>
                  <View style={s.topicStatsRow}>
                    <Text style={s.topicStat}>❤ {item.likes}</Text>
                    <Text style={s.topicStat}>💬 {item.comments}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        <FlatList
          data={filteredArticles}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.articleCard}
              onPress={() => navigation.navigate('Article', { articleId: item.id })}
            >
              <View style={s.articleHeader}>
                <View style={s.articleBadge}>
                  <Text style={s.articleBadgeText}>{item.categoryLabel}</Text>
                </View>
                <Text style={s.articleReadHint}>Открыть →</Text>
              </View>

              <Text style={s.articleTitle}>{item.title}</Text>
              <Text style={s.articlePreview} numberOfLines={3}>
                {getArticlePreview(item.content)}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>Нет материалов</Text>
              <Text style={s.emptySubtitle}>Для этой категории статьи пока не добавлены.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.paper,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      paddingTop: Platform.OS === 'android' ? spacing.xxxl : spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.ink,
      fontFamily: 'Inter_700Bold',
    },
    subtitle: {
      fontSize: 13,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
      marginTop: 2,
    },
    modeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    modeChip: {
      flex: 1,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    modeChipActive: {
      backgroundColor: colors.moss,
      borderColor: 'transparent',
    },
    modeText: {
      fontSize: 13,
      color: colors.ink2,
      fontFamily: 'Inter_600SemiBold',
    },
    modeTextActive: {
      color: colors.pistachio,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    metricCard: {
      flex: 1,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
    },
    metricValue: {
      fontSize: 18,
      color: colors.moss,
      fontFamily: 'Inter_700Bold',
    },
    metricLabel: {
      fontSize: 12,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
      marginTop: 2,
    },
    categories: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    catChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm - 2,
      backgroundColor: colors.paper,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.line,
    },
    catChipActive: {
      backgroundColor: colors.moss,
      borderColor: 'transparent',
    },
    catEmoji: { fontSize: 14 },
    catText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.ink2,
      fontFamily: 'Inter_500Medium',
    },
    catTextActive: { color: colors.pistachio },
    catBadge: {
      backgroundColor: colors.bg2,
      borderRadius: radius.full,
      paddingHorizontal: 5,
      paddingVertical: 1,
      marginLeft: 2,
    },
    catBadgeText: {
      fontSize: 10,
      color: colors.ink3,
      fontFamily: 'Inter_500Medium',
    },
    sortRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    sortLabel: {
      fontSize: 12,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
    },
    sortBtns: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    sortBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.sm,
      backgroundColor: colors.bg2,
    },
    sortBtnActive: {
      backgroundColor: colors.moss,
    },
    sortText: {
      fontSize: 12,
      color: colors.ink2,
      fontFamily: 'Inter_500Medium',
    },
    sortTextActive: { color: colors.pistachio },
    list: {
      padding: spacing.lg,
      gap: spacing.md,
      paddingBottom: spacing.xxxl,
    },
    topicCard: {
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.line,
      gap: spacing.sm,
    },
    topicTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    topicMeta: {
      flexDirection: 'row',
      gap: spacing.xs,
      flexWrap: 'wrap',
      flex: 1,
    },
    pinnedBadge: {
      backgroundColor: colors.bg2,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    pinnedText: {
      fontSize: 11,
      color: colors.ink3,
      fontFamily: 'Inter_500Medium',
    },
    catTag: {
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    catTagText: {
      fontSize: 11,
      color: colors.ink2,
      fontFamily: 'Inter_500Medium',
    },
    topicDate: {
      fontSize: 11,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
      flexShrink: 0,
    },
    topicTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.ink,
      fontFamily: 'Inter_600SemiBold',
      lineHeight: 22,
    },
    topicExcerpt: {
      fontSize: 13,
      color: colors.ink2,
      fontFamily: 'Inter_400Regular',
      lineHeight: 19,
    },
    topicFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    authorAvatar: {
      width: 24,
      height: 24,
      borderRadius: radius.full,
      backgroundColor: colors.moss,
      alignItems: 'center',
      justifyContent: 'center',
    },
    authorInitials: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.pistachio,
      fontFamily: 'Inter_700Bold',
    },
    authorName: {
      fontSize: 12,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
    },
    topicStatsRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    topicStat: {
      fontSize: 12,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
    },
    articleCard: {
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.line,
      gap: spacing.sm,
    },
    articleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    articleBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.bg2,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
    },
    articleBadgeText: {
      fontSize: 11,
      color: colors.ink2,
      fontFamily: 'Inter_500Medium',
    },
    articleReadHint: {
      fontSize: 11,
      color: colors.moss,
      fontFamily: 'Inter_600SemiBold',
    },
    articleTitle: {
      fontSize: 17,
      lineHeight: 24,
      color: colors.ink,
      fontFamily: 'Inter_700Bold',
    },
    articlePreview: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.ink2,
      fontFamily: 'Inter_400Regular',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxxl,
      gap: spacing.sm,
    },
    emptyTitle: {
      fontSize: 18,
      color: colors.ink,
      fontFamily: 'Inter_700Bold',
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
      textAlign: 'center',
    },
  });
