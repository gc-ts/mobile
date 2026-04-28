import React, { useState, useCallback, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import AppTopBar from '../../components/AppTopBar';
import ScreenBackdrop from '../../components/ScreenBackdrop';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { spacing } from '../../styles/theme';

function formatChatDate(dateStr) {
  const date = new Date(dateStr);
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

function buildDraftChat() {
  return {
    id: Date.now(),
    title: 'Новый чат',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function ChatListScreen({ navigation }) {
  const { colors } = useTheme();
  const { employee } = useAuth();
  const [chats, setChats] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  const storageKey = `chats_${employee?.employee_id}`;

  const loadChats = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const list = raw ? JSON.parse(raw) : [];

      if (list.length === 0) {
        const initialChat = buildDraftChat();
        await AsyncStorage.setItem(storageKey, JSON.stringify([initialChat]));
        setChats([initialChat]);
        return;
      }

      setChats(list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    } catch {
      setChats([]);
    }
  }, [storageKey]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  const createChat = async () => {
    const newChat = buildDraftChat();
    const updated = [newChat, ...chats];
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    setChats(updated);
    navigation.navigate('Chat', { chatId: newChat.id });
  };

  const deleteChat = async (chatId) => {
    Alert.alert('Удалить чат?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          const updated = chats.filter((chat) => chat.id !== chatId);
          if (updated.length === 0) {
            const initialChat = buildDraftChat();
            setChats([initialChat]);
            await AsyncStorage.setItem(storageKey, JSON.stringify([initialChat]));
            return;
          }

          setChats(updated);
          await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
        },
      },
    ]);
  };

  const filteredChats = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return chats;

    return chats.filter((chat) => {
      const lastMessage = chat.messages[chat.messages.length - 1]?.text ?? '';
      return `${chat.title} ${lastMessage}`.toLowerCase().includes(query);
    });
  }, [chats, searchValue]);

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.root}>
      <ScreenBackdrop />
      <AppTopBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Поиск по чатам..."
      />

      <View style={s.panel}>
        <View style={s.panelHeader}>
          <View style={s.panelCopy}>
            <Text style={s.title}>Ваши чаты.</Text>
            <Text style={s.kicker}>История диалогов с Techna</Text>
          </View>
          <TouchableOpacity style={s.primaryBtn} onPress={createChat}>
            <Text style={s.primaryBtnText}>НОВЫЙ ЧАТ</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionKicker}>
          {searchValue.trim() ? `Найдено: ${filteredChats.length}` : `Ваши чаты: ${chats.length}`}
        </Text>

        <FlatList
          data={filteredChats}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const lastMsg = item.messages[item.messages.length - 1];
            const isLead = index === 0;

            return (
              <Pressable
                style={({ hovered, pressed }) => [
                  s.chatItem,
                  isLead && s.chatItemLead,
                  hovered && s.chatItemHovered,
                  pressed && s.chatItemPressed,
                ]}
                onPress={() => navigation.navigate('Chat', { chatId: item.id })}
                onLongPress={() => deleteChat(item.id)}
              >
                <View style={s.chatBody}>
                  <Text style={s.chatTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={s.chatMeta}>
                    {formatChatDate(item.updatedAt)} · {item.messages.length} сообщ.
                  </Text>
                  <Text style={s.chatPreview} numberOfLines={2}>
                    {lastMsg
                      ? `${lastMsg.sender === 'user' ? 'Вы: ' : ''}${lastMsg.text}`
                      : 'Новый диалог с AI-ассистентом.'}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>Ничего не найдено</Text>
              <Text style={s.emptyText}>Попробуйте другой запрос или создайте новый чат.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    panel: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    panelCopy: {
      flex: 1,
    },
    title: {
      color: colors.ink,
      fontSize: 32,
      fontFamily: 'Fraunces_400Regular',
      marginBottom: 4,
    },
    kicker: {
      color: colors.ink2,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Inter_400Regular',
    },
    primaryBtn: {
      backgroundColor: colors.pistachio,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    primaryBtnText: {
      color: colors.pistachioInk,
      fontSize: 10,
      letterSpacing: 1.1,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    sectionKicker: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
      marginBottom: spacing.sm,
    },
    list: {
      paddingBottom: spacing.xxxl,
    },
    chatItem: {
      borderTopWidth: 1,
      borderLeftWidth: 2,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.line,
      borderLeftColor: 'transparent',
      backgroundColor: colors.paper,
      marginBottom: -1,
    },
    chatItemLead: {
      borderLeftColor: colors.pistachio,
    },
    chatItemHovered: {
      borderColor: colors.moss,
      backgroundColor: colors.mossWash,
    },
    chatItemPressed: {
      opacity: 0.9,
    },
    chatBody: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: 4,
    },
    chatTitle: {
      color: colors.ink,
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
    },
    chatMeta: {
      color: colors.ink3,
      fontSize: 11,
      fontFamily: 'JetBrainsMono_400Regular',
    },
    chatPreview: {
      color: colors.ink2,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'Inter_400Regular',
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
