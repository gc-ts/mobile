import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Animated,
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
import { Feather } from '@expo/vector-icons';
import ScreenBackdrop from '../../components/ScreenBackdrop';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { chatAPI } from '../../services/api';
import { spacing } from '../../styles/theme';

const QUICK_QUESTIONS = [
  { icon: '🌴', text: 'Сколько у меня дней отпуска?' },
  { icon: '💸', text: 'Когда выплачивается аванс?' },
  { icon: '🏥', text: 'Как оформить больничный?' },
  { icon: '🎉', text: 'График работы в праздники' },
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

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function BotLogo({ size = 40, colors }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: colors.moss,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Text
        style={{
          color: colors.pistachio,
          fontSize: size * 0.46,
          fontFamily: 'Fraunces_500Medium',
          lineHeight: size * 0.5,
        }}
      >
        T
      </Text>
    </View>
  );
}

function TypingDots({ colors }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (animValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: -8,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 150);
    const anim3 = createAnimation(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', height: 20 }}>
      <Animated.View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.moss,
          transform: [{ translateY: dot1 }],
        }}
      />
      <Animated.View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.moss,
          transform: [{ translateY: dot2 }],
        }}
      />
      <Animated.View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.moss,
          transform: [{ translateY: dot3 }],
        }}
      />
    </View>
  );
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
      // Сохраняем текущие сообщения перед выходом
      if (messages.length > 0) {
        saveMessages(messages, chatTitle);
      }
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

        // Сохраняем сообщение бота даже если не все токены пришли
        setMessages((prev) => {
          let finalMessages = prev.map((message) =>
            message.id === botId ? { ...message, text: fullText || 'Ответ прерван', source } : message
          );

          // Если сообщение бота ещё не добавлено, добавляем его
          if (!botMessageAdded && fullText) {
            finalMessages = [
              ...finalMessages,
              {
                id: botId,
                text: fullText,
                sender: 'bot',
                timestamp: new Date().toISOString(),
                source,
              },
            ];
          }

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

  const renderMessage = ({ item, index }) => {
    const isUser = item.sender === 'user';
    const prev = messages[index - 1];
    const isGrouped = prev && prev.sender === item.sender;

    if (isUser) {
      return (
        <View style={[s.row, s.rowUser, isGrouped && s.rowGrouped]}>
          <View style={s.userColumn}>
            <View style={s.userBubble}>
              <Text style={s.userBubbleText}>{item.text}</Text>
            </View>
            <Text style={s.userTime}>{formatTime(item.timestamp)}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[s.row, s.rowBot, isGrouped && s.rowGrouped]}>
        <View style={s.avatarSlot}>
          {!isGrouped ? <BotLogo size={36} colors={colors} /> : null}
        </View>
        <View style={s.botColumn}>
          {!isGrouped ? <Text style={s.botName}>Техна</Text> : null}
          <View style={s.botBubble}>
            <Text style={s.botBubbleText}>{item.text}</Text>
            {item.source ? (
              <View style={s.sourceRow}>
                <Feather name="file-text" size={11} color={colors.ink3} />
                <Text style={s.sourceText}>{item.source}</Text>
              </View>
            ) : null}
          </View>
          <Text style={s.botTime}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root}>
      <ScreenBackdrop />

      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={22} color={colors.ink} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <View style={s.headerTitleRow}>
            <BotLogo size={28} colors={colors} />
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle} numberOfLines={1}>Техна</Text>
              <View style={s.statusRow}>
                <View style={s.onlineDot} />
                <Text style={s.headerStatus}>{isStreaming ? 'печатает…' : 'онлайн'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {messages.length === 0 ? (
          <View style={s.empty}>
            <BotLogo size={88} colors={colors} />
            <Text style={s.emptyTitle}>Привет!</Text>
            <Text style={s.emptySubtitle}>
              Я Техна — AI-ассистент по HR-вопросам.{'\n'}С чего начнём?
            </Text>

            <View style={s.quickList}>
              {QUICK_QUESTIONS.map((q) => (
                <TouchableOpacity
                  key={q.text}
                  style={s.quickChip}
                  onPress={() => sendMessage(q.text)}
                >
                  <Text style={s.quickEmoji}>{q.icon}</Text>
                  <Text style={s.quickText}>{q.text}</Text>
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
            ListFooterComponent={
              isTyping ? (
                <View style={[s.row, s.rowBot]}>
                  <View style={s.avatarSlot}>
                    <BotLogo size={36} colors={colors} />
                  </View>
                  <View style={s.botColumn}>
                    <View style={s.typingBubble}>
                      <TypingDots colors={colors} />
                    </View>
                  </View>
                </View>
              ) : null
            }
          />
        )}

        <View style={s.inputWrap}>
          <View style={s.inputBar}>
            <TextInput
              style={[s.input, !inputValue && s.inputEmpty]}
              placeholder="Сообщение для Техны…"
              placeholderTextColor={colors.ink3}
              value={inputValue}
              onChangeText={setInputValue}
              editable={!isStreaming}
              multiline
              maxLength={1000}
              textAlignVertical="center"
            />

            <TouchableOpacity
              style={[
                s.sendBtn,
                (!inputValue.trim() || isStreaming) && s.sendBtnDisabled,
              ]}
              onPress={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isStreaming}
            >
              <Feather
                name="arrow-up"
                size={18}
                color={inputValue.trim() && !isStreaming ? colors.paper : colors.ink3}
              />
            </TouchableOpacity>
          </View>
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      paddingTop: Platform.OS === 'android' ? spacing.xxl : spacing.sm,
      backgroundColor: colors.paper,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      flex: 1,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerTitle: {
      color: colors.ink,
      fontSize: 18,
      fontFamily: 'Fraunces_500Medium',
      lineHeight: 22,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    onlineDot: {
      width: 6,
      height: 6,
      borderRadius: 999,
      backgroundColor: colors.pistachio,
    },
    headerStatus: {
      color: colors.ink3,
      fontSize: 11,
      fontFamily: 'JetBrainsMono_400Regular',
      letterSpacing: 0.4,
    },

    msgList: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-end',
    },
    rowBot: {
      justifyContent: 'flex-start',
      paddingRight: spacing.xxxl,
    },
    rowUser: {
      justifyContent: 'flex-end',
      paddingLeft: spacing.xxxl,
    },
    rowGrouped: {
      marginTop: -spacing.sm,
    },
    avatarSlot: {
      width: 36,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    botColumn: {
      flexShrink: 1,
      gap: 4,
    },
    botName: {
      color: colors.ink3,
      fontSize: 11,
      letterSpacing: 0.6,
      fontFamily: 'JetBrainsMono_500Medium',
      paddingLeft: 4,
    },
    botBubble: {
      backgroundColor: colors.paper,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 4,
      justifyContent: 'center',
    },
    botBubbleText: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 23,
      fontFamily: 'Inter_400Regular',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    botTime: {
      color: colors.ink3,
      fontSize: 10,
      fontFamily: 'JetBrainsMono_400Regular',
      paddingLeft: 4,
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      borderStyle: 'dashed',
    },
    sourceText: {
      flex: 1,
      color: colors.ink3,
      fontSize: 11,
      lineHeight: 16,
      fontFamily: 'JetBrainsMono_400Regular',
    },
    typingBubble: {
      backgroundColor: colors.paper,
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },

    userColumn: {
      flexShrink: 1,
      alignItems: 'flex-end',
      gap: 4,
    },
    userBubble: {
      backgroundColor: colors.moss,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 4,
      maxWidth: '100%',
    },
    userBubbleText: {
      color: colors.paper,
      fontSize: 15,
      lineHeight: 23,
      fontFamily: 'Inter_400Regular',
    },
    userTime: {
      color: colors.ink3,
      fontSize: 10,
      fontFamily: 'JetBrainsMono_400Regular',
      paddingRight: 4,
    },

    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      gap: spacing.md,
    },
    emptyTitle: {
      color: colors.ink,
      fontSize: 32,
      textAlign: 'center',
      fontFamily: 'Fraunces_500Medium',
      marginTop: spacing.md,
    },
    emptySubtitle: {
      color: colors.ink2,
      fontSize: 14,
      lineHeight: 22,
      textAlign: 'center',
      fontFamily: 'Inter_400Regular',
      marginBottom: spacing.lg,
    },
    quickList: {
      gap: spacing.sm,
      width: '100%',
    },
    quickChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.paper,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 4,
    },
    quickEmoji: {
      fontSize: 18,
    },
    quickText: {
      flex: 1,
      color: colors.ink,
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
    },

    inputWrap: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: Platform.OS === 'ios' ? spacing.md : spacing.sm,
      backgroundColor: colors.bg,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.paper,
      borderRadius: 4,
      paddingLeft: spacing.md,
      paddingRight: spacing.sm,
      paddingVertical: spacing.sm,
      minHeight: 42,
    },
    input: {
      flex: 1,
      color: colors.ink,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Inter_400Regular',
      paddingVertical: 0,
      includeFontPadding: false,
      textAlignVertical: 'center',
      maxHeight: 70,
    },
    inputEmpty: {
      height: 32,
      lineHeight: 32,
    },
    sendBtn: {
      width: 32,
      height: 32,
      borderRadius: 4,
      backgroundColor: colors.moss,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: {
      backgroundColor: colors.bg2,
    },
  });
