import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { chatAPI } from '../../services/api';
import { radius, spacing } from '../../styles/theme';

const QUICK_QUESTIONS = [
  'Сколько у меня дней отпуска?',
  'Когда выплачивается аванс?',
  'Как оформить больничный?',
  'График работы в праздники',
];

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
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
  const flatListRef = useRef(null);
  const cancelStreamRef = useRef(null);

  // Load chat from storage
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(storageKey);
      const chats = raw ? JSON.parse(raw) : [];
      const chat = chats.find((c) => c.id === chatId);
      if (chat) {
        setMessages(chat.messages || []);
        setChatTitle(chat.title || 'Новый чат');
      }
    })();
    return () => {
      cancelStreamRef.current?.();
    };
  }, [chatId]);

  const saveMessages = useCallback(
    async (newMessages, newTitle) => {
      const raw = await AsyncStorage.getItem(storageKey);
      const chats = raw ? JSON.parse(raw) : [];
      const updated = chats.map((c) => {
        if (c.id !== chatId) return c;
        return {
          ...c,
          title: newTitle ?? c.title,
          messages: newMessages,
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

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMsg = {
      id: Date.now(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    const nextTitle = messages.length === 0 ? trimmed.slice(0, 40) : chatTitle;
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setChatTitle(nextTitle);
    setInputValue('');
    setIsStreaming(true);
    await saveMessages(withUser, nextTitle);
    setTimeout(scrollToBottom, 100);

    const botId = Date.now() + 1;
    const botMsg = { id: botId, text: '', sender: 'bot', timestamp: new Date().toISOString(), source: null };
    setMessages((prev) => [...prev, botMsg]);
    setTimeout(scrollToBottom, 100);

    let accumulated = '';
    let source = null;

    const cancel = await chatAPI.sendMessageStream(
      trimmed,
      employee?.employee_id,
      (chunk) => {
        if (chunk.type === 'context') {
          source = chunk.source;
        } else if (chunk.type === 'token') {
          accumulated += chunk.delta || '';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId ? { ...m, text: accumulated, source } : m
            )
          );
          setTimeout(scrollToBottom, 50);
        }
      },
      async () => {
        setIsStreaming(false);
        cancelStreamRef.current = null;
        setMessages((prev) => {
          const final = prev.map((m) =>
            m.id === botId ? { ...m, text: accumulated, source } : m
          );
          saveMessages(final, nextTitle);
          return final;
        });
      },
      async () => {
        // Fallback to non-streaming on error
        setIsStreaming(false);
        cancelStreamRef.current = null;
        try {
          const res = await chatAPI.sendMessage(trimmed, employee?.employee_id);
          const fallbackText = res.response || 'Не удалось получить ответ.';
          setMessages((prev) => {
            const final = prev.map((m) =>
              m.id === botId ? { ...m, text: fallbackText, source: res.source } : m
            );
            saveMessages(final, nextTitle);
            return final;
          });
        } catch {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? { ...m, text: 'Произошла ошибка. Попробуйте снова.' }
                : m
            )
          );
        }
      }
    );
    cancelStreamRef.current = cancel;
  };

  const s = makeStyles(colors);

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[s.msgRow, isUser ? s.msgRowUser : s.msgRowBot]}>
        {!isUser && (
          <View style={s.botAvatar}>
            <Text style={s.botAvatarText}>Т</Text>
          </View>
        )}
        <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleBot]}>
          <Text style={[s.bubbleText, isUser && { color: colors.userBubbleText }]}>
            {item.text}
            {isStreaming && item.id === messages[messages.length - 1]?.id && !isUser && (
              <Text style={s.cursor}>▋</Text>
            )}
          </Text>
          {item.source && (
            <Text style={s.source}>📄 {item.source}</Text>
          )}
          <Text style={[s.time, isUser && { color: colors.userBubbleText, opacity: 0.7 }]}>
            {new Date(item.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {isUser && (
          <View style={s.userAvatar}>
            <Text style={s.userAvatarText}>{getInitials(employee?.full_name)}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>{chatTitle}</Text>
          <Text style={s.headerSub}>AI-ассистент «Техна»</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Messages */}
        {messages.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Text style={s.emptyIconText}>Т</Text>
            </View>
            <Text style={s.emptyTitle}>AI-ассистент «Техна»</Text>
            <Text style={s.emptySub}>Задайте вопрос или выберите тему ниже</Text>
            <View style={s.quickList}>
              {QUICK_QUESTIONS.map((q) => (
                <TouchableOpacity key={q} style={s.quickBtn} onPress={() => sendMessage(q)}>
                  <Text style={s.quickText}>{q}</Text>
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

        {/* Typing indicator */}
        {isStreaming && messages[messages.length - 1]?.text === '' && (
          <View style={s.typingRow}>
            <View style={s.botAvatar}>
              <Text style={s.botAvatarText}>Т</Text>
            </View>
            <View style={s.typingBubble}>
              <ActivityIndicator size="small" color={colors.moss} />
            </View>
          </View>
        )}

        {/* Input */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Напишите сообщение..."
            placeholderTextColor={colors.ink3}
            value={inputValue}
            onChangeText={setInputValue}
            multiline
            maxLength={1000}
            editable={!isStreaming}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!inputValue.trim() || isStreaming) && s.sendBtnDisabled]}
            onPress={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isStreaming}
          >
            <Text style={s.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    backIcon: { fontSize: 24, color: colors.moss, fontWeight: '600' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.ink,
      fontFamily: 'Inter_600SemiBold',
    },
    headerSub: {
      fontSize: 12,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
    },
    msgList: {
      padding: spacing.lg,
      gap: spacing.md,
      paddingBottom: spacing.xl,
    },
    msgRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    msgRowBot: { justifyContent: 'flex-start' },
    msgRowUser: { justifyContent: 'flex-end' },
    botAvatar: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: colors.moss,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    botAvatarText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.pistachio,
      fontFamily: 'Inter_700Bold',
    },
    userAvatar: {
      width: 32,
      height: 32,
      borderRadius: radius.full,
      backgroundColor: colors.sage,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    userAvatarText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.ink,
      fontFamily: 'Inter_700Bold',
    },
    bubble: {
      maxWidth: '75%',
      padding: spacing.md,
      borderRadius: radius.md,
    },
    bubbleBot: {
      backgroundColor: colors.botBubbleBg,
      borderWidth: 1,
      borderColor: colors.botBubbleBorder,
    },
    bubbleUser: {
      backgroundColor: colors.userBubbleBg,
    },
    bubbleText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.ink,
      fontFamily: 'Inter_400Regular',
    },
    cursor: { color: colors.moss },
    source: {
      fontSize: 11,
      color: colors.ink3,
      marginTop: spacing.xs,
      fontFamily: 'Inter_400Regular',
    },
    time: {
      fontSize: 11,
      color: colors.ink3,
      marginTop: spacing.xs,
      fontFamily: 'Inter_400Regular',
    },
    typingRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    typingBubble: {
      padding: spacing.md,
      backgroundColor: colors.botBubbleBg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.botBubbleBorder,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: radius.xl,
      backgroundColor: colors.moss,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    emptyIconText: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.pistachio,
      fontFamily: 'Inter_700Bold',
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.ink,
      fontFamily: 'Inter_700Bold',
    },
    emptySub: {
      fontSize: 14,
      color: colors.ink3,
      textAlign: 'center',
      fontFamily: 'Inter_400Regular',
    },
    quickList: {
      width: '100%',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    quickBtn: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    quickText: {
      fontSize: 14,
      color: colors.moss,
      fontFamily: 'Inter_500Medium',
      fontWeight: '500',
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.paper,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    input: {
      flex: 1,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
      color: colors.ink,
      maxHeight: 120,
      fontFamily: 'Inter_400Regular',
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: colors.moss,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
    sendIcon: {
      fontSize: 20,
      color: colors.pistachio,
      fontWeight: '700',
    },
  });
