import React, { useState, useRef, useEffect } from 'react';
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
import { colors } from '../styles/theme';
import { chatAPI } from '../services/api';

export default function ChatScreen({ employee, onLogout }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Привет! Я ваш AI-ассистент. Чем могу помочь?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await chatAPI.sendMessage(messageText, employee.employee_id);

      // Убираем индикатор ожидания
      setIsTyping(false);

      // Анимация печати
      const fullText = response.response;
      let currentText = '';
      const botMessageId = Date.now() + 1;

      const botMessage = {
        id: botMessageId,
        text: '',
        sender: 'bot',
        timestamp: new Date(),
        source: response.source,
        isTyping: true,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Печать текста
      const typingSpeed = 20;
      for (let i = 0; i <= fullText.length; i++) {
        currentText = fullText.slice(0, i);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? { ...msg, text: currentText, isTyping: i < fullText.length }
              : msg
          )
        );

        if (i < fullText.length) {
          await new Promise((resolve) => setTimeout(resolve, typingSpeed));
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);

      const errorText = 'Извините, произошла ошибка при обработке вашего запроса.';
      const errorMessageId = Date.now() + 1;

      const errorMessage = {
        id: errorMessageId,
        text: '',
        sender: 'bot',
        timestamp: new Date(),
        isTyping: true,
      };

      setMessages((prev) => [...prev, errorMessage]);

      // Печать ошибки
      let currentText = '';
      const typingSpeed = 20;
      for (let i = 0; i <= errorText.length; i++) {
        currentText = errorText.slice(0, i);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === errorMessageId
              ? { ...msg, text: currentText, isTyping: i < errorText.length }
              : msg
          )
        );

        if (i < errorText.length) {
          await new Promise((resolve) => setTimeout(resolve, typingSpeed));
        }
      }
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(employee.full_name)}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{employee.full_name || 'Пользователь'}</Text>
            <Text style={styles.userStatus}>Онлайн</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.sender === 'user' ? styles.messageWrapperUser : styles.messageWrapperBot,
              ]}
            >
              {message.sender === 'bot' && (
                <View style={styles.botAvatar}>
                  <Text style={styles.botAvatarText}>🤖</Text>
                </View>
              )}
              <View style={styles.messageContent}>
                <View
                  style={[
                    styles.messageBubble,
                    message.sender === 'user' ? styles.messageBubbleUser : styles.messageBubbleBot,
                  ]}
                >
                  <Text style={styles.messageText}>
                    {message.text}
                    {message.isTyping && <Text style={styles.cursor}>|</Text>}
                  </Text>
                  {message.source && !message.isTyping && (
                    <Text style={styles.messageSource}>📄 Источник: {message.source}</Text>
                  )}
                </View>
                <Text style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {message.sender === 'user' && (
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{getInitials(employee.full_name)}</Text>
                </View>
              )}
            </View>
          ))}

          {isTyping && (
            <View style={styles.messageWrapperBot}>
              <View style={styles.botAvatar}>
                <Text style={styles.botAvatarText}>🤖</Text>
              </View>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Напишите сообщение..."
            value={inputValue}
            onChangeText={setInputValue}
            multiline
            maxLength={500}
            editable={!isTyping}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputValue.trim() || isTyping) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputValue.trim() || isTyping}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPrimary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  userStatus: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: colors.accentPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  messageWrapperBot: {
    justifyContent: 'flex-start',
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botAvatarText: {
    fontSize: 16,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  messageContent: {
    flex: 1,
    maxWidth: '75%',
  },
  messageBubble: {
    padding: 16,
    borderRadius: 16,
  },
  messageBubbleBot: {
    backgroundColor: colors.botMessageBg,
    borderWidth: 1,
    borderColor: colors.botMessageBorder,
  },
  messageBubbleUser: {
    backgroundColor: colors.userMessageBg,
    borderWidth: 1,
    borderColor: colors.userMessageBorder,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  cursor: {
    fontWeight: '400',
  },
  messageSource: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
    marginLeft: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 6,
    padding: 16,
    backgroundColor: colors.botMessageBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.botMessageBorder,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.borderPrimary,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    maxHeight: 100,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
});
