import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppTopBar from '../../components/AppTopBar';
import ScreenBackdrop from '../../components/ScreenBackdrop';
import ContextAICard from '../../components/ContextAICard';
import MarkdownContent from '../../components/MarkdownContent';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { categories, topics } from '../../data/forumData';
import { spacing } from '../../styles/theme';

const FORUM_RULES = [
  'Будьте вежливы и уважительны.',
  'Не публикуйте личную информацию.',
  'Перед новой темой проверьте похожие обсуждения.',
  'Помогайте новичкам и уточняйте контекст.',
];

function formatDate(dateValue) {
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
  if (days < 7) return `${days} дн. назад`;

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getInitials(fullName) {
  return fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function TopicScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { employee } = useAuth();
  const { topicId } = route.params;
  const topic = topics.find((item) => item.id === topicId);
  const [liked, setLiked] = useState(false);

  const relatedTopics = useMemo(
    () =>
      topics
        .filter((item) => item.id !== topicId && item.categoryId === topic?.categoryId)
        .slice(0, 3),
    [topic, topicId]
  );

  if (!topic) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.ink }}>Тема не найдена</Text>
      </SafeAreaView>
    );
  }

  const category = categories.find((item) => item.id === topic.categoryId);
  const currentLikes = topic.likesCount + (liked ? 1 : 0);
  const s = makeStyles(colors);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${topic.title}\n\n${topic.content}`,
      });
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <ScreenBackdrop />
      <AppTopBar />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>← НАЗАД</Text>
        </TouchableOpacity>

        <View style={s.headerText}>
          <Text style={s.headerKicker}>{topic.categoryLabel}</Text>
          <Text style={s.headerTitle}>{topic.title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.authorCard}>
          <View style={s.authorAvatarSquare}>
            <Text style={s.authorAvatarSquareText}>{getInitials(topic.author.fullName)}</Text>
          </View>

          <View style={s.authorCopy}>
            <Text style={s.authorName}>{topic.author.fullName}</Text>
            <Text style={s.authorRole}>{topic.author.position}</Text>
            <Text style={s.authorDate}>Создано {formatDate(topic.createdAt)}</Text>
          </View>
        </View>

        <View style={s.topicCard}>
          <View style={s.badgesRow}>
            <Text style={s.categoryBadge}>
              {category?.emoji || '•'} {topic.categoryLabel}
            </Text>
            {topic.isPinned ? <Text style={s.pinBadge}>PINNED</Text> : null}
          </View>

          <View style={s.topicMeta}>
            <Text style={s.metaText}>👁 {topic.viewsCount}</Text>
            <Text style={s.metaText}>💬 {topic.repliesCount}</Text>
            <Text style={s.metaText}>★ {currentLikes}</Text>
          </View>
        </View>

        <View style={s.topicBody}>
          <MarkdownContent content={topic.content} colors={colors} />
        </View>

        <View style={s.actionsRow}>
          <TouchableOpacity style={[s.actionBtn, liked && s.actionBtnActive]} onPress={() => setLiked(!liked)}>
            <Text style={[s.actionBtnText, liked && s.actionBtnTextActive]}>
              {liked ? 'НРАВИТСЯ' : 'ОЦЕНИТЬ'} ({currentLikes})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionBtn} onPress={handleShare}>
            <Text style={s.actionBtnText}>ПОДЕЛИТЬСЯ</Text>
          </TouchableOpacity>
        </View>

        <View style={s.contextCard}>
          <Text style={s.contextKicker}>Контекст темы</Text>
          <View style={s.contextGrid}>
            <View style={s.contextCell}>
              <Text style={s.contextLabel}>Категория</Text>
              <Text style={s.contextValue}>{topic.categoryLabel}</Text>
            </View>
            <View style={s.contextCell}>
              <Text style={s.contextLabel}>Автор</Text>
              <Text style={s.contextValue}>{topic.author.fullName}</Text>
            </View>
            <View style={s.contextCell}>
              <Text style={s.contextLabel}>Ответов</Text>
              <Text style={s.contextValue}>{topic.repliesCount}</Text>
            </View>
            <View style={s.contextCell}>
              <Text style={s.contextLabel}>Просмотров</Text>
              <Text style={s.contextValue}>{topic.viewsCount}</Text>
            </View>
          </View>
        </View>

        <ContextAICard
          colors={colors}
          employeeId={employee?.employee_id}
          title="Спросить AI по теме"
          subtitle="В запрос автоматически уходит название темы, текст сообщения, автор, категория и текущие метрики обсуждения."
          placeholder="Что хотите уточнить по этой теме?"
          buttonLabel="ASK AI"
          buildPrompt={(question) =>
            `Тема форума: "${topic.title}"\n\nКатегория: ${topic.categoryLabel}\nАвтор: ${topic.author.fullName}, ${topic.author.position}\nСтатистика: ${topic.viewsCount} просмотров, ${topic.repliesCount} ответов, ${currentLikes} лайков\n\nСодержимое темы:\n${topic.content}\n\nВопрос пользователя: ${question}`
          }
        />

        {relatedTopics.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Похожие темы</Text>
            <View style={s.railCard}>
              {relatedTopics.map((relatedTopic, index) => (
                <TouchableOpacity
                  key={relatedTopic.id}
                  style={[s.relatedItem, index < relatedTopics.length - 1 && s.relatedItemBorder]}
                  onPress={() => navigation.replace('Topic', { topicId: relatedTopic.id })}
                >
                  <Text style={s.relatedTitle}>{relatedTopic.title}</Text>
                  <Text style={s.relatedMeta}>
                    💬 {relatedTopic.repliesCount} · ★ {relatedTopic.likesCount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <View style={s.section}>
          <Text style={s.sectionTitle}>Правила форума</Text>
          <View style={s.railCard}>
            {FORUM_RULES.map((rule, index) => (
              <View key={rule} style={[s.ruleItem, index < FORUM_RULES.length - 1 && s.relatedItemBorder]}>
                <Text style={s.ruleBullet}>•</Text>
                <Text style={s.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>
        </View>
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
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.paper,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      gap: spacing.md,
    },
    backBtn: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: 'transparent',
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    backBtnText: {
      color: colors.ink2,
      fontSize: 10,
      letterSpacing: 1,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    headerText: {
      gap: 4,
    },
    headerKicker: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
    },
    headerTitle: {
      color: colors.ink,
      fontSize: 24,
      lineHeight: 30,
      fontFamily: 'Fraunces_400Regular',
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
      paddingBottom: spacing.xxxl,
      gap: spacing.lg,
    },
    authorCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.lg,
      flexDirection: 'row',
      gap: spacing.md,
      alignItems: 'center',
    },
    authorAvatarSquare: {
      width: 48,
      height: 48,
      backgroundColor: colors.moss,
      alignItems: 'center',
      justifyContent: 'center',
    },
    authorAvatarSquareText: {
      color: colors.paper,
      fontSize: 16,
      fontFamily: 'Fraunces_500Medium',
    },
    authorCopy: {
      flex: 1,
      gap: 2,
    },
    authorName: {
      color: colors.ink,
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
    },
    authorRole: {
      color: colors.ink3,
      fontSize: 11,
      fontFamily: 'JetBrainsMono_400Regular',
    },
    authorDate: {
      color: colors.ink2,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'Inter_400Regular',
    },
    topicCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.xl,
      gap: spacing.md,
    },
    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    categoryBadge: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
    },
    pinBadge: {
      color: colors.hot,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
    },
    topicMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    metaText: {
      color: colors.ink3,
      fontSize: 11,
      fontFamily: 'JetBrainsMono_400Regular',
    },
    topicBody: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.xl,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    actionBtn: {
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: 'transparent',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    actionBtnActive: {
      borderColor: colors.hot,
      backgroundColor: colors.hotWash,
    },
    actionBtnText: {
      color: colors.ink2,
      fontSize: 10,
      letterSpacing: 1,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    actionBtnTextActive: {
      color: colors.hot,
    },
    contextCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.xl,
      gap: spacing.md,
    },
    contextKicker: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
    },
    contextGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    contextCell: {
      flexBasis: '48%',
      flexGrow: 1,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.md,
      gap: 4,
    },
    contextLabel: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
    },
    contextValue: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Inter_600SemiBold',
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    railCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.lg,
    },
    relatedItem: {
      paddingVertical: spacing.md,
      gap: 4,
    },
    relatedItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      borderStyle: 'dashed',
    },
    relatedTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Inter_600SemiBold',
    },
    relatedMeta: {
      color: colors.ink3,
      fontSize: 11,
      fontFamily: 'JetBrainsMono_400Regular',
    },
    ruleItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    ruleBullet: {
      color: colors.moss,
      fontSize: 16,
      lineHeight: 20,
      fontFamily: 'Inter_700Bold',
    },
    ruleText: {
      flex: 1,
      color: colors.ink2,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'Inter_400Regular',
    },
  });
