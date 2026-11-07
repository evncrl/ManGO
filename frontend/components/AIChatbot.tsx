import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/config/appconf';
import { Fonts, Palette } from '@/constants/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatbot() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your ManGO Assistant. How can I help you with Philippine mangoes today?',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(({ role, content }) => ({ role, content })),
            { role: 'user', content: userMessage.content },
          ],
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const serverMessage =
          data && typeof data.error === 'string' ? data.error : undefined;
        if (response.status === 404) {
          throw new Error(
            'Chat endpoint not found (404). Check EXPO_PUBLIC_API_URL and confirm the backend is running.',
          );
        }
        if (response.status >= 500) {
          throw new Error(
            serverMessage || `Chatbot server error (${response.status}). Please try again later.`,
          );
        }
        throw new Error(
          serverMessage || `Chatbot request failed (HTTP ${response.status}).`,
        );
      }

      if (data?.success && typeof data.message === 'string') {
        const filteredContent = data.message.replace(/\*/g, '').trim();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: filteredContent,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(
          (data && typeof data.error === 'string' && data.error) ||
            'Invalid response from server',
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);

      let errorMessage = 'Sorry, I encountered an error. ';

      if (error instanceof Error) {
        if (
          error.message.includes('Failed to fetch') ||
          error.message.toLowerCase().includes('network')
        ) {
          errorMessage += `Cannot reach the chatbot server at ${API_URL}. Check your connection, EXPO_PUBLIC_API_URL, and that the backend is running.`;
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please try again later.';
      }

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearChat = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Chat cleared. How can I help you with Philippine mangoes?',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const suggestedQuestions = [
    'How do I assess mango quality?',
    'What are common mango pests and diseases?',
    'How should I care for a mango tree?',
    'What are Philippine mango export standards?',
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>ManGO AI</Text>
          <Text style={styles.headerSubtitle}>Powered by Groq AI</Text>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={20} color={Palette.charcoalEspresso} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.role === 'user' ? styles.userMessage : styles.assistantMessage,
            ]}
          >
            <View style={styles.messageHeader}>
              <Text style={styles.messageRole}>
                {message.role === 'user' ? 'You' : 'AI Assistant'}
              </Text>
              <Text style={styles.messageTime}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
            <Text style={[styles.messageContent, message.role === 'user' && styles.userMessageText]}>{message.content}</Text>
          </View>
        ))}

        {isLoading && (
          <View style={[styles.messageContainer, styles.assistantMessage]}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageRole}>AI Assistant</Text>
              <Text style={styles.messageTime}>...</Text>
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Palette.warmCopper} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Suggested questions:</Text>
          <View style={styles.suggestionsList}>
            {suggestedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionButton}
                onPress={() => handleSuggestedQuestion(question)}
              >
                <Text style={styles.suggestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Ask about mangoes or ManGO app features..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
            multiline
            maxLength={500}
            editable={!isLoading}
            placeholderTextColor={Palette.muted}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={22} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  header: {
    backgroundColor: Palette.surface,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // No border - clean surface
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Palette.charcoal,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Palette.body,
    marginTop: 2,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  messageContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 24,
    maxWidth: '85%',
  },
  userMessage: {
    backgroundColor: Palette.warmCopper,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: Palette.warmCopper,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 4px 12px ${Palette.warmCopper}33`,
      }
    }),
  },
  assistantMessage: {
    backgroundColor: Palette.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  messageRole: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Palette.body,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    color: Palette.muted,
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.regular,
    color: Palette.charcoal,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  loadingText: {
    fontSize: 14,
    color: Palette.body,
    fontFamily: Fonts.medium,
  },
  suggestionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Palette.surface,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Palette.body,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: Palette.sand,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Palette.charcoal,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Palette.charcoal,
    maxHeight: 120,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    backgroundColor: Palette.mangoDark,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Palette.warmCopper,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: `0 4px 12px ${Palette.warmCopper}4D`,
      }
    }),
  },
  sendButtonDisabled: {
    backgroundColor: Palette.sand,
  },
});
