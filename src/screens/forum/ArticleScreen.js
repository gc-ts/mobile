import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
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
import { articles } from '../../data/forumData';
import { spacing } from '../../styles/theme';

function getPreview(content) {
  return (
    content
      .split('\n')
      .find((line) => line.startsWith('## '))
      ?.slice(3) || 'Подробный материал для сотрудников компании.'
  );
}

function extractSections(content) {
  const lines = String(content ?? '').split('\n');
  const sections = [];
  let current = null;

  lines.forEach((line) => {
    if (line.startsWith('## ')) {
      if (current) sections.push(current);
      current = { title: line.slice(3).trim(), lines: [] };
      return;
    }

    if (current && !line.startsWith('# ')) {
      current.lines.push(line);
    }
  });

  if (current) sections.push(current);

  return sections
    .map((section, index) => {
      const contentText = section.lines.join('\n').trim();
      const snippet = contentText
        .replace(/[#>*-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 140);

      return {
        id: `${index}-${section.title}`,
        title: section.title,
        content: contentText,
        snippet: snippet || section.title,
      };
    })
    .filter((section) => section.content || section.title);
}

export default function ArticleScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { employee } = useAuth();
  const { articleId } = route.params;
  const article = articles.find((item) => item.id === articleId);

  const sections = useMemo(() => extractSections(article?.content), [article?.content]);
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id ?? null);
  const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? null;

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
      <ScreenBackdrop />
      <AppTopBar />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>← НАЗАД</Text>
        </TouchableOpacity>

        <View style={s.headerText}>
          <Text style={s.headerKicker}>{article.categoryLabel}</Text>
          <Text style={s.headerTitle}>
            {article.icon} {article.title}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.intro}>
          <Text style={s.introLead}>{getPreview(article.content)}</Text>
        </View>

        <View style={s.articleBody}>
          <MarkdownContent content={article.content} colors={colors} />
        </View>

        {sections.length > 0 ? (
          <View style={s.fragmentPanel}>
            <Text style={s.fragmentKicker}>Контекстные фрагменты</Text>
            <Text style={s.fragmentText}>
              На мобильном вместо выделения мышью можно быстро выбрать нужный раздел и спросить AI по нему.
            </Text>

            <View style={s.fragmentList}>
              {sections.map((section) => {
                const selected = section.id === selectedSectionId;

                return (
                  <TouchableOpacity
                    key={section.id}
                    style={[s.fragmentItem, selected && s.fragmentItemSelected]}
                    onPress={() => setSelectedSectionId(section.id)}
                  >
                    <Text style={[s.fragmentItemTitle, selected && s.fragmentItemTitleSelected]}>
                      {section.title}
                    </Text>
                    <Text style={s.fragmentItemText}>{section.snippet}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {selectedSection ? (
          <ContextAICard
            colors={colors}
            employeeId={employee?.employee_id}
            title="Спросить AI по фрагменту"
            subtitle={`В запрос уйдет выделенный раздел «${selectedSection.title}» и его текст, как мобильный аналог popup на фронте.`}
            placeholder="Что именно нужно уточнить по этому фрагменту?"
            buttonLabel="ASK FRAGMENT"
            accent="ink"
            buildPrompt={(question) =>
              `Документ: "${article.title}"\nКатегория: ${article.categoryLabel}\n\nВыбранный фрагмент: "${selectedSection.title}"\n\nТекст фрагмента:\n${selectedSection.content}\n\nВопрос по фрагменту: ${question}`
            }
          />
        ) : null}

        <ContextAICard
          colors={colors}
          employeeId={employee?.employee_id}
          title="Спросить HR AI по документу"
          subtitle="Вопрос отправляется вместе с названием документа, категорией и полным текстом статьи, как на фронте."
          placeholder="Задайте вопрос по этому документу..."
          buttonLabel="ASK AI"
          buildPrompt={(question) =>
            `Документ: "${article.title}"\nКатегория: ${article.categoryLabel}\n\nСодержимое документа:\n${article.content}\n\nВопрос по документу: ${question}`
          }
        />
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
      gap: spacing.xl,
    },
    intro: {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    },
    introLead: {
      color: colors.ink2,
      fontSize: 15,
      lineHeight: 24,
      fontFamily: 'Inter_400Regular',
    },
    articleBody: {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    },
    fragmentPanel: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.xl,
      gap: spacing.md,
    },
    fragmentKicker: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
    },
    fragmentText: {
      color: colors.ink2,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'Inter_400Regular',
    },
    fragmentList: {
      gap: spacing.sm,
    },
    fragmentItem: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.md,
      gap: 6,
    },
    fragmentItemSelected: {
      borderColor: colors.moss,
      backgroundColor: colors.mossWash,
    },
    fragmentItemTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 21,
      fontFamily: 'Inter_600SemiBold',
    },
    fragmentItemTitleSelected: {
      color: colors.moss,
    },
    fragmentItemText: {
      color: colors.ink3,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'Inter_400Regular',
    },
  });
