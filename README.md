# HR Agent Mobile - React Native App

Кросс-платформенное мобильное приложение для HR Agent AI с полным функционалом веб-версии и нативным UX.

## Возможности

### AI-Чат
- 💬 Интерактивный чат с AI-ассистентом «Техна»
- 📝 Множественные чаты с историей
- ✍️ Анимация печати текста с курсором
- ⏳ Индикатор загрузки (3 прыгающие точки)
- 💾 Автоматическое сохранение истории чатов
- 🔄 Переключение между чатами
- 📋 Редактирование названий чатов

### Форум
- 📋 Категории форума (Адаптация, Общение, Вопросы HR, Обучение, Офис)
- 📰 Просмотр тем и статей
- 💬 Система комментариев и ответов
- 👍 Лайки для тем и комментариев
- 🔍 Поиск по форуму
- 📌 Закрепленные темы
- 📱 Оптимизированный мобильный интерфейс

### Профиль
- 👤 Детальная информация о сотруднике
- 📊 Статистика (темы, ответы, лайки)
- 🎨 Переключение темы (светлая/темная)
- 🚪 Выход из аккаунта

### Аутентификация
- 🔐 JWT-токены для безопасной аутентификации
- 📧 Вход по email или табельному номеру
- ✅ Регистрация новых пользователей
- 💾 Автоматический вход при перезапуске
- 🔄 Проверка валидности токена

### UI/UX
- 🎨 Точный дизайн из веб-версии
- 🌓 Темная и светлая тема
- 📱 Адаптивный дизайн для всех размеров экранов
- ⚡ Плавные анимации и переходы
- 🎯 Нативные компоненты для лучшей производительности
- 🔤 Шрифт Inter для всех текстов

## Технологии

| Компонент | Технология |
| --- | --- |
| Framework | React Native 0.81.5 |
| Platform | Expo ~54.0 |
| UI Library | React Native (нативные компоненты) |
| Navigation | React Navigation 7.x (Stack + Bottom Tabs) |
| State Management | React Context API (Auth, Theme) |
| HTTP Client | Axios 1.15 |
| Storage | AsyncStorage 3.0 |
| Fonts | Expo Google Fonts (Inter) |
| Gradients | Expo Linear Gradient |
| Markdown | Custom MarkdownContent component |

## Установка

### Требования
- Node.js 18+ 
- npm или yarn
- Expo CLI (устанавливается автоматически)
- Для iOS: macOS с Xcode
- Для Android: Android Studio с SDK

### Установка зависимостей

```bash
cd /Users/artempotapov/hr-agent-mobile
npm install
```

## Запуск приложения

### Режим разработки

```bash
npm start
# или
npx expo start
```

После запуска откроется Expo Dev Tools с QR кодом и опциями запуска.

### Запуск на конкретной платформе

#### Web (браузер)
```bash
npm run web
# или
npx expo start --web
```

Откроется в браузере с мобильным видом - самый простой способ для тестирования.

#### Android
```bash
npm run android
# или
npx expo start --android
```

Требования:
- Android Studio установлен
- Android эмулятор запущен или устройство подключено
- USB debugging включен (для реального устройства)

#### iOS (только macOS)
```bash
npm run ios
# или
npx expo start --ios
```

Требования:
- Xcode установлен
- iOS Simulator запущен или устройство подключено

### Запуск на реальном устройстве

1. Установите **Expo Go** на телефон:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Запустите dev server:
```bash
npm start
```

3. Отсканируйте QR код в Expo Go:
   - iOS: используйте встроенную камеру
   - Android: используйте сканер в Expo Go

## Настройка Backend

Приложение подключается к backend API. По умолчанию используется `http://localhost:3001/api`.

### Конфигурация API URL

Файл: `src/services/api.js`

#### Для Android Emulator
```javascript
const API_URL = 'http://10.0.2.2:3001/api';
```
`10.0.2.2` - это специальный адрес для доступа к localhost хоста из Android эмулятора.

#### Для iOS Simulator / Expo Go на том же компьютере
```javascript
const API_URL = 'http://localhost:3001/api';
```

#### Для реального устройства
Замените на IP адрес вашего компьютера:
```javascript
const API_URL = 'http://192.168.1.XXX:3001/api';
```

Узнать IP адрес:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

**Важно:** Убедитесь, что:
- Backend запущен и доступен
- Устройство и компьютер в одной WiFi сети (для реального устройства)
- Firewall не блокирует порт 3001

### Проверка подключения

```bash
# Проверьте доступность backend
curl http://localhost:3001/health

# Для реального устройства (замените IP)
curl http://192.168.1.XXX:3001/health
```

## Структура проекта

```
hr-agent-mobile/
├── App.js                          # Главный файл с провайдерами
├── index.js                        # Точка входа
├── app.json                        # Конфигурация Expo
├── src/
│   ├── navigation/
│   │   ├── AppNavigator.js         # Главный навигатор (Auth/Main)
│   │   ├── ChatNavigator.js        # Навигатор чата (список + экран чата)
│   │   └── ForumNavigator.js       # Навигатор форума (список + тема + статья)
│   ├── screens/
│   │   ├── AuthScreen.js           # Экран авторизации/регистрации
│   │   ├── ChatScreen.js           # Старый экран чата (deprecated)
│   │   ├── chat/
│   │   │   ├── ChatListScreen.js   # Список чатов
│   │   │   └── ChatScreen.js       # Экран чата с сообщениями
│   │   ├── forum/
│   │   │   ├── ForumScreen.js      # Главная форума с категориями
│   │   │   ├── TopicScreen.js      # Просмотр темы с комментариями
│   │   │   └── ArticleScreen.js    # Просмотр статьи
│   │   └── profile/
│   │       └── ProfileScreen.js    # Профиль пользователя
│   ├── contexts/
│   │   ├── AuthContext.js          # Контекст аутентификации
│   │   └── ThemeContext.js         # Контекст темы (светлая/темная)
│   ├── services/
│   │   └── api.js                  # API клиент (Axios)
│   ├── components/
│   │   └── MarkdownContent.js      # Компонент для рендеринга Markdown
│   ├── data/
│   │   └── forumData.js            # Моковые данные форума
│   └── styles/
│       └── theme.js                # Цвета и стили темы
├── assets/                         # Изображения, иконки, шрифты
│   ├── icon.png                    # Иконка приложения
│   ├── splash-icon.png             # Splash screen
│   ├── adaptive-icon.png           # Android adaptive icon
│   └── favicon.png                 # Web favicon
└── package.json                    # Зависимости проекта
```

## Основные компоненты

### Navigation

#### AppNavigator
Главный навигатор, управляет переключением между:
- Auth Stack (если не авторизован)
- Main Tabs (если авторизован)

#### Main Tabs
Bottom Tab Navigator с тремя вкладками:
- **Чат** - ChatNavigator (список чатов + экран чата)
- **Форум** - ForumNavigator (категории + темы + статьи)
- **Профиль** - ProfileScreen

### Contexts

#### AuthContext
Управляет состоянием аутентификации:
- `user` - данные текущего пользователя
- `token` - JWT токен
- `login()` - вход в систему
- `register()` - регистрация
- `logout()` - выход
- `isLoading` - состояние загрузки

#### ThemeContext
Управляет темой приложения:
- `isDark` - флаг темной темы
- `colors` - объект с цветами текущей темы
- `toggleTheme()` - переключение темы

### Services

#### api.js
Axios клиент для работы с backend API:
- Автоматическое добавление JWT токена в заголовки
- Обработка ошибок
- Endpoints для auth, chat, forum, employee

## Дизайн и стилизация

### Цветовая схема

#### Светлая тема
- **Фон**: `#FFFFFF`
- **Текст**: `#1A1A1A`
- **Акцент (Moss)**: `#5FAD2E`
- **Сообщения бота**: `#E8F5E0`
- **Сообщения пользователя**: `#D4ECC4`
- **Границы**: `#E0E0E0`

#### Темная тема
- **Фон**: `#1A1A1A`
- **Текст**: `#FFFFFF`
- **Акцент (Moss)**: `#5FAD2E`
- **Сообщения бота**: `#2A3A2A`
- **Сообщения пользователя**: `#3A4A3A`
- **Границы**: `#333333`

### Типографика
- **Шрифт**: Inter (Regular, Medium, SemiBold, Bold)
- **Размеры**: 12px - 24px

### Компоненты UI
- Градиентный фон на экране авторизации
- Полупрозрачные карточки с blur эффектом
- Анимация печати текста с курсором
- 3 прыгающие точки при загрузке
- Плавные переходы между экранами

## API Integration

Приложение интегрируется с backend API. Полная документация доступна в backend репозитории.

### Используемые эндпоинты

#### Аутентификация
- `POST /api/auth/login` - Вход (email/employeeId + password)
- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/verify` - Проверка валидности JWT токена

#### Чат
- `POST /api/chat/message` - Отправка сообщения в чат
- `POST /api/chat/stream` - Стриминг ответа (SSE)
- `GET /api/chat/history/:employeeId` - История чатов пользователя

#### Сотрудники
- `GET /api/employee/:id` - Получить данные сотрудника
- `GET /api/employee/:id/vacation` - Информация об отпусках
- `GET /api/employee/:id/birthday` - День рождения
- `GET /api/employee/search/by-name?name=` - Поиск по имени

#### Форум
- `GET /api/forum/categories` - Список категорий
- `GET /api/forum/topics` - Список тем
- `GET /api/forum/topics/:id` - Детали темы
- `POST /api/forum/topics` - Создать тему
- `GET /api/forum/topics/:id/replies` - Ответы к теме
- `POST /api/forum/topics/:id/replies` - Добавить ответ
- `POST /api/forum/topics/:id/like` - Лайк теме
- `POST /api/forum/replies/:id/like` - Лайк ответу

#### Документы
- `GET /api/documents` - Список документов
- `GET /api/documents/:id` - Детали документа
- `POST /api/documents/upload` - Загрузка документа (admin only)
- `DELETE /api/documents/:id` - Удаление документа (admin only)

### Формат ответов

#### Успешный ответ
```json
{
  "success": true,
  "data": { ... }
}
```

#### Ошибка
```json
{
  "success": false,
  "error": "Описание ошибки"
}
```

### Аутентификация
Все защищенные эндпоинты требуют JWT токен в заголовке:
```
Authorization: Bearer <token>
```

Токен автоматически добавляется API клиентом из AsyncStorage.

## Тестовые аккаунты

После seed базы данных доступны следующие аккаунты (пароль: `password123`):

| Табельный | Email | ФИО | Должность | Роль |
| --- | --- | --- | --- | --- |
| 12345 | a.potapov@company.ru | Потапов Артем Павлович | Senior Developer | employee |
| 67890 | m.ivanova@company.ru | Иванова Мария Сергеевна | HR Manager | employee |
| 11111 | p.petrov@company.ru | Петров Петр Петрович | Team Lead | employee |

**Админ аккаунт:**
- Login: `admin`
- Password: `admin`

## Разработка

### Очистка кэша
```bash
npx expo start -c
```

### Переустановка зависимостей
```bash
rm -rf node_modules
npm install
```

### Проверка типов и линтинг
```bash
# Если настроен ESLint
npm run lint
```

### Отладка
- Используйте React Native Debugger
- Встроенный Expo Dev Tools
- Console.log в терминале при запуске

## Production Build

### Подготовка

1. Обновите `app.json`:
   - Измените `version`
   - Обновите `icon`, `splash`, `adaptiveIcon`
   - Настройте `ios.bundleIdentifier` и `android.package`

2. Создайте аккаунт на [Expo Application Services](https://expo.dev/)

### Android APK/AAB

```bash
# Установите EAS CLI
npm install -g eas-cli

# Логин
eas login

# Конфигурация
eas build:configure

# Build APK (для тестирования)
eas build --platform android --profile preview

# Build AAB (для Google Play)
eas build --platform android --profile production
```

### iOS IPA

```bash
# Build для TestFlight/App Store
eas build --platform ios --profile production

# Требуется Apple Developer аккаунт ($99/год)
```

### Публикация обновлений (OTA)

```bash
# Публикация обновления без rebuild
eas update --branch production --message "Bug fixes"
```

## Troubleshooting

### Ошибка подключения к backend

**Проблема:** `Network Error`, `ECONNREFUSED`, `timeout`

**Решения:**
1. Проверьте, что backend запущен:
   ```bash
   curl http://localhost:3001/health
   ```

2. Для Android эмулятора используйте `10.0.2.2` вместо `localhost`

3. Для реального устройства:
   - Используйте IP адрес компьютера
   - Убедитесь, что устройство в той же WiFi сети
   - Проверьте firewall (разрешите порт 3001)

4. Проверьте CORS настройки в backend

### Expo не запускается

**Решения:**
```bash
# Очистить кеш
npx expo start -c

# Удалить .expo папку
rm -rf .expo

# Переустановить зависимости
rm -rf node_modules package-lock.json
npm install
```

### Ошибки при установке зависимостей

**Решения:**
```bash
# Очистить npm кеш
npm cache clean --force

# Использовать другой кеш
npm install --cache /tmp/npm-cache-mobile

# Попробовать yarn
yarn install
```

### Белый экран при запуске

**Причины:**
- Шрифты не загрузились
- Ошибка в коде (проверьте консоль)
- Проблема с AsyncStorage

**Решения:**
```bash
# Очистить AsyncStorage
# В коде добавьте:
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.clear();
```

### Проблемы с навигацией

**Решения:**
- Проверьте версии `@react-navigation/*` пакетов
- Убедитесь, что все peer dependencies установлены
- Перезапустите Metro bundler

### Медленная работа на Android

**Решения:**
- Включите Hermes engine (уже включен в Expo 54+)
- Используйте Release build вместо Debug
- Оптимизируйте изображения
- Используйте `React.memo` для тяжелых компонентов

## Платформы

| Платформа | Статус | Примечания |
| --- | --- | --- |
| **Android** | ✅ Полная поддержка | Тестировано на Android 10+ |
| **iOS** | ✅ Полная поддержка | Тестировано на iOS 14+ |
| **Web** | ✅ Работает | Ограниченная функциональность |

## Roadmap

### В разработке
- ✅ Авторизация и регистрация
- ✅ Чат с AI-ассистентом
- ✅ Форум с категориями и темами
- ✅ Профиль пользователя
- ✅ Темная тема
- ✅ Множественные чаты

### Планируется
- [ ] Push уведомления (Expo Notifications)
- [ ] Загрузка файлов в чат
- [ ] Офлайн режим с синхронизацией
- [ ] Поиск по истории чатов
- [ ] Голосовой ввод
- [ ] Биометрическая аутентификация
- [ ] Кэширование изображений
- [ ] Поддержка планшетов (split view)
- [ ] Локализация (EN/RU)
- [ ] Аналитика (Firebase/Amplitude)

## Поддержка

### Документация
- **Backend API**: см. backend репозиторий
- **Expo Docs**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/

### Контакты
- **Email**: hr@company.ru
- **GitHub Issues**: для багов и feature requests

## Лицензия

MIT
