import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
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

const MOCK_REPLIES = {
  1: [
    {
      id: 1,
      content:
        'У меня первый день прошел очень спокойно. На ресепшене встретили, провели экскурсию по офису, показали рабочее место. Ноутбук уже был настроен и ждал на столе. С собой нужен только паспорт для оформления пропуска.',
      author: { fullName: 'Петрова Мария', position: 'Designer' },
      likesCount: 5,
      isLikedByUser: false,
      createdAt: '2026-04-27T11:00:00Z',
    },
    {
      id: 2,
      content:
        'Не забудь взять наушники! В опен-спейсе бывает шумно. И да, в первый день обычно знакомят с командой и проводят вводный инструктаж по безопасности.',
      author: { fullName: 'Сидоров Петр', position: 'Middle Developer' },
      likesCount: 3,
      isLikedByUser: false,
      createdAt: '2026-04-27T12:30:00Z',
    },
    {
      id: 3,
      content:
        'У меня в первый день был welcome-lunch с командой. Очень помогло познакомиться и расслабиться. Не переживай, все будет хорошо!',
      author: { fullName: 'Козлова Анна', position: 'Junior Frontend' },
      likesCount: 8,
      isLikedByUser: true,
      createdAt: '2026-04-27T14:15:00Z',
    },
  ],
};

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
  const [replies, setReplies] = useState(MOCK_REPLIES[topicId] || []);
  const [replyText, setReplyText] = useState('');

  const handleReplyLike = (replyId) => {
    setReplies((prev) =>
      prev.map((reply) =>
        reply.id === replyId
          ? {
              ...reply,
              isLikedByUser: !reply.isLikedByUser,
              likesCount: reply.likesCount + (reply.isLikedByUser ? -1 : 1),
            }
          : reply
      )
    );
  };

  const handleSubmitReply = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    const newReply = {
      id: Date.now(),
      content: trimmed,
      author: {
        fullName: employee?.full_name || 'Вы',
        position: employee?.position || 'Сотрудник',
      },
      likesCount: 0,
      isLikedByUser: false,
      createdAt: new Date().toISOString(),
    };
    setReplies((prev) => [...prev, newReply]);
    setReplyText('');
  };

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

        <View style={s.section}>
          <Text style={s.sectionTitle}>Ответы · {replies.length}</Text>

          {replies.length === 0 ? (
            <View style={s.emptyReplies}>
              <Text style={s.emptyRepliesText}>
                Пока нет ответов. Будьте первым, кто поделится опытом.
              </Text>
            </View>
          ) : (
            <View style={s.repliesList}>
              {replies.map((reply) => (
                <View key={reply.id} style={s.replyCard}>
                  <View style={s.replyAvatarSquare}>
                    <Text style={s.replyAvatarText}>{getInitials(reply.author.fullName)}</Text>
                  </View>
                  <View style={s.replyBody}>
                    <View style={s.replyHeader}>
                      <Text style={s.replyAuthor}>{reply.author.fullName}</Text>
                      <Text style={s.replyRole}>{reply.author.position}</Text>
                    </View>
                    <Text style={s.replyContent}>{reply.content}</Text>
                    <View style={s.replyFooter}>
                      <Text style={s.replyDate}>{formatDate(reply.createdAt)}</Text>
                      <TouchableOpacity onPress={() => handleReplyLike(reply.id)}>
                        <Text
                          style={[
                            s.replyLike,
                            reply.isLikedByUser && s.replyLikeActive,
                          ]}
                        >
                          ★ {reply.likesCount}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={s.replyForm}>
            <Text style={s.replyKicker}>Ваш ответ</Text>
            <TextInput
              style={s.replyInput}
              placeholder="Напишите ваш ответ..."
              placeholderTextColor={colors.ink3}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              textAlignVertical="top"
            />
            <View style={s.replyActions}>
              <TouchableOpacity
                style={s.secondaryReplyBtn}
                onPress={() => setReplyText('')}
                disabled={!replyText.trim()}
              >
                <Text style={s.secondaryReplyText}>ОЧИСТИТЬ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.primaryReplyBtn, !replyText.trim() && s.primaryReplyBtnDisabled]}
                onPress={handleSubmitReply}
                disabled={!replyText.trim()}
              >
                <Text style={s.primaryReplyText}>ОТПРАВИТЬ</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    repliesList: {
      gap: spacing.sm,
    },
    replyCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.md,
      flexDirection: 'row',
      gap: spacing.md,
      alignItems: 'flex-start',
    },
    replyAvatarSquare: {
      width: 40,
      height: 40,
      backgroundColor: colors.moss,
      alignItems: 'center',
      justifyContent: 'center',
    },
    replyAvatarText: {
      color: colors.paper,
      fontSize: 13,
      fontFamily: 'Fraunces_500Medium',
    },
    replyBody: {
      flex: 1,
      gap: 6,
    },
    replyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    replyAuthor: {
      color: colors.ink,
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
    },
    replyRole: {
      color: colors.ink3,
      fontSize: 11,
      fontFamily: 'JetBrainsMono_400Regular',
    },
    replyContent: {
      color: colors.ink2,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: 'Inter_400Regular',
    },
    replyFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: 2,
    },
    replyDate: {
      color: colors.ink3,
      fontSize: 11,
      fontFamily: 'JetBrainsMono_400Regular',
    },
    replyLike: {
      color: colors.ink3,
      fontSize: 11,
      fontFamily: 'JetBrainsMono_500Medium',
    },
    replyLikeActive: {
      color: colors.hot,
    },
    emptyReplies: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.line,
      padding: spacing.lg,
    },
    emptyRepliesText: {
      color: colors.ink3,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'Inter_400Regular',
    },
    replyForm: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.md,
      gap: spacing.sm,
    },
    replyKicker: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
    },
    replyInput: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      minHeight: 88,
      fontSize: 14,
      lineHeight: 20,
      color: colors.ink,
      fontFamily: 'Inter_400Regular',
    },
    replyActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    secondaryReplyBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.line,
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryReplyText: {
      color: colors.ink2,
      fontSize: 10,
      letterSpacing: 1,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    primaryReplyBtn: {
      flex: 1,
      backgroundColor: colors.ink,
      paddingVertical: 12,
      alignItems: 'center',
    },
    primaryReplyBtnDisabled: {
      opacity: 0.5,
    },
    primaryReplyText: {
      color: colors.bg,
      fontSize: 10,
      letterSpacing: 1,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
  });
