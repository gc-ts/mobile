import React, { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AppTopBar from '../../components/AppTopBar';
import ScreenBackdrop from '../../components/ScreenBackdrop';
import { useTheme } from '../../contexts/ThemeContext';
import { articles, categories, topics } from '../../data/forumData';
import { spacing } from '../../styles/theme';

function getArticlePreview(content) {
  return (
    content
      .split('\n')
      .find((line) => line.startsWith('## '))
      ?.slice(3) || 'Подробная информация'
  );
}

function formatTopicMeta(dateValue) {
  const date = new Date(dateValue);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Вчера';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function ForumScreen({ navigation }) {
  const { colors } = useTheme();
  const [searchValue, setSearchValue] = useState('');

  const query = searchValue.trim().toLowerCase();

  const groupedArticles = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          items: articles.filter((article) => {
            if (article.categoryId !== category.id) return false;
            if (!query) return true;
            return `${article.title} ${article.content} ${article.categoryLabel}`.toLowerCase().includes(query);
          }),
        }))
        .filter((category) => category.items.length > 0),
    [query]
  );

  const filteredTopics = useMemo(() => {
    if (!query) return topics;
    return topics.filter((topic) =>
      `${topic.title} ${topic.content} ${topic.categoryLabel}`.toLowerCase().includes(query)
    );
  }, [query]);

  const stats = useMemo(() => {
    const uniqueAuthors = new Map();
    topics.forEach((topic) => {
      if (!uniqueAuthors.has(topic.author.fullName)) {
        uniqueAuthors.set(topic.author.fullName, topic.author);
      }
    });

    return {
      articleCount: articles.length,
      topicCount: topics.length,
      categoryCount: categories.length,
      activeUsers: Array.from(uniqueAuthors.values()).slice(0, 4),
    };
  }, []);

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.root}>
      <ScreenBackdrop />
      <AppTopBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Поиск по базе знаний и темам..."
      />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.leadBlock}>
          <Text style={s.title}>
            База знаний<Text style={s.dot}>.</Text>
          </Text>
          <Text style={s.subtitle}>
            Справочные материалы по правилам внутреннего трудового распорядка. Выберите интересующую вас тему.
          </Text>
        </View>

        {groupedArticles.map((category) => (
          <View key={category.id} style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionEmoji}>{category.emoji}</Text>
              <View style={s.sectionText}>
                <Text style={s.sectionTitle}>{category.label}</Text>
                <Text style={s.sectionDescription}>{category.description}</Text>
              </View>
            </View>

            <View style={s.cards}>
              {category.items.map((article) => (
                <Pressable
                  key={article.id}
                  style={({ hovered, pressed }) => [
                    s.card,
                    hovered && s.cardHovered,
                    pressed && s.cardPressed,
                  ]}
                  onPress={() => navigation.navigate('Article', { articleId: article.id })}
                >
                  <Text style={s.cardIcon}>{article.icon}</Text>
                  <Text style={s.cardTitle}>{article.title}</Text>
                  <Text style={s.cardPreview}>{getArticlePreview(article.content)}</Text>
                  <Text style={s.cardHint}>ЧИТАТЬ →</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View style={s.section}>
          <Text style={s.discussionsKicker}>Последние обсуждения</Text>
          <View style={s.discussionsCard}>
            {filteredTopics.map((topic, index) => (
              <Pressable
                key={topic.id}
                style={({ hovered, pressed }) => [
                  s.topicRow,
                  index < filteredTopics.length - 1 && s.topicRowBorder,
                  hovered && s.topicRowHovered,
                  pressed && s.topicRowPressed,
                ]}
                onPress={() => navigation.navigate('Topic', { topicId: topic.id })}
              >
                <Text style={s.topicTitle}>{topic.title}</Text>
                <Text style={s.topicMeta}>
                  {topic.categoryLabel} · {formatTopicMeta(topic.updatedAt)} · 💬 {topic.repliesCount}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.discussionsKicker}>Форум в цифрах</Text>
          <View style={s.statsGrid}>
            <View style={s.statCard}>
              <Text style={s.statValue}>{stats.articleCount}</Text>
              <Text style={s.statLabel}>статей</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statValue}>{stats.topicCount}</Text>
              <Text style={s.statLabel}>тем</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statValue}>{stats.categoryCount}</Text>
              <Text style={s.statLabel}>категорий</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.discussionsKicker}>Активные участники</Text>
          <View style={s.discussionsCard}>
            {stats.activeUsers.map((user, index) => (
              <View key={user.fullName} style={[s.userRow, index < stats.activeUsers.length - 1 && s.topicRowBorder]}>
                <View style={s.userAvatar}>
                  <Text style={s.userAvatarText}>
                    {user.fullName
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={s.userText}>
                  <Text style={s.userName}>{user.fullName}</Text>
                  <Text style={s.userRole}>{user.position}</Text>
                </View>
                <View style={s.onlineDot} />
              </View>
            ))}
          </View>
        </View>

        {!groupedArticles.length && !filteredTopics.length ? (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>Ничего не найдено</Text>
            <Text style={s.emptyText}>Попробуйте другой запрос по статьям или обсуждениям.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      padding: spacing.xl,
      paddingBottom: spacing.xxxl,
      gap: spacing.xxxl,
    },
    leadBlock: {
      gap: spacing.md,
    },
    title: {
      color: colors.ink,
      fontSize: 40,
      lineHeight: 44,
      fontFamily: 'Fraunces_400Regular',
    },
    dot: {
      color: colors.pistachio,
    },
    subtitle: {
      color: colors.ink2,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: 'Inter_400Regular',
      maxWidth: 620,
    },
    section: {
      gap: spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    sectionEmoji: {
      fontSize: 28,
    },
    sectionText: {
      flex: 1,
      gap: 4,
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 28,
      fontFamily: 'Fraunces_400Regular',
    },
    sectionDescription: {
      color: colors.ink3,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'Inter_400Regular',
    },
    cards: {
      gap: spacing.md,
    },
    card: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    cardHovered: {
      borderColor: colors.moss,
      transform: [{ translateY: -2 }],
    },
    cardPressed: {
      opacity: 0.92,
    },
    cardIcon: {
      fontSize: 24,
      marginBottom: 2,
    },
    cardTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 22,
      fontFamily: 'Fraunces_400Regular',
    },
    cardPreview: {
      color: colors.ink2,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'Inter_400Regular',
    },
    cardHint: {
      marginTop: spacing.xs,
      color: colors.moss,
      fontSize: 10,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
    },
    discussionsKicker: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    discussionsCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.md,
    },
    topicRow: {
      paddingVertical: spacing.sm,
      gap: 2,
    },
    topicRowHovered: {
      backgroundColor: colors.mossWash,
      marginHorizontal: -spacing.md,
      paddingHorizontal: spacing.md,
    },
    topicRowPressed: {
      opacity: 0.9,
    },
    topicRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      borderStyle: 'dashed',
    },
    topicTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'Inter_600SemiBold',
    },
    topicMeta: {
      color: colors.ink3,
      fontSize: 10,
      lineHeight: 14,
      fontFamily: 'JetBrainsMono_400Regular',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      minWidth: 96,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.md,
      gap: 4,
      alignItems: 'center',
    },
    statValue: {
      color: colors.ink,
      fontSize: 30,
      fontFamily: 'Fraunces_400Regular',
    },
    statLabel: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    userAvatar: {
      width: 32,
      height: 32,
      borderRadius: 999,
      backgroundColor: colors.moss,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userAvatarText: {
      color: colors.paper,
      fontSize: 10,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    userText: {
      flex: 1,
      gap: 2,
    },
    userName: {
      color: colors.ink,
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
    },
    userRole: {
      color: colors.ink3,
      fontSize: 11,
      fontFamily: 'JetBrainsMono_400Regular',
    },
    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.pistachio,
    },
    emptyState: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.xl,
      gap: 6,
    },
    emptyTitle: {
      color: colors.ink,
      fontSize: 18,
      fontFamily: 'Fraunces_400Regular',
    },
    emptyText: {
      color: colors.ink2,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'Inter_400Regular',
    },
  });
