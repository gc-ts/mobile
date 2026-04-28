import React, { useState } from 'react';
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
import { topics } from '../../data/forumData';
import { radius, spacing } from '../../styles/theme';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function TopicScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { topicId } = route.params;
  const topic = topics.find((item) => item.id === topicId);
  const [liked, setLiked] = useState(false);

  if (!topic) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.ink }}>Тема не найдена</Text>
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
          {topic.categoryLabel}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <View style={s.meta}>
            {topic.pinned && (
              <View style={s.pinnedBadge}>
                <Text style={s.pinnedText}>📌 Закреплено</Text>
              </View>
            )}
            <View style={s.catTag}>
              <Text style={s.catTagText}>{topic.categoryLabel}</Text>
            </View>
          </View>

          <Text style={s.title}>{topic.title}</Text>

          <View style={s.authorRow}>
            <View style={s.authorAvatar}>
              <Text style={s.authorInitials}>{topic.authorInitials}</Text>
            </View>
            <View style={s.authorMeta}>
              <Text style={s.authorName}>{topic.author}</Text>
              <Text style={s.topicDate}>{formatDate(topic.date)}</Text>
            </View>
          </View>

          <View style={s.statsRow}>
            <View style={s.statPill}>
              <Text style={s.statText}>❤ {topic.likes + (liked ? 1 : 0)}</Text>
            </View>
            <View style={s.statPill}>
              <Text style={s.statText}>💬 {topic.comments}</Text>
            </View>
          </View>
        </View>

        <View style={s.bodyCard}>
          <MarkdownContent content={topic.content} colors={colors} />
        </View>

        <View style={s.footer}>
          <TouchableOpacity style={[s.likeBtn, liked && s.likeBtnActive]} onPress={() => setLiked(!liked)}>
            <Text style={s.likeBtnText}>
              {liked ? '❤️' : '🤍'} {liked ? 'Снять реакцию' : 'Поддержать тему'}
            </Text>
          </TouchableOpacity>
          <Text style={s.commentsCount}>💬 {topic.comments} комментариев</Text>
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
      gap: spacing.md,
    },
    meta: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    pinnedBadge: {
      backgroundColor: colors.bg2,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    pinnedText: {
      fontSize: 12,
      color: colors.ink3,
      fontFamily: 'Inter_500Medium',
    },
    catTag: {
      backgroundColor: colors.moss + '22',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    catTagText: {
      fontSize: 12,
      color: colors.moss,
      fontFamily: 'Inter_600SemiBold',
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.ink,
      fontFamily: 'Inter_700Bold',
      lineHeight: 30,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    authorAvatar: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.moss,
      alignItems: 'center',
      justifyContent: 'center',
    },
    authorInitials: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.pistachio,
      fontFamily: 'Inter_700Bold',
    },
    authorMeta: {
      flex: 1,
    },
    authorName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.ink,
      fontFamily: 'Inter_600SemiBold',
    },
    topicDate: {
      fontSize: 12,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    statPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.full,
      backgroundColor: colors.bg2,
    },
    statText: {
      fontSize: 12,
      color: colors.ink2,
      fontFamily: 'Inter_500Medium',
    },
    bodyCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.xs,
    },
    likeBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.bg2,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.line,
    },
    likeBtnActive: {
      backgroundColor: colors.moss + '22',
      borderColor: colors.moss,
    },
    likeBtnText: {
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
      color: colors.ink2,
    },
    commentsCount: {
      fontSize: 14,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
    },
  });
