import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppTopBar from '../../components/AppTopBar';
import ScreenBackdrop from '../../components/ScreenBackdrop';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { chatAPI } from '../../services/api';
import { spacing } from '../../styles/theme';

const QUICK_QUESTIONS = [
  'Сколько у меня дней отпуска?',
  'Когда выплачивается аванс?',
  'Как оформить больничный?',
  'График работы в праздники',
];

function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function trimTitle(text) {
  return text.length > 50 ? `${text.slice(0, 50)}...` : text;
}

export default function ChatScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { employee } = useAuth();
  const { chatId } = route.params;
  const storageKey = `chats_${employee?.employee_id}`;

  const [messages, setMessages] = useState([]);
  const [chatTitle, setChatTitle] = useState('Новый чат');
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const cancelStreamRef = useRef(null);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(storageKey);
      const chats = raw ? JSON.parse(raw) : [];
      const chat = chats.find((item) => item.id === chatId);
      if (chat) {
        setMessages(chat.messages || []);
        setChatTitle(chat.title || 'Новый чат');
      }
    })();

    return () => {
      cancelStreamRef.current?.();
    };
  }, [chatId, storageKey]);

  const saveMessages = useCallback(
    async (nextMessages, nextTitle) => {
      const raw = await AsyncStorage.getItem(storageKey);
      const chats = raw ? JSON.parse(raw) : [];
      const updated = chats.map((chat) => {
        if (chat.id !== chatId) return chat;
        return {
          ...chat,
          title: nextTitle ?? chat.title,
          messages: nextMessages,
          updatedAt: new Date().toISOString(),
        };
      });
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    },
    [chatId, storageKey]
  );

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const sendMessage = async (rawText) => {
    const trimmed = rawText.trim();
    if (!trimmed || isStreaming) return;

    const userMessage = {
      id: Date.now(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    const nextTitle = messages.length === 0 ? trimTitle(trimmed) : chatTitle;
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setChatTitle(nextTitle);
    setInputValue('');
    setIsStreaming(true);
    setIsTyping(true);
    await saveMessages(updatedMessages, nextTitle);
    setTimeout(scrollToBottom, 100);

    const botId = Date.now() + 1;
    let fullText = '';
    let source = '';
    let botMessageAdded = false;

    const cancel = await chatAPI.sendMessageStream(
      trimmed,
      employee?.employee_id,
      (chunk) => {
        if (chunk.type === 'context' && chunk.source) {
          source = chunk.source;
        } else if (chunk.type === 'token' && chunk.delta) {
          fullText += chunk.delta;

          if (!botMessageAdded) {
            setIsTyping(false);
            setMessages((prev) => [
              ...prev,
              {
                id: botId,
                text: fullText,
                sender: 'bot',
                timestamp: new Date().toISOString(),
                source,
              },
            ]);
            botMessageAdded = true;
          } else {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === botId ? { ...message, text: fullText, source } : message
              )
            );
          }

          setTimeout(scrollToBottom, 50);
        }
      },
      async () => {
        setIsStreaming(false);
        setIsTyping(false);
        cancelStreamRef.current = null;

        setMessages((prev) => {
          const finalMessages = prev.map((message) =>
            message.id === botId ? { ...message, text: fullText, source } : message
          );
          saveMessages(finalMessages, nextTitle);
          return finalMessages;
        });
      },
      async () => {
        setIsStreaming(false);
        setIsTyping(false);
        cancelStreamRef.current = null;

        try {
          const fallback = await chatAPI.sendMessage(trimmed, employee?.employee_id);
          const fallbackText = fallback.response || 'Не удалось получить ответ.';
          setMessages((prev) => {
            const finalMessages = [
              ...prev,
              {
                id: botId,
                text: fallbackText,
                sender: 'bot',
                timestamp: new Date().toISOString(),
                source: fallback.source,
              },
            ];
            saveMessages(finalMessages, nextTitle);
            return finalMessages;
          });
        } catch {
          setMessages((prev) => {
            const finalMessages = [
              ...prev,
              {
                id: botId,
                text: 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.',
                sender: 'bot',
                timestamp: new Date().toISOString(),
              },
            ];
            saveMessages(finalMessages, nextTitle);
            return finalMessages;
          });
        }
      }
    );

    cancelStreamRef.current = cancel;
  };

  const s = makeStyles(colors);

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';

    return (
      <View style={s.messageRow}>
        <View style={[s.avatar, isUser ? s.userAvatar : s.botAvatar]}>
          <Text style={s.avatarText}>{isUser ? getInitials(employee?.full_name) : 'AI'}</Text>
        </View>

        <View style={s.messageContent}>
          <View style={s.messageCard}>
            <Text style={s.messageText}>{item.text}</Text>
            {item.source ? (
              <View style={s.sourceRow}>
                <Text style={s.sourceText}>Источник: {item.source}</Text>
              </View>
            ) : null}
          </View>

          <Text style={s.timeText}>
            {new Date(item.timestamp).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root}>
      <ScreenBackdrop />
      <AppTopBar />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>← ЧАТЫ</Text>
        </TouchableOpacity>

        <View style={s.headerText}>
          <Text style={s.headerTitle}>AI-ассистент «Техна»</Text>
          <Text style={s.headerSubtitle}>
            Отвечаю на вопросы по HR-процессам на основе документов компании
          </Text>
          <Text style={s.headerKicker}>{chatTitle}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {messages.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyMarker}>
              <Text style={s.emptyMarkerText}>AI</Text>
            </View>
            <Text style={s.emptyTitle}>Техна</Text>
            <Text style={s.emptySubtitle}>
              Отвечаю на вопросы по HR-процессам на основе документов компании.
            </Text>

            <View style={s.quickList}>
              <Text style={s.quickKicker}>Популярные вопросы</Text>
              {QUICK_QUESTIONS.map((question) => (
                <TouchableOpacity key={question} style={s.quickBtn} onPress={() => setInputValue(question)}>
                  <Text style={s.quickText}>{question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={s.msgList}
            renderItem={renderMessage}
            onContentSizeChange={scrollToBottom}
          />
        )}

        {isTyping ? (
          <View style={s.typingRow}>
            <View style={[s.avatar, s.botAvatar]}>
              <Text style={s.avatarText}>AI</Text>
            </View>
            <View style={s.typingCard}>
              <ActivityIndicator size="small" color={colors.moss} />
            </View>
          </View>
        ) : null}

        <View style={s.inputWrap}>
          <Text style={s.inputKicker}>Сообщение</Text>

          <View style={s.inputBar}>
            <TextInput
              style={s.input}
              placeholder="Напишите ваш вопрос..."
              placeholderTextColor={colors.ink3}
              value={inputValue}
              onChangeText={setInputValue}
              editable={!isStreaming}
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={[s.sendBtn, (!inputValue.trim() || isStreaming) && s.sendBtnDisabled]}
              onPress={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isStreaming}
            >
              <Text style={s.sendBtnText}>ОТПРАВИТЬ</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.inputHint}>
            Ответы основаны на документах компании. Точную информацию уточняйте у HR.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    flex: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: spacing.md,
      backgroundColor: colors.paper,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
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
      gap: 6,
    },
    headerTitle: {
      color: colors.ink,
      fontSize: 28,
      fontFamily: 'Fraunces_400Regular',
    },
    headerSubtitle: {
      color: colors.ink2,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: 'Inter_400Regular',
    },
    headerKicker: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
    },
    msgList: {
      padding: spacing.lg,
      gap: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    messageRow: {
      flexDirection: 'row',
      gap: spacing.md,
      alignItems: 'flex-start',
    },
    avatar: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botAvatar: {
      backgroundColor: colors.moss,
    },
    userAvatar: {
      backgroundColor: colors.sage,
      borderRadius: 999,
    },
    avatarText: {
      color: colors.paper,
      fontSize: 11,
      letterSpacing: 0.8,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    messageContent: {
      flex: 1,
      gap: 6,
    },
    messageCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    messageText: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 24,
      fontFamily: 'Inter_400Regular',
    },
    sourceRow: {
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    sourceText: {
      color: colors.ink3,
      fontSize: 11,
      lineHeight: 16,
      fontFamily: 'JetBrainsMono_400Regular',
    },
    timeText: {
      color: colors.ink3,
      fontSize: 11,
      fontFamily: 'JetBrainsMono_400Regular',
      paddingHorizontal: 2,
    },
    typingRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    typingCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    emptyMarker: {
      width: 72,
      height: 72,
      backgroundColor: colors.moss,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    emptyMarkerText: {
      color: colors.paper,
      fontSize: 16,
      letterSpacing: 1,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    emptyTitle: {
      color: colors.ink,
      fontSize: 36,
      textAlign: 'center',
      fontFamily: 'Fraunces_400Regular',
    },
    emptySubtitle: {
      color: colors.ink2,
      fontSize: 14,
      lineHeight: 22,
      textAlign: 'center',
      fontFamily: 'Inter_400Regular',
    },
    quickList: {
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    quickKicker: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
      marginBottom: 4,
    },
    quickBtn: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    quickText: {
      color: colors.ink2,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'Inter_400Regular',
    },
    inputWrap: {
      backgroundColor: colors.paper,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.sm,
    },
    inputKicker: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    input: {
      flex: 1,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      fontSize: 15,
      lineHeight: 22,
      color: colors.ink,
      maxHeight: 120,
      fontFamily: 'Inter_400Regular',
    },
    sendBtn: {
      backgroundColor: colors.ink,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    sendBtnDisabled: {
      opacity: 0.45,
    },
    sendBtnText: {
      color: colors.bg,
      fontSize: 10,
      letterSpacing: 1.1,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    inputHint: {
      color: colors.ink3,
      fontSize: 11,
      lineHeight: 16,
      fontFamily: 'JetBrainsMono_400Regular',
    },
  });
