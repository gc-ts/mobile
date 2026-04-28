import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { radius, spacing } from '../styles/theme';

export default function AuthScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    login: '',
    password: '',
    employeeId: '',
    email: '',
    fullName: '',
    position: '',
    department: '',
  });

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleLogin = async () => {
    if (!form.login || !form.password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login(form.login, form.password);
      await login(res.employee, res.token);
    } catch (e) {
      Alert.alert('Ошибка входа', e.response?.data?.message || 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!form.employeeId || !form.email || !form.password || !form.fullName) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }
    setLoading(true);
    try {
      await authAPI.register({
        employeeId: form.employeeId,
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        position: form.position,
        department: form.department,
      });
      Alert.alert('Готово', 'Регистрация завершена! Теперь войдите.');
      setIsLogin(true);
    } catch (e) {
      Alert.alert('Ошибка', e.response?.data?.message || 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.root}>
      <TouchableOpacity style={s.themeBtn} onPress={toggleTheme}>
        <Text style={s.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <View style={s.logoWrap}>
              <Text style={s.logoText}>Т</Text>
            </View>
            <Text style={s.brand}>Техна.</Text>
            <Text style={s.tagline}>HR-ассистент вашей компании</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            {/* Tabs */}
            <View style={s.tabs}>
              <TouchableOpacity
                style={[s.tab, isLogin && s.tabActive]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[s.tabText, isLogin && s.tabTextActive]}>Вход</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.tab, !isLogin && s.tabActive]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[s.tabText, !isLogin && s.tabTextActive]}>Регистрация</Text>
              </TouchableOpacity>
            </View>

            {isLogin ? (
              <View style={s.form}>
                <Field label="Табельный номер или Email" colors={colors}>
                  <TextInput
                    style={s.input}
                    placeholder="12345 или user@company.ru"
                    placeholderTextColor={colors.ink3}
                    value={form.login}
                    onChangeText={(v) => set('login', v)}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </Field>
                <Field label="Пароль" colors={colors}>
                  <TextInput
                    style={s.input}
                    placeholder="Введите пароль"
                    placeholderTextColor={colors.ink3}
                    value={form.password}
                    onChangeText={(v) => set('password', v)}
                    secureTextEntry
                    editable={!loading}
                  />
                </Field>
                <TouchableOpacity
                  style={[s.btn, loading && s.btnDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.bg} />
                  ) : (
                    <Text style={s.btnText}>Войти</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.form}>
                <Field label="Табельный номер *" colors={colors}>
                  <TextInput
                    style={s.input}
                    placeholder="12345"
                    placeholderTextColor={colors.ink3}
                    value={form.employeeId}
                    onChangeText={(v) => set('employeeId', v)}
                    editable={!loading}
                  />
                </Field>
                <Field label="Email *" colors={colors}>
                  <TextInput
                    style={s.input}
                    placeholder="user@company.ru"
                    placeholderTextColor={colors.ink3}
                    value={form.email}
                    onChangeText={(v) => set('email', v)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                  />
                </Field>
                <Field label="ФИО *" colors={colors}>
                  <TextInput
                    style={s.input}
                    placeholder="Иванов Иван Иванович"
                    placeholderTextColor={colors.ink3}
                    value={form.fullName}
                    onChangeText={(v) => set('fullName', v)}
                    editable={!loading}
                  />
                </Field>
                <Field label="Должность" colors={colors}>
                  <TextInput
                    style={s.input}
                    placeholder="Разработчик"
                    placeholderTextColor={colors.ink3}
                    value={form.position}
                    onChangeText={(v) => set('position', v)}
                    editable={!loading}
                  />
                </Field>
                <Field label="Отдел" colors={colors}>
                  <TextInput
                    style={s.input}
                    placeholder="IT"
                    placeholderTextColor={colors.ink3}
                    value={form.department}
                    onChangeText={(v) => set('department', v)}
                    editable={!loading}
                  />
                </Field>
                <Field label="Пароль *" colors={colors}>
                  <TextInput
                    style={s.input}
                    placeholder="Минимум 6 символов"
                    placeholderTextColor={colors.ink3}
                    value={form.password}
                    onChangeText={(v) => set('password', v)}
                    secureTextEntry
                    editable={!loading}
                  />
                </Field>
                <TouchableOpacity
                  style={[s.btn, loading && s.btnDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.bg} />
                  ) : (
                    <Text style={s.btnText}>Зарегистрироваться</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, colors, children }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink2, fontFamily: 'Inter_600SemiBold' }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    themeBtn: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 56 : 16,
      right: spacing.lg,
      zIndex: 10,
      padding: spacing.sm,
    },
    themeIcon: {
      fontSize: 22,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.xl,
      paddingTop: spacing.xxxl,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xxxl,
    },
    logoWrap: {
      width: 64,
      height: 64,
      borderRadius: radius.xl,
      backgroundColor: colors.moss,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      shadowColor: colors.moss,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    logoText: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.pistachio,
      fontFamily: 'Inter_700Bold',
    },
    brand: {
      fontSize: 30,
      fontWeight: '700',
      color: colors.ink,
      fontFamily: 'Inter_700Bold',
      marginBottom: 6,
    },
    tagline: {
      fontSize: 14,
      color: colors.ink3,
      fontFamily: 'Inter_400Regular',
    },
    card: {
      backgroundColor: colors.paper,
      borderRadius: radius.lg,
      padding: spacing.xxl,
      borderWidth: 1,
      borderColor: colors.line,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    tabs: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.xxl,
    },
    tab: {
      flex: 1,
      padding: spacing.md,
      backgroundColor: colors.bg2,
      borderRadius: radius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.line,
    },
    tabActive: {
      backgroundColor: colors.moss,
      borderColor: 'transparent',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.ink3,
      fontFamily: 'Inter_600SemiBold',
    },
    tabTextActive: {
      color: colors.pistachio,
    },
    form: {
      gap: spacing.lg,
    },
    input: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 15,
      color: colors.ink,
      fontFamily: 'Inter_400Regular',
    },
    btn: {
      backgroundColor: colors.moss,
      borderRadius: radius.md,
      padding: spacing.md + 2,
      alignItems: 'center',
      marginTop: spacing.sm,
      shadowColor: colors.moss,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 4,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: {
      color: colors.pistachio,
      fontSize: 15,
      fontWeight: '700',
      fontFamily: 'Inter_700Bold',
    },
  });
