import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AppTopBar from '../../components/AppTopBar';
import ScreenBackdrop from '../../components/ScreenBackdrop';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { employeeAPI } from '../../services/api';
import { spacing } from '../../styles/theme';

const PROFILE_FIELDS = [
  { key: 'fullName', label: 'ФИО', placeholder: 'Потапов Артем Павлович' },
  { key: 'middleName', label: 'Отчество', placeholder: 'Павлович' },
  { key: 'email', label: 'Email', placeholder: 'name@company.ru' },
  { key: 'additionalEmail', label: 'Доп. email', placeholder: 'personal@example.com' },
  { key: 'position', label: 'Должность', placeholder: 'Senior Developer' },
  { key: 'department', label: 'Отдел', placeholder: 'IT' },
  { key: 'phone', label: 'Телефон', placeholder: '+7 (999) 123-45-67' },
  { key: 'telegram', label: 'Telegram', placeholder: '@username' },
  { key: 'city', label: 'Город', placeholder: 'Москва' },
  { key: 'oneCCode', label: 'Код 1С', placeholder: '1C-123' },
  { key: 'birthDate', label: 'Дата рождения', placeholder: '1990-05-20' },
  { key: 'hireDate', label: 'Дата приема', placeholder: '2020-01-15' },
  { key: 'medicalExamDate', label: 'Медосмотр', placeholder: '2026-06-01' },
  { key: 'sanitaryMinimumDate', label: 'Санминимум', placeholder: '2026-08-01' },
  { key: 'vacationDays', label: 'Дней отпуска', placeholder: '28', keyboardType: 'numeric' },
  { key: 'nextVacation', label: 'Следующий отпуск', placeholder: '2026-07-01' },
  { key: 'salary', label: 'Зарплата', placeholder: '120000', keyboardType: 'numeric' },
  { key: 'bonusBalance', label: 'Бонусы', placeholder: '0', keyboardType: 'numeric' },
];

function pick(employee, snakeKey, camelKey) {
  return employee?.[camelKey] ?? employee?.[snakeKey] ?? null;
}

function getEmployeeId(employee) {
  return pick(employee, 'employee_id', 'employeeId') ?? employee?.id ?? null;
}

function normalizeEmployee(employee) {
  return {
    employeeId: getEmployeeId(employee) || '',
    fullName: pick(employee, 'full_name', 'fullName') || '',
    middleName: pick(employee, 'middle_name', 'middleName') || '',
    email: pick(employee, 'email', 'email') || '',
    additionalEmail: pick(employee, 'additional_email', 'additionalEmail') || '',
    position: pick(employee, 'position', 'position') || '',
    department: pick(employee, 'department', 'department') || '',
    phone: pick(employee, 'phone', 'phone') || '',
    telegram: pick(employee, 'telegram', 'telegram') || '',
    city: pick(employee, 'city', 'city') || '',
    oneCCode: pick(employee, 'one_c_code', 'oneCCode') || '',
    birthDate: pick(employee, 'birth_date', 'birthDate') || '',
    hireDate: pick(employee, 'hire_date', 'hireDate') || '',
    medicalExamDate: pick(employee, 'medical_exam_date', 'medicalExamDate') || '',
    sanitaryMinimumDate: pick(employee, 'sanitary_minimum_date', 'sanitaryMinimumDate') || '',
    vacationDays: String(pick(employee, 'vacation_days', 'vacationDays') ?? ''),
    nextVacation: pick(employee, 'next_vacation', 'nextVacation') || '',
    salary: String(pick(employee, 'salary', 'salary') ?? ''),
    bonusBalance: String(pick(employee, 'bonus_balance', 'bonusBalance') ?? ''),
    role: pick(employee, 'role', 'role') || 'employee',
  };
}

function compactPayload(form) {
  const payload = {};
  Object.entries(form).forEach(([key, value]) => {
    if (key === 'employeeId' || key === 'role') return;
    if (value === '') return;
    payload[key] = ['vacationDays', 'salary', 'bonusBalance'].includes(key) ? Number(value) : value;
  });
  return payload;
}

function getInitials(fullName) {
  return (fullName || 'Пользователь')
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
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatShortDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
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

function FormField({ colors, field, value, editable, onChange }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.ink3 }]}>{field.label}</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
          !editable && { opacity: 0.65 },
        ]}
        editable={editable}
        placeholder={field.placeholder}
        placeholderTextColor={colors.ink3}
        value={value}
        keyboardType={field.keyboardType || 'default'}
        onChangeText={(nextValue) => onChange(field.key, nextValue)}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const { employee, logout, updateEmployee } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(employee);
  const [form, setForm] = useState(() => normalizeEmployee(employee));
  const [vacation, setVacation] = useState(null);
  const [birthday, setBirthday] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const employeeId = getEmployeeId(employee);
  const fullName = form.fullName || 'Пользователь';
  const s = makeStyles(colors);

  useEffect(() => {
    setProfile(employee);
    setForm(normalizeEmployee(employee));
  }, [employee]);

  useEffect(() => {
    loadProfile(false);
  }, [employeeId]);

  async function loadProfile(isRefresh) {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const [employeeResult, vacationResult, birthdayResult] = await Promise.allSettled([
      employeeAPI.getEmployee(employeeId),
      employeeAPI.getVacation(employeeId),
      employeeAPI.getBirthday(employeeId),
    ]);

    if (employeeResult.status === 'fulfilled') {
      const nextProfile = { ...(employee || {}), ...employeeResult.value };
      setProfile(nextProfile);
      setForm(normalizeEmployee(nextProfile));
      await updateEmployee(nextProfile);
    }

    if (vacationResult.status === 'fulfilled') setVacation(vacationResult.value);
    if (birthdayResult.status === 'fulfilled') setBirthday(birthdayResult.value);

    setLoading(false);
    setRefreshing(false);
  }

  function updateForm(key, value) {
    setSaveNotice(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveProfile() {
    if (!employeeId) {
      setSaveNotice({ type: 'error', text: 'Не найден табельный номер пользователя.' });
      return;
    }
    setIsSaving(true);
    setSaveNotice(null);
    const nextProfile = { ...(profile || {}), ...form };
    try {
      const saved = await employeeAPI.updateEmployee(employeeId, compactPayload(form));
      const syncedProfile = { ...nextProfile, ...saved };
      setProfile(syncedProfile);
      await updateEmployee(syncedProfile);
      setIsEditing(false);
      setSaveNotice({ type: 'success', text: 'Профиль обновлен.' });
      Alert.alert('Готово', 'Профиль обновлен.');
    } catch (error) {
      const status = error?.response?.status;
      const isMissingUpdateEndpoint =
        status === 404 ||
        status === 405 ||
        error?.code === 'ERR_NETWORK' ||
        error?.response?.data?.error === 'Route not found';

      if (isMissingUpdateEndpoint) {
        setProfile(nextProfile);
        await updateEmployee(nextProfile);
        setIsEditing(false);
        setSaveNotice({
          type: 'warning',
          text: 'Сохранено локально. Backend пока не отдает endpoint для обновления профиля, поэтому после перелогина данные могут вернуться с сервера.',
        });
        return;
      }

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Не удалось сохранить профиль.';
      Alert.alert('Ошибка', message);
      setSaveNotice({ type: 'error', text: message });
    } finally {
      setIsSaving(false);
    }
  }

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
          <Text style={s.position}>{form.position || 'Должность не указана'}</Text>
          <Text style={s.department}>{form.department || 'Отдел не указан'}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleBadgeText}>{form.role === 'admin' ? 'ADMIN' : 'EMPLOYEE'}</Text>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Профиль</Text>
            <TouchableOpacity
              style={s.inlineBtn}
              onPress={() => {
                if (isEditing) setForm(normalizeEmployee(profile));
                setIsEditing((value) => !value);
              }}
              disabled={isSaving}
            >
              <Text style={s.inlineBtnText}>{isEditing ? 'CANCEL' : 'EDIT'}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.formCard}>
            {saveNotice ? (
              <View
                style={[
                  s.notice,
                  saveNotice.type === 'success' && s.noticeSuccess,
                  saveNotice.type === 'warning' && s.noticeWarning,
                  saveNotice.type === 'error' && s.noticeError,
                ]}
              >
                <Text style={s.noticeText}>{saveNotice.text}</Text>
              </View>
            ) : null}

            <FormField
              colors={colors}
              field={{ key: 'employeeId', label: 'Табельный номер', placeholder: '12345' }}
              value={form.employeeId}
              editable={false}
              onChange={updateForm}
            />
            {PROFILE_FIELDS.map((field) => (
              <FormField
                key={field.key}
                colors={colors}
                field={field}
                value={form[field.key]}
                editable={isEditing}
                onChange={updateForm}
              />
            ))}

            {isEditing ? (
              <TouchableOpacity
                style={[s.primaryBtn, isSaving && s.disabledBtn]}
                onPress={saveProfile}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator color={colors.bg} /> : <Text style={s.primaryBtnText}>SAVE PROFILE</Text>}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>HR Snapshot</Text>
          <View style={s.metricsRow}>
            <View style={s.metricCard}>
              <Text style={s.metricValue}>{(vacation?.remainingDays ?? form.vacationDays) || '—'}</Text>
              <Text style={s.metricLabel}>days left</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricValue}>{formatShortDate(vacation?.nextVacation ?? form.nextVacation)}</Text>
              <Text style={s.metricLabel}>next vacation</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricValue}>{getAgeFromDate(form.birthDate ?? birthday?.birthDate, birthday?.age)}</Text>
              <Text style={s.metricLabel}>age</Text>
            </View>
          </View>
          <View style={s.infoCard}>
            <Text style={s.infoText}>Дата рождения: {formatDate(form.birthDate ?? birthday?.birthDate)}</Text>
            <Text style={s.infoText}>Дата приема: {formatDate(form.hireDate)}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Настройки</Text>
          <View style={s.actionsCard}>
            <TouchableOpacity style={s.secondaryBtn} onPress={toggleTheme}>
              <Text style={s.secondaryBtnText}>{isDark ? 'SWITCH TO LIGHT' : 'SWITCH TO DARK'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.logoutBtn} onPress={logout}>
              <Text style={s.logoutBtnText}>LOGOUT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
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
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.md,
    },
    sectionTitle: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    inlineBtn: {
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: colors.paper,
    },
    inlineBtnText: {
      color: colors.ink2,
      fontSize: 10,
      letterSpacing: 1,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    formCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.lg,
      gap: spacing.md,
    },
    notice: {
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    noticeSuccess: {
      backgroundColor: colors.mossWash,
      borderColor: colors.moss,
    },
    noticeWarning: {
      backgroundColor: colors.pistachioWash,
      borderColor: colors.pistachio,
    },
    noticeError: {
      backgroundColor: colors.hotWash,
      borderColor: colors.hot,
    },
    noticeText: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'Inter_400Regular',
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
    infoCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.md,
      gap: 6,
    },
    infoText: {
      color: colors.ink2,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'Inter_400Regular',
    },
    actionsCard: {
      gap: spacing.sm,
    },
    primaryBtn: {
      backgroundColor: colors.ink,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryBtnText: {
      color: colors.bg,
      fontSize: 10,
      letterSpacing: 1.2,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    disabledBtn: {
      opacity: 0.5,
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
    logoutBtn: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.hot,
      paddingVertical: 14,
      alignItems: 'center',
    },
    logoutBtnText: {
      color: colors.hot,
      fontSize: 10,
      letterSpacing: 1.2,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
  });
