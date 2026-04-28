import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { employeeAPI } from '../../services/api';
import { radius, spacing } from '../../styles/theme';

function pick(employee, snakeKey, camelKey) {
  return employee?.[snakeKey] ?? employee?.[camelKey] ?? null;
}

function getEmployeeId(employee) {
  return pick(employee, 'employee_id', 'employeeId') ?? pick(employee, 'id', 'id');
}

function getFullName(employee) {
  return pick(employee, 'full_name', 'fullName') ?? 'Пользователь';
}

function getInitials(fullName) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

function getAgeFromDate(value, apiAge) {
  if (typeof apiAge === 'number') return `${apiAge} лет`;
  if (!value) return '—';

  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return '—';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return `${age} лет`;
}

function FieldCard({ colors, label, value, compact = false }) {
  return (
    <View
      style={[
        styles.fieldCard,
        {
          backgroundColor: colors.paper,
          borderColor: colors.line,
          minWidth: compact ? '48%' : '100%',
        },
      ]}
    >
      <Text style={[styles.fieldLabel, { color: colors.ink3 }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: colors.ink }]}>{value || '—'}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { employee, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(employee);
  const [vacation, setVacation] = useState(null);
  const [birthday, setBirthday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const employeeId = getEmployeeId(employee);
  const fullName = getFullName(profile);

  useEffect(() => {
    setProfile(employee);
  }, [employee]);

  useEffect(() => {
    loadProfile(false);
  }, [employeeId]);

  async function loadProfile(isRefresh) {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const [employeeResult, vacationResult, birthdayResult] = await Promise.allSettled([
      employeeAPI.getEmployee(employeeId),
      employeeAPI.getVacation(employeeId),
      employeeAPI.getBirthday(employeeId),
    ]);

    if (employeeResult.status === 'fulfilled') {
      setProfile((prev) => ({ ...prev, ...employeeResult.value }));
    }

    if (vacationResult.status === 'fulfilled') {
      setVacation(vacationResult.value);
    }

    if (birthdayResult.status === 'fulfilled') {
      setBirthday(birthdayResult.value);
    }

    setLoading(false);
    setRefreshing(false);
  }

  const s = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={s.loaderRoot}>
        <ActivityIndicator size="large" color={colors.moss} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            tintColor={colors.moss}
          />
        }
      >
        <View style={s.headerRow}>
          <View>
            <Text style={s.pageTitle}>Профиль</Text>
            <Text style={s.pageSubtitle}>Данные сотрудника и быстрые HR-сводки</Text>
          </View>
          <TouchableOpacity style={s.themeButton} onPress={toggleTheme}>
            <Text style={s.themeButtonText}>{isDark ? 'Светлая' : 'Темная'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.heroCard}>
          <View style={s.heroTop}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{getInitials(fullName)}</Text>
            </View>
            <View style={s.heroText}>
              <Text style={s.name}>{fullName}</Text>
              <Text style={s.roleLine}>
                {pick(profile, 'position', 'position') || 'Должность не указана'}
              </Text>
              <Text style={s.departmentLine}>
                {pick(profile, 'department', 'department') || 'Отдел не указан'}
              </Text>
            </View>
          </View>

          <View style={s.badgesRow}>
            <View style={s.badge}>
              <Text style={s.badgeLabel}>ID</Text>
              <Text style={s.badgeValue}>{employeeId || '—'}</Text>
            </View>
            <View style={s.badge}>
              <Text style={s.badgeLabel}>Роль</Text>
              <Text style={s.badgeValue}>
                {pick(profile, 'role', 'role') === 'admin' ? 'Администратор' : 'Сотрудник'}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Основное</Text>
          <FieldCard colors={colors} label="Табельный номер" value={employeeId} />
          <FieldCard colors={colors} label="Email" value={pick(profile, 'email', 'email')} />
          <FieldCard colors={colors} label="Телефон" value={pick(profile, 'phone', 'phone')} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Рабочие данные</Text>
          <View style={s.gridRow}>
            <FieldCard
              colors={colors}
              label="Дата выхода"
              value={formatDate(pick(profile, 'hire_date', 'hireDate'))}
              compact
            />
            <FieldCard
              colors={colors}
              label="Дата рождения"
              value={formatDate(pick(profile, 'birth_date', 'birthDate') ?? birthday?.birthDate)}
              compact
            />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>HR-сводка</Text>
          <View style={s.metricsRow}>
            <View style={s.metricCard}>
              <Text style={s.metricValue}>
                {vacation?.remainingDays ?? pick(profile, 'vacation_days', 'vacationDays') ?? '—'}
              </Text>
              <Text style={s.metricLabel}>Дней отпуска</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricValue}>
                {formatShortDate(vacation?.nextVacation ?? pick(profile, 'next_vacation', 'nextVacation'))}
              </Text>
              <Text style={s.metricLabel}>Ближайший отпуск</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricValue}>
                {getAgeFromDate(
                  pick(profile, 'birth_date', 'birthDate') ?? birthday?.birthDate,
                  birthday?.age
                )}
              </Text>
              <Text style={s.metricLabel}>Возраст</Text>
            </View>
          </View>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.secondaryButton} onPress={toggleTheme}>
            <Text style={s.secondaryButtonText}>
              {isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.primaryButton} onPress={logout}>
            <Text style={s.primaryButtonText}>Выйти из аккаунта</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fieldCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Inter_500Medium',
  },
  fieldValue: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: 'Inter_600SemiBold',
  },
});

const makeStyles = (colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    loaderRoot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingTop: spacing.sm,
    },
    pageTitle: {
      fontSize: 28,
      color: colors.ink,
      fontFamily: 'Inter_700Bold',
    },
    pageSubtitle: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 20,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
    },
    themeButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
    },
    themeButtonText: {
      color: colors.ink2,
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
    },
    heroCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.lg,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.moss,
    },
    avatarText: {
      color: colors.pistachio,
      fontSize: 24,
      fontFamily: 'Inter_700Bold',
    },
    heroText: {
      flex: 1,
      gap: 4,
    },
    name: {
      fontSize: 22,
      lineHeight: 28,
      color: colors.ink,
      fontFamily: 'Inter_700Bold',
    },
    roleLine: {
      fontSize: 15,
      color: colors.ink2,
      fontFamily: 'Inter_600SemiBold',
    },
    departmentLine: {
      fontSize: 13,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
    },
    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    badge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.bg2,
    },
    badgeLabel: {
      fontSize: 10,
      color: colors.ink3,
      fontFamily: 'Inter_500Medium',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    badgeValue: {
      fontSize: 13,
      color: colors.ink,
      fontFamily: 'Inter_600SemiBold',
      marginTop: 2,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 18,
      color: colors.ink,
      fontFamily: 'Inter_700Bold',
    },
    gridRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    metricsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    metricCard: {
      flex: 1,
      minWidth: 96,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: 6,
    },
    metricValue: {
      fontSize: 20,
      color: colors.moss,
      fontFamily: 'Inter_700Bold',
    },
    metricLabel: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    primaryButton: {
      backgroundColor: colors.moss,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: colors.pistachio,
      fontSize: 15,
      fontFamily: 'Inter_700Bold',
    },
    secondaryButton: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: colors.ink,
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
    },
  });
