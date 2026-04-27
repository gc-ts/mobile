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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, commonStyles } from '../styles/theme';
import { authAPI, setToken, setEmployee } from '../services/api';

export default function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    employeeId: '',
    email: '',
    fullName: '',
    position: '',
    department: '',
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleLogin = async () => {
    if (!formData.login || !formData.password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(formData.login, formData.password);
      await setToken(response.token);
      await setEmployee(response.employee);
      onLogin(response.employee, response.token);
    } catch (error) {
      Alert.alert('Ошибка входа', error.response?.data?.message || 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.employeeId || !formData.email || !formData.password || !formData.fullName) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }

    setLoading(true);
    try {
      await authAPI.register({
        employeeId: formData.employeeId,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        position: formData.position,
        department: formData.department,
      });
      Alert.alert('Успешно', 'Регистрация завершена! Теперь войдите в систему.');
      setIsLogin(true);
    } catch (error) {
      Alert.alert('Ошибка регистрации', error.response?.data?.message || 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.authGradientStart, colors.authGradientMid, colors.authGradientEnd]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <LinearGradient
                colors={[colors.green, colors.greenLight]}
                style={styles.logo}
              >
                <Text style={styles.logoText}>12</Text>
                <Text style={styles.logoText}>21</Text>
              </LinearGradient>
              <Text style={styles.title}>HR AGENT AI</Text>
              <Text style={styles.subtitle}>Ваш персональный HR-ассистент</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.tabActive]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Вход</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.tabActive]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Регистрация</Text>
              </TouchableOpacity>
            </View>

            {/* Forms */}
            {isLogin ? (
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Табельный номер или Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="12345 или user@company.ru"
                    value={formData.login}
                    onChangeText={(value) => handleChange('login', value)}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Пароль</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Введите пароль"
                    value={formData.password}
                    onChangeText={(value) => handleChange('password', value)}
                    secureTextEntry
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Войти</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Табельный номер</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="12345"
                    value={formData.employeeId}
                    onChangeText={(value) => handleChange('employeeId', value)}
                    editable={!loading}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="user@company.ru"
                    value={formData.email}
                    onChangeText={(value) => handleChange('email', value)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>ФИО</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Иванов Иван Иванович"
                    value={formData.fullName}
                    onChangeText={(value) => handleChange('fullName', value)}
                    editable={!loading}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Должность</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Developer"
                    value={formData.position}
                    onChangeText={(value) => handleChange('position', value)}
                    editable={!loading}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Отдел</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="IT"
                    value={formData.department}
                    onChangeText={(value) => handleChange('department', value)}
                    editable={!loading}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Пароль</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Минимум 6 символов"
                    value={formData.password}
                    onChangeText={(value) => handleChange('password', value)}
                    secureTextEntry
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Зарегистрироваться</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...commonStyles.shadowLarge,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accentPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textTertiary,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(232, 245, 224, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(95, 173, 46, 0.1)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.green,
    borderColor: 'transparent',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  form: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accentSecondary,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 2,
    borderColor: 'rgba(95, 173, 46, 0.2)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.green,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
