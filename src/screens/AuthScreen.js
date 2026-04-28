import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { spacing } from '../styles/theme';

export default function AuthScreen() {
  const { colors, isDark } = useTheme();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [form, setForm] = useState({
    login: '',
    password: '',
    employeeId: '',
    email: '',
    fullName: '',
  });

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage('');
    setIsSuccess(false);
  };

  const setFeedback = (text, success = false) => {
    setMessage(text);
    setIsSuccess(success);
  };

  const handleLogin = async () => {
    if (!form.login.trim() || !form.password.trim()) {
      setFeedback('Заполните логин и пароль.');
      return;
    }

    setLoading(true);
    setFeedback('');

    try {
      const res = await authAPI.login(form.login.trim(), form.password);
      await login(res.employee, res.token);
    } catch {
      setFeedback('Ошибка входа. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!form.employeeId.trim() || !form.email.trim() || !form.password.trim() || !form.fullName.trim()) {
      setFeedback('Заполните обязательные поля.');
      return;
    }

    setLoading(true);
    setFeedback('');

    try {
      const res = await authAPI.register({
        employeeId: form.employeeId.trim(),
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
      });

      // Автоматический вход после регистрации
      if (res.token && res.employee) {
        await login(res.employee, res.token);
      } else {
        // Если токен не вернулся, делаем автоматический логин
        const loginRes = await authAPI.login(form.employeeId.trim(), form.password);
        await login(loginRes.employee, loginRes.token);
      }
    } catch {
      setFeedback('Ошибка регистрации. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(colors, isDark);

  return (
    <SafeAreaView style={s.root}>
      <View style={[s.glow, s.glowRight]} />
      <View style={[s.glow, s.glowLeft]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.panel}>
            <View style={s.header}>
              <View style={s.logoBox}>
                <Text style={s.logoText}>T</Text>
              </View>
              <Text style={s.brand}>Техна.</Text>
              <Text style={s.kicker}>AI-ассистент + форум</Text>
            </View>

            <View style={s.tabs}>
              <TouchableOpacity
                style={[s.tab, isLogin && s.tabActive]}
                onPress={() => {
                  setIsLogin(true);
                  setFeedback('');
                }}
              >
                <Text style={[s.tabText, isLogin && s.tabTextActive]}>ВХОД</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.tab, !isLogin && s.tabActive]}
                onPress={() => {
                  setIsLogin(false);
                  setFeedback('');
                }}
              >
                <Text style={[s.tabText, !isLogin && s.tabTextActive]}>РЕГИСТРАЦИЯ</Text>
              </TouchableOpacity>
            </View>

            {message ? (
              <View style={[s.banner, isSuccess ? s.bannerSuccess : s.bannerError]}>
                <Text style={s.bannerText}>{message}</Text>
              </View>
            ) : null}

            {isLogin ? (
              <View style={s.form}>
                <Field label="Табельный номер или Email" colors={colors}>
                  <TextInput
                    style={s.input}
                    placeholder="12345 или user@company.ru"
                    placeholderTextColor={colors.ink3}
                    value={form.login}
                    onChangeText={(value) => setField('login', value)}
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
                    onChangeText={(value) => setField('password', value)}
                    secureTextEntry
                    editable={!loading}
                  />
                </Field>

                <TouchableOpacity
                  style={[s.primaryButton, loading && s.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.bg} />
                  ) : (
                    <Text style={s.primaryButtonText}>ВОЙТИ</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.form}>
                <Field label="Табельный номер" colors={colors}>
                  <TextInput
                    style={s.input}
                    placeholder="12345"
                    placeholderTextColor={colors.ink3}
                    value={form.employeeId}
                    onChangeText={(value) => setField('employeeId', value)}
                    editable={!loading}
                  />
                </Field>

                <Field label="Email" colors={colors}>
                  <TextInput
                    style={s.input}
                    placeholder="user@company.ru"
                    placeholderTextColor={colors.ink3}
                    value={form.email}
                    onChangeText={(value) => setField('email', value)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                  />
                </Field>

                <Field label="ФИО" colors={colors}>
                  <TextInput
                    style={s.input}
                    placeholder="Иванов Иван Иванович"
                    placeholderTextColor={colors.ink3}
                    value={form.fullName}
                    onChangeText={(value) => setField('fullName', value)}
                    editable={!loading}
                  />
                </Field>

                <Field label="Пароль" colors={colors}>
                  <TextInput
                    style={s.input}
                    placeholder="Минимум 6 символов"
                    placeholderTextColor={colors.ink3}
                    value={form.password}
                    onChangeText={(value) => setField('password', value)}
                    secureTextEntry
                    editable={!loading}
                  />
                </Field>

                <TouchableOpacity
                  style={[s.primaryButton, loading && s.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.bg} />
                  ) : (
                    <Text style={s.primaryButtonText}>ЗАРЕГИСТРИРОВАТЬСЯ</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={s.footer}>
              <Text style={s.footerText}>Для молодых сотрудников компании</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, colors, children }) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontSize: 10,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: colors.ink3,
          fontFamily: 'JetBrainsMono_500Medium',
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

const makeStyles = (colors, isDark) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    flex: {
      flex: 1,
    },
    glow: {
      position: 'absolute',
      width: 280,
      height: 280,
      borderRadius: 999,
      opacity: isDark ? 0.12 : 0.18,
    },
    glowRight: {
      top: -80,
      right: -60,
      backgroundColor: colors.pistachio,
    },
    glowLeft: {
      bottom: -40,
      left: -80,
      backgroundColor: colors.moss,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.xl,
      paddingVertical: spacing.xxxl,
    },
    panel: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.xxxl,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.35 : 0.18,
      shadowRadius: 30,
      elevation: 6,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xxxl,
    },
    logoBox: {
      width: 58,
      height: 58,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      backgroundColor: 'transparent',
    },
    logoText: {
      color: colors.moss,
      fontSize: 26,
      fontFamily: 'Fraunces_500Medium',
    },
    brand: {
      color: colors.ink,
      fontSize: 34,
      fontFamily: 'Fraunces_400Regular',
      marginBottom: 6,
    },
    kicker: {
      color: colors.ink3,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_400Regular',
      textAlign: 'center',
    },
    tabs: {
      flexDirection: 'row',
      gap: 4,
      backgroundColor: colors.bg2,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 4,
      marginBottom: spacing.xl,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: colors.ink,
    },
    tabText: {
      color: colors.ink2,
      fontSize: 11,
      letterSpacing: 1,
      fontFamily: 'JetBrainsMono_500Medium',
    },
    tabTextActive: {
      color: colors.bg,
    },
    banner: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderWidth: 1,
      marginBottom: spacing.xl,
    },
    bannerSuccess: {
      backgroundColor: colors.pistachioWash,
      borderColor: colors.pistachio,
    },
    bannerError: {
      backgroundColor: colors.hotWash,
      borderColor: colors.hot,
    },
    bannerText: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'Inter_400Regular',
    },
    form: {
      gap: spacing.lg,
    },
    input: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.ink,
      fontFamily: 'Inter_400Regular',
    },
    primaryButton: {
      backgroundColor: colors.ink,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    primaryButtonText: {
      color: colors.bg,
      fontSize: 11,
      letterSpacing: 1.2,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    footer: {
      marginTop: spacing.xxl,
      paddingTop: spacing.xxl,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      borderStyle: 'dashed',
      alignItems: 'center',
    },
    footerText: {
      color: colors.ink3,
      fontSize: 11,
      fontFamily: 'JetBrainsMono_400Regular',
    },
  });
