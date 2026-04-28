import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { radius, spacing } from '../../styles/theme';

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function ChatListScreen({ navigation }) {
  const { colors } = useTheme();
  const { employee, logout } = useAuth();
  const [chats, setChats] = useState([]);

  const storageKey = `chats_${employee?.employee_id}`;

  const loadChats = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const list = raw ? JSON.parse(raw) : [];
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
    const newChat = {
      id: Date.now(),
      title: 'Новый чат',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newChat, ...chats];
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    navigation.navigate('Chat', { chatId: newChat.id });
  };

  const deleteChat = async (chatId) => {
    Alert.alert('Удалить чат?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          const updated = chats.filter((c) => c.id !== chatId);
          setChats(updated);
          await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
        },
      },
    ]);
  };

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{getInitials(employee?.full_name)}</Text>
          </View>
          <View>
            <Text style={s.name}>{employee?.full_name || 'Пользователь'}</Text>
            <Text style={s.position}>{employee?.position || employee?.department || ''}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={s.titleRow}>
        <Text style={s.title}>Чаты</Text>
        <TouchableOpacity style={s.newBtn} onPress={createChat}>
          <Text style={s.newBtnText}>+ Новый</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {chats.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>💬</Text>
          <Text style={s.emptyTitle}>Нет чатов</Text>
          <Text style={s.emptySubtitle}>Создайте первый чат с AI-ассистентом</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={createChat}>
            <Text style={s.emptyBtnText}>Начать чат</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          renderItem={({ item }) => {
            const lastMsg = item.messages[item.messages.length - 1];
            return (
              <TouchableOpacity
                style={s.chatItem}
                onPress={() => navigation.navigate('Chat', { chatId: item.id })}
                onLongPress={() => deleteChat(item.id)}
              >
                <View style={s.chatIcon}>
                  <Text style={s.chatIconText}>💬</Text>
                </View>
                <View style={s.chatBody}>
                  <View style={s.chatTop}>
                    <Text style={s.chatTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={s.chatDate}>{formatDate(item.updatedAt)}</Text>
                  </View>
                  {lastMsg && (
                    <Text style={s.chatPreview} numberOfLines={1}>
                      {lastMsg.sender === 'user' ? 'Вы: ' : ''}
                      {lastMsg.text}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.paper,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      paddingTop: Platform.OS === 'android' ? spacing.xxxl : spacing.md,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: colors.moss,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: colors.pistachio,
      fontSize: 15,
      fontWeight: '700',
      fontFamily: 'Inter_700Bold',
    },
    name: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.ink,
      fontFamily: 'Inter_600SemiBold',
    },
    position: {
      fontSize: 12,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
    },
    logoutBtn: { padding: spacing.sm },
    logoutText: {
      color: colors.moss,
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter_600SemiBold',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.ink,
      fontFamily: 'Inter_700Bold',
    },
    newBtn: {
      backgroundColor: colors.moss,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    newBtnText: {
      color: colors.pistachio,
      fontSize: 13,
      fontWeight: '700',
      fontFamily: 'Inter_700Bold',
    },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.line,
    },
    chatIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.bg2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chatIconText: { fontSize: 20 },
    chatBody: { flex: 1 },
    chatTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    chatTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.ink,
      fontFamily: 'Inter_600SemiBold',
      flex: 1,
      marginRight: spacing.sm,
    },
    chatDate: {
      fontSize: 12,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
    },
    chatPreview: {
      fontSize: 13,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xxxl,
      gap: spacing.md,
    },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.ink,
      fontFamily: 'Inter_700Bold',
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.ink3,
      textAlign: 'center',
      fontFamily: 'Inter_400Regular',
    },
    emptyBtn: {
      backgroundColor: colors.moss,
      borderRadius: radius.full,
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.md,
      marginTop: spacing.md,
    },
    emptyBtnText: {
      color: colors.pistachio,
      fontSize: 15,
      fontWeight: '700',
      fontFamily: 'Inter_700Bold',
    },
  });
