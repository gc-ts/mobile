import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../styles/theme';

function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getShortName(name) {
  if (!name) return 'Пользователь';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length < 2) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

export default function AppTopBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Поиск...',
  hideProfileChip = false,
}) {
  const navigation = useNavigation();
  const { employee } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const s = makeStyles(colors);

  return (
    <View style={s.topbar}>
      <View style={s.row}>
        <View style={s.brandBlock}>
          <View style={s.logoBox}>
            <Text style={s.logoText}>T</Text>
          </View>
          <View style={s.brandText}>
            <View style={s.brandRow}>
              <Text style={s.brand}>Техна.</Text>
              {employee?.role === 'admin' ? (
                <View style={s.adminBadge}>
                  <Text style={s.adminBadgeText}>ADMIN</Text>
                </View>
              ) : null}
            </View>
            <Text style={s.brandSub}>AI-ассистент + форум</Text>
          </View>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.ghostBtn} onPress={toggleTheme}>
            <Text style={s.ghostBtnText}>{isDark ? 'LIGHT' : 'DARK'}</Text>
          </TouchableOpacity>

          {!hideProfileChip ? (
            <TouchableOpacity
              style={s.userChip}
              onPress={() => navigation.getParent()?.navigate('ProfileTab')}
            >
              <View style={s.userAvatar}>
                <Text style={s.userAvatarText}>{getInitials(employee?.full_name)}</Text>
              </View>
              <Text style={s.userName} numberOfLines={1}>
                {getShortName(employee?.full_name)}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {typeof onSearchChange === 'function' ? (
        <View style={s.searchWrap}>
          <TextInput
            style={s.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.ink3}
            value={searchValue}
            onChangeText={onSearchChange}
          />
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    topbar: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      paddingTop: Platform.OS === 'android' ? spacing.xxxl : spacing.md,
      gap: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      backgroundColor: colors.bg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    brandBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    logoBox: {
      width: 42,
      height: 42,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.paper,
    },
    logoText: {
      color: colors.moss,
      fontSize: 20,
      fontFamily: 'Fraunces_500Medium',
    },
    brandText: {
      gap: 2,
      flex: 1,
    },
    brand: {
      color: colors.ink,
      fontSize: 22,
      fontFamily: 'Fraunces_400Regular',
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    adminBadge: {
      backgroundColor: colors.pistachio,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    adminBadgeText: {
      color: colors.pistachioInk,
      fontSize: 9,
      letterSpacing: 1,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    brandSub: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_400Regular',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      maxWidth: '52%',
    },
    ghostBtn: {
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: 'transparent',
    },
    ghostBtnText: {
      color: colors.ink2,
      fontSize: 10,
      letterSpacing: 0.8,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    userChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.line,
      paddingLeft: 6,
      paddingRight: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.paper,
      maxWidth: 148,
    },
    userAvatar: {
      width: 28,
      height: 28,
      borderRadius: 999,
      backgroundColor: colors.moss,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userAvatarText: {
      color: colors.paper,
      fontSize: 10,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    userName: {
      color: colors.ink,
      fontSize: 12,
      fontFamily: 'Inter_600SemiBold',
      flexShrink: 1,
    },
    searchWrap: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.md,
    },
    searchInput: {
      color: colors.ink,
      fontSize: 13,
      paddingVertical: 10,
      fontFamily: 'Inter_400Regular',
    },
  });
