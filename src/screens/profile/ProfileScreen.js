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
import AppTopBar from '../../components/AppTopBar';
import ScreenBackdrop from '../../components/ScreenBackdrop';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { employeeAPI } from '../../services/api';
import { spacing } from '../../styles/theme';

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
  if (typeof apiAge === 'number') return `${apiAge}`;
  if (!value) return '—';

  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return '—';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) age -= 1;
  return `${age}`;
}

function DetailRow({ colors, label, value }) {
  return (
    <View style={[styles.detailRow, { backgroundColor: colors.bg, borderColor: colors.line }]}>
      <Text style={[styles.detailLabel, { color: colors.ink3 }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.ink }]}>{value || '—'}</Text>
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
      <ScreenBackdrop />
      <AppTopBar hideProfileChip />

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
        <View style={s.header}>
          <Text style={s.title}>Settings.</Text>
          <Text style={s.kicker}>Профиль сотрудника и настройки приложения</Text>
        </View>

        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{getInitials(fullName)}</Text>
          </View>

          <Text style={s.name}>{fullName}</Text>
          <Text style={s.employeeId}>ID: {employeeId || '—'}</Text>

          <Text style={s.position}>{pick(profile, 'position', 'position') || 'Должность не указана'}</Text>
          <Text style={s.department}>{pick(profile, 'department', 'department') || 'Отдел не указан'}</Text>

          <View style={s.roleBadge}>
            <Text style={s.roleBadgeText}>
              {pick(profile, 'role', 'role') === 'admin' ? '★ ADMIN' : 'EMPLOYEE'}
            </Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Профиль</Text>
          <View style={s.detailsCard}>
            <DetailRow colors={colors} label="Табельный номер" value={employeeId} />
            <DetailRow colors={colors} label="Email" value={pick(profile, 'email', 'email')} />
            <DetailRow colors={colors} label="Должность" value={pick(profile, 'position', 'position')} />
            <DetailRow colors={colors} label="Отдел" value={pick(profile, 'department', 'department')} />
            <DetailRow colors={colors} label="Телефон" value={pick(profile, 'phone', 'phone')} />
            <DetailRow
              colors={colors}
              label="Дата рождения"
              value={formatDate(pick(profile, 'birth_date', 'birthDate') ?? birthday?.birthDate)}
            />
            <DetailRow
              colors={colors}
              label="Дата приема на работу"
              value={formatDate(pick(profile, 'hire_date', 'hireDate'))}
            />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>HR Snapshot</Text>
          <View style={s.metricsRow}>
            <View style={s.metricCard}>
              <Text style={s.metricValue}>
                {vacation?.remainingDays ?? pick(profile, 'vacation_days', 'vacationDays') ?? '—'}
              </Text>
              <Text style={s.metricLabel}>days left</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricValue}>
                {formatShortDate(vacation?.nextVacation ?? pick(profile, 'next_vacation', 'nextVacation'))}
              </Text>
              <Text style={s.metricLabel}>next vacation</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricValue}>
                {getAgeFromDate(
                  pick(profile, 'birth_date', 'birthDate') ?? birthday?.birthDate,
                  birthday?.age
                )}
              </Text>
              <Text style={s.metricLabel}>age</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Настройки</Text>
          <View style={s.actionsCard}>
            <TouchableOpacity style={s.secondaryBtn} onPress={toggleTheme}>
              <Text style={s.secondaryBtnText}>
                {isDark ? 'SWITCH TO LIGHT' : 'SWITCH TO DARK'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.primaryBtn} onPress={logout}>
              <Text style={s.primaryBtnText}>LOGOUT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  detailRow: {
    borderWidth: 1,
    padding: spacing.md,
    gap: 6,
  },
  detailLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  detailValue: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
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
    header: {
      gap: 4,
      paddingTop: spacing.sm,
    },
    title: {
      color: colors.ink,
      fontSize: 34,
      fontFamily: 'Fraunces_500Medium',
    },
    kicker: {
      color: colors.ink3,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_400Regular',
    },
    profileCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.xl,
      alignItems: 'center',
      gap: 6,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 999,
      backgroundColor: colors.sage,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    avatarText: {
      color: colors.paper,
      fontSize: 24,
      fontFamily: 'Fraunces_500Medium',
    },
    name: {
      color: colors.ink,
      fontSize: 22,
      textAlign: 'center',
      fontFamily: 'Fraunces_400Regular',
    },
    employeeId: {
      color: colors.ink3,
      fontSize: 11,
      letterSpacing: 0.6,
      fontFamily: 'JetBrainsMono_400Regular',
    },
    position: {
      color: colors.ink,
      fontSize: 14,
      textAlign: 'center',
      fontFamily: 'Inter_400Regular',
      marginTop: spacing.xs,
    },
    department: {
      color: colors.ink3,
      fontSize: 11,
      textAlign: 'center',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_400Regular',
    },
    roleBadge: {
      marginTop: spacing.md,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.bg,
    },
    roleBadgeText: {
      color: colors.moss,
      fontSize: 10,
      letterSpacing: 1.4,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    detailsCard: {
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
      padding: spacing.md,
      gap: 4,
    },
    metricValue: {
      fontSize: 28,
      color: colors.ink,
      fontFamily: 'Fraunces_500Medium',
    },
    metricLabel: {
      fontSize: 11,
      lineHeight: 16,
      color: colors.ink3,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_400Regular',
    },
    actionsCard: {
      gap: spacing.sm,
    },
    primaryBtn: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.hot,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryBtnText: {
      color: colors.hot,
      fontSize: 10,
      letterSpacing: 1.2,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    secondaryBtn: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.line,
      paddingVertical: 14,
      alignItems: 'center',
    },
    secondaryBtnText: {
      color: colors.ink2,
      fontSize: 10,
      letterSpacing: 1.2,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
  });
