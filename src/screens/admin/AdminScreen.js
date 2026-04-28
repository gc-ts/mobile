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
import * as DocumentPicker from 'expo-document-picker';
import AppTopBar from '../../components/AppTopBar';
import ScreenBackdrop from '../../components/ScreenBackdrop';
import { useTheme } from '../../contexts/ThemeContext';
import { documentsAPI, employeeAPI, knowledgeAPI } from '../../services/api';
import { spacing } from '../../styles/theme';

const TABS = [
  { key: 'documents', label: 'DOCS' },
  { key: 'knowledge', label: 'INDEX' },
  { key: 'employees', label: 'USERS' },
];

const DOC_TYPES = [
  { value: 'policy', label: 'Политика' },
  { value: 'procedure', label: 'Процедура' },
  { value: 'guide', label: 'Гайд' },
  { value: 'form', label: 'Форма' },
  { value: 'other', label: 'Другое' },
];

const USER_FIELDS = [
  { key: 'fullName', label: 'ФИО' },
  { key: 'middleName', label: 'Отчество' },
  { key: 'email', label: 'Email' },
  { key: 'additionalEmail', label: 'Доп. email' },
  { key: 'position', label: 'Должность' },
  { key: 'department', label: 'Отдел' },
  { key: 'phone', label: 'Телефон' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'city', label: 'Город' },
  { key: 'oneCCode', label: 'Код 1С' },
  { key: 'birthDate', label: 'Дата рождения' },
  { key: 'hireDate', label: 'Дата приема' },
  { key: 'medicalExamDate', label: 'Медосмотр' },
  { key: 'sanitaryMinimumDate', label: 'Санминимум' },
  { key: 'vacationDays', label: 'Дней отпуска', keyboardType: 'numeric' },
  { key: 'nextVacation', label: 'Следующий отпуск' },
  { key: 'salary', label: 'Зарплата', keyboardType: 'numeric' },
  { key: 'bonusBalance', label: 'Бонусы', keyboardType: 'numeric' },
];

function pick(entity, snakeKey, camelKey) {
  return entity?.[camelKey] ?? entity?.[snakeKey] ?? null;
}

function getEmployeeId(entity) {
  return pick(entity, 'employee_id', 'employeeId') ?? entity?.id ?? null;
}

function normalizeEmployee(entity) {
  return {
    employeeId: getEmployeeId(entity) || '',
    fullName: pick(entity, 'full_name', 'fullName') || '',
    middleName: pick(entity, 'middle_name', 'middleName') || '',
    email: pick(entity, 'email', 'email') || '',
    additionalEmail: pick(entity, 'additional_email', 'additionalEmail') || '',
    position: pick(entity, 'position', 'position') || '',
    department: pick(entity, 'department', 'department') || '',
    phone: pick(entity, 'phone', 'phone') || '',
    telegram: pick(entity, 'telegram', 'telegram') || '',
    city: pick(entity, 'city', 'city') || '',
    oneCCode: pick(entity, 'one_c_code', 'oneCCode') || '',
    birthDate: pick(entity, 'birth_date', 'birthDate') || '',
    hireDate: pick(entity, 'hire_date', 'hireDate') || '',
    medicalExamDate: pick(entity, 'medical_exam_date', 'medicalExamDate') || '',
    sanitaryMinimumDate: pick(entity, 'sanitary_minimum_date', 'sanitaryMinimumDate') || '',
    vacationDays: String(pick(entity, 'vacation_days', 'vacationDays') ?? ''),
    nextVacation: pick(entity, 'next_vacation', 'nextVacation') || '',
    salary: String(pick(entity, 'salary', 'salary') ?? ''),
    bonusBalance: String(pick(entity, 'bonus_balance', 'bonusBalance') ?? ''),
    role: pick(entity, 'role', 'role') || 'employee',
  };
}

function compactPayload(form) {
  const payload = {};
  Object.entries(form).forEach(([key, value]) => {
    if (key === 'employeeId') return;
    if (value === '') return;
    payload[key] = ['vacationDays', 'salary', 'bonusBalance'].includes(key) ? Number(value) : value;
  });
  return payload;
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ru-RU');
}

function AdminField({ colors, field, value, onChange, editable = true }) {
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
        value={value}
        onChangeText={(nextValue) => onChange(field.key, nextValue)}
        placeholder="—"
        placeholderTextColor={colors.ink3}
        keyboardType={field.keyboardType || 'default'}
      />
    </View>
  );
}

export default function AdminScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadType, setUploadType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [indexStatus, setIndexStatus] = useState(null);
  const [corporateSync, setCorporateSync] = useState(null);
  const [isReindexing, setIsReindexing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState(normalizeEmployee(null));
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(false);
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const s = makeStyles(colors);
  const totalChunks = indexStatus?.stats?.total ?? 0;
  const indexedDocuments = indexStatus?.documents?.length ?? 0;

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const [docsRes, statusRes, syncRes] = await Promise.allSettled([
      documentsAPI.getDocuments(),
      knowledgeAPI.getIndexStatus(),
      knowledgeAPI.getCorporateSync(),
    ]);

    if (docsRes.status === 'fulfilled') {
      const data = docsRes.value;
      setDocuments(Array.isArray(data) ? data : data.documents || []);
    } else {
      setError('Не удалось загрузить документы.');
    }

    if (statusRes.status === 'fulfilled') setIndexStatus(statusRes.value);
    if (syncRes.status === 'fulfilled') setCorporateSync(syncRes.value);

    setLoading(false);
    setRefreshing(false);
  }

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (asset) {
        setUploadFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
        });
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось выбрать файл.');
    }
  }

  async function handleUpload() {
    if (!uploadFile || !uploadTitle.trim() || !uploadCategory.trim() || !uploadType) {
      Alert.alert('Заполните поля', 'Выберите файл, название, категорию и тип документа.');
      return;
    }

    setIsUploading(true);
    try {
      await documentsAPI.uploadDocument(uploadFile, uploadTitle.trim(), uploadCategory.trim(), uploadType);
      setUploadFile(null);
      setUploadTitle('');
      setUploadCategory('');
      setUploadType('');
      await loadInitialData();
      Alert.alert('Готово', 'Документ загружен.');
    } catch (uploadError) {
      Alert.alert('Ошибка', uploadError?.response?.data?.message || 'Не удалось загрузить документ.');
    } finally {
      setIsUploading(false);
    }
  }

  function handleDelete(docId, docTitle) {
    Alert.alert('Удалить документ?', docTitle || 'Документ', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await documentsAPI.deleteDocument(docId);
            await loadInitialData(true);
          } catch {
            Alert.alert('Ошибка', 'Не удалось удалить документ.');
          }
        },
      },
    ]);
  }

  function handleReindex() {
    Alert.alert('Запустить реиндексацию?', 'Процесс может занять несколько минут.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Запустить',
        onPress: async () => {
          setIsReindexing(true);
          try {
            await knowledgeAPI.reindex();
            await loadInitialData(true);
            Alert.alert('Готово', 'Реиндексация запущена.');
          } catch {
            Alert.alert('Ошибка', 'Не удалось запустить реиндексацию.');
          } finally {
            setIsReindexing(false);
          }
        },
      },
    ]);
  }

  async function handleCorporateSync() {
    setIsSyncing(true);
    try {
      const result = await knowledgeAPI.syncCorporate();
      await loadInitialData(true);
      Alert.alert('Готово', result?.message || 'Синхронизация запущена.');
    } catch {
      Alert.alert('Ошибка', 'Не удалось запустить синхронизацию портала.');
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSelectedEmployee(null);
    try {
      const res = await employeeAPI.searchByName(searchQuery.trim());
      setSearchResults(Array.isArray(res) ? res : res.employees || []);
    } catch {
      setSearchResults([]);
      Alert.alert('Ошибка', 'Не удалось выполнить поиск сотрудника.');
    } finally {
      setIsSearching(false);
    }
  }

  async function selectEmployee(employee) {
    const employeeId = getEmployeeId(employee);
    if (!employeeId) return;
    setIsLoadingEmployee(true);
    try {
      const detailedEmployee = await employeeAPI.getEmployee(employeeId);
      const nextEmployee = { ...employee, ...detailedEmployee };
      setSelectedEmployee(nextEmployee);
      setEmployeeForm(normalizeEmployee(nextEmployee));
    } catch {
      setSelectedEmployee(employee);
      setEmployeeForm(normalizeEmployee(employee));
    } finally {
      setIsLoadingEmployee(false);
    }
  }

  function updateEmployeeForm(key, value) {
    setEmployeeForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveEmployee() {
    if (!employeeForm.employeeId) return;
    setIsSavingEmployee(true);
    try {
      const saved = await employeeAPI.updateEmployee(employeeForm.employeeId, compactPayload(employeeForm));
      const nextEmployee = { ...(selectedEmployee || {}), ...saved, ...employeeForm };
      setSelectedEmployee(nextEmployee);
      setEmployeeForm(normalizeEmployee(nextEmployee));
      Alert.alert('Готово', 'Параметры сотрудника обновлены.');
    } catch (saveError) {
      const status = saveError?.response?.status;
      const isMissingUpdateEndpoint =
        status === 404 ||
        status === 405 ||
        saveError?.code === 'ERR_NETWORK' ||
        saveError?.response?.data?.error === 'Route not found';
      const message =
        isMissingUpdateEndpoint
          ? 'В текущей OpenAPI-документации нет endpoint для изменения сотрудника. Нужен PATCH /api/employee/{id} на backend.'
          : saveError?.response?.data?.message || saveError?.response?.data?.error || 'Не удалось сохранить сотрудника.';
      Alert.alert('Ошибка', message);
    } finally {
      setIsSavingEmployee(false);
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
      <AppTopBar />

      <View style={s.header}>
        <Text style={s.headerKicker}>ADMIN</Text>
        <Text style={s.headerTitle}>Панель управления.</Text>
        <Text style={s.headerSubtitle}>Документы, индекс знаний и параметры сотрудников</Text>
      </View>

      <View style={s.tabsRow}>
        {TABS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[s.tab, tab === item.key && s.tabActive]}
            onPress={() => setTab(item.key)}
          >
            <Text style={[s.tabText, tab === item.key && s.tabTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadInitialData(true)}
            tintColor={colors.moss}
          />
        }
      >
        {error ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {tab === 'documents' ? (
          <>
            <View style={s.card}>
              <Text style={s.sectionKicker}>Загрузить документ</Text>
              <AdminField colors={colors} field={{ key: 'title', label: 'Название' }} value={uploadTitle} onChange={(_, v) => setUploadTitle(v)} />
              <AdminField colors={colors} field={{ key: 'category', label: 'Категория' }} value={uploadCategory} onChange={(_, v) => setUploadCategory(v)} />
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.ink3 }]}>Тип документа</Text>
                <View style={s.chipsRow}>
                  {DOC_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[s.chip, uploadType === type.value && s.chipActive]}
                      onPress={() => setUploadType(type.value)}
                    >
                      <Text style={[s.chipText, uploadType === type.value && s.chipTextActive]}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={s.fileBtn} onPress={pickFile}>
                <Text style={s.fileBtnLabel}>{uploadFile ? uploadFile.name : 'ВЫБРАТЬ ФАЙЛ (PDF, DOCX, TXT)'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.primaryBtn, isUploading && s.disabledBtn]} onPress={handleUpload} disabled={isUploading}>
                {isUploading ? <ActivityIndicator color={colors.bg} /> : <Text style={s.primaryBtnText}>UPLOAD</Text>}
              </TouchableOpacity>
            </View>

            <View style={s.section}>
              <Text style={s.sectionKicker}>Загруженные документы · {documents.length}</Text>
              {documents.length === 0 ? (
                <View style={s.emptyCard}>
                  <Text style={s.emptyText}>Документов пока нет.</Text>
                </View>
              ) : (
                <View style={s.list}>
                  {documents.map((doc) => (
                    <View key={doc.id} style={s.docRow}>
                      <View style={s.docCopy}>
                        <Text style={s.docTitle}>{doc.title || doc.fileUrl || 'Документ'}</Text>
                        <Text style={s.docMeta}>
                          {doc.category || '—'} · {doc.type || '—'} · chunks: {doc.chunkCount ?? '—'} · {doc.indexed === false ? 'not indexed' : 'indexed'}
                        </Text>
                      </View>
                      <TouchableOpacity style={s.dangerBtn} onPress={() => handleDelete(doc.id, doc.title)}>
                        <Text style={s.dangerBtnText}>DELETE</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}

        {tab === 'knowledge' ? (
          <>
            <View style={s.card}>
              <Text style={s.sectionKicker}>Статус индекса</Text>
              <View style={s.metricsRow}>
                <View style={s.metricCard}>
                  <Text style={s.metricValue}>{indexedDocuments}</Text>
                  <Text style={s.metricLabel}>documents</Text>
                </View>
                <View style={s.metricCard}>
                  <Text style={s.metricValue}>{totalChunks}</Text>
                  <Text style={s.metricLabel}>chunks</Text>
                </View>
              </View>
              <TouchableOpacity style={[s.primaryBtn, isReindexing && s.disabledBtn]} onPress={handleReindex} disabled={isReindexing}>
                {isReindexing ? <ActivityIndicator color={colors.bg} /> : <Text style={s.primaryBtnText}>REINDEX</Text>}
              </TouchableOpacity>
            </View>

            <View style={s.card}>
              <Text style={s.sectionKicker}>Корпоративный портал</Text>
              <Text style={s.bodyText}>Настроено: {corporateSync?.configured ? 'да' : 'нет'}</Text>
              <Text style={s.bodyText}>Статус: {corporateSync?.running ? 'идет синхронизация' : 'ожидание'}</Text>
              <Text style={s.bodyText}>Последняя синхронизация: {formatDateTime(corporateSync?.lastSync)}</Text>
              <Text style={s.bodyText}>Следующая синхронизация: {formatDateTime(corporateSync?.nextSync)}</Text>
              <Text style={s.bodyText}>Расписание: {corporateSync?.schedule || '—'}</Text>
              <TouchableOpacity style={[s.secondaryBtn, isSyncing && s.disabledBtn]} onPress={handleCorporateSync} disabled={isSyncing}>
                {isSyncing ? <ActivityIndicator color={colors.ink} /> : <Text style={s.secondaryBtnText}>SYNC CORPORATE</Text>}
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {tab === 'employees' ? (
          <>
            <View style={s.card}>
              <Text style={s.sectionKicker}>Поиск сотрудника</Text>
              <AdminField colors={colors} field={{ key: 'query', label: 'ФИО или часть имени' }} value={searchQuery} onChange={(_, v) => setSearchQuery(v)} />
              <TouchableOpacity style={[s.primaryBtn, isSearching && s.disabledBtn]} onPress={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? <ActivityIndicator color={colors.bg} /> : <Text style={s.primaryBtnText}>SEARCH</Text>}
              </TouchableOpacity>
              {searchResults.length > 0 ? (
                <View style={s.list}>
                  {searchResults.map((emp) => {
                    const empId = getEmployeeId(emp);
                    return (
                      <TouchableOpacity key={empId || emp.id} style={s.empCard} onPress={() => selectEmployee(emp)}>
                        <Text style={s.empName}>{pick(emp, 'full_name', 'fullName') || 'Сотрудник'}</Text>
                        <Text style={s.empMeta}>ID: {empId || '—'} · {pick(emp, 'position', 'position') || '—'} · {pick(emp, 'department', 'department') || '—'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : searchQuery.trim() && !isSearching ? (
                <Text style={s.bodyText}>Совпадений не найдено.</Text>
              ) : null}
            </View>

            {isLoadingEmployee ? (
              <View style={s.card}>
                <ActivityIndicator color={colors.moss} />
              </View>
            ) : selectedEmployee ? (
              <View style={s.card}>
                <Text style={s.sectionKicker}>Параметры пользователя</Text>
                <AdminField colors={colors} field={{ key: 'employeeId', label: 'Табельный номер' }} value={employeeForm.employeeId} onChange={updateEmployeeForm} editable={false} />
                {USER_FIELDS.map((field) => (
                  <AdminField key={field.key} colors={colors} field={field} value={employeeForm[field.key]} onChange={updateEmployeeForm} />
                ))}
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.ink3 }]}>Роль</Text>
                  <View style={s.chipsRow}>
                    {['employee', 'admin'].map((role) => (
                      <TouchableOpacity
                        key={role}
                        style={[s.chip, employeeForm.role === role && s.chipActive]}
                        onPress={() => updateEmployeeForm('role', role)}
                      >
                        <Text style={[s.chipText, employeeForm.role === role && s.chipTextActive]}>{role.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TouchableOpacity style={[s.primaryBtn, isSavingEmployee && s.disabledBtn]} onPress={saveEmployee} disabled={isSavingEmployee}>
                  {isSavingEmployee ? <ActivityIndicator color={colors.bg} /> : <Text style={s.primaryBtnText}>SAVE USER</Text>}
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        ) : null}
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
    letterSpacing: 1.2,
    textTransform: 'uppercase',
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
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      gap: 6,
    },
    headerKicker: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.4,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    headerTitle: {
      color: colors.ink,
      fontSize: 30,
      lineHeight: 36,
      fontFamily: 'Fraunces_400Regular',
    },
    headerSubtitle: {
      color: colors.ink2,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'Inter_400Regular',
    },
    tabsRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      gap: 4,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: 'transparent',
    },
    tabActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    tabText: {
      color: colors.ink2,
      fontSize: 10,
      letterSpacing: 1,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    tabTextActive: {
      color: colors.bg,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    section: {
      gap: spacing.sm,
    },
    card: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.lg,
      gap: spacing.md,
    },
    sectionKicker: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    errorBanner: {
      backgroundColor: colors.hotWash,
      borderWidth: 1,
      borderColor: colors.hot,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    errorText: {
      color: colors.hot,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'Inter_400Regular',
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: 10,
      paddingVertical: 7,
      backgroundColor: 'transparent',
    },
    chipActive: {
      backgroundColor: colors.moss,
      borderColor: colors.moss,
    },
    chipText: {
      color: colors.ink2,
      fontSize: 11,
      letterSpacing: 0.6,
      fontFamily: 'Inter_500Medium',
    },
    chipTextActive: {
      color: colors.paper,
    },
    fileBtn: {
      borderWidth: 1,
      borderColor: colors.line,
      borderStyle: 'dashed',
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.bg,
    },
    fileBtnLabel: {
      color: colors.ink2,
      fontSize: 11,
      letterSpacing: 0.8,
      fontFamily: 'JetBrainsMono_500Medium',
    },
    primaryBtn: {
      backgroundColor: colors.ink,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryBtnText: {
      color: colors.bg,
      fontSize: 11,
      letterSpacing: 1.2,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    secondaryBtn: {
      borderWidth: 1,
      borderColor: colors.line,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    secondaryBtnText: {
      color: colors.ink2,
      fontSize: 11,
      letterSpacing: 1.2,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    dangerBtn: {
      borderWidth: 1,
      borderColor: colors.hot,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: 'transparent',
    },
    dangerBtnText: {
      color: colors.hot,
      fontSize: 10,
      letterSpacing: 1,
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    disabledBtn: {
      opacity: 0.5,
    },
    list: {
      gap: spacing.sm,
    },
    docRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.md,
    },
    docCopy: {
      flex: 1,
      gap: 4,
    },
    docTitle: {
      color: colors.ink,
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
    },
    docMeta: {
      color: colors.ink3,
      fontSize: 11,
      lineHeight: 16,
      fontFamily: 'JetBrainsMono_400Regular',
    },
    emptyCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderStyle: 'dashed',
      padding: spacing.lg,
    },
    emptyText: {
      color: colors.ink3,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'Inter_400Regular',
    },
    metricsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    metricCard: {
      flex: 1,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.md,
      gap: 4,
    },
    metricValue: {
      color: colors.ink,
      fontSize: 28,
      fontFamily: 'Fraunces_500Medium',
    },
    metricLabel: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_400Regular',
    },
    bodyText: {
      color: colors.ink2,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'Inter_400Regular',
    },
    empCard: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.md,
      gap: 4,
    },
    empName: {
      color: colors.ink,
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
    },
    empMeta: {
      color: colors.ink3,
      fontSize: 11,
      lineHeight: 16,
      fontFamily: 'JetBrainsMono_400Regular',
    },
  });
