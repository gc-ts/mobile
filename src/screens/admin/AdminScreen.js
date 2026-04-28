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
  { key: 'documents', label: 'ДОКУМЕНТЫ' },
  { key: 'knowledge', label: 'БАЗА ЗНАНИЙ' },
  { key: 'employees', label: 'СОТРУДНИКИ' },
];

const DOC_TYPES = [
  { value: 'policy', label: 'Политика' },
  { value: 'procedure', label: 'Процедура' },
  { value: 'guide', label: 'Руководство' },
  { value: 'form', label: 'Форма' },
  { value: 'other', label: 'Другое' },
];

export default function AdminScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState('documents');

  // Documents
  const [documents, setDocuments] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadType, setUploadType] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Knowledge
  const [indexStatus, setIndexStatus] = useState(null);
  const [isReindexing, setIsReindexing] = useState(false);

  // Employees
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const [docsRes, statusRes] = await Promise.allSettled([
      documentsAPI.getDocuments(),
      knowledgeAPI.getIndexStatus(),
    ]);

    if (docsRes.status === 'fulfilled') {
      const data = docsRes.value;
      setDocuments(Array.isArray(data) ? data : data.documents || []);
    } else {
      setError('Не удалось загрузить документы.');
    }

    if (statusRes.status === 'fulfilled') {
      setIndexStatus(statusRes.value);
    }

    setLoading(false);
    setRefreshing(false);
  }

  const pickFile = async () => {
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
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim() || !uploadCategory.trim() || !uploadType) {
      Alert.alert('Заполните все поля', 'Выберите файл, укажите название, категорию и тип.');
      return;
    }
    setIsUploading(true);
    try {
      await documentsAPI.uploadDocument(uploadFile, uploadTitle.trim(), uploadCategory.trim(), uploadType);
      Alert.alert('Готово', 'Документ загружен.');
      setUploadFile(null);
      setUploadTitle('');
      setUploadCategory('');
      setUploadType('');
      await loadInitialData();
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить документ.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (docId, docTitle) => {
    Alert.alert('Удалить документ?', docTitle, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await documentsAPI.deleteDocument(docId);
            await loadInitialData();
          } catch {
            Alert.alert('Ошибка', 'Не удалось удалить документ.');
          }
        },
      },
    ]);
  };

  const handleReindex = () => {
    Alert.alert('Запустить реиндексацию?', 'Процесс может занять несколько минут.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Запустить',
        onPress: async () => {
          setIsReindexing(true);
          try {
            await knowledgeAPI.reindex();
            Alert.alert('Готово', 'Реиндексация запущена.');
            setTimeout(loadInitialData, 2000);
          } catch {
            Alert.alert('Ошибка', 'Не удалось запустить реиндексацию.');
          } finally {
            setIsReindexing(false);
          }
        },
      },
    ]);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await employeeAPI.searchByName(searchQuery.trim());
      setSearchResults(Array.isArray(res) ? res : res.employees || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

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
      <AppTopBar />

      <View style={s.header}>
        <Text style={s.headerKicker}>ADMIN</Text>
        <Text style={s.headerTitle}>Панель управления.</Text>
        <Text style={s.headerSubtitle}>Документы, база знаний и сотрудники</Text>
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

              <View style={s.field}>
                <Text style={s.fieldLabel}>Название</Text>
                <TextInput
                  style={s.input}
                  placeholder="Например, Положение об отпусках"
                  placeholderTextColor={colors.ink3}
                  value={uploadTitle}
                  onChangeText={setUploadTitle}
                />
              </View>

              <View style={s.field}>
                <Text style={s.fieldLabel}>Категория</Text>
                <TextInput
                  style={s.input}
                  placeholder="HR, Юр.отдел, IT"
                  placeholderTextColor={colors.ink3}
                  value={uploadCategory}
                  onChangeText={setUploadCategory}
                />
              </View>

              <View style={s.field}>
                <Text style={s.fieldLabel}>Тип документа</Text>
                <View style={s.chipsRow}>
                  {DOC_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[s.chip, uploadType === type.value && s.chipActive]}
                      onPress={() => setUploadType(type.value)}
                    >
                      <Text style={[s.chipText, uploadType === type.value && s.chipTextActive]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={s.fileBtn} onPress={pickFile}>
                <Text style={s.fileBtnLabel}>{uploadFile ? uploadFile.name : 'ВЫБРАТЬ ФАЙЛ (PDF, DOCX, TXT)'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.primaryBtn, isUploading && s.primaryBtnDisabled]}
                onPress={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text style={s.primaryBtnText}>UPLOAD</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={s.section}>
              <Text style={s.sectionKicker}>Загруженные документы · {documents.length}</Text>

              {documents.length === 0 ? (
                <View style={s.emptyCard}>
                  <Text style={s.emptyText}>Документов пока нет. Загрузите первый файл выше.</Text>
                </View>
              ) : (
                <View style={s.list}>
                  {documents.map((doc) => (
                    <View key={doc.id} style={s.docRow}>
                      <View style={s.docCopy}>
                        <Text style={s.docTitle}>{doc.title}</Text>
                        <Text style={s.docMeta}>
                          {doc.category} · {doc.type} · {doc.filename}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={s.dangerBtn}
                        onPress={() => handleDelete(doc.id, doc.title)}
                      >
                        <Text style={s.dangerBtnText}>УДАЛИТЬ</Text>
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
                  <Text style={s.metricValue}>{indexStatus?.documentCount ?? 0}</Text>
                  <Text style={s.metricLabel}>documents</Text>
                </View>
                <View style={s.metricCard}>
                  <Text style={s.metricValue}>{indexStatus?.chunkCount ?? 0}</Text>
                  <Text style={s.metricLabel}>chunks</Text>
                </View>
              </View>

              <View style={s.detailRow}>
                <Text style={s.fieldLabel}>Последняя индексация</Text>
                <Text style={s.detailValue}>
                  {indexStatus?.lastIndexed
                    ? new Date(indexStatus.lastIndexed).toLocaleString('ru-RU')
                    : 'Никогда'}
                </Text>
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, isReindexing && s.primaryBtnDisabled]}
                onPress={handleReindex}
                disabled={isReindexing}
              >
                {isReindexing ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text style={s.primaryBtnText}>REINDEX</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={s.card}>
              <Text style={s.sectionKicker}>Описание</Text>
              <Text style={s.bodyText}>
                Векторный индекс используется AI-ассистентом для поиска контекста в загруженных документах.
                Запускайте реиндексацию после массовой загрузки или удаления файлов.
              </Text>
            </View>
          </>
        ) : null}

        {tab === 'employees' ? (
          <View style={s.card}>
            <Text style={s.sectionKicker}>Поиск сотрудника</Text>

            <View style={s.field}>
              <Text style={s.fieldLabel}>ФИО или часть имени</Text>
              <TextInput
                style={s.input}
                placeholder="Иванов"
                placeholderTextColor={colors.ink3}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>

            <TouchableOpacity
              style={[s.primaryBtn, isSearching && s.primaryBtnDisabled]}
              onPress={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={s.primaryBtnText}>SEARCH</Text>
              )}
            </TouchableOpacity>

            {searchResults.length > 0 ? (
              <View style={s.list}>
                {searchResults.map((emp) => (
                  <View key={emp.id ?? emp.employee_id} style={s.empCard}>
                    <Text style={s.empName}>{emp.full_name}</Text>
                    <Text style={s.empMeta}>
                      ID: {emp.employee_id} · {emp.position || '—'} · {emp.department || '—'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : isSearching ? null : searchQuery.trim() ? (
              <Text style={s.bodyText}>Совпадений не найдено.</Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

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
    card: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.lg,
      gap: spacing.md,
    },
    section: {
      gap: spacing.sm,
    },
    sectionKicker: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_600SemiBold',
    },
    field: {
      gap: 6,
    },
    fieldLabel: {
      color: colors.ink3,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'JetBrainsMono_500Medium',
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
    primaryBtnDisabled: {
      opacity: 0.5,
    },
    primaryBtnText: {
      color: colors.bg,
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
    detailRow: {
      gap: 6,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      borderStyle: 'dashed',
      paddingTop: spacing.md,
    },
    detailValue: {
      color: colors.ink,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
    },
    bodyText: {
      color: colors.ink2,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'Inter_400Regular',
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
