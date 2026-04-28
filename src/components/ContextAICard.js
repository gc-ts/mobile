import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { chatAPI } from '../services/api';
import { spacing } from '../styles/theme';

export default function ContextAICard({
  colors,
  employeeId,
  title,
  subtitle,
  placeholder,
  buttonLabel = 'ASK AI',
  buildPrompt,
  accent = 'moss',
}) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const s = useMemo(() => makeStyles(colors, accent), [colors, accent]);

  const askAI = async () => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setResponse('');
    const fullPrompt = buildPrompt(trimmed);
    let fullText = '';

    try {
      await chatAPI.sendMessageStream(
        fullPrompt,
        employeeId,
        (chunk) => {
          if (chunk.type === 'token' && chunk.delta) {
            fullText += chunk.delta;
            setResponse(fullText);
          }
        },
        () => {
          setLoading(false);
        },
        async () => {
          try {
            const fallback = await chatAPI.sendMessage(fullPrompt, employeeId);
            setResponse(fallback.response || 'Не удалось получить ответ.');
          } catch {
            setResponse('Произошла ошибка при обращении к AI.');
          } finally {
            setLoading(false);
          }
        }
      );
    } catch {
      setResponse('Произошла ошибка при обращении к AI.');
      setLoading(false);
    }
  };

  return (
    <View style={s.card}>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}

      <TextInput
        style={s.input}
        value={question}
        onChangeText={setQuestion}
        placeholder={placeholder}
        placeholderTextColor={colors.ink3}
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[s.button, (loading || !question.trim()) && s.buttonDisabled]}
        onPress={askAI}
        disabled={loading || !question.trim()}
      >
        {loading ? (
          <ActivityIndicator color={s.buttonText.color} />
        ) : (
          <Text style={s.buttonText}>{buttonLabel}</Text>
        )}
      </TouchableOpacity>

      {response ? (
        <View style={s.response}>
          <Text style={s.responseText}>{response}</Text>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (colors, accent) => {
  const accentColor = accent === 'ink' ? colors.ink : colors.moss;
  const accentText = accent === 'ink' ? colors.bg : colors.paper;

  return StyleSheet.create({
    card: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.xl,
      gap: spacing.md,
    },
    title: {
      color: colors.ink,
      fontSize: 24,
      lineHeight: 30,
      fontFamily: 'Fraunces_400Regular',
    },
    subtitle: {
      color: colors.ink2,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'Inter_400Regular',
    },
    input: {
      minHeight: 92,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 15,
      lineHeight: 22,
      color: colors.ink,
      fontFamily: 'Inter_400Regular',
    },
    button: {
      backgroundColor: accentColor,
      paddingVertical: 13,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: accentText,
      fontSize: 10,
      letterSpacing: 1.1,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    response: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.md,
    },
    responseText: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 22,
      fontFamily: 'Inter_400Regular',
    },
  });
};
