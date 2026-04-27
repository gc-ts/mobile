# HR Agent Mobile - React Native App

Кросс-платформенное мобильное приложение для HR Agent AI с точным дизайном из веб-версии.

## 🚀 Технологии

- **React Native** - кросс-платформенная разработка
- **Expo** - быстрая разработка и тестирование
- **React Navigation** - навигация между экранами
- **Axios** - HTTP запросы к backend
- **AsyncStorage** - локальное хранилище

## 📱 Возможности

✅ Авторизация (логин/регистрация)
✅ Чат с AI-ассистентом
✅ Анимация печати текста
✅ Индикатор загрузки (3 точки)
✅ Точный дизайн из веб-версии
✅ Подключение к backend на порту 3001
✅ Хранение токенов и данных пользователя
✅ Автоматический вход при перезапуске

## 🛠 Установка

```bash
cd /Users/artempotapov/hr-agent-mobile
npm install
```

## 🎯 Запуск

### Вариант 1: В браузере (самый простой)

```bash
npx expo start --web
```

Откроется в браузере с мобильным видом.

### Вариант 2: Android Emulator

1. Установите Android Studio
2. Создайте виртуальное устройство (AVD)
3. Запустите эмулятор
4. Запустите приложение:

```bash
npx expo start
# Нажмите 'a' для запуска на Android
```

### Вариант 3: iOS Simulator (только Mac)

```bash
npx expo start
# Нажмите 'i' для запуска на iOS
```

### Вариант 4: Реальное устройство

1. Установите **Expo Go** на телефон:
   - iOS: App Store
   - Android: Google Play

2. Запустите:
```bash
npx expo start
```

3. Сканируйте QR код в Expo Go

## 🔧 Настройка Backend

Backend должен работать на `http://localhost:3001`

### Для Android Emulator:
API URL уже настроен на `http://10.0.2.2:3001` (это localhost для эмулятора)

### Для iOS Simulator / Expo Go:
Раскомментируйте в `src/services/api.js`:
```javascript
const API_URL = 'http://localhost:3001/api';
```

### Для реального устройства:
Замените на IP вашего компьютера:
```javascript
const API_URL = 'http://192.168.1.XXX:3001/api';
```

Узнать IP:
```bash
# Mac/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

## 📂 Структура проекта

```
hr-agent-mobile/
├── App.js                      # Главный файл с навигацией
├── src/
│   ├── screens/
│   │   ├── AuthScreen.js       # Экран авторизации
│   │   └── ChatScreen.js       # Экран чата
│   ├── services/
│   │   └── api.js              # API сервис для backend
│   └── styles/
│       └── theme.js            # Цвета и стили
├── assets/                     # Изображения и иконки
└── package.json
```

## 🎨 Дизайн

Точная копия веб-версии из `/Users/artempotapov/front1221`:

- ✅ Салатовая цветовая схема
- ✅ Градиентный фон авторизации
- ✅ Полупрозрачная карточка с blur эффектом
- ✅ Зеленые акценты (#5FAD2E)
- ✅ Сообщения бота: #E8F5E0
- ✅ Сообщения пользователя: #D4ECC4
- ✅ Анимация печати с курсором
- ✅ 3 прыгающие точки при ожидании

## 🔐 Тестовые аккаунты

**Аккаунт 1:**
- Employee ID: `12345`
- Email: `a.potapov@company.ru`
- Password: `password123`

**Аккаунт 2:**
- Employee ID: `123453`
- Email: `swag@love.com`
- Password: (установлен при регистрации)

## 🐛 Troubleshooting

### Ошибка подключения к backend

**Проблема:** `Network Error` или `ECONNREFUSED`

**Решение:**
1. Убедитесь что backend запущен: `http://localhost:3001/health`
2. Для Android эмулятора используйте `10.0.2.2` вместо `localhost`
3. Для реального устройства используйте IP компьютера
4. Проверьте что устройство в той же WiFi сети

### Expo не запускается

**Решение:**
```bash
# Очистить кеш
npx expo start -c

# Переустановить зависимости
rm -rf node_modules
npm install
```

### Ошибки при установке

**Решение:**
```bash
npm install --cache /tmp/npm-cache-mobile --no-fund
```

## 📱 Платформы

- ✅ **Android** - полная поддержка
- ✅ **iOS** - полная поддержка
- ✅ **Web** - работает в браузере

## 🚀 Production Build

### Android APK:
```bash
eas build --platform android
```

### iOS IPA:
```bash
eas build --platform ios
```

## 📝 API Endpoints

Приложение использует следующие endpoints:

- `POST /api/auth/login` - Вход
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/verify` - Проверка токена
- `POST /api/chat/message` - Отправка сообщения
- `GET /api/employee/:id` - Данные сотрудника

## 🎯 Следующие шаги

- [ ] Добавить экран профиля
- [ ] Добавить историю чатов
- [ ] Добавить push уведомления
- [ ] Добавить темную тему
- [ ] Добавить загрузку файлов

## 📄 Лицензия

MIT
